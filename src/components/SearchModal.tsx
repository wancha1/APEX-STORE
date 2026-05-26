import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { BUSINESS_INFO } from "../data";
import { Search, X, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Context appropriate Unsplash product photography helper
const getSearchProductImageUrl = (product: any) => {
  const images: Record<string, string> = {
    "iphone-15-pro-max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80",
    "galaxy-s24-ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80",
    "macbook-pro-m3": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80",
    "hp-elitebook-840": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80",
    "sony-ps5-slim": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=300&q=80",
    "samsung-55-4k": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80",
    "airpods-pro-2": "https://images.unsplash.com/photo-1588449668338-d13417f16cd9?auto=format&fit=crop&w=300&q=80",
    "anker-prime-100w": "https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=300&q=80"
  };

  if (images[product.id]) {
    return images[product.id];
  }

  const category = String(product.category || "").toLowerCase();
  if (category.includes("phone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=copy&w=300&q=80";
  }
  if (category.includes("laptop") || category.includes("computer")) {
    return "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=copy&w=300&q=80";
  }
  return "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=copy&w=300&q=80";
};

export default function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, products, setSelectedQuickViewProduct } = useCart();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouncing effect for product matcher
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus on activation & reset states
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setDebouncedQuery("");
      setHighlightedIndex(-1);
      // Little delay to ensure dialog has fully animated
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Trap scroll while search overlay is active
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchOpen]);

  // Multi-field premium search matching algorithm (names, categories, descriptions, specifications)
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const normalized = debouncedQuery.toLowerCase();
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(normalized);
      const matchCategory = p.category.toLowerCase().includes(normalized);
      const matchDescription = p.description && p.description.toLowerCase().includes(normalized);
      const matchSpecs = p.specs && p.specs.some((spec) => spec.toLowerCase().includes(normalized));

      return matchName || matchCategory || matchDescription || matchSpecs;
    });
  }, [products, debouncedQuery]);

  // Reset highlight cursor when results length changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results.length]);

  // Esc key closure, Arrow key navigation and Enter selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      if (e.key === "Escape") {
        setIsSearchOpen(false);
        return;
      }

      if (results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === "Enter") {
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            e.preventDefault();
            handleSelectProduct(results[highlightedIndex]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, results, highlightedIndex, setIsSearchOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectProduct = (product: any) => {
    setSelectedQuickViewProduct(product);
    setIsSearchOpen(false);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          id="search-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-[#020205]/95 backdrop-blur-xl flex flex-col pt-24 pb-8 px-4 sm:px-6 md:px-8"
        >
          {/* Inner content wrapper */}
          <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
            {/* Input & Close block */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3.5 flex-1 select-none">
                {isSearching ? (
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <div className="w-4.5 h-4.5 border-2 border-slate-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <Search className="w-6 h-6 text-slate-400 shrink-0" />
                )}
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Sealed iPhone 15, HP laptop, OLED screen, storage options..."
                  className="w-full bg-transparent text-white font-display text-lg md:text-xl placeholder-slate-500 outline-none border-none py-1"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer bg-white/2"
                aria-label="Close global search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Display based on query state */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
              {!query.trim() ? (
                // Pre-Search Suggestion Guide
                <div className="space-y-8 py-4 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold block mb-4">
                      Instant Premium Categories
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["Phones", "Laptops", "TVs & Audio", "Gaming"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setQuery(cat);
                            inputRef.current?.focus();
                          }}
                          className="px-4 py-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 hover:border-white/15 text-slate-300 font-medium text-xs text-left cursor-pointer transition-all animate-fade-in"
                        >
                          <div className="font-semibold text-white">{cat}</div>
                          <span className="text-[9px] font-mono text-slate-500">Quick explore</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#25D366] font-bold block mb-3">
                      Recommended Showroom Queries
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["Pro Max", "Sealed Box", "M3 MacBook", "4K HDR TV", "Slim Console", "UGX 3,000,000+"].map((rec) => (
                        <button
                          key={rec}
                          type="button"
                          onClick={() => {
                            setQuery(rec);
                            inputRef.current?.focus();
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-black/40 hover:bg-white/5 text-slate-400 text-xs cursor-pointer transition-colors"
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/2 border border-white/5 p-5 rounded-2xl">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block mb-1">
                      AUTHORIZED FLAGSHIP OUTLET CONCIERGE DIRECTIVES:
                    </span>
                    <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
                      Start typing components, model numbers, or core specs to instantly crawl authentic, sealed stock registered on Juba Road. Simply configure variables on the search result card to pre-fetch doorstep dispatch tags!
                    </p>
                  </div>
                </div>
              ) : results.length === 0 && !isSearching ? (
                // No Matching Results
                <div className="py-16 text-center max-w-md mx-auto animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-white/3 text-slate-400 flex items-center justify-center text-lg mb-4 mx-auto">
                    🔍
                  </div>
                  <h5 className="font-display font-semibold text-white tracking-tight text-base mb-1">
                    No results found for "{query}"
                  </h5>
                  <p className="text-xs text-slate-400 font-light leading-relaxed font-sans mb-6">
                    We couldn't locate any items matching your exact query. Try refining your spelling or contact our Juba Road showroom team to check off-catalog custom orders of genuine devices.
                  </p>

                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                      `Hi Apex Devices! I was searching your Juba Road showroom catalog for "${query}" but didn't find any direct matches. Could you check if this item is currently available in your warehouse or if you have incoming stock for it?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#25D366] hover:bg-[#20ba54] text-white transition-all shadow-lg shadow-[#25D366]/10 hover:shadow-[#25D366]/20 cursor-pointer"
                  >
                    <span>Inquire on WhatsApp Hotline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                // Listing Search Results (Only show if we have results in debounced state)
                results.length > 0 && (
                  <div className="space-y-3.5 pb-12 text-left animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-3">
                      <span>Available Showroom matches ({results.length})</span>
                      <span className="hidden sm:inline">Use ↑ ↓ arrow keys to navigate</span>
                    </div>

                    <div className="space-y-2">
                      {results.map((product, index) => {
                        const isHighlighted = index === highlightedIndex;
                        return (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className={`group flex items-center justify-between gap-4 p-3 border rounded-2xl transition-all duration-200 cursor-pointer text-left ${
                              isHighlighted
                                ? "bg-white/10 border-blue-500/50 shadow-md translate-x-1"
                                : "bg-neutral-900/40 hover:bg-white/5 border-white/5 hover:border-white/10"
                            }`}
                          >
                            {/* Thumbnail and Title details block */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="w-14 h-14 bg-black rounded-xl overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                                <img
                                  src={getSearchProductImageUrl(product)}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>

                              <div className="min-w-0">
                                <span className="text-[9px] font-mono tracking-wider uppercase text-slate-500 block">
                                  {product.category}
                                </span>
                                <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 font-display transition-colors truncate">
                                  {product.name}
                                </h4>
                                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                  {product.specs.slice(0, 2).join("  ·  ")}
                                </p>
                              </div>
                            </div>

                            {/* Pricing details and launch button */}
                            <div className="text-right shrink-0 flex items-center gap-3">
                              <div className="font-mono text-xs font-semibold text-white flex flex-col items-end">
                                {isHighlighted && (
                                  <span className="text-[8px] text-blue-400 uppercase tracking-widest font-mono font-bold animate-pulse mb-0.5 select-none hidden sm:inline">
                                    ⏎ Press Enter
                                  </span>
                                )}
                                <span className={isHighlighted ? "text-blue-400 font-bold" : ""}>
                                  {formatCurrency(product.price)}
                                </span>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                                isHighlighted ? "bg-white border-white text-black" : "bg-white/3 border-white/5 text-slate-400 group-hover:bg-white group-hover:text-black group-hover:border-white"
                              }`}>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Quick status footer block */}
            <div className="border-t border-white/5 pt-4 text-center select-none shrink-0 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span>Press <strong className="text-slate-400 font-medium">ESC</strong> to exit context</span>
              </span>
              <span className="text-[#25D366] font-semibold">⚡ Ultimate Showroom Search</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
