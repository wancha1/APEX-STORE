import { useState, FormEvent } from "react";
import { useCart } from "../context/CartContext";
import { X, ShoppingBag, Plus, Minus, Trash2, Smartphone, ShieldCheck, HelpCircle, FileText, ArrowRight } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { motion, AnimatePresence } from "motion/react";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    removeFromCart,
    cartSubtotal,
    cartCount,
    clearCart,
  } = useCart();

  // Checkout states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Promo code system standard Apex style
  const [promoCode, setPromoCode] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Scalable SVG Bar + Area Chart representing cart item pricing
  const renderCartChart = () => {
    if (cart.length === 0) return null;
    
    // Max item cost for scaling bar heights (minimum scale at 1 to prevent division by zero)
    const maxVal = Math.max(...cart.map(item => item.product.price * item.quantity), 1);
    
    // Chart specifications
    const chartHeight = 80;
    const paddingX = 20;
    const paddingY = 10;
    const width = 360; // Standard layout bounds
    
    // Compute points for the line/area connector
    const points = cart.map((item, idx) => {
      const x = paddingX + (idx / Math.max(cart.length - 1, 1)) * (width - paddingX * 2);
      const ratio = (item.product.price * item.quantity) / maxVal;
      const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
      return { x, y, item };
    });

    const linePath = points.map(p => `${p.x},${p.y}`).join(" ");
    
    // Area path closed to baseline
    const areaPath = points.length > 0 
      ? `M ${points[0].x},${chartHeight - paddingY} L ${linePath} L ${points[points.length - 1].x},${chartHeight - paddingY} Z`
      : "";

    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-4 select-none">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-mono uppercase text-sky-400 tracking-wider font-extrabold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
              Live Showroom Valuation
            </span>
            <span className="text-xs font-semibold text-white">Cart Index Dynamics</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-500 block uppercase font-medium">Aggregate Sum</span>
            <span className="text-sm font-mono font-bold text-sky-400">
              {formatCurrency(cartSubtotal)}
            </span>
          </div>
        </div>

        {/* Dynamic Vector Plot Grid */}
        <div className="relative w-full h-[85px] bg-[#020204]/60 border border-white/5 rounded-xl flex flex-col justify-end p-1 overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guidelines for premium look */}
            <line x1={0} y1={paddingY} x2={width} y2={paddingY} stroke="white" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4" />
            <line x1={0} y1={chartHeight / 2} x2={width} y2={chartHeight / 2} stroke="white" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4" />
            <line x1={0} y1={chartHeight - paddingY} x2={width} y2={chartHeight - paddingY} stroke="white" strokeOpacity="0.05" strokeWidth="1" />

            {/* Area & Line plots connecting cart points */}
            {points.length > 1 && (
              <>
                <path d={areaPath} fill="url(#areaGrad)" className="transition-all duration-300" />
                <polyline points={linePath} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" className="transition-all duration-300" />
              </>
            )}

            {/* Custom Individual Vertical Bars with glowing gradients representing each product cost */}
            {points.map((p, idx) => {
              const barWidth = Math.max(12, 140 / cart.length);
              const barHeight = chartHeight - paddingY - p.y;
              return (
                <rect
                  key={idx}
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height={Math.max(barHeight, 3)}
                  rx="3"
                  fill="url(#barGrad)"
                  className="transition-all duration-300 hover:fill-blue-400 cursor-pointer"
                >
                  <title>{`${p.item.product.name}: ${formatCurrency(p.item.product.price * p.item.quantity)} (Qty: ${p.item.quantity})`}</title>
                </rect>
              );
            })}

            {/* Indicator nodes running across the points */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                className="fill-blue-400 stroke-neutral-950 stroke-2 cursor-pointer transition-all hover:r-4"
              >
                <title>{`${p.item.product.name}: ${formatCurrency(p.item.product.price * p.item.quantity)}`}</title>
              </circle>
            ))}
          </svg>

          {/* Quick labels axis */}
          <div className="absolute bottom-1 inset-x-0 px-4 flex justify-between pointer-events-none font-mono text-[7px] text-slate-500 uppercase">
            <span>Entry 1</span>
            {cart.length > 2 && <span>Value Trend Breakdown</span>}
            <span>Index {cart.length}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleApplyPromo = () => {
    setPromoError("");
    const trimmed = promoCode.trim().toUpperCase();
    if (trimmed === "APEX100K") {
      setDiscountAmount(100000);
      setActiveCode("APEX100K");
    } else if (trimmed === "APEXWELCOME") {
      setDiscountAmount(50000);
      setActiveCode("APEXWELCOME");
    } else if (trimmed === "LIRATECH") {
      setDiscountAmount(150000);
      setActiveCode("LIRATECH");
    } else if (trimmed === "") {
      setPromoError("Enter a valid code.");
    } else {
      setPromoError("Invalid code. Try APEXWELCOME or LIRATECH");
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setActiveCode("");
    setDiscountAmount(0);
    setPromoError("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleWhatsAppCheckout = (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Build invoice payload in professional Apex formatting
    const orderId = `APX-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let itemsText = "";
    cart.forEach((item, index) => {
      const colorText = item.selectedColor ? ` [Color: ${item.selectedColor}]` : "";
      const storageText = item.selectedStorage ? ` [Storage: ${item.selectedStorage}]` : "";
      const priceStr = formatCurrency(item.product.price);
      const totalItemPriceStr = formatCurrency(item.product.price * item.quantity);
      
      itemsText += `${index + 1}. *${item.product.name}*${colorText}${storageText}\n`;
      itemsText += `   Qty: ${item.quantity} × ${priceStr} = ${totalItemPriceStr}\n\n`;
    });

    const deliveryFee = paymentMethod === "Showroom Pick-up" ? 0 : 35000;
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

    const invoiceMessage = `*APEX DEVICES ELECTRONICS - ORDER INVOICE * 📦
-------------------------------------------
*Order Reference:* #${orderId}
*Date:* ${dateStr}
*Status:* Pending Dispatch

👤 *CUSTOMER DIRECTORY:*
-------------------------------------------
• *Name:* ${customerName}
• *Phone Call line:* ${customerPhone}
• *Delivery Zone:* ${deliveryArea || "Showroom pick-up requested"}
• *Payment Mode:* ${paymentMethod}
${specialInstructions ? `• *Special Notes:* "${specialInstructions}"\n` : ""}

🛒 *ORDERED GADGETS:*
-------------------------------------------
${itemsText}
📊 *BILLING SUMMARY:*
-------------------------------------------
• *Items Subtotal:* ${formatCurrency(cartSubtotal)}
• *Delivery & Setup Fee:* ${formatCurrency(deliveryFee)}
${activeCode ? `• *Discount Applied:* -${formatCurrency(discountAmount)} (${activeCode})\n` : ""}
-------------------------------------------
🔥 *ESTIMATED TOTAL:* ${formatCurrency(finalTotal)}
-------------------------------------------

Hello ${BUSINESS_INFO.name}! 👋 I placed an order via your online store. Please verify stock availability at your showroom so I can proceed with immediate payment!`;

    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(invoiceMessage)}`, "_blank");
    clearCart();
    setIsCartOpen(false);
    setIsCheckingOut(false);
    setActiveCode("");
    setDiscountAmount(0);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop dimmer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-[#020205]/85 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            id="cart-drawer-container"
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#05050c] border-l border-white/10 shadow-2xl z-50 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <h4 className="font-display font-bold text-lg text-white">
                  {isCheckingOut ? "Secure Checkout" : `Shopping Cart (${cartCount})`}
                </h4>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close Cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-slate-400">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h5 className="font-display font-bold text-white text-md mb-2">Your Apex Cart is Empty</h5>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6 font-light">
                    Browse our high-end smartphones, Apple Silicon MacBooks, smart TVs and gaming packs to begin building your custom order!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : !isCheckingOut ? (
                /* Item list mode */
                <div className="space-y-4">
                  {renderCartChart()}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Shopping Invoice Details</span>
                    <button
                      onClick={clearCart}
                      className="text-[10px] font-mono text-red-400 uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear Cart
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.product.id}-${item.selectedColor}-${item.selectedStorage}-${index}`}
                        className="bg-white/3 border border-white/5 hover:border-white/10 p-3.5 rounded-2xl flex items-start gap-3 transition-all"
                      >
                        {/* Interactive Mini-image representation */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500/10 to-purple-600/10 border border-white/5 shrink-0 flex items-center justify-center text-blue-400">
                          📦
                        </div>

                        {/* Detail text */}
                        <div className="flex-1 min-w-0 text-left">
                          <h5 className="font-display font-bold text-xs text-white truncate">
                            {item.product.name}
                          </h5>
                          
                          {/* Selected characteristics */}
                          <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            {item.selectedColor && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/5 text-slate-400">
                                {item.selectedColor}
                              </span>
                            )}
                            {item.selectedStorage && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/5 text-slate-400">
                                {item.selectedStorage}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            {/* Quantity modifiers */}
                            <div className="flex items-center border border-white/5 bg-black/40 rounded-lg overflow-hidden shrink-0">
                              <button
                                onClick={() => updateQty(item.product.id, item.quantity - 1, item.selectedColor, item.selectedStorage)}
                                className="px-2 py-1 hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-mono text-xs text-white min-w-[18px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.product.id, item.quantity + 1, item.selectedColor, item.selectedStorage)}
                                className="px-2 py-1 hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <span className="font-mono text-xs font-bold text-blue-400">
                                {formatCurrency(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Removal */}
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedStorage)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded cursor-pointer self-start"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Checkout details form mode */
                <form id="drawer-checkout-form" onSubmit={handleWhatsAppCheckout} className="space-y-4 text-left">
                  <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Confirm Your Checkout details</span>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 font-bold">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ronald Ssubi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 text-xs rounded-xl p-3 text-white outline-none"
                    />
                  </div>

                  {/* Phone Line */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 font-bold">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +256 708 428 805"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 text-xs rounded-xl p-3 text-white outline-none"
                    />
                  </div>

                  {/* Delivery Location Area */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 font-bold">Delivery Zone / Sub-county in Lira</label>
                    <input
                      type="text"
                      placeholder="e.g. Juba Road Plot 2 or Lira Town Hall"
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 text-xs rounded-xl p-3 text-white outline-none"
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 font-bold">Payment Channel *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 text-xs rounded-xl p-3 text-white outline-none cursor-pointer"
                    >
                      <option value="Cash on Delivery">Cash on Delivery (MTN Mobile Money/Cash)</option>
                      <option value="Airtel Money Instant Transfer">Airtel Money Instant</option>
                      <option value="Showroom Pick-up">Showroom Pick-up & Cash Desk</option>
                    </select>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 font-bold">Delivery Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please supply a clean silicone matte cover with this"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 text-xs rounded-xl p-3 text-white outline-none resize-none"
                    />
                  </div>
                  
                  {/* Cancel button */}
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-xs rounded-xl font-bold text-slate-300 transition-colors"
                  >
                    ← Back to Cart Item list
                  </button>
                </form>
              )}
            </div>

            {/* Bottom calculation widget */}
            {cart.length > 0 && (
              <div className="p-6 bg-white/3 border-t border-white/10 text-left">
                {/* Apex Style Coupon Voucher Code section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Apply Apex Voucher code</span>
                    <span className="text-[9px] font-mono text-blue-400">Try APEXWELCOME or LIRATECH</span>
                  </div>
                  {!activeCode ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Voucher: e.g. APEXWELCOME"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError("");
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono font-bold">{activeCode} Verified!</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold hover:underline cursor-pointer"
                      >
                        [Remove]
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[10px] font-mono text-red-400 mt-1 text-left">{promoError}</p>
                  )}
                </div>

                <div className="space-y-3 mb-5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cart Items Total:</span>
                    <span className="text-white font-medium">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {activeCode && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Voucher Discount (-):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery & Setup (Lira Area):</span>
                    <span className="text-white text-right">
                      {paymentMethod === "Showroom Pick-up" ? "UGX 0" : "UGX 35,000"}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Grand Estimated Total:</span>
                    <span className="text-blue-400 font-extrabold text-right">
                      {formatCurrency(Math.max(0, cartSubtotal + (paymentMethod === "Showroom Pick-up" ? 0 : 35000) - discountAmount))}
                    </span>
                  </div>
                </div>

                {!isCheckingOut ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-lg shadow-blue-500/10"
                  >
                    <span>Proceed to Dispatch Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleWhatsAppCheckout}
                    id="cart-drawer-whatsapp-submit"
                    className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/15"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-100" />
                    <span>Confirm Order on WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <p className="text-[10px] text-slate-500 font-mono text-center mt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified 100% Genuine Apex Standards</span>
                </p>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
