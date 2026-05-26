export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
  priceStart: string;
  benefits: string[];
}

export interface TrustSignal {
  title: string;
  description: string;
  iconName: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  location: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
}

export interface TechStackItem {
  name: string;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviewsCount: number;
  badge?: string;
  specs: string[];
  colors?: string[];
  storages?: string[];
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  iconName: "Smartphone" | "Laptop" | "Tv" | "Gamepad2" | "Watch" | "Headphones" | "Camera" | "Speaker";
  // Media & Scalable spec additions
  images?: string[];
  videos?: string[];
  videoPreview?: string;
  detailedSpecs?: { label: string; value: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedStorage?: string;
}

