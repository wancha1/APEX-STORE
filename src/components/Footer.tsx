import { MapPin, Phone, Mail, Globe, Shield } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { MouseEvent } from "react";
import { useCart } from "../context/CartContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { showMerchantAdmin, setShowMerchantAdmin } = useCart();

  const handleLinkScroll = (e: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="site-footer" className="bg-[#020205]/20 border-t border-white/5 pt-16 pb-8 relative overflow-hidden text-left">
      {/* Subtle bottom background light glow */}
      <div className="absolute bottom-0 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Main Footer layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/5 pb-12 mb-8 animate-fade-in">
          
          {/* Column 1: Brand & Slogan */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-start text-left">
            <a href="#" className="flex items-center gap-2 group mb-5" id="footer-logo">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow shadow-blue-500/10">
                <span className="font-display font-medium text-white text-base">A</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display font-semibold tracking-tight text-white text-md leading-tight">
                  {BUSINESS_INFO.name}
                </span>
                <span className="text-[8px] font-mono tracking-wider text-blue-400 capitalize">electronics showroom</span>
              </div>
            </a>
            
            <p className="text-slate-400 text-xs font-light leading-relaxed mb-6 max-w-sm">
              The premier Flagship Store in northern Uganda for genuine sealed smartphones, premium business laptops, high-definition displays, and accessories, backed by direct brand warranties.
            </p>

            <div className="flex items-center gap-4 text-slate-500 text-xs font-mono">
              <span>Lira Showroom HQ</span>
              <span>•</span>
              <span className="text-blue-400 font-bold">Juba Road</span>
            </div>
          </div>

          {/* Column 2: Sitemap */}
          <div className="md:col-span-6 lg:col-span-3 flex flex-col items-start text-left">
            <h5 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4">
              Quick Sitemap
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#services" onClick={(e) => handleLinkScroll(e, "services")} className="hover:text-white hover:underline transition-all">
                  Tech Showroom
                </a>
              </li>
              <li>
                <a href="#calculator" onClick={(e) => handleLinkScroll(e, "calculator")} className="hover:text-white hover:underline transition-all">
                  Device Setup Builder
                </a>
              </li>
              <li>
                <a href="#why-us" onClick={(e) => handleLinkScroll(e, "why-us")} className="hover:text-white hover:underline transition-all">
                  Showroom Standards
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleLinkScroll(e, "about")} className="hover:text-white hover:underline transition-all">
                  Our Legacy
                </a>
              </li>
              <li>
                <a href="#testimonials" onClick={(e) => handleLinkScroll(e, "testimonials")} className="hover:text-white hover:underline transition-all">
                  Buyer Reviews
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => handleLinkScroll(e, "contact")} className="hover:text-white hover:underline transition-all">
                  Contact Store
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact quick facts */}
          <div className="md:col-span-6 lg:col-span-4 flex flex-col items-start text-left">
            <h5 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4">
              Connect Directory
            </h5>
            <div className="space-y-3.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="font-mono">{BUSINESS_INFO.phoneDisplay}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="font-mono">{BUSINESS_INFO.email}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{BUSINESS_INFO.address}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Lower Banner Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500 font-mono">
          <div>
            &copy; {currentYear} {BUSINESS_INFO.name}. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <span>Imported & Supplied for</span>
              <span className="text-white font-medium">Genuine Tech Access</span>
            </div>
            <button
              onClick={() => setShowMerchantAdmin(!showMerchantAdmin)}
              className="text-[10px] uppercase font-mono tracking-widest text-[#25D366] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3 h-3 text-[#25D366]" />
              <span>{showMerchantAdmin ? "[Exit Warehouse Admin]" : "[Staff Sandbox Portal]"}</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
