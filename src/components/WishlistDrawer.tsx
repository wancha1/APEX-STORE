import { useCart } from "../context/CartContext";
import { X, ShoppingBag, Trash2, Heart, Smartphone, Watch, Laptop, Tv, Gamepad2, Headphones, Camera, Speaker } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getProductIcon = (iconName: string) => {
  switch (iconName) {
    case "Smartphone":
      return <Smartphone className="w-5 h-5" />;
    case "Laptop":
      return <Laptop className="w-5 h-5" />;
    case "Tv":
      return <Tv className="w-5 h-5" />;
    case "Gamepad2":
      return <Gamepad2 className="w-5 h-5" />;
    case "Watch":
      return <Watch className="w-5 h-5" />;
    case "Headphones":
      return <Headphones className="w-5 h-5" />;
    case "Camera":
      return <Camera className="w-5 h-5" />;
    case "Speaker":
      return <Speaker className="w-5 h-5" />;
    default:
      return <Smartphone className="w-5 h-5" />;
  }
};

export default function WishlistDrawer() {
  const { wishlist, toggleWishlist, isWishlistOpen, setIsWishlistOpen, addToCart } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="wishlist-drawer-wrapper">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsWishlistOpen(false)}
            className="absolute inset-0 bg-[#020205]/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-all max-w-md w-screen bg-[#05050c] border-l border-white/10 shadow-2xl flex flex-col pt-6 pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 pb-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <Heart className="w-5 h-5 fill-pink-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-display font-bold text-white leading-tight">My Wishlist</h2>
                    <p className="text-[10px] uppercase tracking-wider font-mono text-slate-500 leading-none mt-1">
                      {wishlist.length} {wishlist.length === 1 ? "item cached" : "items cached"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close Wishlist"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-slate-500/5 border border-slate-500/10 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                      <Heart className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-display font-semibold text-slate-300">Your wishlist is empty</span>
                    <p className="text-xs text-slate-500 max-w-xs mt-1.5 font-light font-sans">
                      Products you heart while shopping the authorized premium Lira store catalog will reflect right here.
                    </p>
                    <button
                      onClick={() => setIsWishlistOpen(false)}
                      className="mt-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                    >
                      Browse Hot Gadgets
                    </button>
                  </div>
                ) : (
                  wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="group bg-white/3 border border-white/5 rounded-2xl p-4 flex gap-4 hover:border-white/10 hover:bg-white/5 transition-all relative text-left"
                    >
                      {/* Brand badge */}
                      <span className="absolute top-3 right-3 text-[8px] font-mono select-none px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
                        100% Genuine
                      </span>

                      {/* Icon Container */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border border-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 self-center">
                        {getProductIcon(item.iconName)}
                      </div>

                      {/* Information */}
                      <div className="flex-1 space-y-1 pr-14">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block">
                          {item.category}
                        </span>
                        <h4 className="font-display font-bold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-xs font-bold text-orange-400">
                            {formatCurrency(item.price)}
                          </span>
                          {item.originalPrice && (
                            <span className="font-mono text-[10px] text-slate-500 line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            addToCart(item, 1);
                            toggleWishlist(item); // Item moves from wishlist to cart!
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Buy gadget"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Buy</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom footer bar instructions */}
              {wishlist.length > 0 && (
                <div className="p-6 bg-white/3 border-t border-white/10 text-center font-mono text-[10px] text-slate-500">
                  ⚡ Items in wishlist are saved. Transfer them to purchase cart instantly.
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
