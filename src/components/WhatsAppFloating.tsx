import { useState, useEffect } from "react";
import { MessageSquare, Smartphone } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { motion, AnimatePresence } from "motion/react";

export default function WhatsAppFloating() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    
    // Trigger tooltip occasionally to draw focus subtly
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4000);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      clearTimeout(timer);
    };
  }, []);

  const handleFloatingClick = () => {
    const defaultMsg = encodeURIComponent(`Hello ${BUSINESS_INFO.name}! 👋 Checked your online storefront. I would like to inquire about gadget specs, prices, and showroom stock availability!`);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${defaultMsg}`, "_blank");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
          
          {/* Subtle Help Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#020205]/90 border border-white/10 backdrop-blur-md text-white rounded-xl py-2 px-3.5 shadow-xl text-[11px] font-medium flex items-center gap-2 relative text-left"
              >
                {/* Ping active */}
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span>Chat live with showroom staff</span>
                {/* Close button for tooltip */}
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-gray-500 hover:text-white ml-1 text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Icon Action Button */}
          <motion.button
            id="floating-whatsapp-action"
            onClick={handleFloatingClick}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-green-500/30 cursor-pointer relative group"
            aria-label="Direct Chat on WhatsApp"
          >
            <MessageSquare className="w-6 h-6 text-white group-hover:scale-115 transition-transform duration-200" />
            <span className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-20 pointer-events-none" />
          </motion.button>

        </div>
      )}
    </AnimatePresence>
  );
}
