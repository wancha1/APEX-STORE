import { useState, useEffect } from "react";
import { Menu, X, MessageSquare, Smartphone, ShoppingBag, Heart, GitCompare, Search } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "motion/react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { 
    cartCount, 
    setIsCartOpen, 
    wishlist, 
    setIsWishlistOpen, 
    compareList, 
    setIsCompareOpen,
    isSearchOpen,
    setIsSearchOpen
  } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Live Catalog", href: "#services" },
    { name: "Setup Builder", href: "#calculator" },
    { name: "Why Apex", href: "#why-us" },
    { name: "Our Legacy", href: "#about" },
    { name: "Reviews", href: "#testimonials" },
    { name: "Contact Store", href: "#contact" },
  ];

  const handleWhatsAppClick = () => {
    const defaultMsg = encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I checked out your online storefront. I am looking to inquire about flagship phone & laptop stocks!`);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${defaultMsg}`, "_blank");
  };


  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/4 border-b border-white/8 backdrop-blur-lg py-4 shadow-lg shadow-black/30"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" id="nav-logo">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="font-display font-medium text-white text-lg">A</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 blur opacity-40 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-semibold tracking-tight text-white text-lg leading-tight">
                Apex Devices
              </span>
              <span className="text-[9px] font-mono font-medium text-blue-400 capitalize tracking-wider leading-none">
                electronics showroom
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" id="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Contact CTA & Cart */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Elegant Search bar trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/5 bg-white/4 hover:bg-white/10 hover:border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-sans text-xs group"
              title="Search Showroom Products"
              aria-label="Open global search"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              <span className="text-slate-400 select-none">Search store...</span>
            </button>

            {/* E-commerce Wishlist Icon */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 rounded-xl border border-white/5 bg-white/4 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Open My Wishlist"
              aria-label="Toggle Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? "fill-pink-500 text-pink-500" : ""}`} />
              <AnimatePresence>
                {wishlist.length > 0 && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-tr from-pink-500 to-rose-600 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center animate-pulse"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* E-commerce Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-white/5 bg-white/4 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              aria-label="Toggle Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-tr from-pink-500 to-red-500 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center animate-pulse"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              id="header-cta-whatsapp"
              onClick={handleWhatsAppClick}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md shadow-green-500/10 hover:shadow-green-500/20 flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <Smartphone className="w-4 h-4" />
              WhatsApp Store Catalog
            </button>
          </div>

          {/* Mobile Menu & Card Utility Buttons */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              aria-label="Mobile global search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Mobile Wishlist heart */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              aria-label="Mobile Wishlist Sidebar"
            >
              <Heart className={`w-4.5 h-4.5 ${wishlist.length > 0 ? "fill-pink-500 text-pink-500" : ""}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Mobile Shopping Cart trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              aria-label="Mobile Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden bg-[#020205]/95 border-b border-white/10 backdrop-blur-md"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 px-4">
                <button
                  id="mobile-header-cta-whatsapp"
                  onClick={() => {
                    handleWhatsAppClick();
                    setIsOpen(false);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-500/15"
                >
                  <Smartphone className="w-4 h-4" />
                  WhatsApp Catalog
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
