"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getProductsWithCategories,
  type ProductWithCategory,
  type PriceUnit,
} from "@/app/actions/daily-menu";
import {
  addProduct,
  deleteProduct,
  toggleProductActive,
  updateProduct,
} from "@/app/actions/products";

type CategoryData = {
  id: string;
  name: string;
  display_order: number;
};

// Helper to format price display
function formatPriceDisplay(
  price: number | null,
  priceUnit: PriceUnit
): string {
  if (price === null) return "";
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
  return priceUnit === "PER_PERSON" ? `${formatted} / pers.` : formatted;
}

export function ProduitsContent() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState<string>("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductPriceUnit, setNewProductPriceUnit] =
    useState<PriceUnit>("FIXED");
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editingProduct, setEditingProduct] =
    useState<ProductWithCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPriceUnit, setEditPriceUnit] = useState<PriceUnit>("FIXED");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const result = await getProductsWithCategories(true);
    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      setProducts(result.products);
      setCategories(result.categories);
      if (result.categories.length > 0 && !newProductCategory) {
        setNewProductCategory(result.categories[0].id);
      }
    }
    setLoading(false);
  }, [newProductCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  // Group products by category for display
  const groupedProducts: Record<string, ProductWithCategory[]> = {};

  if (selectedCategory) {
    const cat = categories.find((c) => c.id === selectedCategory);
    if (cat) {
      groupedProducts[cat.name] = filteredProducts;
    }
  } else {
    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.category_id === cat.id);
      if (catProducts.length > 0) {
        groupedProducts[cat.name] = catProducts;
      }
    });
  }

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductCategory) return;

    setAdding(true);
    const price = newProductPrice ? parseFloat(newProductPrice) : null;

    const result = await addProduct({
      name: newProductName,
      categoryId: newProductCategory,
      price,
      priceUnit: newProductPriceUnit,
    });

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      toast.success("Produit ajouté !");
      setNewProductName("");
      setNewProductPrice("");
      setNewProductPriceUnit("FIXED");
      setShowAddModal(false);
      await loadData();
    }
    setAdding(false);
  };

  const openEditModal = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category_id || "");
    setEditPrice(product.price?.toString() || "");
    setEditPriceUnit(product.price_unit || "FIXED");
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editName.trim()) return;

    setSaving(true);
    const price = editPrice ? parseFloat(editPrice) : null;

    const result = await updateProduct(editingProduct.id, {
      name: editName,
      categoryId: editCategory,
      price,
      priceUnit: editPriceUnit,
    });

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      toast.success("Produit modifié !");
      setEditingProduct(null);
      await loadData();
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Supprimer "${productName}" ?`)) return;

    setDeletingId(productId);
    const result = await deleteProduct(productId);

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      toast.success("Produit supprimé");
      await loadData();
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    const result = await toggleProductActive(productId, !currentActive);

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      toast.success(currentActive ? "Produit désactivé" : "Produit activé");
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Actif (visible dans le menu)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span>Inactif</span>
        </div>
      </div>

      {/* Categories filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? "bg-blue-600 text-white"
              : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
        >
          Tous ({products.length})
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Products list */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Aucun produit</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Commencez par ajouter vos premiers produits.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ajouter un produit
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(
            ([categoryName, categoryProducts]) => (
              <div key={categoryName} className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {categoryName}
                  <span className="text-sm font-normal text-gray-500">
                    ({categoryProducts.length})
                  </span>
                </h2>
                <div className="space-y-2">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                        product.is_active
                          ? "bg-gray-50 dark:bg-gray-800"
                          : "bg-gray-100 dark:bg-gray-900 opacity-60"
                      }`}
                    >
                      {/* Toggle active button */}
                      <button
                        onClick={() =>
                          handleToggleActive(product.id, product.is_active)
                        }
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                          product.is_active
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                        }`}
                        title={product.is_active ? "Désactiver" : "Activer"}
                      >
                        {product.is_active && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Product info - clickable to edit */}
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 text-left"
                      >
                        <span
                          className={`text-sm font-medium ${
                            !product.is_active && "line-through"
                          }`}
                        >
                          {product.name}
                        </span>
                        {product.price !== null && (
                          <span className="ml-2 text-sm text-gray-500">
                            {formatPriceDisplay(product.price, product.price_unit)}
                          </span>
                        )}
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() =>
                          handleDeleteProduct(product.id, product.name)
                        }
                        disabled={deletingId === product.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === product.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ajouter un produit</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Catégorie
                </label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ex: Salade César"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="14,00"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de prix
                  </label>
                  <select
                    value={newProductPriceUnit}
                    onChange={(e) =>
                      setNewProductPriceUnit(e.target.value as PriceUnit)
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FIXED">Prix fixe</option>
                    <option value="PER_PERSON">Par personne</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddProduct}
                disabled={adding || !newProductName.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {adding ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Modifier le produit</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Catégorie
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="14,00"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de prix
                  </label>
                  <select
                    value={editPriceUnit}
                    onChange={(e) =>
                      setEditPriceUnit(e.target.value as PriceUnit)
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FIXED">Prix fixe</option>
                    <option value="PER_PERSON">Par personne</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEditProduct}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
