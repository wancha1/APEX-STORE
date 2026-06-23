import { useState, FormEvent, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { X, ShoppingBag, Plus, Minus, Trash2, Smartphone, ShieldCheck, HelpCircle, FileText, ArrowRight, Loader2, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Search, Truck, MapPin, Package } from "lucide-react";
import { BUSINESS_INFO } from "../data";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, setDoc } from "firebase/firestore";

// High-quality Unsplash image mapping for individual items
const getProductImageUrl = (product: any) => {
  if (product.images && product.images[0]) {
    return product.images[0];
  }
  if (product.image) {
    return product.image;
  }
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
    customerUser,
    customerLoading,
    loginCustomerWithGoogle,
    logoutCustomer,
    trackAnalyticsEvent,
  } = useCart();

  // Checkout states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Sync authenticated user info
  useEffect(() => {
    if (customerUser?.displayName) {
      setCustomerName(customerUser.displayName);
    }
  }, [customerUser]);

  // Promo code system standard Apex style
  const [promoCode, setPromoCode] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Order history states
  const [activeTab, setActiveTab] = useState<"cart" | "history" | "track">("cart");
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Order tracking states
  const [trackOrderId, setTrackOrderId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [hasSearchedTrack, setHasSearchedTrack] = useState(false);

  // Firestore Error Handler helper conforming to instructions
  const handleFirestoreError = (error: unknown, opType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: opType,
      path,
      authInfo: {
        userId: customerUser?.uid,
        email: customerUser?.email,
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  const fetchOrderHistory = async () => {
    if (!customerUser) {
      // Pull local guest orders
      const localGuestOrders = localStorage.getItem("apex_guest_orders");
      if (localGuestOrders) {
        try {
          setOrderHistory(JSON.parse(localGuestOrders));
        } catch (e) {
          setOrderHistory([]);
        }
      } else {
        setOrderHistory([]);
      }
      return;
    }

    setLoadingHistory(true);
    setHistoryError("");
    try {
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", customerUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const orders: any[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      // Also merge with local guest orders if any
      const localGuestOrders = localStorage.getItem("apex_guest_orders");
      if (localGuestOrders) {
        try {
          const guestOrdersArr = JSON.parse(localGuestOrders);
          guestOrdersArr.forEach((go: any) => {
            if (!orders.some((o: any) => o.orderId === go.orderId)) {
              orders.push(go);
            }
          });
        } catch (e) {}
      }

      setOrderHistory(orders);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      handleFirestoreError(err, "list", "orders");
      setHistoryError("Cannot load cloud order history. Showing offline records.");
      
      const localGuestOrders = localStorage.getItem("apex_guest_orders");
      if (localGuestOrders) {
        try {
          setOrderHistory(JSON.parse(localGuestOrders));
        } catch (e) {}
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Re-fetch order history if user logs in
  useEffect(() => {
    if (activeTab === "history") {
      fetchOrderHistory();
    }
  }, [customerUser, activeTab]);

  const handleTrackOrder = async (orderIdToTrack?: string) => {
    const targetId = orderIdToTrack || trackOrderId;
    const sanitized = targetId.trim().replace(/^#/, "").toUpperCase();
    if (!sanitized) {
      setTrackingError("Please enter a valid Order Reference (e.g. APX-910403)");
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError("");
    setTrackedOrder(null);
    setHasSearchedTrack(true);

    try {
      const docRef = doc(db, "orders", sanitized);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTrackedOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Fallback search using orderId query for any legacy/autoID-created order structures
        const q = query(collection(db, "orders"), where("orderId", "==", sanitized));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const matchedDoc = querySnapshot.docs[0];
          setTrackedOrder({ id: matchedDoc.id, ...matchedDoc.data() });
        } else {
          setTrackingError(`Order reference #${sanitized} could not be found.`);
        }
      }
    } catch (err: any) {
      console.error("Order tracking error:", err);
      setTrackingError("Server permission or connection error tracking order details.");
      handleFirestoreError(err, "get", `orders/${sanitized}`);
    } finally {
      setIsTrackingLoading(false);
    }
  };

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
              Live Store Valuation
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

    const deliveryFee = paymentMethod === "Store Pick-up" ? 0 : 35000;
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
• *Delivery Zone:* ${deliveryArea || "Store pick-up requested"}
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

Hello ${BUSINESS_INFO.name}! 👋 I placed an order via your online store. Please verify stock availability at your store so I can proceed with immediate payment!`;

    window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(invoiceMessage)}`, "_blank");

    // Construct Order Payload
    const orderData = {
      userId: customerUser?.uid || "guest",
      customerName,
      customerPhone,
      deliveryArea: deliveryArea || "Store pick-up requested",
      paymentMethod,
      specialInstructions,
      orderId,
      createdAt: new Date().toISOString(),
      subtotal: cartSubtotal,
      deliveryFee,
      discountAmount,
      totalAmount: finalTotal,
      status: "Pending Dispatch",
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
        selectedColor: item.selectedColor || null,
        selectedStorage: item.selectedStorage || null
      }))
    };

    // Save order payload to Firestore
    const saveOrderToFirestore = async () => {
      try {
        await setDoc(doc(db, "orders", orderId), orderData);
        console.log("Order saved to Firestore successfully!");
      } catch (err) {
        console.error("Failed to save order to Firestore:", err);
        handleFirestoreError(err, "create", `orders/${orderId}`);
      }
    };
    saveOrderToFirestore();

    // Persist in local storage history list
    try {
      const existingHistory = localStorage.getItem("apex_guest_orders");
      const guestHistoryArr = existingHistory ? JSON.parse(existingHistory) : [];
      guestHistoryArr.unshift(orderData);
      localStorage.setItem("apex_guest_orders", JSON.stringify(guestHistoryArr));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }

    // Track analytical report events
    try {
      cart.forEach((item) => {
        trackAnalyticsEvent(
          "order",
          item.product.id,
          item.quantity,
          customerName || "Cash Client",
          orderId,
          item.product.price,
          item.product.name
        );
      });
    } catch (err) {
      console.error("Failed to track order analytics event:", err);
    }

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
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            id="cart-drawer-container"
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#09091b] border-l border-gray-200 dark:border-white/10 shadow-2xl z-50 flex flex-col justify-between text-left transition-colors duration-300"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-150 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {isCheckingOut ? "Secure Checkout" : activeTab === "cart" ? `Shopping Cart (${cartCount})` : "Purchase Archive"}
                </h4>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
                aria-label="Close Cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Swapper */}
            {!isCheckingOut && (
              <div className="mx-6 mt-4 flex border border-gray-150 dark:border-white/5 bg-gray-50 dark:bg-slate-900/50 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("cart")}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "cart"
                      ? "bg-blue-600 font-extrabold text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Cart ({cartCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("history");
                    fetchOrderHistory();
                  }}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "history"
                      ? "bg-blue-600 font-extrabold text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  History
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("track")}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    activeTab === "track"
                      ? "bg-blue-600 font-extrabold text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Track Order
                </button>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/5">
              {activeTab === "history" && !isCheckingOut ? (
                // ORDER HISTORY VIEW
                <div className="space-y-4">
                  {/* Verification Notice / Callout */}
                  {!customerUser ? (
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 text-left space-y-3 mb-2">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h6 className="text-xs font-bold text-white leading-none font-sans">Showing Device-Only Logs</h6>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-light">
                            Currently showing past purchases made on this browser. To sync in real-time with our showroom, sign in with your Google account.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={loginCustomerWithGoogle}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-neutral-900 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>OAuth Google Log-In</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-mono">Cloud synced: {customerUser.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchOrderHistory}
                        className="text-[10px] text-blue-400 hover:underline font-mono"
                      >
                        Refresh
                      </button>
                    </div>
                  )}

                  {loadingHistory ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                      <p className="text-xs text-slate-500 font-mono">Loading purchase directory...</p>
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h6 className="text-xs font-semibold text-white mb-1">No Orders Recorded</h6>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-light">
                        Once you place gadget orders using WhatsApp Checkout, your live doorstep tag lists will appear here!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-left">
                        <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Historical Order Manifest ({orderHistory.length})</span>
                      </div>

                      <div className="space-y-3.5">
                        {orderHistory.map((order, index) => (
                          <div
                            key={order.orderId || index}
                            className="bg-white/3 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col gap-3 transition-all text-left"
                          >
                            <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                              <div>
                                <span className="text-xs font-mono font-bold text-white block">
                                  #{order.orderId}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-600" />
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                  }) : "Recent Order"}
                                </span>
                              </div>
                              <span className="text-[8px] font-mono tracking-widest uppercase font-semibold px-2 py-1 rounded-md border border-amber-500/20 text-amber-400 bg-amber-955/10">
                                {order.status || "Pending Dispatch"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {order.items?.map((item: any, itIdx: number) => (
                                <div key={itIdx} className="flex justify-between text-xs leading-tight">
                                  <div className="text-slate-300 font-medium truncate max-w-[200px]">
                                    {item.name}
                                    {item.selectedColor && <span className="text-[9px] text-slate-500 font-mono block">Color: {item.selectedColor}</span>}
                                    {item.selectedStorage && <span className="text-[9px] text-slate-500 font-mono block">Storage: {item.selectedStorage}</span>}
                                  </div>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {item.qty} &times; {formatCurrency(item.price)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="border-t border-white/5 pt-2.5 flex justify-between items-center text-xs">
                              <div className="text-[9px] font-mono text-slate-500">
                                <div>Subtotal: {formatCurrency(order.subtotal || order.totalAmount)}</div>
                                {order.deliveryFee > 0 && <div>Delivery: {formatCurrency(order.deliveryFee)}</div>}
                                {order.discountAmount > 0 && <div className="text-emerald-500">Discount: -{formatCurrency(order.discountAmount)}</div>}
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-mono text-slate-500 block">Grand Total Paid</span>
                                <span className="text-xs font-mono font-bold text-sky-400">
                                  {formatCurrency(order.totalAmount || order.subtotal)}
                                </span>
                              </div>
                            </div>

                            <div className="pt-1 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackOrderId(order.orderId);
                                  setActiveTab("track");
                                  handleTrackOrder(order.orderId);
                                }}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                              >
                                <Truck className="w-3.5 h-3.5 text-blue-400" />
                                <span>Track Status</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const queryText = `Hello Apex Devices! 👋 Inquiring about my Order reference #${order.orderId} containing: ${order.items?.map((it: any) => `${it.qty}x ${it.name}`).join(", ")}. Please send me delivery status updates!`;
                                  window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(queryText)}`, "_blank");
                                }}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                              >
                                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                                <span>WhatsApp Call</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === "track" && !isCheckingOut ? (
                // ORDER TRACKING VIEW
                <div className="space-y-5">
                  <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                        Real-time Order Tracker
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      Track any order placed with Apex Devices. Enter your unique order code provided after checkout.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1.5 font-bold">
                          Order ID / Reference Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. APX-910403"
                            value={trackOrderId}
                            onChange={(e) => {
                              setTrackOrderId(e.target.value);
                              setTrackingError("");
                            }}
                            className="w-full bg-black/60 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-3 pr-10 text-xs text-white font-mono placeholder-slate-600 outline-none uppercase"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleTrackOrder();
                              }
                            }}
                          />
                          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTrackOrder()}
                        disabled={isTrackingLoading}
                        className="w-full py-2.5 rounded-xl text-xs font-bold font-sans uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isTrackingLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Locating Order...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Query Status</span>
                          </>
                        )}
                      </button>
                    </div>

                    {trackingError && (
                      <div className="flex gap-2 p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 text-left text-xs text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{trackingError}</span>
                      </div>
                    )}
                  </div>

                  {isTrackingLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                      <p className="text-xs text-slate-500 font-mono">Synchronizing with showroom logs...</p>
                    </div>
                  ) : trackedOrder ? (
                    <div className="space-y-4 text-left">
                      {/* Tracking Details Card */}
                      <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-5">
                        {/* Summary Header */}
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                          <div>
                            <span className="text-xs font-mono font-bold text-white block">
                              Reference: #{trackedOrder.orderId}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-600" />
                              {trackedOrder.createdAt ? new Date(trackedOrder.createdAt).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              }) : "Recently placed"}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono tracking-wider uppercase font-extrabold px-2.5 py-1 rounded-md border border-sky-500/20 text-sky-400 bg-sky-950/10">
                            {trackedOrder.status || "Pending Dispatch"}
                          </span>
                        </div>

                        {/* Interactive Status Milestone Progress Timeline Bar */}
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold block">
                            Milestone Status Tracking
                          </span>
                          <div className="relative pt-6 pb-2 px-3">
                            {/* Connecting Line background */}
                            <div className="absolute top-1/2 left-3 right-3 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
                            
                            {/* Running Line fill */}
                            <div 
                              className="absolute top-1/2 left-3 h-[2px] bg-gradient-to-r from-blue-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                              style={{ 
                                width: trackedOrder.status === "Completed" ? "calc(100% - 24px)" : 
                                       trackedOrder.status === "Dispatched" ? "50%" : "0%" 
                              }}
                            />

                            {/* Node indicators */}
                            <div className="relative flex justify-between z-10 font-sans text-[10px]">
                              {/* Step 1: Placed */}
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-[#05050c] border border-blue-400">
                                  ✓
                                </div>
                                <span className="text-[9px] mt-2 font-mono text-blue-400 font-bold uppercase tracking-wider">Placed</span>
                              </div>

                              {/* Step 2: Dispatched */}
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-4 ring-[#05050c] border transition-colors ${
                                  trackedOrder.status === "Dispatched" || trackedOrder.status === "Completed"
                                    ? "bg-blue-600 border-blue-400 text-white"
                                    : "bg-neutral-900 border-white/5 text-slate-600"
                                }`}>
                                  {trackedOrder.status === "Dispatched" || trackedOrder.status === "Completed" ? "✓" : "2"}
                                </div>
                                <span className={`text-[9px] mt-2 font-mono uppercase tracking-wider ${
                                  trackedOrder.status === "Dispatched" || trackedOrder.status === "Completed"
                                    ? "text-blue-400 font-bold"
                                    : "text-slate-600 font-medium"
                                }`}>Dispatched</span>
                              </div>

                              {/* Step 3: Delivered */}
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-4 ring-[#05050c] border transition-colors ${
                                  trackedOrder.status === "Completed"
                                    ? "bg-emerald-600 border-emerald-400 text-white"
                                    : "bg-neutral-900 border-white/5 text-slate-600"
                                }`}>
                                  {trackedOrder.status === "Completed" ? "✓" : "3"}
                                </div>
                                <span className={`text-[9px] mt-2 font-mono uppercase tracking-wider ${
                                  trackedOrder.status === "Completed"
                                    ? "text-emerald-400 font-bold"
                                    : "text-slate-600 font-medium"
                                }`}>Delivered</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Goods list */}
                        <div className="space-y-2 border-t border-b border-white/5 py-4">
                          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold block">
                            Gadgets Ordered
                          </span>
                          <div className="space-y-2">
                            {trackedOrder.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="text-slate-200 font-medium truncate max-w-[220px]">
                                  {item.name}
                                  {item.selectedColor && (
                                    <span className="text-[9px] text-slate-500 font-mono block">
                                      Color: {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedStorage && (
                                    <span className="text-[9px] text-slate-500 font-mono block">
                                      Storage: {item.selectedStorage}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 font-mono font-medium text-[11px] shrink-0">
                                  {item.qty} &times; {formatCurrency(item.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Metadata Profile */}
                        <div className="space-y-3 text-xs leading-relaxed">
                          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5 text-left">
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-500 tracking-wider block mb-0.5">
                                Client Directory
                              </span>
                              <span className="text-white font-medium block truncate">
                                {trackedOrder.customerName}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-500 tracking-wider block mb-0.5">
                                Delivery Zone
                              </span>
                              <span className="text-white font-medium block truncate">
                                {trackedOrder.deliveryArea || "Store pickup"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-500 tracking-wider block mb-0.5">
                                Payment Channel
                              </span>
                              <span className="text-white font-medium block truncate text-[11px]">
                                {trackedOrder.paymentMethod}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-mono text-slate-500 tracking-wider block mb-0.5">
                                Billing Receipt
                              </span>
                              <span className="text-sky-400 font-mono font-bold block">
                                {formatCurrency(trackedOrder.totalAmount || trackedOrder.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Inquiry */}
                      <button
                        type="button"
                        onClick={() => {
                          const queryText = `Hello Apex Devices! 👋 Tracking client inquiring for status update on Order ref #${trackedOrder.orderId}. Dispatch milestones status showing as [${trackedOrder.status || "Pending Dispatch"}]. Please send latest dispatch updates!`;
                          window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(queryText)}`, "_blank");
                        }}
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#25D366] hover:bg-[#20ba54] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-500/10"
                      >
                        <Smartphone className="w-4 h-4 text-green-100" />
                        <span>Inquire Delivery via WhatsApp</span>
                      </button>
                    </div>
                  ) : hasSearchedTrack ? (
                    <div className="py-10 px-4 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      </div>
                      <h6 className="text-xs font-semibold text-white mb-1.5">No Matching Order Located</h6>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-light mb-4">
                        We couldn't pull any order corresponding to this reference in our Cloud register. Please double check that you formatted the letters exactly as they appear in your receipt (e.g. including dashes like <strong className="font-mono text-slate-300">APX-102943</strong>).
                      </p>
                      <button
                        type="button"
                        onClick={() => setHasSearchedTrack(false)}
                        className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-mono transition-all uppercase tracking-wider cursor-pointer"
                      >
                        Reset Tracker
                      </button>
                    </div>
                  ) : (
                    // Prompt state info
                    <div className="py-8 px-4 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3.5 shadow-inner">
                        <Package className="w-4 h-4" />
                      </div>
                      <h6 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider mb-1.5">Order Tracking Guide</h6>
                      <ul className="text-[10px] text-slate-550 space-y-2 max-w-[280px] leading-relaxed text-left font-light list-inside list-disc">
                        <li>References are generated instantly as soon as you place your order.</li>
                        <li>Verify live showroom status, dispatch routes, and billing details.</li>
                        <li>Guest and authenticated orders can both be checked 24/7.</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : cart.length === 0 ? (
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
                        <div className="w-11 h-11 rounded-xl border border-white/10 shrink-0 overflow-hidden bg-neutral-900 flex items-center justify-center">
                          <img
                            src={getProductImageUrl(item.product)}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
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

                  {/* Customer Google Authentication block */}
                  {!customerUser ? (
                    <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-4 text-center space-y-3 mb-2" id="customer-auth-google-prompt">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full mb-1">
                          Secure Customer Identity
                        </span>
                        <h6 className="text-[11px] font-semibold text-white">Log in with Google to sync checkout credentials</h6>
                      </div>
                      <button
                        type="button"
                        onClick={loginCustomerWithGoogle}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-neutral-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>OAuth Google Sign-In</span>
                      </button>
                      <div className="relative flex py-0.5 items-center">
                        <div className="flex-grow border-t border-white/5"></div>
                        <span className="flex-shrink mx-2 text-[8px] text-slate-500 font-mono uppercase">or order as guest</span>
                        <div className="flex-grow border-t border-white/5"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between mb-2" id="customer-auth-google-profile">
                      <div className="flex items-center gap-2.5">
                        {customerUser.photoURL ? (
                          <img src={customerUser.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-emerald-500/30" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase font-mono">
                            {customerUser.displayName?.[0] || customerUser.email?.[0] || "U"}
                          </div>
                        )}
                        <div className="text-left">
                          <div className="text-xs font-bold text-white leading-none font-sans">Google Verified</div>
                          <div className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate">{customerUser.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={logoutCustomer}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/15 hover:border-red-500/35 text-[9px] font-mono text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  )}

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
                      placeholder="e.g. +256 772 604 777"
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
                      <option value="Store Pick-up">Store Pick-up & Cash Desk</option>
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
                  <div className="flex items-center justify-between mb-1 select-none">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 opacity-40 line-through">Apply Apex Voucher code</span>
                    <span className="text-[9px] font-mono text-slate-600 opacity-40 line-through">Vouchers Disabled</span>
                  </div>
                  <div className="flex gap-2 opacity-35 pointer-events-none select-none cursor-not-allowed">
                    <input
                      disabled
                      type="text"
                      placeholder="Vouchers globally disabled"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError("");
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none font-mono cursor-not-allowed"
                    />
                    <button
                      disabled
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 py-2 bg-white/5 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
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
                      {paymentMethod === "Store Pick-up" ? "UGX 0" : "UGX 35,000"}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Grand Estimated Total:</span>
                    <span className="text-blue-400 font-extrabold text-right">
                      {formatCurrency(Math.max(0, cartSubtotal + (paymentMethod === "Store Pick-up" ? 0 : 35000) - discountAmount))}
                    </span>
                  </div>
                </div>

                {!isCheckingOut ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="flex-1 py-3 px-2 md:px-4 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-md shadow-blue-500/10"
                    >
                      <span>Checkout Form</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        // Quick order with current items straight to WhatsApp!
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

                        const deliveryFee = paymentMethod === "Store Pick-up" ? 0 : 35000;
                        const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

                        const invoiceMessage = `*APEX DEVICES ELECTRONICS - DIRECT CART ORDER* 📦
-------------------------------------------
*Order Reference:* #${orderId}
*Date:* ${dateStr}
*Status:* Fast Checkout Request

🛒 *ORDERED GADGETS:*
-------------------------------------------
${itemsText}
📊 *BILLING SUMMARY:*
-------------------------------------------
• *Items Subtotal:* ${formatCurrency(cartSubtotal)}
• *Delivery Est:* ${formatCurrency(deliveryFee)}
${activeCode ? `• *Discount Applied:* -${formatCurrency(discountAmount)} (${activeCode})\n` : ""}
-------------------------------------------
🔥 *ESTIMATED TOTAL:* ${formatCurrency(finalTotal)}
-------------------------------------------

Hello ${BUSINESS_INFO.name}! 👋 I would like to place an immediate order for my cart items directly. Please confirm live stock at Juba Road showroom!`;

                        window.open(`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(invoiceMessage)}`, "_blank");
                        clearCart();
                        setIsCartOpen(false);
                      }}
                      className="flex-1 py-3 px-2 md:px-4 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider text-white bg-[#25D366] hover:bg-[#20ba54] hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shadow-md shadow-green-500/10"
                    >
                      <Smartphone className="w-3.5 h-3.5 shrink-0 text-green-100" />
                      <span>WhatsApp Order</span>
                    </button>
                  </div>
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
