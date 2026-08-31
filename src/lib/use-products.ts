"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS as STATIC_PRODUCTS, type Product } from "@/lib/products";

type UseProductsResult = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Returns products from Supabase if available, falls back to
 * the static PRODUCTS array from products.ts if the DB is
 * unreachable or returns no rows.
 */
export function useProducts(): UseProductsResult {
  // Start empty so we never flash the static seed catalogue before the live
  // Supabase data arrives. The static list is used ONLY as a genuine fallback
  // (DB error or truly no rows), handled in the fetch below.
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("products")
      .select("id, name, category, subcategory, price, size, waist, length, elastic_waist, colours, tag, image, available, visible_at")
      .eq("available", true)
      .order("id", { ascending: true })
      .then(({ data, error: dbError }) => {
        if (dbError || !data || data.length === 0) {
          // Silently fall back to static data (available only)
          setProducts(STATIC_PRODUCTS.filter(p => p.available));
          if (dbError) setError(dbError.message);
        } else {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory,
            price: p.price,
            size: p.size,
            waist: p.waist ?? undefined,
            length: p.length ?? undefined,
            elasticWaist: p.elastic_waist,
            colours: p.colours ?? [],
            tag: p.tag as Product["tag"],
            image: p.image,
            images: [],
            description: "",
            available: p.available,
            visible_at: p.visible_at,
            pairsWith: [],
          }));
          setProducts(mapped);
        }
        setIsLoading(false);
      });
  }, []);

  return { products, isLoading, error };
}

/**
 * Server-side: fetch a single product by ID from Supabase.
 * Used in Server Components or Route Handlers.
 * Returns null if not found or on error — caller should fall back to getProduct(id).
 */
export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const { createClient: createServerClient } = await import("@supabase/supabase-js");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      price: data.price,
      size: data.size,
      waist: data.waist ?? undefined,
      length: data.length ?? undefined,
      elasticWaist: data.elastic_waist,
      colours: data.colours ?? [],
      tag: data.tag as Product["tag"],
      image: data.image,
      description: data.description,
      available: data.available,
      pairsWith: (data.pairs_with as Product["pairsWith"]) ?? [],
    };
  } catch {
    return null;
  }
}
