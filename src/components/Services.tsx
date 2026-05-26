import React, { useState, useMemo, useEffect } from "react";
import { BUSINESS_INFO, SERVICES } from "../data";
import { useCart } from "../context/CartContext";
import {
  Smartphone,
  Laptop,
  Tv,
  Gamepad2,
  Headphones,
  Speaker,
  Star,
  Search,
  Check,
  ShoppingBag,
  ArrowRight,
  Clock,
  Zap,
  ShieldCheck,
  Percent,
  X,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";

// Icon components mapping helper
const getProductIcon = (iconName: string) => {
  switch (iconName) {
    case "Smartphone":
      return <Smartphone className="w-8 h-8 text-sky-400" />;
    case "Laptop":
      return <Laptop className="w-8 h-8 text-indigo-400" />;
    case "Tv":
      return <Tv className="w-8 h-8 text-emerald-400" />;
    case "Gamepad2":
      return <Gamepad2 className="w-8 h-8 text-fuchsia-400" />;
    case "Headphones":
      return <Headphones className="w-8 h-8 text-pink-400" />;
    default:
      return <Speaker className="w-8 h-8 text-blue-400" />;
  }
};

// High-quality, context-appropriate Unsplash product photography mapping helper
const getProductImageUrl = (product: any) => {
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

  if (images[product.id]) {
    return images[product.id];
  }

  const category = String(product.category || "").toLowerCase();
  if (category.includes("phone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80";
  }
  if (category.includes("laptop") || category.includes("computer")) {
    return "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=1200&q=80";
  }
  if (category.includes("tv") || category.includes("audio")) {
    return "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80";
  }
  if (category.includes("gaming") || category.includes("console")) {
    return "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=1200&q=80";
};

export default function Services() {
  const { 
    addToCart,
    toggleWishlist,
    isInWishlist,
    activeCategory,
    setActiveCategory,
    selectedQuickViewProduct,
    setSelectedQuickViewProduct,
    products,
    isProductsLoading
  } = useCart();

  // Midnight Countdown
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 12, seconds: 45 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const timer = setTimeout(() => setIsCatalogLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  // Performance-friendly pagination state
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLazyLoadingMore, setIsLazyLoadingMore] = useState(false);



  // Muted video preview hover state
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  // Gallery & media modes in details modal
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Quick View Angle selections state inside Specification Sheet Modal
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  useEffect(() => {
    setActiveAngleIndex(0);
    setMediaMode("image");
  }, [selectedQuickViewProduct]);

  // Construct dynamic angle variations for selected product specs sheet
  const angleSlides = useMemo(() => {
    if (!selectedQuickViewProduct) return [];
    
    // Support customized multiple image paths/URLs
    if (selectedQuickViewProduct.images && selectedQuickViewProduct.images.length > 0) {
      return selectedQuickViewProduct.images.map((img: string, idx: number) => ({
        angleName: idx === 0 ? "Genuine Factory Seal" : idx === 1 ? "Studio Presentation" : `Alternate Perspective #${idx + 1}`,
        description: idx === 0 
          ? "Sealed factory box featuring direct brand warrants and certificate badges"
          : "Premium structural bezels, micro detailing, and scratch-resistant aluminum finishes",
        badge: idx === 0 ? "MAIN BOX" : `ANGLE VIEW #${idx + 1}`,
        image: img
      }));
    }

    return [
      {
        angleName: "Genuine Sealed Box",
        description: "Official factory shrink-wrap with unique serial authenticators",
        badge: "VERIFIED SEALED",
        image: getProductImageUrl(selectedQuickViewProduct)
      },
      {
        angleName: "Aerospace Chassis Profile",
        description: "Premium materials, thin bezel design curves, and robust scratch-resistance",
        badge: "PROFILE",
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80"
      },
      {
        angleName: "Ports & Connectivity IO",
        description: "High-speed USB Type-C or digital connection buses ready for productivity",
        badge: "PORTS / INTERFACES",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
      }
    ];
  }, [selectedQuickViewProduct]);

  // Search & Filters and Sort Settings 
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPriceLimit, setMaxPriceLimit] = useState(20000000);

  const categories = ["All", "Phones", "Laptops", "TVs & Audio", "Gaming", "Accessories"];

  // Custom configurations state
  const [productSelections, setProductSelections] = useState<
    Record<string, { color?: string; storage?: string }>
  >({});

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.specs.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = activeCategory === "All" || product.category === activeCategory;
      const matchPrice = product.price <= maxPriceLimit;
      return matchSearch && matchCategory && matchPrice;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0; // standard order
    });
  }, [products, searchTerm, activeCategory, sortBy, maxPriceLimit]);

  // Reset pagination on filter bounds to optimize low-bandwidth clients
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, activeCategory, sortBy, maxPriceLimit]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleLoadMore = () => {
    setIsLazyLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setIsLazyLoadingMore(false);
    }, 600);
  };

  const handleProductSelection = (productId: string, key: "color" | "storage", value: string) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [key]: value,
      },
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Direct checkout dispatch
  const handleInitiateWhatsAppCall = (product: any) => {
    const selection = productSelections[product.id] || {};
    const colorSelected = selection.color || (product.colors && product.colors[0]) || "Standard Seal";
    const capacitySelected = selection.storage || (product.storages && product.storages[0]) || "Standard Base";

    const customMessage = `Hello ${BUSINESS_INFO.name}! 👋 I am inquiring about a premium order from your online showroom:
    
🛍️ *Model:* ${product.name}
🎨 *Shade:* ${colorSelected}
📦 *Storage:* ${capacitySelected}
💳 *Lira Promo Price:* ${formatCurrency(product.price)}

Please confirm stock eligibility so I can arrange doorstep dispatch at Juba Road! Thank you.`;

    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(customMessage)}`, "_blank");
  };

  // Setup Upgrades customizer concierge configuration
  const [selectedSuite, setSelectedSuite] = useState("command-center"); // Turnkey Suites selections
  const [includeExtendedCare, setIncludeExtendedCare] = useState(true);
  const [includeSetupAndDelivery, setIncludeSetupAndDelivery] = useState(true);

  const getSuitePrice = () => {
    let base = 3500000;
    if (selectedSuite === "creator-studio") base = 5200000;
    if (selectedSuite === "family-theater") base = 2800000;

    if (includeExtendedCare) base += 200000;
    if (includeSetupAndDelivery) base += 50000;
    return base;
  };

  const handleSuiteWhatsAppSubmit = () => {
    const suiteName = selectedSuite === "command-center" 
      ? "Apex Elite Workspace CommandCenter Suite"
      : selectedSuite === "creator-studio"
      ? "Apex Professional Creator Studio Bundle"
      : "Apex Family Cinema Theater Living Room Suite";

    const text = `Hello ${BUSINESS_INFO.name}! 🧡 I would like to book a luxury room upgrade package:
    
