import React, { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { parseCsvToProducts } from "../utils/csvParser";
import { getSimulatedCsvContent } from "../utils/simulatedStock";
import {
  Database,
  Upload,
  FileSpreadsheet,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";

export default function BulkImporter() {
  const { products, addCustomProducts, setActiveCategory } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [previewSortBy, setPreviewSortBy] = useState<"category" | "price_asc" | "price_desc" | "name" | "none">("category");
  const [copiedJsonFeedback, setCopiedJsonFeedback] = useState(false);

  const diagnostics = useMemo(() => {
    if (previewProducts.length === 0) return null;
    
    const duplicateIds: string[] = [];
    const missingImages: string[] = [];
    const missingVideos: string[] = [];
    const invalidMediaPaths: string[] = [];
    let autoRecoveredSlugsCount = 0;
    
    const existingIds = new Set(products.map((p) => p.id));
    const seenInImport = new Set<string>();
    
    previewProducts.forEach((p, idx) => {
      const label = p.name || `Row ${idx + 2}`;
      
      // 1. Duplicate ID Check
      if (seenInImport.has(p.id) || existingIds.has(p.id)) {
        duplicateIds.push(p.id || `Row ${idx + 2}`);
      }
      seenInImport.add(p.id);
      
      // 2. Automatic Slug Generate check
      if (!p.id || p.id.toLowerCase().startsWith("unnamed") || p.id === label.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
        autoRecoveredSlugsCount++;
      }
      
      // 3. Missing Media check
      if (!p.images || p.images.length === 0) {
        missingImages.push(label);
      }
      if (!p.videos || p.videos.length === 0) {
        missingVideos.push(label);
      }
      
      // 4. File-path style validation checks
      if (p.images && p.images.length > 0) {
        p.images.forEach((img: string) => {
          const isValid = img.startsWith("public/products/images/") || img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/products/");
          if (!isValid) {
            invalidMediaPaths.push(`${label}: "${img}"`);
          }
        });
      }
    });
    
    return {
      duplicateIds: [...new Set(duplicateIds)],
      missingImages: [...new Set(missingImages)],
      missingVideos: [...new Set(missingVideos)],
      invalidMediaPaths: [...new Set(invalidMediaPaths)],
      autoRecoveredSlugsCount
    };
  }, [previewProducts, products]);

  const handleCopyJson = () => {
    if (previewProducts.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(previewProducts, null, 2));
      setCopiedJsonFeedback(true);
      setTimeout(() => setCopiedJsonFeedback(false), 2000);
    } catch (err) {
      console.warn("Unable to write directly to clipboard:", err);
    }
  };

  const sortedPreviewProducts = useMemo(() => {
    const items = [...previewProducts];
    if (previewSortBy === "none") return items;
    return items.sort((a, b) => {
      if (previewSortBy === "category") {
        const catA = String(a.category || "").toLowerCase();
        const catB = String(b.category || "").toLowerCase();
        return catA.localeCompare(catB);
      }
      if (previewSortBy === "name") {
        const nameA = String(a.name || "").toLowerCase();
        const nameB = String(b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (previewSortBy === "price_asc") {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        return priceA - priceB;
      }
      if (previewSortBy === "price_desc") {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        return priceB - priceA;
      }
      return 0;
    });
  }, [previewProducts, previewSortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleLoadSimulatedStock = () => {
    const simCsv = getSimulatedCsvContent();
    setCsvText(simCsv);
    const parsed = parseCsvToProducts(simCsv);
    setPreviewProducts(parsed);
    setImportStatus({
      success: true,
      message: `Parsed ${parsed.length} items from simulated stock. Click 'Merge Into Live Store' below to push them live!`
    });
  };

  const handleCommitImport = () => {
    if (previewProducts.length === 0) {
      const parsed = parseCsvToProducts(csvText);
      if (parsed.length === 0) {
        setImportStatus({ success: false, message: "No valid product rows parsed. Please verify CSV headings." });
        return;
      }
      addCustomProducts(parsed);
      setImportStatus({ success: true, message: `Successfully loaded and merged ${parsed.length} new custom products into your live inventory!` });
      setCsvText("");
      setPreviewProducts([]);
      setActiveCategory("All");
    } else {
      addCustomProducts(previewProducts);
      setImportStatus({ success: true, message: `Successfully loaded and merged ${previewProducts.length} new custom products into your live inventory!` });
      setCsvText("");
      setPreviewProducts([]);
      setActiveCategory("All");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        const parsed = parseCsvToProducts(text);
        setPreviewProducts(parsed);
        setImportStatus({
          success: true,
          message: `Successfully uploaded and parsed '${file.name}' (${parsed.length} items identified).`
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        const parsed = parseCsvToProducts(text);
        setPreviewProducts(parsed);
        setImportStatus({
          success: true,
          message: `Successfully uploaded and parsed '${file.name}' (${parsed.length} items identified).`
        });
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setPreviewProducts([]);
      setImportStatus(null);
      return;
    }
    const parsed = parseCsvToProducts(text);
    setPreviewProducts(parsed);
    if (parsed.length > 0) {
      setImportStatus({
        success: true,
        message: `Parsed ${parsed.length} items from input text. Click 'Merge Into Live Store' below!`
      });
    } else {
      setImportStatus({
        success: false,
        message: "Parsing... typing or checking CSV headers."
      });
    }
  };

  return (
    <section id="merchant-control" className="relative border-t border-white/5 bg-[#05050b] py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between bg-white/3 hover:bg-white/5 border border-white/10 p-5 rounded-2xl cursor-pointer transition-all select-none group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                Apex Merchant Administration Panel
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  {products.length} Items Live
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                Bulk import new inventory, download CSV templates, load 100+ stock mockups, and inspect live catalogs.
              </p>
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-white transition-colors">
            {isOpen ? <ChevronDown className="w-5 h-5 animate-bounce" /> : <ChevronUp className="w-5 h-5 animate-bounce" />}
          </div>
        </div>

        {isOpen && (
          <div className="mt-6 text-left animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-black/60 border border-emerald-500/20 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
                <div>
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Bulk Products CSV / Excel Uploader
                  </h4>
                  <p className="text-xs text-slate-400 font-light mt-1">
                    Convert spreadsheet rows or direct user input into structured React product models instantly. Designed for future scalable Firebase connection.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSimulatedStock}
                    className="px-3.5 py-1.5 text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 transition-all cursor-pointer"
                  >
                    🚀 Load 100+ Sample Products
                  </button>
                  <a
                    href={`data:text/csv;charset=utf-8,${encodeURIComponent("id,name,description,price,originalPrice,category,rating,reviewsCount,badge,specs,colors,storages,stockStatus,iconName\ns24-base,Samsung Galaxy S24,Excellent slim device,3200000,3500000,Phones,4.8,42,HOT,8GB RAM;256GB Storage,Onyx Black;Cobalt,256GB,In Stock,Smartphone")}`}
                    download="apex_devices_template.csv"
                    className="px-3.5 py-1.5 text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                  >
                    📥 Excel/CSV Template
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Input Form Dropzone */}
                <div className="space-y-4">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                      dragActive
                        ? "border-emerald-400 bg-emerald-400/5"
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">
                      Drag and drop your Excel-compatible <code className="text-emerald-400 font-mono font-bold text-[11px] bg-black/40 px-1 py-0.5 rounded">.csv</code> file here
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">or manual select below</p>
                    
                    <label className="mt-3 inline-block cursor-pointer px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-all">
                      <span>Select File</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col text-left">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 font-bold">
                      Or Paste Raw CSV Text Rows:
                    </label>
                    <textarea
                      value={csvText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="id,name,description,price,originalPrice,category,rating,reviewsCount,badge,specs,colors,storages,stockStatus,iconName&#10;ip-16,Apple iPhone 16 Pro,Latest M4 series,4600000,5100000,Phones,4.9,94,NEW,A18 Chip;6.1-inch Screen,Desert Titanium;Black,128GB;256GB,In Stock,Smartphone"
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 transition-all font-mono placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Right Column: Preview window */}
                <div className="flex flex-col h-full justify-between">
                  <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 overflow-hidden flex-1 flex flex-col min-h-[220px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-white/5 pb-2.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-405 text-left font-bold block">
                        Parsed Import Preview ({previewProducts.length} Items):
                      </span>
                      {previewProducts.length > 0 && (
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <span className="text-[9px] text-slate-500 font-mono font-medium">Auto-Sort Preview:</span>
                          <select
                            value={previewSortBy}
                            onChange={(e) => setPreviewSortBy(e.target.value as any)}
                            className="bg-black/80 border border-white/10 text-[9px] rounded-md px-2 py-1 text-slate-300 outline-none cursor-pointer focus:border-emerald-500 font-sans font-medium"
                          >
                            <option value="category">Category (A-Z)</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="none">Original Parsed Order</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {previewProducts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-lg">
                        <FileSpreadsheet className="w-8 h-8 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-500 font-light">
                          No imported items loaded yet. Paste CSV rows on the left, drop a file, or click <strong className="text-blue-400">"Load 100+ Sample Products"</strong> to generate a rich preview.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-[180px] text-xs font-mono text-left scrollbar-thin divide-y divide-white/5">
                        {sortedPreviewProducts.slice(0, 10).map((preview, idx) => (
                          <div key={preview.id || idx} className="py-2 flex items-center justify-between gap-4">
                            <div className="truncate max-w-[200px]">
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded mr-1.5 font-sans font-bold">
                                {preview.category}
                              </span>
                              <span className="text-slate-200">{preview.name}</span>
                            </div>
                            <div className="text-emerald-400 font-bold text-right shrink-0">
                              {formatCurrency(preview.price)}
                            </div>
                          </div>
                        ))}
                        {sortedPreviewProducts.length > 10 && (
                          <div className="py-2 text-[10px] text-slate-500 italic text-center">
                            + {sortedPreviewProducts.length - 10} more items parsed successfully
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reusable Data Diagnostics Suite */}
                  {diagnostics && (
                    <div className="mt-3 bg-neutral-950/80 border border-white/5 rounded-xl p-3.5 space-y-2 text-xs font-sans text-left">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1.5">
                        <span className="text-[10px] font-mono uppercase font-bold text-sky-400 tracking-wider">🛠 Core Catalog Diagnostics</span>
                        <button
                          type="button"
                          onClick={handleCopyJson}
                          className="text-[9px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 py-1 px-2.5 rounded font-mono text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedJsonFeedback ? "✓ Copied JSON" : "📥 Export Parsed JSON"}
                        </button>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        {/* 1. ID Duplicates Check */}
                        <div className="flex items-center gap-2">
                          <span className={diagnostics.duplicateIds.length > 0 ? "text-amber-400 font-extrabold" : "text-emerald-400 font-extrabold"}>•</span>
                          <span className="text-slate-400">ID Conflicts / Duplicates:</span>
                          <span className={diagnostics.duplicateIds.length > 0 ? "text-amber-400 font-bold ml-auto" : "text-emerald-400 font-bold ml-auto"}>
                            {diagnostics.duplicateIds.length > 0 ? `${diagnostics.duplicateIds.length} flagged` : "Verified Safe (0)"}
                          </span>
                        </div>
                        {diagnostics.duplicateIds.length > 0 && (
                          <div className="text-[9px] text-amber-500/80 bg-amber-500/5 p-1 rounded max-h-12 overflow-y-auto break-all font-mono">
                            Conflict IDs: {diagnostics.duplicateIds.join(", ")}
                          </div>
                        )}

                        {/* 2. Automated Slugs Check */}
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-extrabold">•</span>
                          <span className="text-slate-400">Auto-Slug Generates:</span>
                          <span className="text-teal-400 font-bold ml-auto">{diagnostics.autoRecoveredSlugsCount} resolved</span>
                        </div>

                        {/* 3. Missing Media Check */}
                        <div className="flex items-center gap-2">
                          <span className={diagnostics.missingImages.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>•</span>
                          <span className="text-slate-400">Missing Image Galleries:</span>
                          <span className="text-slate-300 ml-auto font-bold">{diagnostics.missingImages.length} items</span>
                        </div>
                        {diagnostics.missingImages.length > 0 && (
                          <div className="text-[9px] text-rose-400/80 bg-rose-400/5 p-1.5 rounded max-h-12 overflow-y-auto">
                            Missing image lists: {diagnostics.missingImages.slice(0, 3).join(", ")} {diagnostics.missingImages.length > 3 ? `+${diagnostics.missingImages.length - 3} more` : ""}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className={diagnostics.missingVideos.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>•</span>
                          <span className="text-slate-400">Missing Video Promos:</span>
                          <span className="text-slate-300 ml-auto font-bold">{diagnostics.missingVideos.length} items</span>
                        </div>
                        {diagnostics.missingVideos.length > 0 && (
                          <div className="text-[9px] text-yellow-400/80 bg-yellow-400/5 p-1.5 rounded max-h-12 overflow-y-auto">
                            Need fallbacks: {diagnostics.missingVideos.slice(0, 3).join(", ")} {diagnostics.missingVideos.length > 3 ? `+${diagnostics.missingVideos.length - 3} more` : ""}
                          </div>
                        )}

                        {/* 4. Path Validation */}
                        <div className="flex items-center gap-2">
                          <span className={diagnostics.invalidMediaPaths.length > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>•</span>
                          <span className="text-slate-400">Invalid Media Folder Check:</span>
                          <span className={diagnostics.invalidMediaPaths.length > 0 ? "text-amber-400 font-bold ml-auto" : "text-emerald-400 font-bold ml-auto"}>
                            {diagnostics.invalidMediaPaths.length > 0 ? `${diagnostics.invalidMediaPaths.length} bad paths` : "100% Path Compliant"}
                          </span>
                        </div>
                        {diagnostics.invalidMediaPaths.length > 0 && (
                          <div className="text-[9px] text-orange-400 bg-orange-400/5 p-1.5 rounded max-h-12 overflow-y-auto">
                            Flagged rows: {diagnostics.invalidMediaPaths.slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Feedback banner */}
                  {importStatus && (
                    <div className={`mt-3 p-3 rounded-lg flex items-center gap-2.5 text-xs text-left ${
                      importStatus.success
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                      {importStatus.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      )}
                      <span className="font-sans line-clamp-2">{importStatus.message}</span>
                    </div>
                  )}

                  {/* Commit Action Buttons */}
                  <div className="mt-4 flex gap-3 h-10 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      disabled={previewProducts.length === 0 && !csvText.trim()}
                      onClick={handleCommitImport}
                      className="flex-1 h-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-30 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-xl font-bold text-white text-xs select-none transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 active:scale-95 text-center shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Merge Into Live Store</span>
                    </button>
                    {(csvText || previewProducts.length > 0 || importStatus) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCsvText("");
                          setPreviewProducts([]);
                          setImportStatus(null);
                        }}
                        className="px-3 border border-white/10 hover:bg-white/5 active:scale-95 transition-all text-xs text-slate-400 rounded-xl cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
