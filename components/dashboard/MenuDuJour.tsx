"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getProductsWithCategories,
  getDailyMenu,
  saveDailyMenu,
  getRestaurantSlug,
  updateMenuShowPrices,
  duplicateMenuFromDate,
  type ProductWithCategory,
} from "@/app/actions/daily-menu";
import {
  getTodayString,
  formatDateDisplay,
  getRelativeDateLabel,
  navigateDate as navigateDateUtil,
} from "@/lib/date";

type CategoryData = {
  id: string;
  name: string;
  display_order: number;
};

type GroupedProducts = Record<string, ProductWithCategory[]>;

export function MenuDuJour() {
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productOrders, setProductOrders] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  // Group products by category
  const groupedProducts: GroupedProducts = {};
  categories.forEach((cat) => {
    groupedProducts[cat.id] = products
      .filter((p) => p.category_id === cat.id)
      .sort((a, b) => {
        const orderA = productOrders[a.id] ?? 0;
        const orderB = productOrders[b.id] ?? 0;
        return orderA - orderB;
      });
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [productsResult, menuResult, slug] = await Promise.all([
      getProductsWithCategories(),
      getDailyMenu(selectedDate),
      getRestaurantSlug(),
    ]);

    if (productsResult.error) {
      toast.error(productsResult.error, { duration: 5000 });
    } else {
      setProducts(productsResult.products);
      setCategories(productsResult.categories);
    }

    if (menuResult.error) {
      toast.error(menuResult.error, { duration: 5000 });
    }

    if (menuResult.menu) {
      const ids = new Set(menuResult.menu.items.map((i) => i.product_id));
      setSelectedIds(ids);
      const orders: Record<string, number> = {};
      menuResult.menu.items.forEach((item) => {
        orders[item.product_id] = item.display_order;
      });
      setProductOrders(orders);
      setShowPrices(menuResult.menu.show_prices);
    } else {
      setSelectedIds(new Set());
      setProductOrders({});
      setShowPrices(true);
    }

    setRestaurantSlug(slug);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
        // Assign default order when adding
        const product = products.find((p) => p.id === productId);
        if (product?.category_id) {
          const categoryProducts = products.filter(
            (p) => p.category_id === product.category_id && newSet.has(p.id)
          );
          setProductOrders((prev) => ({
            ...prev,
            [productId]: categoryProducts.length,
          }));
        }
      }
      return newSet;
    });
  };

  const moveProduct = (productId: string, direction: "up" | "down") => {
    const product = products.find((p) => p.id === productId);
    if (!product?.category_id) return;

    const categoryProducts = products
      .filter((p) => p.category_id === product.category_id && selectedIds.has(p.id))
      .sort((a, b) => (productOrders[a.id] ?? 0) - (productOrders[b.id] ?? 0));

    const currentIndex = categoryProducts.findIndex((p) => p.id === productId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= categoryProducts.length) return;

    const targetProduct = categoryProducts[targetIndex];

    setProductOrders((prev) => ({
      ...prev,
      [productId]: prev[targetProduct.id] ?? targetIndex,
      [targetProduct.id]: prev[productId] ?? currentIndex,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    const result = await saveDailyMenu(
      selectedDate,
      Array.from(selectedIds),
      productOrders,
      { showPrices }
    );

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else {
      toast.success("Menu enregistré !");
    }

    setSaving(false);
  };

  const handleToggleShowPrices = async () => {
    const newValue = !showPrices;
    setShowPrices(newValue);

    // Update immediately in DB if menu exists
    const result = await updateMenuShowPrices(selectedDate, newValue);
    if (result.error) {
      // Revert on error
      setShowPrices(!newValue);
      toast.error(result.error, { duration: 5000 });
    }
  };

  const handlePreview = () => {
    if (restaurantSlug) {
      window.open(`/menu/${restaurantSlug}?date=${selectedDate}`, "_blank");
    }
  };

  const handleDownloadPdf = () => {
    if (restaurantSlug) {
      window.open(`/api/menu/pdf?slug=${restaurantSlug}&date=${selectedDate}`, "_blank");
    }
  };

  const handleDuplicateFromYesterday = async (confirmOverwrite = false) => {
    setDuplicating(true);

    // "Hier" = selectedDate - 1 jour
    const sourceDate = navigateDateUtil(selectedDate, -1);

    const result = await duplicateMenuFromDate(sourceDate, selectedDate, confirmOverwrite);

    if (result.needsConfirmation) {
      setShowDuplicateConfirm(true);
      setDuplicating(false);
      return;
    }

    if (result.error) {
      toast.error(result.error, { duration: 5000 });
    } else if (result.success) {
      toast.success(`Menu dupliqué ! (${result.itemsCopied} items copiés)`, { duration: 3000 });
      // Reload data to show the duplicated menu
      await loadData();
    }

    setDuplicating(false);
    setShowDuplicateConfirm(false);
  };

  const navigateDate = (days: number) => {
    setSelectedDate(navigateDateUtil(selectedDate, days));
  };

  const goToToday = () => {
    setSelectedDate(getTodayString());
  };

  const relativeLabel = getRelativeDateLabel(selectedDate);
  const isToday = relativeLabel === "Aujourd'hui";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Jour précédent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="sr-only"
              id="date-picker"
            />
            <label
              htmlFor="date-picker"
              className="block text-lg font-semibold capitalize cursor-pointer"
            >
              {formatDateDisplay(selectedDate)}
            </label>
            <span className="text-sm text-gray-500">{relativeLabel}</span>
            {!isToday && (
              <button
                onClick={goToToday}
                className="ml-2 text-sm text-blue-600 hover:text-blue-700"
              >
                (Menu du jour)
              </button>
            )}
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Jour suivant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Duplicate from yesterday button */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleDuplicateFromYesterday(false)}
            disabled={duplicating}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {duplicating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Duplication...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Dupliquer depuis hier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Show prices toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Afficher les prix</p>
            <p className="text-sm text-gray-500">Sur la carte publique et le PDF</p>
          </div>
          <button
            onClick={handleToggleShowPrices}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showPrices ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showPrices ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Products by category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryProducts = groupedProducts[category.id] || [];
          const selectedCategoryProducts = categoryProducts.filter((p) =>
            selectedIds.has(p.id)
          );

          return (
            <div key={category.id} className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {category.name}
                <span className="text-sm font-normal text-gray-500">
                  ({selectedCategoryProducts.length}/{categoryProducts.length})
                </span>
              </h2>

              <div className="space-y-2">
                {categoryProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  const selectedIndex = selectedCategoryProducts.findIndex(
                    (p) => p.id === product.id
                  );
                  const canMoveUp = isSelected && selectedIndex > 0;
                  const canMoveDown =
                    isSelected && selectedIndex < selectedCategoryProducts.length - 1;

                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                          : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <span className="flex-1 text-sm font-medium">{product.name}</span>

                      {isSelected && (
                        <div className="flex gap-1 relative z-10" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveProduct(product.id, "up"); }}
                            disabled={!canMoveUp}
                            className={`p-2 rounded-lg transition-colors ${
                              canMoveUp
                                ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                : "opacity-30 cursor-not-allowed"
                            }`}
                            aria-label="Monter"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveProduct(product.id, "down"); }}
                            disabled={!canMoveDown}
                            className={`p-2 rounded-lg transition-colors ${
                              canMoveDown
                                ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                                : "opacity-30 cursor-not-allowed"
                            }`}
                            aria-label="Descendre"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {categoryProducts.length === 0 && (
                  <p className="text-sm text-gray-500 italic py-2">
                    Aucun produit dans cette catégorie
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={handlePreview}
            disabled={!restaurantSlug}
            className="py-4 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Aperçu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!restaurantSlug || selectedIds.size === 0}
            className="py-4 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Télécharger PDF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Spacer for fixed buttons */}
      <div className="h-24" />

      {/* Duplicate confirmation modal */}
      {showDuplicateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Écraser le menu existant ?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Un menu existe déjà pour cette date. Voulez-vous le remplacer par le menu de la veille ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDuplicateFromYesterday(true)}
                disabled={duplicating}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {duplicating ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
