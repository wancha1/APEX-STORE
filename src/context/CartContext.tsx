import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, Bookmark, CheckCircle, X, Sparkles, ArrowRight } from "lucide-react";
import { Product, CartItem } from "../types";
import { PRODUCTS } from "../data";
import { getSupabase, isSupabaseConfigured, mapSupabaseToFrontend, getIsSupabaseConfigured, configureSupabaseRuntime } from "../lib/supabase";
import { 
  auth as firebaseAuth
} from "../lib/firebase";
import { 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

interface CartContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  activeNotification: {
    product: Product;
    type: "cart" | "wishlist";
    quantity?: number;
    color?: string;
    storage?: string;
  } | null;
  setActiveNotification: (notification: any | null) => void;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedStorage?: string) => void;
  updateQty: (productId: string, quantity: number, selectedColor?: string, selectedStorage?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string, selectedStorage?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  // Dynamic Product Catalog states loaded from public/products/products.json or Supabase
  products: Product[];
  setProducts: (products: Product[]) => void;
  isProductsLoading: boolean;
  productsError: string | null;
  addCustomProducts: (newProducts: Product[]) => void;
  refreshCatalog: () => Promise<void>;

  // Wishlist Feature
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

  // Likes Feature
  likedProductIds: string[];
  toggleLike: (productId: string) => void;
  isLiked: (productId: string) => boolean;

  // Compare Feature
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;

  // SEO & Head Metadata States
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  selectedQuickViewProduct: any | null;
  setSelectedQuickViewProduct: (product: any | null) => void;

  // Merchant Admin Control panel
  showMerchantAdmin: boolean;
  setShowMerchantAdmin: (show: boolean) => void;

  // Search Modal Feature
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Supabase Auth Properties
  adminUser: any | null;
  setAdminUser: (user: any | null) => void;
  csrfToken: string | null;
  setCsrfToken: (token: string | null) => void;
  isSupabaseActive: boolean;

  // Customer Firebase Auth Properties
  customerUser: any | null;
  customerLoading: boolean;
  loginCustomerWithGoogle: () => Promise<void>;
  logoutCustomer: () => Promise<void>;
  loginCustomerWithEmail: (email: string, pass: string) => Promise<any>;
  signUpCustomerWithEmail: (email: string, pass: string, name: string) => Promise<any>;

  // Analytics Tracker Features
  analyticsEvents: any[];
  trackAnalyticsEvent: (
    type: "like" | "save" | "order",
    productId?: string,
    quantity?: number,
    customerName?: string,
    orderId?: string,
    price?: number,
    productName?: string
  ) => void;
  clearAnalyticsEvents: () => void;
}

