import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { 
  BarChart3, 
  Heart, 
  Bookmark, 
  ShoppingBag, 
  Download, 
  Clock, 
  Trash2, 
  Coins, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function AdminAnalytics() {
  const { 
    analyticsEvents, 
    clearAnalyticsEvents, 
    products, 
    adminUser 
  } = useCart();

  const [filterType, setFilterType] = useState<"all" | "like" | "save" | "order">("all");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Compute 24h mathematical time slices
  const intervals = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const segments = {
      last24h: { name: "Last 24 Hours", likes: 0, saves: 0, orders: 0, revenue: 0, events: [] as any[] },
      prev24_48h: { name: "24 - 48 Hours Ago", likes: 0, saves: 0, orders: 0, revenue: 0, events: [] as any[] },
      prev48_72h: { name: "48 - 72 Hours Ago", likes: 0, saves: 0, orders: 0, revenue: 0, events: [] as any[] },
      older: { name: "Older than 72 Hours", likes: 0, saves: 0, orders: 0, revenue: 0, events: [] as any[] }
    };

    analyticsEvents.forEach(evt => {
      const evtTime = new Date(evt.timestamp).getTime();
      const diff = now.getTime() - evtTime;

      if (diff <= oneDay) {
        segments.last24h.events.push(evt);
        if (evt.type === "like") segments.last24h.likes++;
        if (evt.type === "save") segments.last24h.saves++;
        if (evt.type === "order") {
          segments.last24h.orders++;
          segments.last24h.revenue += (evt.price || 0) * (evt.quantity || 1);
        }
      } else if (diff <= 2 * oneDay) {
        segments.prev24_48h.events.push(evt);
        if (evt.type === "like") segments.prev24_48h.likes++;
        if (evt.type === "save") segments.prev24_48h.saves++;
        if (evt.type === "order") {
          segments.prev24_48h.orders++;
          segments.prev24_48h.revenue += (evt.price || 0) * (evt.quantity || 1);
        }
      } else if (diff <= 3 * oneDay) {
        segments.prev48_72h.events.push(evt);
        if (evt.type === "like") segments.prev48_72h.likes++;
        if (evt.type === "save") segments.prev48_72h.saves++;
        if (evt.type === "order") {
          segments.prev48_72h.orders++;
          segments.prev48_72h.revenue += (evt.price || 0) * (evt.quantity || 1);
        }
      } else {
        segments.older.events.push(evt);
        if (evt.type === "like") segments.older.likes++;
        if (evt.type === "save") segments.older.saves++;
        if (evt.type === "order") {
          segments.older.orders++;
          segments.older.revenue += (evt.price || 0) * (evt.quantity || 1);
        }
      }
    });

    return segments;
  }, [analyticsEvents]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    let likes = 0;
    let saves = 0;
    let orders = 0;
    let revenue = 0;

    analyticsEvents.forEach(evt => {
      if (evt.type === "like") likes++;
      if (evt.type === "save") saves++;
      if (evt.type === "order") {
        orders++;
        revenue += (evt.price || 0) * (evt.quantity || 1);
      }
    });

    return { likes, saves, orders, revenue };
  }, [analyticsEvents]);

  // Filtered Events display list
  const filteredEventsList = useMemo(() => {
    if (filterType === "all") return analyticsEvents;
    return analyticsEvents.filter(e => e.type === filterType);
  }, [analyticsEvents, filterType]);

  // PDF report creation using standard jsPDF coordinates
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Layout page constants
      const leftMargin = 14;
      const rightMargin = 196;
      const docWidth = 210;

      // Print Blue Header Bar
      doc.setFillColor(3, 7, 18); // Dark background
      doc.rect(0, 0, docWidth, 38, "F");

      // Title Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("APEX DEVICES ELECTRONICS", leftMargin, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(96, 165, 250); // Light blue
      doc.text("REAL-TIME CONVERSION TELEMETRY & EVENT AUDIT REPORT", leftMargin, 23);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Generated securely via the Apex store admin console", leftMargin, 29);

      // Section metadata cards on white section (below header)
      let y = 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text("REPORT METADATA", leftMargin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Extraction Date: ${new Date().toLocaleString("en-US")}`, leftMargin, y + 6);
      doc.text(`Administrator: ${adminUser?.email || "Local Administrator"}`, leftMargin, y + 11);
      doc.text(`Active Telemetry Volume: ${analyticsEvents.length} distinct items`, leftMargin, y + 16);

      // Totals on the right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`Gross Revenue Segment: ${formatPrice(aggregateStats.revenue)}`, 110, y + 6);
      doc.text(`Total Likes Captured: ${aggregateStats.likes} (♥)`, 110, y + 11);
      doc.text(`Total Saves Registered: ${aggregateStats.saves} (★)`, 110, y + 16);

      // Rule separator
      doc.setDrawColor(229, 231, 235);
      doc.line(leftMargin, y + 22, rightMargin, y + 22);

      // 1. INTERVAL BREAKDOWN TABLE
      y += 30;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("I. 24-HOUR TIME-FREQUENCY SEGMENTATION", leftMargin, y);

      // Table headers
      doc.setFillColor(243, 244, 246);
      doc.rect(leftMargin, y + 4, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text("Interval Window Frame", leftMargin + 3, y + 9);
      doc.text("Likes (♥)", leftMargin + 55, y + 9);
      doc.text("Saves (★)", leftMargin + 85, y + 9);
      doc.text("Orders (📦)", leftMargin + 115, y + 9);
      doc.text("Window Net Value", leftMargin + 145, y + 9);

      const rows = [
        intervals.last24h,
        intervals.prev24_48h,
        intervals.prev48_72h,
        intervals.older
      ];

      y += 12;
      rows.forEach(row => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        doc.text(row.name, leftMargin + 3, y + 4);
        doc.text(String(row.likes), leftMargin + 55, y + 4);
        doc.text(String(row.saves), leftMargin + 85, y + 4);
        doc.text(String(row.orders), leftMargin + 115, y + 4);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(formatPrice(row.revenue), leftMargin + 145, y + 4);

        doc.setDrawColor(243, 244, 246);
        doc.line(leftMargin, y + 7, rightMargin, y + 7);
        y += 8;
      });

      // 2. DETAILED ACTION LOGS (Page padding check)
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("II. DETAILED EVENT TELEMETRY JOURNAL", leftMargin, y);

      doc.setFillColor(243, 244, 246);
      doc.rect(leftMargin, y + 4, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text("Date & Time", leftMargin + 3, y + 9);
      doc.text("Event Type", leftMargin + 45, y + 9);
      doc.text("Product (Target Gadget)", leftMargin + 80, y + 9);
      doc.text("Details / Checkout Value", leftMargin + 135, y + 9);

      y += 12;
      const sortedLogs = [...analyticsEvents].slice(0, 20); // Maintain beautiful single output logs safely

      sortedLogs.forEach(evt => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);

        const timeStr = new Date(evt.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        doc.text(timeStr, leftMargin + 3, y + 4);

        if (evt.type === "order") {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(16, 185, 129); // emerald
          doc.text("ORDER PLACED", leftMargin + 45, y + 4);
        } else if (evt.type === "save") {
          doc.setTextColor(244, 63, 94); // rose
          doc.text("SAVED TO WISHLIST", leftMargin + 45, y + 4);
        } else {
          doc.setTextColor(59, 130, 246); // blue
          doc.text("LIKED PRODUCT", leftMargin + 45, y + 4);
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(31, 41, 55);
        doc.text(evt.productName.substring(0, 30), leftMargin + 80, y + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        if (evt.type === "order") {
          doc.text(`Qty: ${evt.quantity} | Total: ${formatPrice((evt.price || 0) * (evt.quantity || 1))}`, leftMargin + 135, y + 4);
        } else {
          doc.text(`Value: ${formatPrice(evt.price || 0)}`, leftMargin + 135, y + 4);
        }

        doc.setDrawColor(249, 250, 251);
        doc.line(leftMargin, y + 6, rightMargin, y + 6);
        y += 7;
      });

      // Simple report stamp at base
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("Apex Devices Core Telemetry • Activity logged securely in Uganda Local Server.", leftMargin, 287);
      doc.text(`Data Signature Ref: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 135, 287);

      doc.save(`Apex-Telemetry-Report-${Date.now()}.pdf`);
    } catch (e: any) {
      alert("Failed generating automated telemetry PDF report: " + e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-analytics-module">
      {/* 1. TOP HEADER & TELEMETRY TOOLBAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/3 border border-white/5 p-5 rounded-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 tracking-widest px-2.5 py-1 rounded border border-emerald-500/20 font-semibold mb-2 inline-block">
            Autonomous Conversion Monitoring
          </span>
          <h3 className="font-display font-bold text-xl text-white">
            Apex Live Conversion Telemetry
          </h3>
          <p className="text-xs text-slate-400">
            Real-time visual monitoring of user engagement, saves, and WhatsApp checkout funnels.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition-all w-full md:w-auto justify-center"
          id="btn-download-telemetry-pdf"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Analytics Report</span>
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* REVENUE */}
        <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Gross Sales tracked</span>
            <div className="text-xl font-mono text-emerald-400 font-extrabold">
              {formatPrice(aggregateStats.revenue)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">From checkouts initiated</span>
          </div>
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* LIKES COUNTER */}
        <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Total Likes (♥)</span>
            <div className="text-xl font-mono text-blue-400 font-extrabold">
              {aggregateStats.likes} <span className="text-xs text-slate-500 font-normal">events</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">High-intent product likes</span>
          </div>
          <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
            <Heart className="w-5 h-5 fill-blue-400/20" />
          </div>
        </div>

        {/* SAVES COUNTER */}
        <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-pink-500/30 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Total Saves (★)</span>
            <div className="text-xl font-mono text-pink-400 font-extrabold">
              {aggregateStats.saves} <span className="text-xs text-slate-500 font-normal">events</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">Added to wishlist carts</span>
          </div>
          <div className="w-11 h-11 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        {/* ORDERS COUNTER */}
        <div className="bg-white/3 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-amber-500/30 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">WhatsApp checkouts</span>
            <div className="text-xl font-mono text-amber-400 font-extrabold">
              {aggregateStats.orders} <span className="text-xs text-slate-500 font-normal">orders</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">Dispatch invoices compiled</span>
          </div>
          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. 24-HOUR INTERVAL ANALYSIS BOARD */}
      <div className="space-y-4">
        <h4 className="font-display font-medium text-base text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400 animate-spin-pulse" />
          <span>96-Hour Event Segmentation Matrix (24h Buckets)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[intervals.last24h, intervals.prev24_48h, intervals.prev48_72h, intervals.older].map((segment, index) => (
            <div 
              key={segment.name}
              className={`border p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden ${
                index === 0 
                  ? "bg-slate-950/40 border-emerald-500/30" 
                  : "bg-black/30 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Highlight badge for active segment (Last 24h) */}
              {index === 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>LIVE ACTIVE</span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold block uppercase tracking-wider">BUCKET {index + 1}</span>
                <h5 className="font-display font-bold text-sm text-white">{segment.name}</h5>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-3">
                <div className="text-center">
                  <span className="text-[9px] font-mono text-blue-500 font-black block">LIKES</span>
                  <span className="text-sm font-mono text-white font-extrabold">{segment.likes}</span>
                </div>
                <div className="text-center border-x border-white/5">
                  <span className="text-[9px] font-mono text-pink-500 font-black block">SAVES</span>
                  <span className="text-sm font-mono text-white font-extrabold">{segment.saves}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-mono text-amber-500 font-black block">ORDERS</span>
                  <span className="text-sm font-mono text-white font-extrabold">{segment.orders}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Value generated</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {formatPrice(segment.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. HISTOGRAM LOGS JOURNAL */}
      <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div>
            <h4 className="font-display font-bold text-base text-white flex items-center gap-1.5">
              <BarChart3 className="w-4.5 h-4.5 text-blue-400" />
              <span>Telemetry Event Journal</span>
            </h4>
            <p className="text-[11px] text-slate-400">Showing the log records parsed and securely persisted locally.</p>
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/15">
            {[
              { id: "all", label: "All Events" },
              { id: "like", label: "Likes (♥)" },
              { id: "save", label: "Saves (★)" },
              { id: "order", label: "Orders (📦)" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id as any)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === btn.id 
                    ? "bg-white/10 text-white font-black border border-white/10" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOG PANEL TABLE */}
        <div className="overflow-x-auto min-h-[300px]">
          {filteredEventsList.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No logged events found for selected query</p>
            </div>
          ) : (
            <table className="w-full text-left" id="telemetry-table-journal">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Event Action</th>
                  <th className="pb-3">Target Gadget</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3 text-right pr-2">Total Price Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEventsList.map(evt => {
                  const dateObj = new Date(evt.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  });

                  return (
                    <tr key={evt.id} className="text-xs text-slate-300 hover:bg-white/2 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[10px] text-slate-500">
                        <span>{formattedDate}</span> <span className="text-[9px] opacity-75 ml-1">{formattedTime}</span>
                      </td>
                      <td className="py-3">
                        {evt.type === "order" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                            📦 ORDER : {evt.orderId || "REF"}
                          </span>
                        ) : evt.type === "save" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded font-black">
                            ★ SAVED DECK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-black">
                            ♥ LIKED ITEM
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-white">
                        {evt.productName}
                      </td>
                      <td className="py-3 font-mono text-slate-400 font-bold">
                        {evt.quantity || 1}x
                      </td>
                      <td className="py-3 text-right pr-2 font-mono font-bold text-slate-300">
                        {formatPrice((evt.price || 0) * (evt.quantity || 1))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* RECURSIVE PURGE JOURNAL */}
        <div className="mt-5 pt-3 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <p className="text-[10px] text-slate-500 font-mono">
            *WARNING: Bypassing telemetry deletes local history buffer blocks permanently.
          </p>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to permanently clear the telemetry event audit journal list?")) {
                clearAnalyticsEvents();
              }
            }}
            className="text-[10px] font-mono uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-400 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-bold active:scale-95"
            id="btn-purge-telemetry"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Telemetry Audit logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
