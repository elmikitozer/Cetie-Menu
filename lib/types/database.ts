export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          restaurant_id: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          restaurant_id?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          restaurant_id?: string | null;
          role?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number | null;
          price_unit: "FIXED" | "PER_PERSON";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price?: number | null;
          price_unit?: "FIXED" | "PER_PERSON";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number | null;
          price_unit?: "FIXED" | "PER_PERSON";
          is_active?: boolean;
          created_at?: string;
        };
      };
      daily_menus: {
        Row: {
          id: string;
          restaurant_id: string;
          date: string;
          is_published: boolean;
          show_prices: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          date: string;
          is_published?: boolean;
          show_prices?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          date?: string;
          is_published?: boolean;
          show_prices?: boolean;
          created_at?: string;
        };
      };
      daily_menu_items: {
        Row: {
          id: string;
          daily_menu_id: string;
          product_id: string;
          custom_price: number | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          daily_menu_id: string;
          product_id: string;
          custom_price?: number | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          daily_menu_id?: string;
          product_id?: string;
          custom_price?: number | null;
          display_order?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type DailyMenu = Database["public"]["Tables"]["daily_menus"]["Row"];
export type DailyMenuItem = Database["public"]["Tables"]["daily_menu_items"]["Row"];