const generatePrepopulatedEvents = () => {
  const productsList = [
    { id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", price: 4800000 },
    { id: "galaxy-s24-ultra", name: "Galaxy S24 Ultra", price: 4200000 },
    { id: "macbook-pro-m3", name: "MacBook Pro M3", price: 6500000 },
    { id: "sony-ps5-slim", name: "Sony PS5 Slim", price: 2300000 },
    { id: "airpods-pro-2", name: "AirPods Pro 2", price: 950000 },
  ];

  const events: any[] = [];
  const now = new Date();
  const customerNames = ["Wanzira Ronnie", "Akwii Josephine", "Ocen Emmanuel", "Angom Brenda", "Okello Daniel"];

  // 0 - 24 hrs ago (Interval 1)
  events.push({
    id: "evt-1",
    timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    type: "like",
    productId: "iphone-15-pro-max",
    productName: "iPhone 15 Pro Max",
    price: 4800000
  });
  events.push({
    id: "evt-2",
    timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    type: "save",
    productId: "galaxy-s24-ultra",
    productName: "Galaxy S24 Ultra",
    price: 4200000
  });
  events.push({
    id: "evt-3",
    timestamp: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
    type: "order",
    productId: "iphone-15-pro-max",
    productName: "iPhone 15 Pro Max",
    price: 4800000,
    quantity: 1,
    customerName: customerNames[0],
    orderId: "APX-829104"
  });
  events.push({
    id: "evt-4",
    timestamp: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
    type: "like",
    productId: "macbook-pro-m3",
    productName: "MacBook Pro M3",
    price: 6500000
  });
  events.push({
    id: "evt-5",
    timestamp: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(),
    type: "save",
    productId: "airpods-pro-2",
    productName: "AirPods Pro 2",
    price: 950000
  });
  events.push({
    id: "evt-5b",
    timestamp: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
    type: "order",
    productId: "sony-ps5-slim",
    productName: "Sony PS5 Slim",
    price: 2300000,
    quantity: 2,
    customerName: customerNames[1],
    orderId: "APX-491902"
  });

  // 24 - 48 hrs ago (Interval 2)
  events.push({
    id: "evt-6",
    timestamp: new Date(now.getTime() - 26 * 3600 * 1000).toISOString(),
    type: "like",
    productId: "galaxy-s24-ultra",
    productName: "Galaxy S24 Ultra",
    price: 4200000
  });
  events.push({
    id: "evt-7",
    timestamp: new Date(now.getTime() - 30 * 3600 * 1000).toISOString(),
    type: "save",
    productId: "macbook-pro-m3",
    productName: "MacBook Pro M3",
    price: 6500000
  });
  events.push({
    id: "evt-8",
    timestamp: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
    type: "order",
    productId: "airpods-pro-2",
    productName: "AirPods Pro 2",
    price: 950000,
    quantity: 1,
    customerName: customerNames[2],
    orderId: "APX-394851"
  });
  events.push({
    id: "evt-9",
    timestamp: new Date(now.getTime() - 42 * 3600 * 1000).toISOString(),
    type: "save",
    productId: "iphone-15-pro-max",
    productName: "iPhone 15 Pro Max",
    price: 4800000
  });

  // 48 - 72 hrs ago (Interval 3)
  events.push({
    id: "evt-10",
    timestamp: new Date(now.getTime() - 50 * 3600 * 1000).toISOString(),
    type: "like",
    productId: "airpods-pro-2",
    productName: "AirPods Pro 2",
    price: 950000
  });
  events.push({
    id: "evt-11",
    timestamp: new Date(now.getTime() - 56 * 3600 * 1000).toISOString(),
    type: "order",
    productId: "galaxy-s24-ultra",
    productName: "Galaxy S24 Ultra",
    price: 4200000,
    quantity: 1,
    customerName: customerNames[3],
    orderId: "APX-103945"
  });
  events.push({
    id: "evt-12",
    timestamp: new Date(now.getTime() - 64 * 3600 * 1000).toISOString(),
    type: "save",
    productId: "sony-ps5-slim",
    productName: "Sony PS5 Slim",
    price: 2300000
  });

  // Older than 72 hrs (Interval 4)
  events.push({
    id: "evt-13",
    timestamp: new Date(now.getTime() - 80 * 3600 * 1000).toISOString(),
    type: "order",
    productId: "iphone-15-pro-max",
    productName: "iPhone 15 Pro Max",
    price: 4800000,
    quantity: 1,
    customerName: customerNames[4],
    orderId: "APX-928410"
  });
  events.push({
    id: "evt-14",
    timestamp: new Date(now.getTime() - 90 * 3600 * 1000).toISOString(),
    type: "like",
    productId: "macbook-pro-m3",
    productName: "MacBook Pro M3",
    price: 6500000
  });

  return events.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("apex_dark_mode");
      if (saved !== null) {
        return saved === "true";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (isDarkMode) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("apex_dark_mode", String(isDarkMode));
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Dynamic Product Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Analytics Tracker State
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("apex_analytics_events");
      if (saved) {
        return JSON.parse(saved);
      } else {
        const initialEvents = generatePrepopulatedEvents();
        localStorage.setItem("apex_analytics_events", JSON.stringify(initialEvents));
        return initialEvents;
      }
    } catch {
      return [];
    }
  });

  const trackAnalyticsEvent = (
    type: "like" | "save" | "order",
    productId?: string,
    quantity = 1,
    customerName?: string,
    orderId?: string,
    price?: number,
    productName?: string
  ) => {
    try {
      const targetProdName = productName || products.find(p => p.id === productId)?.name || "Premium Item";
      const targetPrice = price || products.find(p => p.id === productId)?.price || 0;

      const newEvent = {
        id: `local-evt-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        type,
        productId,
        productName: targetProdName,
        price: targetPrice,
        quantity,
        customerName: customerName || (type === "order" ? "Cash Client" : undefined),
        orderId,
      };

      setAnalyticsEvents((prev) => {
        const updated = [newEvent, ...prev];
        localStorage.setItem("apex_analytics_events", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to track analytics event:", err);
    }
  };

  const clearAnalyticsEvents = () => {
    try {
      localStorage.removeItem("apex_analytics_events");
      setAnalyticsEvents([]);
    } catch (err) {
      console.error("Failed to clear analytics events:", err);
    }
  };

  // Supabase Admin User State
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);

  // Customer Firebase Auth State
  const [customerUser, setCustomerUser] = useState<any | null>(null);
  const [customerLoading, setCustomerLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCustomerUser(user);
      setCustomerLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginCustomerWithGoogle = async () => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (error) {
      console.error("Google Customer Sign-In Error:", error);
      throw error;
    }
  };

  const loginCustomerWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      return userCredential.user;
    } catch (error) {
      console.error("Email Customer Login Error:", error);
      throw error;
    }
  };

  const signUpCustomerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      // Force refreshing user profile locally
      setCustomerUser({ ...userCredential.user, displayName: name });
      return userCredential.user;
    } catch (error) {
      console.error("Email Customer Sign-Up Error:", error);
      throw error;
    }
  };

  const logoutCustomer = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (error) {
      console.error("Google Customer Logout Error:", error);
    }
  };

  // Monitor secure cookie admin sessions and Supabase Auth updates in parallel
  useEffect(() => {
    if (!isConfigLoaded) return;

    const checkAdminSession = async () => {
      try {
        // Enforce cookie session lookup using credentials: include parameter (supports standard iframe cookies)
        const res = await fetch("/api/admin/me", {
          credentials: "include"
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.success && data.user) {
              setAdminUser(data.user);
              setCsrfToken(data.csrfToken || null);
              return; // Cookie session active, skip standard Supabase guest lookups
            }
          }
        }
      } catch (err) {
        console.error("Secure administrative credentials check failed:", err);
      }

      // Standby fallback to Supabase Anon session observer (if any)
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setAdminUser(session.user);
          }
        } catch (err) {
          console.error("Supabase initial session lookup error:", err);
        }
      }
    };

    checkAdminSession();

    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        // Only update with Supabase session if secure cookie auth is inactive
        if (!csrfToken) {
          setAdminUser(session?.user ?? null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [csrfToken, isConfigLoaded]);

  // Listen for Google Auth callback message from popup
  useEffect(() => {
    const handleGoogleAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const hash = event.data.hash;
        if (hash) {
          const supabase = getSupabase();
          if (supabase) {
            const cleanedHash = hash.replace(/^[#\?]/, "");
            const params = new URLSearchParams(cleanedHash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) {
                console.error("Error setting session from OAuth hash:", error.message);
              }
            }
          }
        }
      }
    };

    window.addEventListener("message", handleGoogleAuthMessage);
    return () => {
      window.removeEventListener("message", handleGoogleAuthMessage);
    };
  }, []);

  async function loadProducts() {
    try {
      setIsProductsLoading(true);
      setProductsError(null);

      const supabase = getSupabase();
      if (supabase) {
        // Fetch from Supabase Products Table
        const { data: sbData, error: sbError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (!sbError && sbData && sbData.length > 0) {
          const mapped = sbData.map(mapSupabaseToFrontend);
          setProducts(mapped);
          setIsProductsLoading(false);
          return;
        } else if (sbError) {
          console.warn("Supabase query error occurred, falling back to local files:", sbError);
        }
      }

      // Fallback: Fetch local products.json
      const res = await fetch("/products/products.json");
      if (!res.ok) {
        throw new Error(`Failed to load product database (HTTP ${res.status})`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON configuration format for product database");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        throw new Error("Invalid product database format");
      }
    } catch (err: any) {
      console.warn("Dynamic product fetch failed. Falling back to static offline content:", err);
      setProductsError(err.message || "Could not fetch dynamic products");
      setProducts(PRODUCTS);
    } finally {
      setIsProductsLoading(false);
    }
  }

  // Load products dynamically on mount checking runtime environment variables dynamically
  useEffect(() => {
    async function initializeAndLoad() {
      try {
        const res = await fetch("/api/config").catch(() => null);
        if (res && res.ok) {
          const config = await res.json();
          if (config.supabaseUrl && config.supabaseAnonKey) {
            configureSupabaseRuntime(config.supabaseUrl, config.supabaseAnonKey);
          }
        }
      } catch (e) {
        console.warn("Dynamic configuration proxy handshake missed.", e);
      }
      setIsSupabaseActive(getIsSupabaseConfigured());
      setIsConfigLoaded(true);
      await loadProducts();
    }
    initializeAndLoad();
  }, []);

  const refreshCatalog = async () => {
    await loadProducts();
  };

  const addCustomProducts = (newProducts: Product[]) => {
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredNew = newProducts.filter((p) => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
  };

  // Client-Active Notification Toast Panel
  const [activeNotification, setActiveNotificationState] = useState<{
    product: Product;
    type: "cart" | "wishlist";
    quantity?: number;
    color?: string;
    storage?: string;
  } | null>(null);

  const [toasts, setToasts] = useState<Array<{
    id: string;
    product: Product;
    type: "cart" | "wishlist";
    quantity?: number;
    color?: string;
    storage?: string;
  }>>([]);

  const addToast = (
    product: Product,
    type: "cart" | "wishlist",
    quantity?: number,
    color?: string,
    storage?: string
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, product, type, quantity, color, storage }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setActiveNotification = (notification: any | null) => {
    setActiveNotificationState(notification);
    if (notification) {
      addToast(
        notification.product,
        notification.type,
        notification.quantity,
        notification.color,
        notification.storage
      );
    }
  };

  // SEO state
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("apex_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load and save Wishlist state
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("apex_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Load and save Likes state
  const [likedProductIds, setLikedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("apex_likes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("apex_likes", JSON.stringify(likedProductIds));
  }, [likedProductIds]);

  const toggleLike = (productId: string) => {
    setLikedProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        return prev.filter((id) => id !== productId);
      } else {
        // Log like event
        trackAnalyticsEvent("like", productId);
        return [...prev, productId];
      }
    });
  };

  const isLiked = (productId: string) => {
    return likedProductIds.includes(productId);
  };

  // Compare state
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Merchant admin state - hidden by default for maximum luxury look
  const [showMerchantAdmin, setShowMerchantAdmin] = useState(false);

  // Search overlay state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("apex_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("apex_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Wishlist Actions
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        // Log save/wishlist event
        trackAnalyticsEvent("save", product.id, 1, undefined, undefined, product.price, product.name);
        
        // Trigger customer notification popup
        setActiveNotification({ product, type: "wishlist" });
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Compare Actions
  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        if (prev.length >= 2) {
          // If already 2 items, replace the second one or show a warning/limit
          // We limit selection to max 2 items
          return [prev[0], product];
        }
        return [...prev, product];
      }
    });
  };

  const isInCompare = (productId: string) => {
    return compareList.some((item) => item.id === productId);
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedStorage?: string
  ) => {
    setCart((prevCart) => {
      // Find matching item with same characteristics
      const matchIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedStorage === selectedStorage
      );

      if (matchIndex > -1) {
        const nextCart = [...prevCart];
        nextCart[matchIndex] = {
          ...nextCart[matchIndex],
          quantity: nextCart[matchIndex].quantity + quantity,
        };
        return nextCart;
      }

      return [...prevCart, { product, quantity, selectedColor, selectedStorage }];
    });
    // Trigger customer notification popup
    setActiveNotification({
      product,
      type: "cart",
      quantity,
      color: selectedColor,
      storage: selectedStorage,
    });
    setIsCartOpen(true); // Auto flash draft drawer when items are added like Apex!
  };

  const updateQty = (
    productId: string,
    quantity: number,
    selectedColor?: string,
    selectedStorage?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedStorage);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId &&
        item.selectedColor === selectedColor &&
        item.selectedStorage === selectedStorage
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (
    productId: string,
    selectedColor?: string,
    selectedStorage?: string
  ) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedStorage === selectedStorage
          )
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        activeNotification,
        setActiveNotification,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        products,
        setProducts,
        isProductsLoading,
        productsError,
        addCustomProducts,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        likedProductIds,
        toggleLike,
        isLiked,
        compareList,
        toggleCompare,
        isInCompare,
        clearCompare,
        isCompareOpen,
        setIsCompareOpen,
        activeCategory,
        setActiveCategory,
        selectedQuickViewProduct,
        setSelectedQuickViewProduct,
        showMerchantAdmin,
        setShowMerchantAdmin,
        isSearchOpen,
        setIsSearchOpen,
        refreshCatalog,
        adminUser,
        setAdminUser,
        csrfToken,
        setCsrfToken,
        isSupabaseActive,
        customerUser,
        customerLoading,
        loginCustomerWithGoogle,
        logoutCustomer,
        loginCustomerWithEmail,
        signUpCustomerWithEmail,
        analyticsEvents,
        trackAnalyticsEvent,
        clearAnalyticsEvents,
      }}
    >
      {selectedHtmlIdFix(children)}

      {/* Interactive Customer Notification Popup / Brief Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[250] flex flex-col gap-3.5 max-w-sm w-full select-none pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
              className="w-full bg-neutral-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col relative overflow-hidden"
              style={{
                boxShadow: toast.type === "cart"
                  ? "0 15px 35px -10px rgba(16,185,129,0.15), 0 0 0 1px rgba(255,255,255,0.03)"
                  : "0 15px 35px -10px rgba(244,63,94,0.15), 0 0 0 1px rgba(255,255,255,0.03)"
              }}
            >
              {/* Glow border stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                toast.type === "cart" ? "bg-emerald-500" : "bg-gradient-to-b from-rose-500 to-pink-500"
              }`} />

              <div className="flex gap-3">
                {/* Dynamic Image Wrapper with Glow */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                  <img
                    src={getProductImageUrl(toast.product)}
                    className="w-full h-full object-cover"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] border shrink-0 ${
                    toast.type === "cart"
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-pink-500 border-pink-400 text-white"
                  }`}>
                    {toast.type === "cart" ? "✓" : "♥"}
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${
                      toast.type === "cart"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        : "bg-pink-500/10 text-pink-400 border border-pink-500/15"
                    }`}>
                      {toast.type === "cart" ? "⚡ Added To Cart" : "💖 Saved To Wishlist"}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate font-display">
                    {toast.product.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    <span className="font-mono font-bold text-sky-400">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "UGX",
                        maximumFractionDigits: 0,
                      }).format(toast.product.price)}
                    </span>
                    {toast.color && (
                      <span className="truncate">
                        • {toast.color}
                      </span>
                    )}
                    {toast.storage && (
                      <span className="truncate">
                        • {toast.storage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close x */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="h-5 w-5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5 active:scale-90 self-start"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Toast CTA trigger links */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2">
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="flex-1 py-1 text-[8px] font-mono uppercase bg-neutral-900/65 hover:bg-neutral-900 text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all cursor-pointer font-bold select-none text-center"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (toast.type === "cart") {
                      setIsCartOpen(true);
                    } else {
                      setIsWishlistOpen(true);
                    }
                    removeToast(toast.id);
                  }}
                  className={`flex-1 py-1 px-2.5 text-[8px] font-mono uppercase rounded-lg transition-all cursor-pointer font-extrabold flex items-center justify-center gap-1 text-black ${
                    toast.type === "cart"
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500"
                      : "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                  }`}
                >
                  <span>{toast.type === "cart" ? "View Checkout" : "View Wishlist"}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  );
}

// Low level Unsplash path mapper to prevent missing image references
const getProductImageUrl = (product: Product) => {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  const images: Record<string, string> = {
    "iphone-15-pro-max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
    "galaxy-s24-ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    "macbook-pro-m3": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    "hp-elitebook-840": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "sony-ps5-slim": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80",
    "samsung-55-4k": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
    "airpods-pro-2": "https://images.unsplash.com/photo-1588449668338-d13417f16cd9?auto=format&fit=crop&w=1200&q=80",
    "anker-prime-100w": "https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=1200&q=80"
  };
  if (images[product.id]) return images[product.id];
  const cat = String(product.category || "").toLowerCase();
  if (cat.includes("phone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes("laptop") || cat.includes("computer")) {
    return "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes("tv") || cat.includes("audio")) {
    return "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes("gaming") || cat.includes("console")) {
    return "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=1200&q=80";
};

// Simple helper to satisfy strict element formatting if wrapping
function selectedHtmlIdFix(node: ReactNode) {
  return node;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}

export function useAdminAuth() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside a CartProvider");
  }
  return {
    adminUser: context.adminUser,
    csrfToken: context.csrfToken,
    setAdminUser: context.setAdminUser,
    setCsrfToken: context.setCsrfToken
  };
}
