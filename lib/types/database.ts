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
          // PDF Design fields
          opening_days: string | null;
          opening_days_2: string | null;
          lunch_hours: string | null;
          dinner_hours: string | null;
          holiday_notice: string | null;
          meat_origin: string | null;
          payment_notice: string | null;
          subtitle: string | null;
          restaurant_type: string | null;
          cities: string | null;
          sides_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          opening_days?: string | null;
          opening_days_2?: string | null;
          lunch_hours?: string | null;
          dinner_hours?: string | null;
          holiday_notice?: string | null;
          meat_origin?: string | null;
          payment_notice?: string | null;
          subtitle?: string | null;
          restaurant_type?: string | null;
          cities?: string | null;
          sides_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          opening_days?: string | null;
          opening_days_2?: string | null;
          lunch_hours?: string | null;
          dinner_hours?: string | null;
          holiday_notice?: string | null;
          meat_origin?: string | null;
          payment_notice?: string | null;
          subtitle?: string | null;
          restaurant_type?: string | null;
          cities?: string | null;
          sides_note?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          restaurant_id: string | null;
          role: "owner" | "staff" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          restaurant_id?: string | null;
          role?: "owner" | "staff" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          restaurant_id?: string | null;
          role?: "owner" | "staff" | "admin";
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
      invites: {
        Row: {
          id: string;
          restaurant_id: string;
          token: string;
          role: "owner" | "staff";
          email: string | null;
          created_by: string | null;
          used_by: string | null;
          created_at: string;
          expires_at: string | null;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          token?: string;
          role: "owner" | "staff";
          email?: string | null;
          created_by?: string | null;
          used_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          token?: string;
          role?: "owner" | "staff";
          email?: string | null;
          created_by?: string | null;
          used_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          used_at?: string | null;
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

// Role type
export type UserRole = "owner" | "staff" | "admin";
