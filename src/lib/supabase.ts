import { createClient } from "@supabase/supabase-js";
import { Product } from "../types";

let supabaseUrl = ((import.meta as any).env?.APEX_SUPABASE_URL) || ((import.meta as any).env?.VITE_SUPABASE_URL) || "";
let supabaseAnonKey = ((import.meta as any).env?.APEX_SUPABASE_ANON_KEY) || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || "";

export function getIsSupabaseConfigured(): boolean {
  const urlValid = supabaseUrl && 
                  supabaseUrl !== "YOUR_SUPABASE_URL" && 
                  !supabaseUrl.includes("YOUR_SUPABASE") && 
                  supabaseUrl.startsWith("http");
  const keyValid = supabaseAnonKey && 
                  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY" && 
                  !supabaseAnonKey.includes("YOUR_SUPABASE") && 
                  supabaseAnonKey.length > 20;
  return !!(urlValid && keyValid);
}

export const isSupabaseConfigured = getIsSupabaseConfigured();

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!getIsSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export function configureSupabaseRuntime(url: string, anonKey: string) {
  if (url && anonKey) {
    const isNewUrl = url !== "YOUR_SUPABASE_URL" && !url.includes("YOUR_SUPABASE") && url.startsWith("http");
    const isNewKey = anonKey !== "YOUR_SUPABASE_ANON_KEY" && !anonKey.includes("YOUR_SUPABASE") && anonKey.length > 20;
    if (isNewUrl && isNewKey) {
      supabaseUrl = url;
      supabaseAnonKey = anonKey;
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
}

export interface SupabaseProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price?: number | null;
  badge?: string | null;
  specs: string[];
  colors: string[];
  storages: string[];
  images: string[];
  videos: string[];
  stock_status: string;
  detailed_specs?: any;
  created_at?: string;
}

/**
 * Maps a record from Supabase table 'products' to the frontend 'Product' datatype.
 * Correctly calculates discount badges and defaults parameters nicely.
 */
export function mapSupabaseToFrontend(p: SupabaseProduct): Product {
  const ds = p.detailed_specs || {};
  
  // Calculate discount dynamically if requested: $((original_price - price)/original_price)*100
  let calculatedBadge = p.badge || undefined;
  if (p.original_price && p.original_price > p.price) {
    const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
    if (discount > 0) {
      calculatedBadge = `${discount}% OFF`;
    }
  }

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.original_price || undefined,
    badge: calculatedBadge,
    specs: p.specs || [],
    colors: p.colors || [],
    storages: p.storages || [],
    stockStatus: (p.stock_status as any) || "In Stock",
    images: p.images || [],
    videos: p.videos || [],
    description: ds.description || "Authorized manufacturer sealed box. Certified check-in and instantaneous replacements.",
    rating: parseFloat(ds.rating ?? "5.0") || 5.0,
    reviewsCount: parseInt(ds.reviewsCount ?? "15") || 15,
    iconName: ds.iconName || "Smartphone",
    videoPreview: ds.videoPreview || undefined,
    detailedSpecs: ds.techSpecs || [],
    stockQuantity: ds.stockQuantity !== undefined ? Number(ds.stockQuantity) : undefined,
    warrantyStatus: ds.warrantyStatus || undefined
  };
}

/**
 * Maps a frontend 'Product' datatype back to the Supabase table layout format.
 */
export function mapFrontendToSupabase(p: Product): Partial<SupabaseProduct> {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    original_price: p.originalPrice || null,
    badge: p.badge || null,
    specs: p.specs || [],
    colors: p.colors || [],
    storages: p.storages || [],
    stock_status: p.stockStatus || "In Stock",
    images: p.images || [],
    videos: p.videos || [],
    detailed_specs: {
      description: p.description,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      iconName: p.iconName,
      videoPreview: p.videoPreview,
      techSpecs: p.detailedSpecs || [],
      stockQuantity: p.stockQuantity,
      warrantyStatus: p.warrantyStatus
    }
  };
}

// SQL Script instructions to be copy-pasted in Supabase SQL editor by the user/admin
export const SUPABASE_SETUP_SQL = `-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    original_price DOUBLE PRECISION,
    badge TEXT,
    specs TEXT[] DEFAULT '{}'::TEXT[],
    colors TEXT[] DEFAULT '{}'::TEXT[],
    storages TEXT[] DEFAULT '{}'::TEXT[],
    images TEXT[] DEFAULT '{}'::TEXT[],
    videos TEXT[] DEFAULT '{}'::TEXT[],
    stock_status TEXT DEFAULT 'In Stock',
    detailed_specs JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to anyone
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT TO public USING (true);

-- SECURE DESIGN: Direct client-side modifications (INSERT, UPDATE, DELETE) are disabled!
-- All backend admin writes flow securely through our Node/Express server API using the Supabase Service Role key (which bypasses RLS),
-- completely eliminating any risk of direct frontend state manipulation, key exposure, or clients tampering with the database.

-- Create sheet_configs table for managing connected Google Sheets
CREATE TABLE IF NOT EXISTS public.sheet_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url_or_id TEXT NOT NULL,
    sync_interval TEXT DEFAULT 'manual' NOT NULL, -- manual, hour, 6hours, daily
    category_filter TEXT DEFAULT 'All' NOT NULL, -- restrict to specific category or All
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_sync_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for sheet_configs
ALTER TABLE public.sheet_configs ENABLE ROW LEVEL SECURITY;

-- SECURE DESIGN: Only super admins can manage Google Sheets configurations. Clients only query SELECT securely if verified.

-- Create sheet_sync_logs table for logging audit histories
CREATE TABLE IF NOT EXISTS public.sheet_sync_logs (
    id TEXT PRIMARY KEY,
    sheet_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL, -- 'success' or 'failed'
    added_count INTEGER DEFAULT 0 NOT NULL,
    updated_count INTEGER DEFAULT 0 NOT NULL,
    skipped_count INTEGER DEFAULT 0 NOT NULL,
    failed_rows JSONB DEFAULT '[]'::JSONB NOT NULL,
    log_text TEXT NOT NULL
);

-- Enable RLS for sheet_sync_logs
ALTER TABLE public.sheet_sync_logs ENABLE ROW LEVEL SECURITY;

-- SECURE DESIGN: Public and regular authenticated users have ZERO write/update policies on system log tables.
-- The custom Express backend acts as the single source of truth, appending logs after crypto JWT verification.

-- Storage bucket configuration guidelines:
-- Please create a storage bucket in your Supabase admin named 'product-media'.
-- Set it to public, and do lock down write operations completely except via the service_role key.
`;