💎 *Bespoke Suite Layout:* ${suiteName}
🛡️ *Extended Care Carecard (+200k):* ${includeExtendedCare ? "Yes, Active" : "No, Standard box only"}
🚚 *Lira Whiteglove Setup (+50k):* ${includeSetupAndDelivery ? "Yes, Active" : "No, Pickup"}
📈 *Bespoke Quote:* ${formatCurrency(getSuitePrice())}

Please assign a tech concierge to review stock and showroom delivery schedules at my convenience!`;

    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="services" className="py-24 sm:py-32 relative bg-[#020205] overflow-hidden">
      {/* Immersive background aura highlights */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[40%] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[30%] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Apple-styled minimalist Header */}
        <div className="text-center max-w-4xl mx-auto mb-20 md:mb-28">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-blue-400 font-semibold mb-4 inline-block">
            AUTHORIZED APEX FLAGSHOWROOM
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white tracking-tight mb-6">
            Engineered to Inspire. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-purple-400">
              Showcased for Lira.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto font-sans">
            Step into Northern Uganda's most pristine electronic catalog. Authentic luxury sealed brands, official manufacture warranties, and same-day personalized home delivery.
          </p>
        </div>

        {/* E-Commerce Understated Minimal Filters & Tabs */}
        <div className="bg-neutral-950/40 border border-white/5 p-6 rounded-[2.5rem] gap-6 mb-16 flex flex-col backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            
            {/* Elegant categories list scroll */}
            <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x gap-2 text-left -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap" id="categories-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 text-xs font-medium rounded-xl text-center shrink-0 snap-start cursor-pointer transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-white text-black font-semibold shadow-xl"
                      : "bg-white/3 hover:bg-white/8 border border-white/5 text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quiet modern query bars */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 lg:max-w-xl md:justify-end">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Inquire products, processors or brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 text-xs rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-sans"
                />
              </div>

              {/* Classic Sort selection */}
              <div className="relative flex items-center">
                <span className="text-slate-500 text-[10px] pr-2 uppercase font-mono tracking-widest hidden sm:block">Filter:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-black/50 border border-white/10 text-xs rounded-xl px-3 py-3 text-white outline-none cursor-pointer focus:border-white transition-all font-sans"
                >
                  <option value="featured">Pristine Stock</option>
                  <option value="price_asc">Price: Lowest first</option>
                  <option value="price_desc">Price: High luxury first</option>
                  <option value="rating">Top Rated Showroom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clean range slider budget checks */}
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-2 text-slate-400 text-xs w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-slate-500">Target budget limit:</span>
            </div>

            <div className="flex flex-1 items-center gap-4 w-full max-w-lg">
              <input
                type="range"
                min="5000"
                max="20000000"
                step="5000"
                value={maxPriceLimit}
                onChange={(e) => setMaxPriceLimit(Number(e.target.value))}
                className="flex-1 accent-white bg-white/5 h-1 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl shrink-0 font-mono text-xs text-white transition-colors">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider shrink-0">Limit: UGX</span>
                <input
                  type="text"
                  value={maxPriceLimit === 0 ? "" : maxPriceLimit.toLocaleString()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    if (raw === "") {
                      setMaxPriceLimit(0);
                    } else {
                      const num = Math.min(Math.max(Number(raw), 0), 20000000);
                      setMaxPriceLimit(num);
                    }
                  }}
                  onBlur={() => {
                    if (maxPriceLimit < 5000) {
                      setMaxPriceLimit(5000);
                    }
                  }}
                  className="w-24 bg-transparent border-none text-white font-mono text-xs font-bold focus:outline-none focus:ring-0 text-right p-0"
                  placeholder="5,000"
                  title="Type your target budget limit"
                  id="typed-budget-limit-input"
                />
              </div>
            </div>

            {maxPriceLimit < 20000000 && (
              <button
                type="button"
                onClick={() => setMaxPriceLimit(20000000)}
                className="text-[9px] font-mono text-slate-500 hover:text-white uppercase tracking-wider cursor-pointer font-bold"
              >
                [Clear Limit Filter]
              </button>
            )}
          </div>
        </div>

        {/* Spacious 3-Column Grid for Products - Completely Redesigned & Image-First */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-24" id="products-catalog-grid">
          {isCatalogLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`lux-skeleton-${idx}`}
                className="bg-white/3 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between relative text-left overflow-hidden min-h-[500px]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer pointer-events-none" />
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl bg-white/5 mb-6 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-1/3 mb-4 animate-pulse" />
                  <div className="h-6 bg-white/5 rounded w-3/4 mb-4 animate-pulse" />
                </div>
                <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-neutral-950/40 border border-white/5 rounded-[2.5rem] p-16 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mb-5 mx-auto text-xl">
                ☕
              </div>
              <h5 className="font-display font-medium text-lg text-white mb-2">No showroom items matched</h5>
              <p className="text-sm text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
                No active stock matched "{searchTerm}" or fits this specific price bracket. Reach our Juba Road team using WhatsApp to import or customize custom electronic specs!
              </p>
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const isImageLoaded = loadedImages[product.id];
              
              // Stable scarcity & buyer psychology tag calculation
              const getUrgencyContext = (id: string, idx: number) => {
                const map: Record<string, { label: string; style: string }> = {
                  "iphone-15 Pro Max": { label: "🔥 Only 2 sealed boxes left!", style: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  "galaxy-s24-ultra": { label: "📈 Selling fast in Lira this week", style: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                  "macbook-pro-m3": { label: "⚡ Free dispatch to Lira/Gulu today", style: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                  "sony-ps5-slim": { label: "⏳ Low Showroom Count", style: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                };
                
                // fallback rotating logic
                const defaults = [
                  { label: "🛡️ 1-Year Local Warranty", style: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                  { label: "📦 Sealed Original Accessories", style: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  { label: "✨ Pristine High-Spec Grade", style: "text-teal-400 bg-teal-500/10 border-teal-500/20" }
                ];
                
                return map[id] || defaults[idx % defaults.length];
              };

              const urgency = getUrgencyContext(product.id, filteredProducts.indexOf(product));

              return (
                <div
                  key={product.id}
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                  onClick={() => setSelectedQuickViewProduct(product)}
                  className="product-catalog-grid-item group flex flex-col justify-between text-left relative transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    {/* Frame image (High-resolution premium photography) */}
                    <div className="w-full aspect-[4/3] rounded-[2.2rem] relative overflow-hidden bg-white/3 border border-white/5 flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-white/10 group-hover:shadow-[0_25px_60px_-15px_rgba(59,130,246,0.06)]">
                      
                      {/* Skeletal Shimmer Loader */}
                      {!isImageLoaded && (
                        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center animate-pulse z-0">
                          <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
                        </div>
                      )}

                      {/* Video clip autoplay review on hover */}
                      {hoveredProductId === product.id && (product.videoPreview || (product.videos && product.videos.length > 0)) && (
                        <video
                          src={product.videoPreview || (product.videos && product.videos[0])}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover rounded-[2.2rem] z-10 transition-opacity duration-300 pointer-events-none"
                        />
                      )}

                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onLoad={() => setLoadedImages((prev) => ({ ...prev, [product.id]: true }))}
                        className={`w-full h-full object-cover rounded-[2.2rem] transition-all duration-700 ease-out ${
                          isImageLoaded ? "opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] scale-100 blur-0" : "opacity-0 blur-md"
                        }`}
                      />
                      
                      {/* Ambient Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Stock indicator badge */}
                      <span className={`absolute bottom-4 right-4 text-[9px] font-mono tracking-widest uppercase font-semibold px-3 py-1 rounded-xl border backdrop-blur-md ${
                        product.stockStatus === "In Stock"
                          ? "bg-black/60 border-emerald-500/20 text-emerald-400"
                          : "bg-black/60 border-amber-500/20 text-amber-400"
                      }`}>
                        {product.stockStatus === "In Stock" ? "Showroom Ready" : "Low Stock"}
                      </span>

                      {/* Promo Badging if active */}
                      {product.badge && (
                        <span className="absolute top-4 left-4 text-[9px] font-mono tracking-wide font-extrabold bg-white text-black uppercase px-2.5 py-1 rounded-lg shadow-lg">
                          {product.badge}
                        </span>
                      )}

                      {/* Top-Right Premium Interactive Action Row */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                        {/* Functional Like Button (Toggles global wishlist state per user prompt) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-90 transition-all cursor-pointer ${
                            isInWishlist(product.id)
                              ? "bg-rose-500/25 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-slate-900/40"
                              : "bg-black/50 border-white/5 text-white/80 hover:text-white hover:bg-black/75 hover:border-white/20"
                          }`}
                          title={isInWishlist(product.id) ? "Unlike item" : "Like item"}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-transform duration-300 ${isInWishlist(product.id) ? "fill-rose-500 scale-110 text-rose-500" : ""}`} />
                        </button>

                        {/* Functional Save to Wishlist Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-90 transition-all cursor-pointer ${
                            isInWishlist(product.id)
                              ? "bg-blue-500/25 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-900/40"
                              : "bg-black/50 border-white/5 text-white/80 hover:text-white hover:bg-black/75 hover:border-white/20"
                          }`}
                          title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 transition-transform duration-300 ${isInWishlist(product.id) ? "fill-blue-400 scale-110 text-blue-400" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Meta info & Titles */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                          {product.category}
                        </span>
                      </div>
                      
                      <h4 
                        onClick={() => setSelectedQuickViewProduct(product)}
                        className="font-display font-medium text-lg text-white group-hover:text-blue-400 cursor-pointer transition-colors duration-300"
                      >
                        {product.name}
                      </h4>
                    </div>

                    {/* Scarcity Banner ribbon on card */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-medium ${urgency.style}`}>
                        {urgency.label}
                      </span>
                    </div>

                    {/* Feature highlight line - Understated & Minimalist */}
                    <p className="text-xs font-mono text-slate-400/80 mb-5 leading-relaxed tracking-tight">
                      {product.specs.slice(0, 2).join("    ·    ")}
                    </p>
                  </div>

                  {/* Pricing Matrix & Call-to-Action Layout */}
                  <div className="mt-auto space-y-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-base font-semibold text-white">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="font-mono text-xs text-slate-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Single unified interactive trigger CTA */}
                    <button
                      onClick={() => setSelectedQuickViewProduct(product)}
                      className="w-full py-3.5 px-4 rounded-xl font-medium text-xs tracking-wider uppercase bg-white hover:bg-zinc-100 text-black border border-white hover:border-zinc-100 transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                    >
                      <span>Configure & Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Pagination Button Center Console */}
        {filteredProducts.length > visibleCount && (
          <div className="flex flex-col items-center justify-center pb-20 w-full gap-4 text-center">
            <button
              type="button"
              disabled={isLazyLoadingMore}
              onClick={handleLoadMore}
              className="px-8 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-white/20 text-white font-medium text-xs font-mono uppercase tracking-widest transition-all cursor-pointer hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              {isLazyLoadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin inline-block mr-1" />
                  Scanning Lira Showrooms...
                </span>
              ) : (
                "Show More Genuine Devices"
              )}
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Displaying {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} Premium Products
            </span>
          </div>
        )}

        {/* Minimal Bespoke Workspace & Living Design Concierge (Re-Engineered Calculator alternative) */}
        <div id="calculator" className="scroll-mt-24 mt-24">
          <div className="bg-gradient-to-b from-neutral-950 to-neutral-900 border border-white/5 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Informational intro */}
              <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400 font-semibold mb-2 block">
                    APEX LUXURY OFFICE & CINEMA INTEGRATIONS
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">
                    Inquire Turnkey Workplace & Room Hardware Packages
                  </h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed mt-4 font-sans">
                    Transform your workspace or design a premium family viewing hub. Select a flagship stream preset below, configure customized VIP additions, and fetch an integrated availability quote.
                  </p>
                </div>

                {/* Turnkey Preset grids */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedSuite("command-center")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedSuite === "command-center"
                        ? "border-sky-500/30 bg-sky-500/10 text-white"
                        : "border-white/5 bg-white/2 hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white mb-1">Office CommandCenter</div>
                    <div className="text-[10px] font-mono text-slate-500">Premium MacBook + Desk Hub</div>
                  </button>
                  <button
                    onClick={() => setSelectedSuite("creator-studio")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedSuite === "creator-studio"
                        ? "border-purple-500/30 bg-purple-500/10 text-white"
                        : "border-white/5 bg-white/2 hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white mb-1">Pro Studio Desk</div>
                    <div className="text-[10px] font-mono text-slate-500">M3 Powerhouse + Audio Gear</div>
                  </button>
                  <button
                    onClick={() => setSelectedSuite("family-theater")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedSuite === "family-theater"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-white/2 hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white mb-1">Cinema Lounge</div>
                    <div className="text-[10px] font-mono text-slate-500">4K Frameless TV + Soundbar</div>
                  </button>
                </div>

                {/* Accessories checkboxes */}
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-semibold block">Optional Protection & Care addons:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setIncludeExtendedCare(!includeExtendedCare)}
                      className={`px-4 py-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        includeExtendedCare ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-transparent text-slate-500"
                      }`}
                    >
                      <span className="text-xs font-semibold">3-Year Luxury Warranty Carecard</span>
                      <span className="text-xs font-mono text-sky-400 font-semibold">+200K</span>
                    </button>
                    <button
                      onClick={() => setIncludeSetupAndDelivery(!includeSetupAndDelivery)}
                      className={`px-4 py-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        includeSetupAndDelivery ? "border-white/20 bg-white/5 text-white" : "border-white/5 bg-transparent text-slate-500"
                      }`}
                    >
                      <span className="text-xs font-semibold">Immediate Whiteglove Home Installation</span>
                      <span className="text-xs font-mono text-sky-400 font-semibold">+50K</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Package Summary Receipt Card */}
              <div className="lg:col-span-12 xl:col-span-5 relative">
                <div className="bg-black/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Concierge Estimate</span>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">READY</span>
                  </div>

                  <div className="space-y-3.5 font-mono text-xs">
                    <div className="flex justify-between leading-normal">
                      <span className="text-slate-400 text-left">Layout Streams Choice:</span>
                      <span className="text-white text-right font-medium">
                        {selectedSuite === "command-center" ? "Office CommandCenter" : selectedSuite === "creator-studio" ? "Pro Creator Studio" : "Cinema Living Room"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Carecard Extension:</span>
                      <span>{includeExtendedCare ? "Included" : "Excluded"}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pb-3 border-b border-white/5">
                      <span>Installation Logistics:</span>
                      <span>{includeSetupAndDelivery ? "Immediate Setup" : "Standard Pickup Only"}</span>
                    </div>
                  </div>

                  <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block mb-1">Integrated Promo Pricing Estimate</span>
                    <span className="text-2xl font-mono text-sky-400 font-bold block">
                      {formatCurrency(getSuitePrice())}
                    </span>
                  </div>

                  <button
                    onClick={handleSuiteWhatsAppSubmit}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xl shadow-green-500/15"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-100" />
                    <span className="text-xs tracking-wider uppercase">Book Concierge on WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Customer First Luxury Product Specifications Detail Overlay */}
      {selectedQuickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop screen */}
          <div
            onClick={() => setSelectedQuickViewProduct(null)}
            className="absolute inset-0 bg-[#020205]/95 backdrop-blur-md cursor-pointer"
          />

          {/* Luxury Sheet Modal */}
          <div className="relative w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10 p-6 md:p-10 flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Elegant Close trigger */}
            <button
              onClick={() => setSelectedQuickViewProduct(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer z-20"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-4">
              
              {/* Image angle slider LHS */}
              <div className="lg:col-span-12 xl:col-span-6 space-y-4">
                {/* Media Deck Switcher (Video & Image Playroom) */}
                {selectedQuickViewProduct.videos && selectedQuickViewProduct.videos.length > 0 && (
                  <div className="flex gap-1 p-1 bg-white/2 border border-white/5 rounded-xl self-start max-w-xs">
                    <button
                      type="button"
                      onClick={() => setMediaMode("image")}
                      className={`flex-1 py-1.5 px-3 text-[10px] font-mono uppercase rounded-lg transition-all cursor-pointer font-bold select-none ${
                        mediaMode === "image" ? "bg-white text-black" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📸 Gallery ({angleSlides.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaMode("video")}
                      className={`flex-1 py-1.5 px-3 text-[10px] font-mono uppercase rounded-lg transition-all cursor-pointer font-bold select-none ${
                        mediaMode === "video" ? "bg-white text-black" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🎥 Video Showroom
                    </button>
                  </div>
                )}

                <div
                  onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                  onTouchEnd={(e) => {
                    if (!touchStart) return;
                    const touchEnd = e.changedTouches[0].clientX;
                    const diff = touchStart - touchEnd;
                    if (diff > 55) {
                      setActiveAngleIndex((prev) => (prev + 1) % angleSlides.length);
                    } else if (diff < -55) {
                      setActiveAngleIndex((prev) => (prev - 1 + angleSlides.length) % angleSlides.length);
                    }
                    setTouchStart(null);
                  }}
                  onClick={() => mediaMode === "image" && setIsFullscreenPreviewOpen(true)}
                  className={`aspect-[4/3] bg-neutral-900 border border-white/5 rounded-3xl flex items-center justify-center relative overflow-hidden group/carousel selection:bg-transparent shadow-inner ${
                    mediaMode === "image" ? "cursor-zoom-in" : ""
                  }`}
                >
                  
                  {mediaMode === "image" ? (
                    <>
                      {/* Angle slider active image */}
                      <img
                        src={angleSlides[activeAngleIndex]?.image || getProductImageUrl(selectedQuickViewProduct)}
                        alt={selectedQuickViewProduct.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      />
                      
                      {/* Rating accent badge */}
                      <span className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[9px] text-white">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {selectedQuickViewProduct.rating}
                      </span>

                      {/* Active Slide Angle Badge */}
                      <span className="absolute top-4 right-4 z-10 bg-white/10 text-white backdrop-blur-md border border-white/10 font-mono text-[8px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-lg">
                        {angleSlides[activeAngleIndex]?.badge}
                      </span>

                      {/* Arrows overlay on hover */}
                      {angleSlides.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAngleIndex((prev) => (prev - 1 + angleSlides.length) % angleSlides.length);
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/95 text-white flex items-center justify-center transition-all cursor-pointer text-xs border border-white/5 z-20"
                            aria-label="Previous angle"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAngleIndex((prev) => (prev + 1) % angleSlides.length);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/95 text-white flex items-center justify-center transition-all cursor-pointer text-xs border border-white/5 z-20"
                            aria-label="Next angle"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Micro indicator dots overlay */}
                      {angleSlides.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/50 backdrop-blur-sm py-1.5 px-3 rounded-xl border border-white/5">
                          {angleSlides.map((_, sidx) => (
                            <button
                              key={sidx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAngleIndex(sidx);
                              }}
                              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                activeAngleIndex === sidx ? "bg-white scale-125 w-3" : "bg-white/20 hover:bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-10">
                      <video
                        src={selectedQuickViewProduct.videos?.[0]}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Thumbnail slide strip navigation bar */}
                {mediaMode === "image" && angleSlides.length > 1 && (
                  <div className="flex gap-2 py-1.5 overflow-x-auto scrollbar-none justify-start select-none">
                    {angleSlides.map((slide, sidx) => (
                      <button
                        key={sidx}
                        type="button"
                        onClick={() => setActiveAngleIndex(sidx)}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                          activeAngleIndex === sidx ? "border-blue-500 scale-105" : "border-white/5 hover:border-white/20"
                        }`}
                      >
                        <img src={slide.image} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Selection Label descriptions */}
                {mediaMode === "image" && (
                  <div className="bg-[#050508] border border-white/5 rounded-2xl p-4 text-left">
                    <div className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-widest animate-fade-in">
                      {angleSlides[activeAngleIndex]?.angleName}
                    </div>
                    <div className="text-xs text-slate-400 font-light mt-1 font-sans animate-fade-in text-slate-300">
                      {angleSlides[activeAngleIndex]?.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications Sheet RHS */}
              <div className="lg:col-span-12 xl:col-span-6 space-y-6 text-left">
                
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-1 block font-medium">
                    {selectedQuickViewProduct.category} Catalog Series
                  </span>
                  <h3 className="font-display font-medium text-2xl md:text-3xl text-white leading-tight">
                    {selectedQuickViewProduct.name}
                  </h3>
                  
                  {/* Price displays */}
                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="font-mono text-xl font-semibold text-white">
                      {formatCurrency(selectedQuickViewProduct.price)}
                    </span>
                    {selectedQuickViewProduct.originalPrice && (
                      <span className="font-mono text-sm text-slate-500 line-through">
                        {formatCurrency(selectedQuickViewProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-400 font-light leading-relaxed font-sans">
                  {selectedQuickViewProduct.description || "Authorized manufacturer sealed box. Packed alongside official brand care certificates and specialized Lira customer warranty guarantees."}
                </p>

                {/* Key specs highlight checklists */}
                <div className="space-y-2 bg-[#050508] border border-white/5 p-4 rounded-2xl">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">Key Technical Sheet:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedQuickViewProduct.specs.map((spec: string, sidx: number) => (
                      <div key={sidx} className="flex items-center gap-2 text-xs text-slate-300 font-sans">
                        <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Genuine Detailed Specs List (from dynamic JSON structure) */}
                {selectedQuickViewProduct.detailedSpecs && selectedQuickViewProduct.detailedSpecs.length > 0 && (
                  <div className="space-y-2 bg-neutral-950/80 border border-white/5 p-4 rounded-2xl border-dashed border-white/10">
                    <span className="text-[9px] font-mono uppercase text-teal-400 font-bold block mb-1.5 tracking-wider">🔒 Showroom Specification Sheet:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px]">
                      {selectedQuickViewProduct.detailedSpecs.map((dspec: { label: string; value: string }, idx: number) => (
                        <div key={idx} className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-slate-500">{dspec.label}</span>
                          <span className="text-slate-300 font-medium text-right">{dspec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Options selector blocks */}
                <div className="space-y-4 pt-2">
                  
                  {selectedQuickViewProduct.colors && selectedQuickViewProduct.colors.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5 font-mono">Available Shades:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuickViewProduct.colors.map((color: string) => {
                          const activeColor = productSelections[selectedQuickViewProduct.id]?.color || selectedQuickViewProduct.colors[0];
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleProductSelection(selectedQuickViewProduct.id, "color", color)}
                              className={`px-3 py-2 text-[10px] font-sans rounded-lg border cursor-pointer transition-all ${
                                activeColor === color
                                  ? "border-sky-500 bg-sky-500/10 text-white font-medium"
                                  : "border-white/5 bg-white/3 text-slate-400 hover:border-white/10"
                              }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedQuickViewProduct.storages && selectedQuickViewProduct.storages.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5 font-mono">Available Custom Capacities:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuickViewProduct.storages.map((st: string) => {
                          const activeStorage = productSelections[selectedQuickViewProduct.id]?.storage || selectedQuickViewProduct.storages[0];
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleProductSelection(selectedQuickViewProduct.id, "storage", st)}
                              className={`px-3 py-2 text-[10px] font-sans rounded-lg border cursor-pointer transition-all ${
                                activeStorage === st
                                  ? "border-sky-500 bg-sky-500/10 text-white font-medium"
                                  : "border-white/5 bg-white/3 text-slate-400 hover:border-white/10"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Elegant real-time Order Summary Certificate */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4.5 space-y-2.5 font-mono text-xs text-slate-300">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">🛒 Active Dispatch Bill Preview</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm uppercase tracking-widest font-bold">Showroom Approved</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Unit model:</span>
                    <span className="text-white text-right truncate font-medium">{selectedQuickViewProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected shade:</span>
                    <span className="text-sky-400 text-right font-medium">{productSelections[selectedQuickViewProduct.id]?.color || selectedQuickViewProduct.colors?.[0] || "Standard Seal"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected storage:</span>
                    <span className="text-purple-400 text-right font-medium">{productSelections[selectedQuickViewProduct.id]?.storage || selectedQuickViewProduct.storages?.[0] || "Standard Base"}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5 text-xs">
                    <span className="text-slate-400 font-sans">Showroom Promo Price:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{formatCurrency(selectedQuickViewProduct.price)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center italic mt-1 font-sans">
                    * Click below to instantly draft order details to sales agent
                  </div>
                </div>

                {/* Primary WhatsApp Direct Dispatch button */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-3">
                  {/* Like & Wishlist Quick Actions for the detailed modal */}
                  <div className="flex gap-2 self-stretch sm:self-auto justify-center">
                    {/* Heart/Like Button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedQuickViewProduct)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                        isInWishlist(selectedQuickViewProduct.id)
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={isInWishlist(selectedQuickViewProduct.id) ? "Liked" : "Like Item"}
                    >
                      <Heart className={`w-4.5 h-4.5 ${isInWishlist(selectedQuickViewProduct.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    {/* Bookmark/Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedQuickViewProduct)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                        isInWishlist(selectedQuickViewProduct.id)
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={isInWishlist(selectedQuickViewProduct.id) ? "Saved in wishlist" : "Add to wishlist"}
                    >
                      <Bookmark className={`w-4.5 h-4.5 ${isInWishlist(selectedQuickViewProduct.id) ? "fill-blue-400" : ""}`} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleInitiateWhatsAppCall(selectedQuickViewProduct);
                      setSelectedQuickViewProduct(null);
                    }}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold bg-[#25D366] hover:bg-[#20ba54] text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/10 w-full sm:w-auto"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span className="text-xs uppercase tracking-wider font-bold">Book Order via WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQuickViewProduct(null)}
                    className="py-4 px-6 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    Back to Showroom
                  </button>
                </div>

                {/* Absolute warranty & security checks */}
                <div className="flex items-center justify-around gap-2 pt-4 border-t border-white/5 text-[9px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">✔ Sealed Genuine Stock</span>
                  <span className="flex items-center gap-1">⏱ Same-Day Lira Delivery</span>
                  <span className="flex items-center gap-1">🛡 Corporate Warranties</span>
                </div>

                {/* Mobile Sticky CTA Trigger overlay inside viewport */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#020205]/95 backdrop-blur-md border-t border-white/10 p-4 flex items-center justify-between xl:hidden animate-fade-in">
                  <div className="max-w-[160px] truncate text-left">
                    <div className="text-[8px] text-sky-400 font-mono uppercase tracking-widest leading-none mb-1">Mobile Fast checkout</div>
                    <div className="text-sm font-mono text-white font-extrabold truncate">{selectedQuickViewProduct.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleInitiateWhatsAppCall(selectedQuickViewProduct);
                      setSelectedQuickViewProduct(null);
                    }}
                    className="px-5 py-3.5 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20ba54] text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#25D366]/20 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy Now</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Highly Polished Fullscreen Image Preview overlay */}
            {isFullscreenPreviewOpen && mediaMode === "image" && (
              <div 
                onClick={() => setIsFullscreenPreviewOpen(false)}
                className="fixed inset-0 z-[120] bg-black/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
              >
                <button
                  type="button"
                  onClick={() => setIsFullscreenPreviewOpen(false)}
                  className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer text-xs font-mono uppercase tracking-widest select-none z-55"
                >
                  ✕ Close Zoom
                </button>
                
                <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={angleSlides[activeAngleIndex]?.image || getProductImageUrl(selectedQuickViewProduct)}
                    className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl transition-all duration-350"
                    alt={selectedQuickViewProduct.name}
                  />
                  
                  {/* Absolute description details overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-950 border border-white/10 py-2.5 px-6 rounded-2xl text-center max-w-sm">
                    <div className="text-white text-xs font-bold leading-none mb-1">{selectedQuickViewProduct.name}</div>
                    <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">{angleSlides[activeAngleIndex]?.angleName}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
}
