import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ShoppingBag, Heart, Bookmark, CheckCircle, X, Sparkles, ArrowRight } from "lucide-react";
import { Product, CartItem } from "../types";
import { PRODUCTS } from "../data";

interface CartContextType {
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

  // Dynamic Product Catalog states loaded from public/products/products.json
  products: Product[];
  setProducts: (products: Product[]) => void;
  isProductsLoading: boolean;
  productsError: string | null;
  addCustomProducts: (newProducts: Product[]) => void;

  // Wishlist Feature
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Dynamic Product Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Load products dynamically on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        setIsProductsLoading(true);
        const res = await fetch("/products/products.json");
        if (!res.ok) {
          throw new Error(`Failed to load product database (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          throw new Error("Invalid product database format");
        }
      } catch (err: any) {
        console.warn("Dynamic product fetch failed. Falling back to local static cache:", err);
        setProductsError(err.message || "Could not fetch dynamic products");
        // Fallback to static offline config gracefully
        setProducts(PRODUCTS);
      } finally {
        setIsProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const addCustomProducts = (newProducts: Product[]) => {
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredNew = newProducts.filter((p) => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
  };

  // Client-Active Notification Toast Panel
  const [activeNotification, setActiveNotification] = useState<{
    product: Product;
    type: "cart" | "wishlist";
    quantity?: number;
    color?: string;
    storage?: string;
  } | null>(null);

  // Auto-dismiss handler to let alerts slide back smoothly
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeNotification]);

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
      }}
    >
      {selectedHtmlIdFix(children)}

      {/* Interactive Customer Notification Popup / Brief Toast */}
      {activeNotification && (
        <div 
          id="customer-notification-popup"
          className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-neutral-950/95 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto select-none transition-all duration-300"
          style={{
            boxShadow: activeNotification.type === "cart" 
              ? "0 20px 40px -15px rgba(16,185,129,0.2), 0 0 0 1px rgba(255,255,255,0.05)" 
              : "0 20px 40px -15px rgba(244,63,94,0.2), 0 0 0 1px rgba(255,255,255,0.05)"
          }}
        >
          {/* Background glowing gradient base */}
          <div className={`absolute -inset-px -z-10 rounded-3xl opacity-30 blur-md transition-all ${
            activeNotification.type === "cart" ? "bg-emerald-500/10" : "bg-pink-500/10"
          }`} />

          <div className="flex gap-3">
            {/* Dynamic Image Wrapper with Glow */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 border border-white/15 shrink-0">
              <img 
                src={getProductImageUrl(activeNotification.product)} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                alt="" 
              />
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border shrink-0 ${
                activeNotification.type === "cart" 
                  ? "bg-emerald-500 border-emerald-400 text-white" 
                  : "bg-pink-500 border-pink-400 text-white"
              }`}>
                {activeNotification.type === "cart" ? "✓" : "♥"}
              </div>
            </div>

            {/* Info Blocks */}
            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${
                  activeNotification.type === "cart" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                }`}>
                  {activeNotification.type === "cart" ? "⚡ Added To Cart" : "💖 Saved To Wishlist"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-sky-400" />
              </div>
              <h4 className="text-sm font-semibold text-white truncate font-display">
                {activeNotification.product.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-mono font-bold text-sky-400">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "UGX",
                    maximumFractionDigits: 0,
                  }).format(activeNotification.product.price)}
                </span>
                {activeNotification.color && (
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    • {activeNotification.color}
                  </span>
                )}
                {activeNotification.storage && (
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    • {activeNotification.storage}
                  </span>
                )}
              </div>
            </div>

            {/* Close button icon */}
            <button
              type="button"
              onClick={() => setActiveNotification(null)}
              className="h-6 w-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5 active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Action Interactive Footer */}
          <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveNotification(null);
              }}
              className="flex-1 py-1.5 text-[10px] font-mono uppercase bg-neutral-900 hover:bg-neutral-850 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer font-bold select-none text-center"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeNotification.type === "cart") {
                  setIsCartOpen(true);
                } else {
                  setIsWishlistOpen(true);
                }
                setActiveNotification(null);
              }}
              className={`flex-1 py-1.5 px-3 text-[10px] font-mono uppercase rounded-xl transition-all cursor-pointer font-extrabold flex items-center justify-center gap-1.5 text-black ${
                activeNotification.type === "cart"
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500"
                  : "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              }`}
            >
              <span>{activeNotification.type === "cart" ? "View Checkout" : "View Wishlist"}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
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
