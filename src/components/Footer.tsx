import { MapPin, Phone, Shield, ExternalLink } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { useCart } from "../context/CartContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { showMerchantAdmin, setShowMerchantAdmin } = useCart();

  return (
    <footer id="site-footer" className="bg-[#fafafa] dark:bg-slate-950 border-t border-gray-200 dark:border-white/5 py-8 relative overflow-hidden text-left">
      {/* Subtle background light glow */}
      <div className="absolute bottom-0 right-10 w-[200px] h-[200px] bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand Info & Address */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="font-display font-medium text-white text-xs">A</span>
              </div>
              <div>
                <span className="font-display font-semibold tracking-tight text-slate-900 dark:text-white text-sm">
                  {BUSINESS_INFO.name}
                </span>
                <span className="hidden sm:inline text-slate-400 mx-2 text-xs">|</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-450 shrink-0" />
              <span>{BUSINESS_INFO.address}</span>
            </div>
          </div>

          {/* Map CTA Button and quick contact */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS_INFO.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              id="footer-store-map-btn"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 hover:border-gray-300 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Store Map</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={`tel:${BUSINESS_INFO.phoneDisplay.replace(/\s+/g, "")}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 hover:border-gray-300 transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono">{BUSINESS_INFO.phoneDisplay}</span>
            </a>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-6 pt-6 border-t border-gray-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div>
            &copy; {currentYear} {BUSINESS_INFO.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMerchantAdmin(!showMerchantAdmin)}
              className="text-[10px] uppercase font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>{showMerchantAdmin ? "Exit Warehouse Admin" : "Staff Sandbox Key"}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
