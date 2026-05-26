import { useCart } from "../context/CartContext";
import { X, Smartphone, Watch, Laptop, Tv, Gamepad2, Headphones, Camera, Speaker, Check, ShoppingBag, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getProductIcon = (iconName: string) => {
  switch (iconName) {
    case "Smartphone":
      return <Smartphone className="w-8 h-8 text-blue-400" />;
    case "Laptop":
      return <Laptop className="w-8 h-8 text-blue-400" />;
    case "Tv":
      return <Tv className="w-8 h-8 text-blue-400" />;
    case "Gamepad2":
      return <Gamepad2 className="w-8 h-8 text-blue-400" />;
    case "Watch":
      return <Watch className="w-8 h-8 text-blue-400" />;
    case "Headphones":
      return <Headphones className="w-8 h-8 text-blue-400" />;
    case "Camera":
      return <Camera className="w-8 h-8 text-blue-400" />;
    case "Speaker":
      return <Speaker className="w-8 h-8 text-blue-400" />;
    default:
      return <Smartphone className="w-8 h-8 text-blue-400" />;
  }
};

export default function CompareModal() {
  const { compareList, toggleCompare, clearCompare, isCompareOpen, setIsCompareOpen, addToCart } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isCompareOpen) return null;

  const item1 = compareList[0];
  const item2 = compareList[1];

  // Helper to determine price color indicators
  const p1Cheaper = item1 && item2 && item1.price <= item2.price;
  const p2Cheaper = item1 && item2 && item2.price < item1.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCompareOpen(false)}
          className="absolute inset-0 bg-[#020205]/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl bg-[#05050c] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl z-10 flex flex-col p-6 sm:p-8 max-h-[90vh]"
        >
          {/* Top Bar / Close Actions */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <div className="text-left">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2.5 py-0.5 rounded font-mono uppercase font-bold tracking-widest">
                TECHNICAL BENCHMARK
              </span>
              <h3 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
                Product Specification Comparison
              </h3>
            </div>
            <button
              onClick={() => setIsCompareOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close Comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Verification States */}
          {!item1 && (
            <div className="py-16 text-center space-y-4">
              <p className="text-slate-400 text-sm font-sans">
                You haven't selected any items for comparison yet. Check the "Compare" box on product cards in the catalog.
              </p>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-transform cursor-pointer"
              >
                Go to Catalog
              </button>
            </div>
          )}

          {item1 && (
            <div className="flex-1 overflow-y-auto space-y-6 select-none pr-1">
              {/* Main specifications table/grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Product 1 Panel */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-5 sm:p-6 text-left relative flex flex-col justify-between">
                  <button
                    onClick={() => toggleCompare(item1)}
                    className="absolute top-4 right-4 text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold hover:underline cursor-pointer"
                  >
                    [Remove]
                  </button>

                  <div>
                    {/* Visual head */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border border-blue-500/15 rounded-xl flex items-center justify-center">
                        {getProductIcon(item1.iconName)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{item1.category}</span>
                        <h4 className="font-display font-extrabold text-base text-white leading-tight mt-0.5">
                          {item1.name}
                        </h4>
                      </div>
                    </div>

                    {/* Price and Badging */}
                    <div className="space-y-2 border-t border-b border-white/5 py-3 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-400 font-sans text-xs">Apex Lira Price:</span>
                        <div className="text-right">
                          <span className={`font-mono text-base font-bold ${p1Cheaper ? "text-emerald-400" : "text-orange-400"}`}>
                            {formatCurrency(item1.price)}
                          </span>
                          {p1Cheaper && item2 && (
                            <span className="block text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                              ✨ BEST PRICE DEAL
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Rating:</span>
                        <span className="text-white font-mono flex items-center gap-1 font-semibold">
                          ⭐ {item1.rating} <span className="text-slate-500">({item1.reviewsCount} reviews)</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Stock Availability:</span>
                        <span className={`font-mono font-bold ${item1.stockStatus === "In Stock" ? "text-emerald-400" : "text-amber-400"}`}>
                          {item1.stockStatus}
                        </span>
                      </div>
                    </div>

                    {/* Spec features listing */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold tracking-wider block">
                        Tech Specs Checklist:
                      </span>
                      {item1.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 font-sans">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => {
                        addToCart(item1, 1);
                        setIsCompareOpen(false);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add This to Cart
                    </button>
                  </div>
                </div>

                {/* Product 2 Panel (either selected or draft empty frame) */}
                {item2 ? (
                  <div className="bg-white/3 border border-white/5 rounded-2xl p-5 sm:p-6 text-left relative flex flex-col justify-between">
                    <button
                      onClick={() => toggleCompare(item2)}
                      className="absolute top-4 right-4 text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold hover:underline cursor-pointer"
                    >
                      [Remove]
                    </button>

                    <div>
                      {/* Visual head */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border border-blue-500/15 rounded-xl flex items-center justify-center">
                          {getProductIcon(item2.iconName)}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{item2.category}</span>
                          <h4 className="font-display font-extrabold text-base text-white leading-tight mt-0.5">
                            {item2.name}
                          </h4>
                        </div>
                      </div>

                      {/* Price and Badging */}
                      <div className="space-y-2 border-t border-b border-white/5 py-3 mb-4">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-400 font-sans text-xs">Apex Lira Price:</span>
                          <div className="text-right">
                            <span className={`font-mono text-base font-bold ${p2Cheaper ? "text-emerald-400" : "text-orange-400"}`}>
                              {formatCurrency(item2.price)}
                            </span>
                            {p2Cheaper && (
                              <span className="block text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                                ✨ BEST PRICE DEAL
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Rating:</span>
                          <span className="text-white font-mono flex items-center gap-1 font-semibold">
                            ⭐ {item2.rating} <span className="text-slate-500">({item2.reviewsCount} reviews)</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Stock Availability:</span>
                          <span className={`font-mono font-bold ${item2.stockStatus === "In Stock" ? "text-emerald-400" : "text-amber-400"}`}>
                            {item2.stockStatus}
                          </span>
                        </div>
                      </div>

                      {/* Spec features listing */}
                      <div className="space-y-2.5">
                        <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold tracking-wider block">
                          Tech Specs Checklist:
                        </span>
                        {item2.specs.map((spec, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300 font-sans">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add to Cart CTA */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={() => {
                          addToCart(item2, 1);
                          setIsCompareOpen(false);
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add This to Cart
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-white/1 text-slate-500 space-y-3 min-h-[350px]">
                    <HelpCircle className="w-10 h-10 text-slate-600 animate-pulse" />
                    <div>
                      <p className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Choose a second gadget</p>
                      <p className="text-[11px] text-slate-500 font-light font-sans max-w-xs mt-1">
                        Tick the "Compare" checker on any other item in the electronics store display to view them side-by-side.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Footer controls & Benchmark Disclaimer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 mt-6 gap-3">
            <span className="text-[10px] font-mono text-slate-500 text-left sm:text-left">
              🛡️ Direct brand specs directly mapped from licensed physical retail manuals.
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={clearCompare}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Dismiss View
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
