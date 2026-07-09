// Auto-generated Supabase type definitions for Thrift Collision
// Run `npx supabase gen types typescript` to regenerate after schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "processing"
  | "stockpiled"
  | "shipped"
  | "delivered"
  | "unsuccessful";

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          name: string;
          category: string;
          subcategory: string;
          price: number;
          size: string;
          waist: string | null;
          length: string | null;
          elastic_waist: boolean;
          colours: string[];
          tag: "NEW" | "2 LEFT" | "1 LEFT" | "SOLD OUT";
          image: string;
          description: string;
          available: boolean;
          pairs_with: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string; // references auth.users.id
          name: string;
          phone: string;
          email: string | null;
          delivery_address: string | null;
          tshirt_size: string | null;
          chest_inches: string | null;
          sleeve_inches: string | null;
          pants_waist: string | null;
          pants_length: string | null;
          hip_inches: string | null;
          cap_inches: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_id: string; // human-readable e.g. TC-A1B2C3
          user_id: string | null; // null = guest order
          guest_phone: string | null;
          guest_name: string | null;
          status: OrderStatus;
          subtotal: number;
          shipping_cost: number;
          discount_amount: number;
          total: number;
          delivery_address: string;
          pay_method: string;
          is_stockpile: boolean;
          stockpiled_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string; // references orders.id
          product_id: number;
          product_name: string;
          product_image: string;
          size: string;
          quantity: number;
          price: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      temp_leads: {
        Row: {
          id: string;
          phone: string;
          email: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["temp_leads"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["temp_leads"]["Insert"]>;
      };
      drop_leads: {
        Row: {
          id: string;
          user_id: string | null; // set when a temp_lead completes OTP
          phone: string;
          email: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["drop_leads"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["drop_leads"]["Insert"]>;
      };
      keywords: {
        Row: {
          id: string;
          user_id: string; // references auth.users.id
          keyword: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["keywords"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["keywords"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
    };
  };
}
