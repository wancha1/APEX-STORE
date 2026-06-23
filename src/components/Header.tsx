import { useState, useEffect, useRef } from "react";
import { Menu, X, MessageSquare, Smartphone, ShoppingBag, Heart, GitCompare, Search, Bookmark, User, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "motion/react";
import AuthModal from "./AuthModal";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const { 
    cartCount, 
    setIsCartOpen, 
    wishlist, 
    setIsWishlistOpen, 
    compareList, 
    setIsCompareOpen,
    isSearchOpen,
    setIsSearchOpen,
    customerUser,
    logoutCustomer,
    isDarkMode,
    setIsDarkMode
  } = useCart();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Live Catalog", href: "#services" }
  ];

  const handleWhatsAppClick = () => {
    const defaultMsg = encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I checked out your online storefront. I am looking to inquire about flagship phone & laptop stocks!`);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${defaultMsg}`, "_blank");
  };


  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-white/75 dark:bg-slate-950/65 border-b border-gray-200/40 dark:border-white/5 backdrop-blur-2xl py-3.5 shadow-sm"
          : "bg-neutral-50/40 dark:bg-slate-950/20 border-b border-transparent backdrop-blur-xl py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group transition-all duration-300 hover:scale-[1.03]" id="nav-logo">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-[1.05] transition-all duration-300">
              <span className="font-display font-medium text-white text-lg">A</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 blur opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10" />
            </div>
             <div className="flex flex-col text-left">
              <span className="font-display font-semibold tracking-tight text-neutral-900 dark:text-white text-lg leading-tight flex items-center gap-1 transition-colors">
                Apex <span className="text-blue-600 dark:text-blue-400">Phones</span>
              </span>
              <span className="text-[9px] font-mono font-medium text-blue-400 dark:text-blue-300 capitalize tracking-wider leading-none">
                electronics
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" id="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-all duration-300 hover:scale-[1.03] relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Contact CTA & Cart */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Elegant Search bar trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer font-sans text-xs group"
              title="Search My Store Products"
              aria-label="Open global search"
            >
              <Search className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-slate-500 dark:text-slate-400 select-none">Search store...</span>
            </button>

            {/* E-commerce Wishlist Icon */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Open My Wishlist"
              aria-label="Toggle Wishlist"
            >
              <Bookmark className={`w-5 h-5 ${wishlist.length > 0 ? "fill-pink-500 text-pink-500" : ""}`} />
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
              className="relative px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-2"
              aria-label="Toggle Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-mono font-medium tracking-wide">Cart</span>
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

            {/* Customer User Account Action Dropdown */}
            {customerUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer text-xs"
                  aria-label="User account dropdown"
                >
                  {customerUser.photoURL ? (
                    <img src={customerUser.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-purple-600" />
                  )}
                  <span className="max-w-[80px] truncate">{customerUser.displayName || "Buyer"}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl text-left z-50 select-none"
                    >
                      <div className="pb-2 border-b border-gray-100">
                        <p className="text-xs text-neutral-900 font-semibold truncate">{customerUser.displayName || "Authorized Buyer"}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{customerUser.email}</p>
                      </div>
                      <div className="py-2.5">
                        <div className="text-[9px] font-mono font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1.5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Order Auth Synced</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await logoutCustomer();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between text-left text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <span>Sign Out</span>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-gray-250 bg-gray-50/50 hover:bg-gray-100 text-slate-600 hover:text-neutral-950 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                aria-label="Sign in customer portal"
              >
                <User className="w-4 h-4 text-blue-500" />
                <span>Sign In</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Sun className={`w-5 h-5 text-amber-500 transition-all duration-500 absolute ${isDarkMode ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
                <Moon className={`w-5 h-5 text-blue-400 transition-all duration-500 absolute ${isDarkMode ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
              </div>
            </button>

            <button
              id="header-cta-whatsapp"
              onClick={handleWhatsAppClick}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md shadow-green-500/15 hover:shadow-green-500/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
            >
              <Smartphone className="w-4 h-4" />
              WhatsApp Orders
            </button>
          </div>

          {/* Mobile Menu & Card Utility Buttons */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile Theme toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center overflow-hidden"
              aria-label="Toggle mobile dark mode"
            >
              <div className="relative w-4.5 h-4.5 flex items-center justify-center">
                <Sun className={`w-4.5 h-4.5 text-amber-500 transition-all duration-500 absolute ${isDarkMode ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
                <Moon className={`w-4.5 h-4.5 text-blue-400 transition-all duration-500 absolute ${isDarkMode ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
              </div>
            </button>

            {/* Mobile Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative p-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-600 hover:text-neutral-950 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Mobile global search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Mobile Wishlist bookmark */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-600 hover:text-neutral-950 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Mobile Wishlist Sidebar"
            >
              <Bookmark className={`w-4.5 h-4.5 ${wishlist.length > 0 ? "fill-pink-500 text-pink-500" : ""}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Mobile Shopping Cart trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-600 hover:text-neutral-900 transition-all cursor-pointer flex items-center gap-1.5"
              aria-label="Mobile Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-mono font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-500 hover:text-neutral-950 hover:bg-gray-100 focus:outline-none transition-colors"
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
            className="lg:hidden bg-white/85 dark:bg-slate-950/85 border-b border-gray-200 dark:border-white/5 backdrop-blur-xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-900/60 border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all text-left"
                >
                  {link.name}
                </a>
              ))}

              {/* Mobile Account Profile Sync Block */}
              <div className="pt-2 pb-2 px-4 border-t border-gray-100 dark:border-white/5 mx-2 my-1">
                {customerUser ? (
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-slate-900 border border-purple-100 dark:border-white/10 flex items-center justify-center text-purple-600">
                        {customerUser.photoURL ? (
                          <img src={customerUser.photoURL} alt="Avatar" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{customerUser.displayName || "Buyer Account"}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{customerUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await logoutCustomer();
                        setIsOpen(false);
                      }}
                      className="w-full py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-250 dark:border-red-900/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Sync Profile</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>User Account Sign In / Sign Up</span>
                  </button>
                )}
              </div>

              <div className="pt-2 px-4">
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

      {/* Customer authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
