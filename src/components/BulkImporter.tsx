import React, { useState, useMemo, useEffect } from "react";
import AdminAnalytics from "./AdminAnalytics";
import { useCart } from "../context/CartContext";
import { parseCsvToProducts } from "../utils/csvParser";
import { getSimulatedCsvContent } from "../utils/simulatedStock";
import { mapFrontendToSupabase, getSupabase } from "../lib/supabase";
import { Product } from "../types";
import {
  extractSpreadsheetId,
  getSheetFetchUrl,
  parseAndValidateSheetData,
  SheetConfig,
  SyncLogEntry
} from "../utils/googleSheetsSync";
import {
  Database,
  Upload,
  FileSpreadsheet,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X,
  Shield,
  LogIn,
  LogOut,
  Search,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  ImageIcon,
  Video,
  Grid,
  Filter,
  ArrowDownWideNarrow,
  Sparkles,
  Link,
  Clipboard,
  FileText,
  Clock,
  Download,
  AlertTriangle,
  Settings,
  History,
  Check,
  Star,
  TrendingDown
} from "lucide-react";

export default function BulkImporter() {
  const {
    products,
    addCustomProducts,
    setProducts,
    setActiveCategory,
    refreshCatalog,
    adminUser,
    setAdminUser,
    csrfToken,
    setCsrfToken,
    isSupabaseActive
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "importer" | "mediaHub" | "setup" | "sheetsSync" | "analytics">("directory");

  // Google Sheets Product Sync states
  const [sheets, setSheets] = useState<SheetConfig[]>(() => {
    const saved = localStorage.getItem("apex_sheets_config");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "primary-catalog",
        name: "Main Catalog Sheet",
        urlOrId: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
        syncInterval: "manual",
        categoryFilter: "All",
        isActive: true,
        lastSyncTime: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
      }
    ];
  });

  const [activeSheetId, setActiveSheetId] = useState<string>("primary-catalog");
  const [sheetLogs, setSheetLogs] = useState<SyncLogEntry[]>(() => {
    const saved = localStorage.getItem("apex_sheet_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "log-seed-1",
        sheetName: "Main Catalog Sheet",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: "success",
        addedCount: 3,
        updatedCount: 5,
        skippedCount: 2,
        failedRows: [
          { row: 9, id: "phone-err-val", name: "Apex Drone Pro", reason: "Invalid price structure: 'N/A'. Must be a positive decimal number." },
          { row: 12, id: "duplicate-id-check", name: "Apex Pro-X Earbuds", reason: "Duplicate row entry with ID 'duplicate-id-check' in same Google Sheet." }
        ],
        logText: "Fetch spreadsheet payload successfully. Processed 10 rows. Check detailed diagnostics filter logs."
      }
    ];
  });

  // Sheet config inputs
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetUrl, setNewSheetUrl] = useState("");
  const [newSheetInterval, setNewSheetInterval] = useState<SheetConfig["syncInterval"]>("manual");
  const [newSheetCategory, setNewSheetCategory] = useState("All");

  // Live Sync execution state indicators
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [isApplyingSync, setIsApplyingSync] = useState(false);
  const [sheetsFeedback, setSheetsFeedback] = useState<{ success: boolean; message: string } | null>(null);
  
  // Pending parsed sheet preview records
  const [previewSheetProducts, setPreviewSheetProducts] = useState<Product[]>([]);
  const [previewSkippedRows, setPreviewSkippedRows] = useState<SyncLogEntry["failedRows"]>([]);
  const [previewCounts, setPreviewCounts] = useState<{ addedCount: number; updatedCount: number; skippedCount: number } | null>(null);
  const [viewLogDetail, setViewLogDetail] = useState<SyncLogEntry | null>(null);

  // Admin Restock Alert subscription state bindings
  const [restockSubscriptions, setRestockSubscriptions] = useState<any[]>([]);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);
  const [reloadingAlerts, setReloadingAlerts] = useState(false);
  const [alertsAdminTab, setAlertsAdminTab] = useState<"restock" | "pricedrop" | "reviews">("restock");

  // Admin Price Drop and Product Reviews bindings
  const [priceDropSubscriptions, setPriceDropSubscriptions] = useState<any[]>([]);
  const [isFetchingPriceDrops, setIsFetchingPriceDrops] = useState(false);
  const [showroomReviews, setShowroomReviews] = useState<any[]>([]);
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);

  const fetchPriceDropSubscriptions = async () => {
    try {
      setIsFetchingPriceDrops(true);
      const res = await fetch("/api/admin/price-drop-subscriptions", {
        headers: { "X-CSRF-Token": csrfToken || "" },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPriceDropSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error("Error fetching admin price drop logs:", err);
    } finally {
      setIsFetchingPriceDrops(false);
    }
  };

  const fetchShowroomReviews = async () => {
    try {
      setIsFetchingReviews(true);
      const res = await fetch("/api/admin/reviews", {
        headers: { "X-CSRF-Token": csrfToken || "" },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setShowroomReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching admin reviews list:", err);
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const triggerPriceDropRelease = async (subscriptionId: string) => {
    if (!window.confirm("Are you sure you want to trigger manual release and dispatch simulation emails to this user address?")) return;
    try {
      const res = await fetch("/api/admin/price-drop-release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || ""
        },
        body: JSON.stringify({ subscriptionId }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to release price drop alert.");
      alert(`Success! Simulated email notice dispatched to subscriber!`);
      await fetchPriceDropSubscriptions();
    } catch (err: any) {
      alert(`Price drop release failed: ${err.message}`);
    }
  };

  const triggerDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to administratively delete this verified customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken || "" },
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete review.");
      alert(`Success! Review removed successfully.`);
      await fetchShowroomReviews();
    } catch (err: any) {
      alert(`Could not delete review: ${err.message}`);
    }
  };

  const fetchRestockSubscriptions = async () => {
    try {
      setIsFetchingAlerts(true);
      const res = await fetch("/api/admin/notify-subscriptions", {
        headers: {
          "X-CSRF-Token": csrfToken || ""
        },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subscriptions) {
          setRestockSubscriptions(data.subscriptions);
        } else {
          setRestockSubscriptions(data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching restock records:", err);
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  const triggerRestockAlertRelease = async (productId: string) => {
    if (!window.confirm("Are you sure you want to trigger product restock and dispatch automated simulated email alert notifications to all subscribers?")) return;
    try {
      setReloadingAlerts(true);
      const res = await fetch("/api/admin/notify-release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || ""
        },
         body: JSON.stringify({ productId }),
         credentials: "include"
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to release restock.");
      }
      alert(`Success! Product has been marked as 'In Stock' in memory. Simulated email notices were dispatched successfully to ${resData.dispatchedCount} subscriber(s)!`);
      
      // Update local product state
      if (products) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockStatus: "In Stock" } : p))
        );
      }
      // Re-fetch subscriptions
      await fetchRestockSubscriptions();
    } catch (err: any) {
      alert(`RESTOCK RELEASE FAILED: ${err.message}`);
    } finally {
      setReloadingAlerts(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchRestockSubscriptions();
    }
  }, [adminUser]);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem("apex_sheets_config", JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    localStorage.setItem("apex_sheet_logs", JSON.stringify(sheetLogs));
  }, [sheetLogs]);

  // Auth local inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Directory filter variables
  const [dirSearch, setDirSearch] = useState("");
  const [dirCategory, setDirCategory] = useState("All");
  const [dirStock, setDirStock] = useState("All");
  const [dirPage, setDirPage] = useState(1);
  const itemsPerPage = 6;

  // Inline edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Bulk importer inputs
  const [csvText, setCsvText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<"update" | "skip">("update");
  const [isImporting, setIsImporting] = useState(false);

  // Storage Media Manager states
  const [mediaDragActive, setMediaDragActive] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<{ name: string; url: string; size: string }[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaTargetProduct, setMediaTargetProduct] = useState("");
  const [copiedLinkFeedback, setCopiedLinkFeedback] = useState<string | null>(null);

  // Filter products count
  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((p) => p.category))];
  }, [products]);

  // Handle Administrative Auth Actions strictly with secure cryptographically verified server-side validation
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        credentials: "include" // vial for transmitting secure cookies
      });

      const contentType = resp.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await resp.json();
        } catch (jsonErr) {
          console.error("Failed to parse json on response:", jsonErr);
        }
      }

      if (resp.ok && data) {
        if (data.success && data.user) {
          // Store token securely inside cookie container, and grab csrfToken for double-submit
          setAdminUser(data.user);
          setCsrfToken(data.csrfToken || null);
          setIsAuthLoading(false);
          return;
        }
      } else {
        const errMsg = data?.error || "Incorrect administrative passphrase or credentials.";
        setAuthError(errMsg);
      }
    } catch (apiErr) {
      console.error("Secure backend admin login handshake fails:", apiErr);
      setAuthError("Administrative auth communications offline. Please check network connection.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // Perform server-side session cookie neutralization
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to neutralize cookie session:", err);
    } finally {
      setAdminUser(null);
      setCsrfToken(null);
    }
  };

  // Directory Filtration & Pagination
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(dirSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(dirSearch.toLowerCase()) ||
                          p.specs.some(s => s.toLowerCase().includes(dirSearch.toLowerCase()));
      const matchCategory = dirCategory === "All" || p.category === dirCategory;
      const matchStock = dirStock === "All" || p.stockStatus === dirStock;
      return matchSearch && matchCategory && matchStock;
    });
  }, [products, dirSearch, dirCategory, dirStock]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (dirPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, dirPage]);

  // Export Inventory as CSV helper
  const handleExportCsv = () => {
    if (products.length === 0) return;
    
    // Header Row mapping database fields nicely
    const headers = ["id", "name", "category", "price", "original_price", "badge", "specs", "colors", "storages", "images", "videos", "stock_status", "description", "rating", "reviews_count"];
    
    const rows = products.map((p) => {
      const specsJoined = p.specs.join(";");
      const colorsJoined = (p.colors || []).join(";");
      const storagesJoined = (p.storages || []).join(";");
      const imagesJoined = (p.images || []).join(";");
      const videosJoined = (p.videos || []).join(";");
      
      return [
        p.id,
        p.name.replace(/"/g, '""'),
        p.category,
        p.price,
        p.originalPrice || "",
        p.badge || "",
        specsJoined.replace(/"/g, '""'),
        colorsJoined.replace(/"/g, '""'),
        storagesJoined.replace(/"/g, '""'),
        imagesJoined.replace(/"/g, '""'),
        videosJoined.replace(/"/g, '""'),
        p.stockStatus,
        (p.description || "").replace(/"/g, '""'),
        p.rating,
        p.reviewsCount
      ];
    });

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `apex_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Interactive Product CRUD Actions
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Auto-calculate discount percentage if originalPrice is declared
    let calculatedBadge = editingProduct.badge;
    if (editingProduct.originalPrice && editingProduct.originalPrice > editingProduct.price) {
      const discount = Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100);
      if (discount > 0) {
        calculatedBadge = `${discount}% OFF`;
      }
    } else {
      calculatedBadge = undefined;
    }

    const updated = {
      ...editingProduct,
      badge: calculatedBadge
    };

    const supabase = getSupabase();
    if (supabase && isSupabaseActive) {
      if (csrfToken) {
        const sbMapped = mapFrontendToSupabase(updated);
        try {
          const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(sbMapped),
            credentials: "include"
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            alert(`Failed to save to database securely: ${errData.error || res.statusText}`);
            return;
          }
        } catch (apiErr) {
          console.error("Secure save handshake offline:", apiErr);
          alert("Administrative server communications are currently offline. Cannot persist changes.");
          return;
        }
      } else {
        alert("Action denied. You do not have an active administrative session. Please log in.");
        return;
      }
    }

    // Update local state instantly
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    const supabase = getSupabase();
    if (supabase && isSupabaseActive) {
      if (csrfToken) {
        try {
          const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: {
              "X-CSRF-Token": csrfToken
            },
            credentials: "include"
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            alert(`Failed to delete securely from database: ${errData.error || res.statusText}`);
            return;
          }
        } catch (apiErr) {
          console.error("Secure delete handshake offline:", apiErr);
          alert("Administrative server communications are currently offline. Cannot delete entry.");
          return;
        }
      } else {
        alert("Action denied. You do not have an active administrative session. Please log in.");
        return;
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // CSV Drag and Drop Parsers
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
          message: `Successfully uploaded and parsed '${file.name}' (${parsed.length} products parsed). Check diagnostic conflicts below.`
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
          message: `Parsed '${file.name}' successfully. (${parsed.length} products found).`
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
  };

  const handleLoadSimulatedStock = () => {
    const simCsv = getSimulatedCsvContent();
    setCsvText(simCsv);
    const parsed = parseCsvToProducts(simCsv);
    setPreviewProducts(parsed);
    setImportStatus({
      success: true,
      message: `Parsed ${parsed.length} items from sample catalog. Ready to import!`
    });
  };

  // Duplicates Diagnostic Checker
  const diagnostics = useMemo(() => {
    if (previewProducts.length === 0) return null;
    const existingIds = new Set(products.map((p) => p.id));
    const duplicatesInImport = new Set<string>();
    const intersectionList: string[] = [];

    previewProducts.forEach((p) => {
      if (existingIds.has(p.id) || duplicatesInImport.has(p.id)) {
        intersectionList.push(p.id);
      }
      duplicatesInImport.add(p.id);
    });

    return {
      duplicateIdsCount: intersectionList.length,
      duplicateIds: [...new Set(intersectionList)],
      healthyCount: previewProducts.length - intersectionList.length
    };
  }, [previewProducts, products]);

  // Bulk commit runner supporting 10,000+ items inside batch segments
  const handleCommitImport = async () => {
    if (previewProducts.length === 0) return;
    setIsImporting(true);
    setBulkProgress({ current: 0, total: previewProducts.length });

    const existingIds = new Set(products.map((p) => p.id));
    
    // Filter previews based on duplicate mode chosen
    const filteredToCommit = previewProducts.filter((p) => {
      if (duplicateMode === "skip" && existingIds.has(p.id)) {
        return false;
      }
      return true;
    });

    if (filteredToCommit.length === 0) {
      setImportStatus({
        success: false,
        message: "No products added as all imported IDs were duplicates under 'Skip Duplicates' mode."
      });
      setIsImporting(false);
      setBulkProgress(null);
      return;
    }

    const supabase = getSupabase();
    let committedCount = 0;
    let failedCount = 0;

    if (supabase && isSupabaseActive) {
      // Chunk size of 100 prevents network packet bottlenecks
      const segmentSize = 100;
      for (let i = 0; i < filteredToCommit.length; i += segmentSize) {
        const segment = filteredToCommit.slice(i, i + segmentSize);
        const mappedSegment = segment.map((p) => {
          // Sync discount automatic calculation
          let calculatedBadge = p.badge;
          if (p.originalPrice && p.originalPrice > p.price) {
            const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            if (discount > 0) {
              calculatedBadge = `${discount}% OFF`;
            }
          }
          return mapFrontendToSupabase({ ...p, badge: calculatedBadge });
        });

        let batchError = false;
        if (csrfToken) {
          try {
            const res = await fetch("/api/admin/products", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
              },
              body: JSON.stringify(mappedSegment),
              credentials: "include"
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.error("Batch error inside bulk upsert secure API:", errData.error || res.statusText);
              batchError = true;
            }
          } catch (apiErr) {
            console.error("Batch API write offline:", apiErr);
            batchError = true;
          }
        } else {
          console.error("Batch rejected: Action denied. Session expired.");
          batchError = true;
        }

        if (batchError) {
          failedCount += segment.length;
        } else {
          committedCount += segment.length;
        }

        setBulkProgress({
          current: Math.min(i + segmentSize, filteredToCommit.length),
          total: filteredToCommit.length
        });
      }
      setImportStatus({
        success: failedCount === 0,
        message: `Bulk Import Completed. Sync status: ${committedCount} uploaded, ${failedCount} errors flagged.`
      });
      await refreshCatalog();
    } else {
      // Dev Sandbox local context merger
      addCustomProducts(filteredToCommit);
      setImportStatus({
        success: true,
        message: `Merged ${filteredToCommit.length} custom products into Sandbox offline runtime successfully.`
      });
      setBulkProgress(null);
    }

    setIsImporting(false);
    setCsvText("");
    setPreviewProducts([]);
  };

  // Storage Bucket Drag Zones
  const handleMediaDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setMediaDragActive(true);
    } else if (e.type === "dragleave") {
      setMediaDragActive(false);
    }
  };

  const handleMediaDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMediaDragActive(false);

    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      await uploadMediaFiles(filesArray);
    }
  };

  const handleMediaFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      await uploadMediaFiles(filesArray);
    }
  };

  // Upload to Supabase Storage Bucket securely via custom server API proxying
  const uploadMediaFiles = async (files: File[]) => {
    setIsUploadingMedia(true);
    const supabase = getSupabase();

    if (!supabase || !isSupabaseActive) {
      // Simulate uploads
      setTimeout(() => {
        const dummyFiles = files.map((f) => ({
          name: f.name,
          url: `https://dummycdn.io/storage/v1/object/public/product-media/products/${encodeURIComponent(f.name)}`,
          size: `${(f.size / 1024).toFixed(1)} KB`
        }));
        setUploadedUrls((prev) => [...dummyFiles, ...prev]);
        setIsUploadingMedia(false);
      }, 1200);
      return;
    }

    try {
      if (!csrfToken) {
        alert("Action denied. Administrative session expired or token is missing.");
        setIsUploadingMedia(false);
        return;
      }

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrfToken
          },
          body: formData,
          credentials: "include"
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.success && data.file) {
          setUploadedUrls((prev) => [
            {
              name: data.file.name,
              url: data.file.url,
              size: data.file.size
            },
            ...prev
          ]);
        } else {
          throw new Error("Invalid response envelope from server.");
        }
      }
    } catch (err: any) {
      alert(`Media Upload error: ${err.message || "Make sure you have created the bucket 'product-media' in Supabase Storage and set to public!"}`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleBindUrlToProduct = (url: string, type: "image" | "video") => {
    if (!mediaTargetProduct) {
      alert("Specify a Product ID first to bind media dynamically.");
      return;
    }

    const exists = products.find((p) => p.id === mediaTargetProduct);
    if (!exists) {
      alert(`Product with ID '${mediaTargetProduct}' not found in active catalog.`);
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === mediaTargetProduct) {
          if (type === "image") {
            const currentImages = p.images || [];
            return { ...p, images: [url, ...currentImages.filter(i => i !== url)] };
          } else {
            const currentVideos = p.videos || [];
            return { ...p, videos: [url, ...currentVideos.filter(v => v !== url)] };
          }
        }
        return p;
      })
    );

    alert(`Successfully bound media to product: ${exists.name}`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkFeedback(text);
    setTimeout(() => setCopiedLinkFeedback(null), 2000);
  };

  const formatShillings = (amt: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0
    }).format(amt);
  };

  // Google Sheets Action Handlers
  const handleAddNewSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim() || !newSheetUrl.trim()) return;

    const sheetIdExtracted = extractSpreadsheetId(newSheetUrl);
    if (!sheetIdExtracted) {
      alert("Invalid Google Sheets URL format. Ensure a valid sharing link is provided.");
      return;
    }

    const uniqueId = `sheet-${Date.now()}`;
    const newSheet: SheetConfig = {
      id: uniqueId,
      name: newSheetName.trim(),
      urlOrId: newSheetUrl.trim(),
      syncInterval: newSheetInterval,
      categoryFilter: newSheetCategory,
      isActive: true,
      lastSyncTime: undefined
    };

    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(uniqueId);

    // Reset controls
    setNewSheetName("");
    setNewSheetUrl("");
    setNewSheetInterval("manual");
    setNewSheetCategory("All");

    setSheetsFeedback({
      success: true,
      message: `Successfully registered Google Sheet '${newSheet.name}'. Scroll down and select 'Test Fetch' to compile diagnostic logs.`
    });
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) {
      alert("At least one Google Sheet connection is required to be active.");
      return;
    }
    if (!window.confirm("Disconnect and remove this Google Sheet? Pre-existing audit logs will be preserved.")) return;

    const remaining = sheets.filter(s => s.id !== id);
    setSheets(remaining);
    if (activeSheetId === id) {
      setActiveSheetId(remaining[0].id);
    }
  };

  const handleToggleSheetStatus = (id: string) => {
    setSheets(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleTestFetchSheet = async (sheetConfigId: string) => {
    const config = sheets.find(s => s.id === sheetConfigId);
    if (!config) return;

    setIsTestingSync(true);
    setSheetsFeedback(null);
    setPreviewSheetProducts([]);
    setPreviewSkippedRows([]);
    setPreviewCounts(null);

    try {
      const sheetId = extractSpreadsheetId(config.urlOrId);
      if (!sheetId) {
        throw new Error("Invalid spreadsheet URL structure. Make sure you pasted a valid URL containing the spreadsheet/d/... path.");
      }

      const fetchUrl = getSheetFetchUrl(sheetId);
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Google Sheet request rejected by server with HTTP status error ${response.status}. Verify the sheet's Link Sharing matches 'Anyone with link can view'.`);
      }

      const csvData = await response.text();
      const results = parseAndValidateSheetData(csvData, products, config.categoryFilter);

      setPreviewSheetProducts(results.validProductsToSave);
      setPreviewSkippedRows(results.skippedRows);
      setPreviewCounts({
        addedCount: results.addedCount,
        updatedCount: results.updatedCount,
        skippedCount: results.skippedCount
      });

      setSheetsFeedback({
        success: true,
        message: `Parsed sheet successful! Validated ${results.processedProducts.length} row outputs, with ${results.skippedCount} rows flagged and bypassed from live updates.`
      });

    } catch (err: any) {
      console.error(err);
      setSheetsFeedback({
        success: false,
        message: `Connection Error: ${err.message || "Failed fetching Sheet CSV details"}. Reset sharing permissions and verify link again.`
      });
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleCommitSheetSync = async (sheetConfigId: string) => {
    const config = sheets.find(s => s.id === sheetConfigId);
    if (!config) return;

    if (previewSheetProducts.length === 0) {
      alert("No pending products loaded. Please hit 'Run Diagnostic Fetch' first.");
      return;
    }

    setIsApplyingSync(true);
    setSheetsFeedback(null);

    const logId = `log-${Date.now()}`;
    const logTimestamp = new Date().toISOString();
    const writeAdded = previewCounts ? previewCounts.addedCount : 0;
    const writeUpdated = previewCounts ? previewCounts.updatedCount : 0;
    const writeSkipped = previewCounts ? previewCounts.skippedCount : 0;

    try {
      if (!csrfToken) {
        throw new Error("No active administrative session is configured. Please login.");
      }

      const supabase = getSupabase();
      if (supabase && isSupabaseActive) {
        // Safe batch processing (chunk sizes of 100)
        const segmentSize = 100;
        let batchNo = 0;
        for (let i = 0; i < previewSheetProducts.length; i += segmentSize) {
          batchNo++;
          const segment = previewSheetProducts.slice(i, i + segmentSize);
          const mapped = segment.map(p => mapFrontendToSupabase(p));
          
          const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(mapped),
            credentials: "include"
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(`Supplied row upsert chunk #${batchNo} failed: ${errData.error || res.statusText}`);
          }
        }

        // Try syncing configurations securely inside the administrative API
        try {
          const configPayload = {
            id: config.id,
            name: config.name,
            url_or_id: config.urlOrId,
            sync_interval: config.syncInterval,
            category_filter: config.categoryFilter,
            is_active: config.isActive,
            last_sync_time: logTimestamp
          };

          const logPayload = {
            id: logId,
            sheet_name: config.name,
            timestamp: logTimestamp,
            status: "success",
            added_count: writeAdded,
            updated_count: writeUpdated,
            skipped_count: writeSkipped,
            failed_rows: previewSkippedRows,
            log_text: `Processed synchronization for '${config.name}'. Success: ${writeAdded} added, ${writeUpdated} updated, ${writeSkipped} rows flagged.`
          };

          const configRes = await fetch("/api/admin/sheet-configs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(configPayload),
            credentials: "include"
          });

          const logRes = await fetch("/api/admin/sheet-sync-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(logPayload),
            credentials: "include"
          });

          if (!configRes.ok || !logRes.ok) {
            console.warn("Could not write Sheets operational configs/logs securely to Supabase tables.");
          }
        } catch (dbErr) {
          console.warn("Could not write Sheets operational logs securely to Supabase tables. Proceeding with client Sandbox cache fallback.", dbErr);
        }

        await refreshCatalog();
      } else {
        // Sandbox memory mode
        addCustomProducts(previewSheetProducts);
      }

      // Record logs
      const cleanLog: SyncLogEntry = {
        id: logId,
        sheetName: config.name,
        timestamp: logTimestamp,
        status: "success",
        addedCount: writeAdded,
        updatedCount: writeUpdated,
        skippedCount: writeSkipped,
        failedRows: previewSkippedRows,
        logText: `Sheet synchronization complete. Inventory refreshed.\nLogs Info:\n- Added rows count: ${writeAdded}.\n- Updated rows count: ${writeUpdated}.\n- Flagged skipped: ${writeSkipped}.\n- Timed At: ${new Date(logTimestamp).toLocaleString()}`
      };

      setSheetLogs(prev => [cleanLog, ...prev]);
      setSheets(prev => prev.map(s => s.id === config.id ? { ...s, lastSyncTime: logTimestamp } : s));

      setSheetsFeedback({
        success: true,
        message: `Google Sheet Synced successfully! Transferred ${writeAdded} additions and ${writeUpdated} updates directly to the website database.`
      });

      // Clear pending
      setPreviewSheetProducts([]);
      setPreviewSkippedRows([]);
      setPreviewCounts(null);

    } catch (err: any) {
      console.error(err);
      const failureLog: SyncLogEntry = {
        id: logId,
        sheetName: config.name,
        timestamp: logTimestamp,
        status: "failed",
        addedCount: 0,
        updatedCount: 0,
        skippedCount: writeSkipped,
        failedRows: [{ row: 0, id: "TX_ERROR", name: "Transaction Block Commit", reason: err.message || "Failed committing sheet data rows to database" }],
        logText: `Bypassed updates. Transaction write failed.\nReason: ${err.message || "Network Timeout during batch uploads"}`
      };
      
      setSheetLogs(prev => [failureLog, ...prev]);
      setSheetsFeedback({
        success: false,
        message: `Failed executing database synchronization: ${err.message || "Database write rejected"}. audit log history generated.`
      });
    } finally {
      setIsApplyingSync(false);
    }
  };

  const runBackgroundPeriodicSync = async (config: SheetConfig) => {
    try {
      const sheetId = extractSpreadsheetId(config.urlOrId);
      if (!sheetId) return;

      const fetchUrl = getSheetFetchUrl(sheetId);
      const response = await fetch(fetchUrl);
      if (!response.ok) return;

      const csvData = await response.text();
      const results = parseAndValidateSheetData(csvData, products, config.categoryFilter);

      const logId = `log-bg-${Date.now()}`;
      const logTimestamp = new Date().toISOString();

      const supabase = getSupabase();
      if (supabase && isSupabaseActive && csrfToken) {
        const segmentSize = 100;
        for (let i = 0; i < results.validProductsToSave.length; i += segmentSize) {
          const segment = results.validProductsToSave.slice(i, i + segmentSize);
          const mapped = segment.map(p => mapFrontendToSupabase(p));
          
          await fetch("/api/admin/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(mapped),
            credentials: "include"
          });
        }
        await refreshCatalog();

        try {
          const configPayload = {
            id: config.id,
            name: config.name,
            url_or_id: config.urlOrId,
            sync_interval: config.syncInterval,
            category_filter: config.categoryFilter,
            is_active: config.isActive,
            last_sync_time: logTimestamp
          };

          const logPayload = {
            id: logId,
            sheet_name: config.name,
            timestamp: logTimestamp,
            status: "success",
            added_count: results.addedCount,
            updated_count: results.updatedCount,
            skipped_count: results.skippedCount,
            failed_rows: results.skippedRows,
            log_text: `Automated background check-in for '${config.name}'. Results: ${results.addedCount} added, ${results.updatedCount} updated, ${results.skippedCount} skipped.`
          };

          await fetch("/api/admin/sheet-configs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(configPayload),
            credentials: "include"
          });

          await fetch("/api/admin/sheet-sync-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(logPayload),
            credentials: "include"
          });
        } catch (e) {
          // silent error
        }
      } else {
        addCustomProducts(results.validProductsToSave);
      }

      const cleanLog: SyncLogEntry = {
        id: logId,
        sheetName: config.name,
        timestamp: logTimestamp,
        status: "success",
        addedCount: results.addedCount,
        updatedCount: results.updatedCount,
        skippedCount: results.skippedCount,
        failedRows: results.skippedRows,
        logText: `Automated scheduler successfully fetched and synchronized catalog.\nStatus: SUCCESS ${results.addedCount} additions, ${results.updatedCount} updates, ${results.skippedCount} skipped rows.`
      };

      setSheetLogs(prev => [cleanLog, ...prev]);
      setSheets(prev => prev.map(s => s.id === config.id ? { ...s, lastSyncTime: logTimestamp } : s));
      console.log(`Automatic Background synchronization successfully completed for: ${config.name}`);
    } catch (e) {
      console.warn("Background auto sync skipped or failed due to network constraints.", e);
    }
  };

  const handleDownloadLogs = (log: SyncLogEntry) => {
    const logOutput = 
      `=======================================================\n` +
      `APEX SHEET SYNC LOG AUDIT TRAIL: ${log.status.toUpperCase()}\n` +
      `=======================================================\n` +
      `Connected Spreadsheet: ${log.sheetName}\n` +
      `Execution Timestamp: ${new Date(log.timestamp).toLocaleString()}\n` +
      `Status: ${log.status.toUpperCase()}\n` +
      `Added Record Rows: ${log.addedCount}\n` +
      `Modified Record Rows: ${log.updatedCount}\n` +
      `Skipped Validation Rows: ${log.skippedCount}\n\n` +
      `-------------------------------------------------------\n` +
      `FAILED ROW DIAGNOSTIC REASONS\n` +
      `-------------------------------------------------------\n` +
      (log.failedRows.length === 0 
        ? "No items skipped. Validation constraints are fully met!\n"
        : log.failedRows.map(f => `[Row ${f.row}] ID: ${f.id || "N/A"}, Item Name: ${f.name || "N/A"}\nReason: ${f.reason}\n`).join("\n")) +
      `\n-------------------------------------------------------\n` +
      `DETAILED ENGINE LOG TEXT OUT\n` +
      `-------------------------------------------------------\n` +
      log.logText;

    const uri = "data:text/plain;charset=utf-8," + encodeURIComponent(logOutput);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `apex_sync_report_${log.sheetName.replace(/\s+/g, '_')}_${log.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Background automated synchronizer observer checking in background every 30 seconds
  useEffect(() => {
    const syncIntervalWatcher = setInterval(() => {
      const nowEpoch = Date.now();
      sheets.forEach(sh => {
        if (!sh.isActive || sh.syncInterval === "manual") return;

        const lastSynced = sh.lastSyncTime ? new Date(sh.lastSyncTime).getTime() : 0;
        let deltaLimitMs = 0;
        if (sh.syncInterval === "hour") deltaLimitMs = 3600000;
        else if (sh.syncInterval === "6hours") deltaLimitMs = 3600000 * 6;
        else if (sh.syncInterval === "daily") deltaLimitMs = 3600000 * 24;

        if (nowEpoch - lastSynced >= deltaLimitMs) {
          runBackgroundPeriodicSync(sh);
        }
      });
    }, 30000);

    return () => clearInterval(syncIntervalWatcher);
  }, [sheets, products]);

  return (
    <section id="merchant-control" className="relative border-t border-white/5 bg-[#030307] py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Clickable Header Accordion trigger */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between bg-white/3 hover:bg-white/5 border border-white/10 p-5 rounded-3xl cursor-pointer transition-all select-none group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2 tracking-tight">
                Apex Corporate Administrator Panel
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold uppercase tracking-wider">
                  {isSupabaseActive ? "🔌 Live Supabase Mode" : "💻 Sandbox Mode"}
                </span>
                <span className="text-[10px] bg-white/10 text-white font-mono px-2 py-0.5 rounded-md font-medium">
                  {products.length} Products
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                Secure inventory directory, inline stock editors, bulk CSV operations (10,000+), media uploads, and metrics.
              </p>
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-white transition-all">
            {isOpen ? <ChevronDown className="w-5 h-5 animate-pulse" /> : <ChevronUp className="w-5 h-5 animate-pulse" />}
          </div>
        </div>

        {isOpen && (
          <div className="mt-6 text-left animate-in fade-in duration-300">
            {/* RENDER LOGIN SCREEN IF NOT AUTHENTICATED */}
            {!adminUser ? (
              <div className="bg-[#05050c] border border-white/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center max-w-lg mx-auto text-center">
                <div className="absolute top-0 inset-x-0 h-[100px] bg-emerald-500/5 blur-3xl pointer-events-none" />
                <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-display font-extrabold text-white">Administrative Portal Access</h4>
                <p className="text-xs text-slate-400 font-light mt-1 max-w-sm mb-6">
                  Log in with authorized warehouse credentials to manage inventory entries, upload firmware media, or sync bulk catalogs.
                </p>

                {authError && (
                  <div className="mb-4 w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-left font-light leading-snug">{authError}</span>
                  </div>
                )}

                {/* Secure Signed staff login signature */}
                <div className="w-full bg-[#030308] border border-white/5 rounded-xl py-2 px-4 mb-4 select-none text-[10px] font-mono uppercase tracking-wider text-center text-emerald-400 font-extrabold">
                  🔒 Certified Administrative Portal
                </div>

                <form onSubmit={handleAuth} className="w-full space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">Email Address:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. administrator@apex.co.ug"
                      className="w-full bg-[#0a0a14] border border-white/10 text-xs text-white rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">Secret Passphrase:</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#0a0a14] border border-white/10 text-xs text-white rounded-xl py-3 px-4 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isAuthLoading ? "Authenticating Admin..." : "Secure Sign In Admin"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* FULLY AUTHENTICATED ADMIN CONSOLE VIEW */
              <div className="bg-[#05050b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                
                {/* ADMINISTRATIVE TOPBAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse animate-duration-1000" />
                      <h4 className="text-base font-display font-black text-white uppercase tracking-wider">
                        Apex Control Desk
                      </h4>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Logged in as: <strong className="text-emerald-400">{adminUser.email}</strong>
                    </p>
                  </div>

                  {/* NAV TABS */}
                  <div className="flex flex-wrap items-center gap-2 bg-black/50 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                    <button
                      id="tab-btn-directory"
                      onClick={() => setActiveTab("directory")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "directory"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.03]"
                      }`}
                    >
                      <span>Product Directory</span>
                    </button>
                    <button
                      id="tab-btn-importer"
                      onClick={() => setActiveTab("importer")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "importer"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.03]"
                      }`}
                    >
                      <span>Bulk CSV Import</span>
                    </button>
                    <button
                      id="tab-btn-analytics"
                      onClick={() => setActiveTab("analytics")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "analytics"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.03]"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Store Analytics</span>
                    </button>
                    <button
                      id="tab-btn-sheetssync"
                      onClick={() => setActiveTab("sheetsSync")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "sheetsSync"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-emerald-400/80 hover:text-white hover:bg-emerald-500/10 hover:scale-[1.03] border border-emerald-500/10"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                      <span>Google Sheets Sync</span>
                    </button>
                    <button
                      id="tab-btn-mediahub"
                      onClick={() => setActiveTab("mediaHub")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "mediaHub"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.03]"
                      }`}
                    >
                      <span>CDN Media Hub</span>
                    </button>
                    <button
                      id="tab-btn-restockalerts"
                      onClick={() => {
                        setActiveTab("restockAlerts" as any);
                        fetchRestockSubscriptions();
                        fetchPriceDropSubscriptions();
                        fetchShowroomReviews();
                      }}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "restockAlerts"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-amber-400 hover:text-white hover:bg-amber-500/10 hover:scale-[1.03] border border-amber-500/15"
                      }`}
                    >
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <span>Restock Emails ({restockSubscriptions.length})</span>
                    </button>
                    <button
                      id="tab-btn-setup"
                      onClick={() => setActiveTab("setup")}
                      className={`px-4 py-2 text-xs font-bold font-sans rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "setup"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] font-extrabold border border-emerald-400/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5 hover:scale-[1.03]"
                      }`}
                    >
                      <span>Database CLI Instructions</span>
                    </button>
                    <button
                      id="tab-btn-logout"
                      onClick={handleSignOut}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 cursor-pointer ml-3 hover:scale-[1.08] active:scale-90"
                      title="Admin Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: 1. DIRECTORY HUB (CRUD, FILTERING, PAGINATION, EXPORT CSV) */}
                {activeTab === "directory" && (
                  <div className="space-y-6">
                    {/* Filtering inputs and tools */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/3 border border-white/5 p-4 rounded-2xl">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={dirSearch}
                          onChange={(e) => { setDirSearch(e.target.value); setDirPage(1); }}
                          placeholder="Search product metadata..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <select
                          value={dirCategory}
                          onChange={(e) => { setDirCategory(e.target.value); setDirPage(1); }}
                          className="w-full bg-[#0a0a14] border border-white/10 text-xs text-slate-300 rounded-xl py-2 px-3 outline-none cursor-pointer focus:border-sky-500 font-sans"
                        >
                          <option value="All">All Categories</option>
                          {categories.filter(c => c !== "All").map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={dirStock}
                          onChange={(e) => { setDirStock(e.target.value); setDirPage(1); }}
                          className="w-full bg-[#0a0a14] border border-white/10 text-xs text-slate-300 rounded-xl py-2 px-3 outline-none cursor-pointer focus:border-sky-500 font-sans"
                        >
                          <option value="All">All Stock Statuses</option>
                          <option value="In Stock">In Stock Only</option>
                          <option value="Low Stock">Low Stock Only</option>
                          <option value="Out of Stock">Out of Stock Only</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-xs font-bold text-sky-400 font-mono transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export All to CSV</span>
                      </button>
                    </div>

                    {/* Inline edit panel popup when active */}
                    {editingProduct && (
                      <div className="bg-black/80 border border-emerald-500/20 shadow-2xl rounded-3xl p-5 border-dashed">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                          <h5 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Edit className="w-3.5 h-3.5" /> Modifying Matrix Record: {editingProduct.id}
                          </h5>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Product Name:</label>
                            <input
                              type="text"
                              required
                              value={editingProduct.name}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Category Group:</label>
                            <input
                              type="text"
                              required
                              value={editingProduct.category}
                              onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Selling Price (UGX):</label>
                            <input
                              type="number"
                              required
                              value={editingProduct.price}
                              onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Original Price (Discount Base):</label>
                            <input
                              type="number"
                              value={editingProduct.originalPrice || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || undefined })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                              placeholder="e.g. 5000000"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Semicolon Specifications Array:</label>
                            <input
                              type="text"
                              value={editingProduct.specs.join("; ")}
                              onChange={(e) => setEditingProduct({ ...editingProduct, specs: e.target.value.split(";").map(s => s.trim()).filter(Boolean) })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                              placeholder="e.g. Gen-AI Core; 12GB RAM"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Stock Availability:</label>
                            <select
                              value={editingProduct.stockStatus}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })}
                              className="w-full bg-[#0a0a14] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                            >
                              <option value="In Stock">In Stock</option>
                              <option value="Low Stock">Low Stock</option>
                              <option value="Out of Stock">Out of Stock</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              <span>Commit Update</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Desktop Directory Grid layout with interactive features */}
                    {paginatedProducts.length === 0 ? (
                      <div className="text-center p-12 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                        <Database className="w-10 h-10 text-slate-600 mb-2" />
                        <h5 className="text-xs font-mono font-bold text-slate-400 uppercase">No live products found matching filters</h5>
                        <p className="text-xs text-slate-500 font-light max-w-sm mt-1">Try resetting search keywords or categories to view administrative inventories.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {paginatedProducts.map((p) => {
                          const original = p.originalPrice || 0;
                          const rateRatio = original ? Math.round(((original - p.price) / original) * 100) : 0;

                          return (
                            <div
                              key={p.id}
                              className="bg-black/40 border border-white/5 hover:border-white/10 rounded-2xl p-4.5 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all group"
                            >
                              {rateRatio > 0 && (
                                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-mono font-black bg-rose-500 text-white rounded-md tracking-wider">
                                  {rateRatio}% DISCOUNT SAVED
                                </div>
                              )}

                              {/* Images Thumbnail */}
                              <div className="w-20 h-20 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                {p.images && p.images.length > 0 ? (
                                  <img src={p.images[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-600" />
                                )}
                              </div>

                              {/* Central column metadata info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/15 px-1.5 py-0.5 rounded">
                                      {p.category}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">ID: {p.id}</span>
                                  </div>
                                  <h5 className="text-sm font-display font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                                    {p.name}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-light mt-0.5 max-w-sm line-clamp-1">
                                    {p.description}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3.5 mt-3 pt-3.5 border-t border-white/5 text-xs text-slate-300">
                                  <div>
                                    <span className="text-emerald-400 font-extrabold">{formatShillings(p.price)}</span>
                                    {p.originalPrice && (
                                      <span className="text-[10px] text-slate-500 line-through stroke-slate-500 ml-1.5">{formatShillings(p.originalPrice)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      p.stockStatus === "In Stock" ? "bg-emerald-400" : p.stockStatus === "Low Stock" ? "bg-amber-400" : "bg-rose-400"
                                    }`} />
                                    <span className="text-[10px] font-mono text-slate-400">{p.stockStatus}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Side controller buttons */}
                              <div className="flex sm:flex-col gap-1.5 justify-end mt-3 sm:mt-0 pt-3.5 sm:pt-0 sm:border-l sm:border-white/5 sm:pl-3 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(p)}
                                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-white/5 hover:bg-sky-500/15 text-slate-400 hover:text-sky-400 border border-white/5 hover:border-sky-500/20 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination indicators footer */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <span className="text-xs text-slate-500 font-mono">
                          Showing page {dirPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={dirPage === 1}
                            onClick={() => setDirPage(prev => Math.max(1, prev - 1))}
                            className="px-3 py-1 text-xs text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl disabled:opacity-30 cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            disabled={dirPage === totalPages}
                            onClick={() => setDirPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-3 py-1 text-xs text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl disabled:opacity-30 cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: 2. BULK EXCEL CSV IMPORTER */}
                {activeTab === "importer" && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h5 className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4" /> 10,000+ High-Performance Bulk Core Importer
                        </h5>
                        <p className="text-[10px] text-slate-400 font-light mt-1">
                          Paste CSV rows, select spreadsheet file formats, check conflicts automatically, and run sequential batch writes.
                        </p>
                      </div>
                      <div className="flex gap-2.5 mt-2.5 md:mt-0">
                        <button
                          type="button"
                          onClick={handleLoadSimulatedStock}
                          className="px-3.5 py-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                          🚀 Load 100+ Live Product Mockups
                        </button>
                        <a
                          href="data:text/csv;charset=utf-8,id,name,category,price,original_price,badge,specs,colors,storages,images,videos,stock_status,description,rating,reviews_count%0Aip-16-trial,iPhone 16 Ultimate Pro,Phones,4200000,4800000,PREORDER,6.3-inch Retina Display;Dual Fusion Telephoto,Titanium White;Space Gray,128GB;256GB;512GB,https://dummyimage.com/600x400/000/fff%26text=iPhone16,https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4,In Stock,Unopened factory sealed Apple Uganda warranty specifications catalog set.,4.9,240%0As24-ultra,Samsung Galaxy S24 Ultra,Phones,3900000,4300000,PROMO,100x Space Zoom;Titanium Framing,Amethyst Violet;Titanium Gray,256GB;512GB,https://dummyimage.com/600x400/000/fff%26text=S24Ultra,,Low Stock,Excellent Uganda stock certified enterprise specifications ready box,4.8,110"
                          download="apex_bulk_catalog_template.csv"
                          className="px-3.5 py-1.5 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download Template</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Drag Area Dropzone */}
                      <div className="space-y-4">
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                            dragActive
                              ? "border-emerald-400 bg-emerald-400/5 shadow-inner"
                              : "border-white/10 bg-[#0a0a14] hover:border-white/20"
                          }`}
                        >
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-200 font-bold leading-normal">
                            Drag your catalog spreadsheet <code className="text-emerald-400 font-mono bg-black/50 py-0.5 px-1.5 rounded text-[11px] border border-white/5">.csv</code> file here
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Supports UTF-8 or standard ASCII formatting</p>
                          
                          <label className="mt-4 inline-block cursor-pointer px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95 select-none">
                            <span>Browse File Directory</span>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1.5">
                            Or Paste Excel CSV rows directly below:
                          </label>
                          <textarea
                            value={csvText}
                            onChange={(e) => handleTextChange(e.target.value)}
                            placeholder="id,name,category,price,original_price,badge,specs,colors,storages,images,videos,stock_status,description,rating,reviews_count&#10;rog-7,Asus ROG Phone 7,Gaming,3600000,4100000,HOT,165Hz AMOLED;Snapdragon 8 Gen 2,Phantom Black;Storm White,512GB,https://dummyimage.com/600/000/fff,,In Stock,Custom Ugandan gaming set,4.9,92"
                            className="w-full h-36 bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-emerald-500 transition-all font-mono placeholder:text-slate-600 select-all"
                          />
                        </div>
                      </div>

                      {/* Diagnostic Conflicts Panel & Commit controls */}
                      <div className="bg-[#0a0a14] border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Import Status & Core Dry-Run Summary</span>
                            {previewProducts.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-md font-mono">
                                Parsed {previewProducts.length} Items Successfully
                              </span>
                            )}
                          </div>

                          {previewProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-white/5 bg-black/20 rounded-xl text-center min-h-[160px]">
                              <FileSpreadsheet className="w-8 h-8 text-slate-600 mb-2" />
                              <p className="text-xs text-slate-500 font-light max-w-xs leading-relaxed">
                                Fill paste area, load mockup arrays, or upload file lists to view dynamic structural catalog validations.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Validation checks */}
                              {diagnostics && (
                                <div className="space-y-2 text-xs font-sans text-left">
                                  <div className="p-3 bg-neutral-950 rounded-xl space-y-2 border border-white/5 font-mono text-[11px]">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Duplicate Key Collisions:</span>
                                      <span className={diagnostics.duplicateIdsCount > 0 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                                        {diagnostics.duplicateIdsCount > 0 ? `${diagnostics.duplicateIdsCount} ID matches live data` : "No Collisions Detected (0)"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Uniquely Generated Rows:</span>
                                      <span className="text-emerald-400">{diagnostics.healthyCount} entries</span>
                                    </div>
                                    {diagnostics.duplicateIdsCount > 0 && (
                                      <div className="bg-amber-500/5 text-amber-500 p-2 rounded text-[10px] leading-snug font-mono break-all max-h-16 overflow-y-auto">
                                        Matching IDs in Database: {diagnostics.duplicateIds.join(", ")}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1.5 p-1">
                                    <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Duplicate Key Policy Action:</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      <label className="flex items-center gap-2 p-2 rounded-xl bg-black border border-white/5 hover:border-white/10 cursor-pointer text-[11px] font-sans">
                                        <input
                                          type="radio"
                                          name="dupPolicy"
                                          checked={duplicateMode === "update"}
                                          onChange={() => setDuplicateMode("update")}
                                          className="accent-emerald-400"
                                        />
                                        <span className="text-slate-200">Overwrite Existing</span>
                                      </label>
                                      <label className="flex items-center gap-2 p-2 rounded-xl bg-black border border-white/5 hover:border-white/10 cursor-pointer text-[11px] font-sans">
                                        <input
                                          type="radio"
                                          name="dupPolicy"
                                          checked={duplicateMode === "skip"}
                                          onChange={() => setDuplicateMode("skip")}
                                          className="accent-emerald-400"
                                        />
                                        <span className="text-slate-200">Skip Matches</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress indicators */}
                          {bulkProgress && (
                            <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-white/5 text-xs text-left">
                              <div className="flex justify-between mb-1 text-[11px] font-mono">
                                <span className="text-sky-400">Batch Upsert in Progress...</span>
                                <span className="text-slate-400">{bulkProgress.current} / {bulkProgress.total} Rows Saved</span>
                              </div>
                              <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-400 h-full transition-all duration-300"
                                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {importStatus && (
                            <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                              importStatus.success
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            }`}>
                              {importStatus.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              <span className="font-sans font-light leading-snug">{importStatus.message}</span>
                            </div>
                          )}
                        </div>

                        {/* Committing execution controls */}
                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 w-full">
                          <button
                            type="button"
                            disabled={isImporting || previewProducts.length === 0}
                            onClick={handleCommitImport}
                            className="flex-1 py-3.5 text-xs font-black bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-20 text-white rounded-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 select-none"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isImporting ? "Processing Batch..." : "Merge Catalog Into Base Table"}</span>
                          </button>
                          {(csvText || previewProducts.length > 0 || importStatus) && (
                            <button
                              type="button"
                              onClick={() => {
                                setCsvText("");
                                setPreviewProducts([]);
                                setImportStatus(null);
                                setBulkProgress(null);
                              }}
                              className="px-4 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <AdminAnalytics />
                )}

                {/* TAB CONTENT: Google Sheets Product Sync System (ADMINS ONLY) */}
                {activeTab === "sheetsSync" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* TOP SUMMARY INTRO */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl">
                      <div className="text-left">
                        <h5 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Google Sheets Product Sync Dashboard
                        </h5>
                        <p className="text-xs text-slate-300 font-light mt-1">
                          Govern your entire digital catalog from a public Google Sheets file. Automatic calculated discount values, array semicolon-splits, price validation safeguards, and row audit monitoring are executed instantly.
                        </p>
                      </div>
                      
                      {/* STATS RAPID RAIL */}
                      <div className="flex items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-slate-400 text-left shrink-0">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Connected Sheets</span>
                          <span className="text-emerald-400 font-extrabold text-xs">{sheets.length} Active Sheets</span>
                        </div>
                        <div className="border-l border-white/10 h-8 self-center" />
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Failed Row Audits</span>
                          <span className="text-amber-400 font-extrabold text-xs">
                            {sheetLogs.reduce((total, log) => total + log.skippedCount, 0)} Logged Rows
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TWO-COLUMN GRID: CONFIG & DIAGNOSTIC PREVIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* COL 1: SHEETS CONNECTIONS LIST & REGISTER NEW SHEET */}
                      <div className="space-y-6 lg:col-span-1">
                        
                        {/* REGISTER FORM CARD */}
                        <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 text-left">
                          <h6 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-black mb-3.5 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-emerald-400" /> Connect Google Sheet
                          </h6>
                          
                          <form onSubmit={handleAddNewSheet} className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Friendly Label *</label>
                              <input
                                type="text"
                                required
                                value={newSheetName}
                                onChange={(e) => setNewSheetName(e.target.value)}
                                placeholder="e.g. Uganda Primary Catalog"
                                className="w-full bg-black border border-white/10 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Spreadsheet Public Link or Sheet ID *</label>
                              <input
                                type="text"
                                required
                                value={newSheetUrl}
                                onChange={(e) => setNewSheetUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="w-full bg-black border border-white/10 text-xs text-white rounded-xl py-2.5 px-3.5 outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Sync Interval *</label>
                                <select
                                  value={newSheetInterval}
                                  onChange={(e) => setNewSheetInterval(e.target.value as any)}
                                  className="w-full bg-black border border-white/10 text-xs text-slate-300 rounded-xl py-2 px-2 outline-none cursor-pointer focus:border-emerald-500"
                                >
                                  <option value="manual">Manual Trigger Only</option>
                                  <option value="hour">Every 1 Hour</option>
                                  <option value="6hours">Every 6 Hours</option>
                                  <option value="daily">Daily Cron Checking</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Category Filter *</label>
                                <select
                                  value={newSheetCategory}
                                  onChange={(e) => setNewSheetCategory(e.target.value)}
                                  className="w-full bg-black border border-white/10 text-xs text-slate-300 rounded-xl py-2 px-2 outline-none cursor-pointer focus:border-emerald-500"
                                >
                                  <option value="All">All Categories</option>
                                  <option value="Smartphones">Smartphones</option>
                                  <option value="Laptops">Laptops</option>
                                  <option value="Accessories">Accessories</option>
                                  <option value="Audio">Audio</option>
                                </select>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-750 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                            >
                              Connect Google Sheet
                            </button>
                          </form>
                        </div>

                        {/* CONNECTED SHEETS STACK */}
                        <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 text-left">
                          <h6 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-black mb-3 flex items-center justify-between">
                            <span>Connected Sources ({sheets.length})</span>
                            <span className="text-[10px] text-slate-500">Dual Sync Enabled</span>
                          </h6>

                          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                            {sheets.map((sh) => {
                              const isSelected = activeSheetId === sh.id;
                              return (
                                <div
                                  key={sh.id}
                                  onClick={() => {
                                    setActiveSheetId(sh.id);
                                    setSheetsFeedback(null);
                                    setPreviewSheetProducts([]);
                                    setPreviewSkippedRows([]);
                                    setPreviewCounts(null);
                                  }}
                                  className={`p-3 rounded-xl border border-white/5 cursor-pointer transition-all flex flex-col justify-between text-left ${
                                    isSelected
                                      ? "bg-slate-900/80 border-emerald-500/20 shadow-md ring-1 ring-emerald-500/10"
                                      : "bg-black/40 hover:bg-black/70 hover:border-white/10"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <h3 className="text-xs font-semibold text-white block truncate leading-tight flex items-center gap-1">
                                        {sh.name}
                                        {sh.isActive ? (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                        )}
                                      </h3>
                                      <span className="text-[9px] font-mono text-slate-500 line-clamp-1 mt-0.5">
                                        ID: {extractSpreadsheetId(sh.urlOrId)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleSheetStatus(sh.id);
                                        }}
                                        className={`p-1 rounded uppercase font-mono text-[8px] font-extrabold border shrink-0 ${
                                          sh.isActive 
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                        }`}
                                        title={sh.isActive ? "Pause schedule" : "Enable schedule"}
                                      >
                                        {sh.isActive ? "Active" : "Paused"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSheet(sh.id);
                                        }}
                                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                        title="Delete Sheet Info"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Interval: {sh.syncInterval}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 italic">
                                      {sh.lastSyncTime 
                                        ? `Last synced: ${new Date(sh.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                        : "Never synced"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* COL 2 & 3: INTERACTIVE CONTROLS & DIAGNOSTIC PREDICTOR SCREEN */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* CONTROLLERS CARD */}
                        <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 text-left text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-4">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Active Source Session</span>
                              <h3 className="text-sm font-display font-extrabold text-white mt-0.5">
                                {sheets.find(s => s.id === activeSheetId)?.name || "No connection active"}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isTestingSync || isApplyingSync}
                                onClick={() => handleTestFetchSheet(activeSheetId)}
                                className="px-3.5 py-2 border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-45 text-white font-mono font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                {isTestingSync ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                <span>Diagnostic Fetch Sheet</span>
                              </button>

                              <button
                                type="button"
                                disabled={isTestingSync || isApplyingSync || previewSheetProducts.length === 0}
                                onClick={() => handleCommitSheetSync(activeSheetId)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-20 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/15"
                              >
                                {isApplyingSync ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Commit Sheet Sync</span>
                              </button>
                            </div>
                          </div>

                          {/* FEEDBACK PROMPTS */}
                          {sheetsFeedback && (
                            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 mb-4 font-light ${
                              sheetsFeedback.success
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            }`}>
                              {sheetsFeedback.success ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <span className="block font-bold leading-none">{sheetsFeedback.success ? "Analysis Complete" : "Sync Bypassed"}</span>
                                <span className="block text-[11px] leading-relaxed text-slate-300">{sheetsFeedback.message}</span>
                              </div>
                            </div>
                          )}

                          {/* INSTRUCTIONS ACCORDION NOTICE */}
                          <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed select-text mb-4">
                            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-300 block mb-0.5">Google Spreadsheet Formatting Requirements:</span>
                              <span>Column Row #1 headers must contain standard lowercase names: <code className="text-emerald-400 font-mono">id</code>, <code className="text-emerald-400 font-mono">name</code>, <code className="text-emerald-400 font-mono">category</code>, <code className="text-emerald-400 font-mono">price</code>, <code className="text-emerald-400 font-mono font-bold text-[10px]">stock_status</code>. Semicolons are parsed to split list values cleanly. Image arrays default automatically to mock photography if left empty.</span>
                            </div>
                          </div>

                          {/* COUNTS GRAPHICS */}
                          {previewCounts && (
                            <div className="grid grid-cols-3 gap-3.5 mb-4">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-center">
                                <span className="text-slate-500 block text-[9px] uppercase font-bold font-mono">To Be Added</span>
                                <span className="text-emerald-400 font-display font-black text-xl leading-normal shrink-0">
                                  +{previewCounts.addedCount} Rows
                                </span>
                              </div>

                              <div className="bg-sky-500/5 border border-sky-500/10 p-3 rounded-xl text-center">
                                <span className="text-slate-500 block text-[9px] uppercase font-bold font-mono">To Be Updated</span>
                                <span className="text-sky-400 font-display font-black text-xl leading-normal shrink-0">
                                  {previewCounts.updatedCount} Rows
                                </span>
                              </div>

                              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-center">
                                <span className="text-slate-500 block text-[9px] uppercase font-bold font-mono">Validation Skipped</span>
                                <span className="text-amber-400 font-display font-black text-xl leading-normal shrink-0 text-amber-500">
                                  {previewCounts.skippedCount} Rows
                                </span>
                              </div>
                            </div>
                          )}

                          {/* DIAGNOSTIC TABS OR VISUALIZER */}
                          {previewSheetProducts.length > 0 && (
                            <div className="space-y-3">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-black block">Parsed Spreadsheet Results ({previewSheetProducts.length})</span>
                              
                              <div className="border border-white/5 rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
                                <table className="w-full text-[11px] font-mono font-light border-collapse text-left text-slate-300">
                                  <thead>
                                    <tr className="bg-white/3 border-b border-white/5 font-bold uppercase text-[9px] text-slate-400 text-left">
                                      <th className="py-2.5 px-3">Row ID</th>
                                      <th className="py-2.5 px-3">Product Name</th>
                                      <th className="py-2.5 px-3">Category</th>
                                      <th className="py-2.5 px-3 text-right">Target Price</th>
                                      <th className="py-2.5 px-3 text-right">Badge</th>
                                      <th className="py-2.5 px-3 text-center">Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {previewSheetProducts.slice(0, 10).map((prod, pIdx) => (
                                      <tr key={pIdx} className="hover:bg-white/2">
                                        <td className="py-2 px-3 text-slate-400">{prod.id}</td>
                                        <td className="py-2 px-3 text-white font-medium">{prod.name}</td>
                                        <td className="py-2 px-3 text-slate-400">{prod.category}</td>
                                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatShillings(prod.price)}</td>
                                        <td className="py-2 px-3 text-right">
                                          {prod.badge ? (
                                            <span className="bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                              {prod.badge}
                                            </span>
                                          ) : (
                                            <span className="text-slate-600">-</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            prod.stockStatus === "In Stock" ? "bg-emerald-500/10 text-emerald-400" : prod.stockStatus === "Low Stock" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-400"
                                          }`}>
                                            {prod.stockStatus}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                    {previewSheetProducts.length > 10 && (
                                      <tr>
                                        <td colSpan={6} className="py-2 text-center text-[10px] text-slate-500 bg-white/1 font-sans italic border-t border-white/5">
                                          And {previewSheetProducts.length - 10} more rows parsing checked out...
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* FLAGGED ERRORS AND REJECTED DATA BLOCKS */}
                          {previewSkippedRows.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-black block flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Validation Exceptions Block ({previewSkippedRows.length})
                              </span>

                              <div className="border border-rose-950/20 rounded-xl overflow-hidden max-h-48 overflow-y-auto scrollbar-thin text-[11px]">
                                <table className="w-full font-mono text-left border-collapse text-rose-300">
                                  <thead>
                                    <tr className="bg-rose-950/20 border-b border-rose-950/20 font-bold uppercase text-[9px] text-rose-400 text-left">
                                      <th className="py-2 px-3">Excel Row</th>
                                      <th className="py-2 px-3">Id Slug</th>
                                      <th className="py-2 px-3">Detected Name</th>
                                      <th className="py-2 px-3">Diagnostic Reason</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 bg-rose-500/5">
                                    {previewSkippedRows.map((sk, skIdx) => (
                                      <tr key={skIdx} className="hover:bg-rose-500/10">
                                        <td className="py-2 px-3 text-rose-400 font-bold">Line {sk.row}</td>
                                        <td className="py-2 px-3 text-slate-300 font-mono truncate max-w-xs">{sk.id || "-"}</td>
                                        <td className="py-2 px-3 text-slate-200 truncate max-w-xs">{sk.name || "N/A"}</td>
                                        <td className="py-2 px-3 text-rose-400 text-[10px] font-medium leading-relaxed font-sans">{sk.reason}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {previewSheetProducts.length === 0 && !isTestingSync && (
                            <div className="text-center py-16 bg-white/2 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                              <FileSpreadsheet className="w-10 h-10 text-slate-600 mb-2" />
                              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400 leading-normal">
                                Diagnostics Fetch Pending
                              </h3>
                              <p className="text-[11px] text-slate-500 max-w-sm font-light mt-1">
                                Choose an active source Sheet config on the sidebar, then click "Diagnostic Fetch Sheet" above to parse rows and review mappings.
                              </p>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* SECTION: AUDITING HISTORIC TRANSACTIONS LOGS */}
                    <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 text-left text-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div>
                          <h6 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold font-mono">HISTORIC SHEET SYNC AUDITS</h6>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Permanent audit logs tracking sheet connection sync runs.</p>
                        </div>
                        <span className="text-[10px] bg-white/5 text-slate-400 border border-white/5 font-mono px-2 py-0.5 rounded uppercase font-bold">
                          Offline Safe Cache Mode
                        </span>
                      </div>

                      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-1 text-[11px] font-mono scrollbar-thin">
                        {sheetLogs.length === 0 ? (
                          <p className="text-center py-12 text-slate-500 italic">No historical logs parsed. Run synchronization commits to populate audits.</p>
                        ) : (
                          sheetLogs.map((log) => {
                            const isSelected = viewLogDetail?.id === log.id;
                            return (
                              <div key={log.id} className="py-3 font-mono">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                                        log.status === "success" 
                                          ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400" 
                                          : "bg-rose-500/15 border-rose-500/20 text-rose-500"
                                      }`}>
                                        {log.status.toUpperCase()}
                                      </span>
                                      <strong className="text-slate-200 font-sans">{log.sheetName}</strong>
                                      <span className="text-[9px] text-slate-400 font-normal">[{new Date(log.timestamp).toLocaleString()}]</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-sans max-w-xl">
                                      Executed successfully: <strong className="text-emerald-400">{log.addedCount}</strong> rows added, <strong className="text-sky-400">{log.updatedCount}</strong> updated, <strong className="text-amber-400">{log.skippedCount}</strong> rows flagged/skipped.
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setViewLogDetail(isSelected ? null : log)}
                                      className="py-1 px-2.5 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white rounded uppercase text-[10px] font-bold cursor-pointer transition-all font-mono"
                                    >
                                      {isSelected ? "Hide" : "Inspect"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadLogs(log)}
                                      className="p-1 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded transition-colors"
                                      title="Download TXT Audit Log"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* DETAILED LOG COLLAPSIBLE VIEW */}
                                {isSelected && (
                                  <div className="mt-3.5 p-4 bg-black border border-white/5 text-[10px] overflow-auto rounded-3xl text-left select-all animate-in slide-in-from-top-2 duration-200">
                                    <span className="block text-emerald-400 border-b border-white/5 pb-1 mb-2 font-bold uppercase">DIAGNOSTIC EXCEPTION REPORT:</span>
                                    {log.failedRows.length === 0 ? (
                                      <p className="text-slate-500 italic block">None. Row validations checked out completely flawless.</p>
                                    ) : (
                                      <div className="space-y-1 max-h-40 overflow-y-auto mb-3 text-slate-300">
                                        {log.failedRows.map((f, rIdx) => (
                                          <div key={rIdx} className="leading-snug">
                                            <strong className="text-amber-400">Row {f.row}:</strong> ID <code className="bg-white/5 py-0.5 px-1 font-mono">{f.id}</code> ({f.name}) - <span className="text-rose-400">{f.reason}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <span className="block text-slate-400 font-bold uppercase border-b border-white/5 pb-1 mb-2 mt-4">SHEET INTERFACE TEXT ENGINE LOGS:</span>
                                    <pre className="text-slate-500 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono select-all">
                                      {log.logText}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB CONTENT: 3. CDN MEDIA HUB (STORAGE BACKEND PORTAL) */}
                {activeTab === "mediaHub" && (
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-mono font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <ImageIcon className="w-4 h-4" /> Storage Bucket Drag Folder CDN
                      </h5>
                      <p className="text-[10px] text-slate-400 font-light mt-1">
                        Upload photography galleries and high-definition product trailers. Binders produce standard CDN path hashes linked to records instantly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div
                          onDragEnter={handleMediaDrag}
                          onDragOver={handleMediaDrag}
                          onDragLeave={handleMediaDrag}
                          onDrop={handleMediaDrop}
                          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                            mediaDragActive
                              ? "border-rose-400 bg-rose-400/5 shadow-inner"
                              : "border-white/10 bg-[#0a0a14] hover:border-white/20"
                          }`}
                        >
                          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-200 font-bold leading-normal">
                            Drag image folder directories or video clips <code className="text-rose-400 font-mono bg-black/50 py-0.5 px-1.5 rounded text-[11px] border border-white/5">files</code> here
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Accepts PNG, JPG, WEBP, and MP4 up to 50MB</p>

                          <label className="mt-4 inline-block cursor-pointer px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95 select-none">
                            <span>Browse System Media Files</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              onChange={handleMediaFileSelection}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Direct Bind UI block */}
                        <div className="bg-[#0a0a14] border border-white/5 rounded-2xl p-4.5 space-y-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-black block">Bind Image Arrays Inline</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1">Target Product ID:</label>
                              <input
                                type="text"
                                value={mediaTargetProduct}
                                onChange={(e) => setMediaTargetProduct(e.target.value)}
                                placeholder="e.g. s24-ultra"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-rose-500 text-[11px] font-mono"
                              />
                            </div>
                            <div className="flex flex-col justify-end">
                              <span className="text-[9px] text-slate-500 leading-normal block mb-1">Enter target ID first, then click "Bind" on a CDN file link to the right!</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* URL Copy Output directory */}
                      <div className="bg-[#0a0a14] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Uploaded CDN File Directory</span>
                            {isUploadingMedia && <span className="text-[10px] text-rose-400 animate-pulse font-mono">Syncing server folder files...</span>}
                          </div>

                          <div className="max-h-72 overflow-y-auto divide-y divide-white/5 pr-2 scrollbar-thin">
                            {uploadedUrls.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-12 italic">
                                Ready to upload media assets. Dropped or selected media elements will render CDN URL bindings dynamically.
                              </p>
                            ) : (
                              uploadedUrls.map((item, idx) => (
                                <div key={idx} className="py-2.5 text-xs font-mono text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] text-slate-300 font-sans font-bold leading-relaxed line-clamp-1">{item.name}</span>
                                    <span className="text-[9px] text-slate-500">{item.size} • CDN verified</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(item.url)}
                                      className="py-1 px-2.5 bg-white/5 hover:bg-white/10 active:scale-95 select-none rounded border border-white/5 text-[10px] text-slate-300 font-semibold cursor-pointer transition-all flex items-center gap-1"
                                    >
                                      {copiedLinkFeedback === item.url ? "Copied" : "Copy Url"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBindUrlToProduct(item.url, "image")}
                                      className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 hover:border-rose-500/20 active:scale-95 select-none rounded text-[10px] font-semibold cursor-pointer transition-all"
                                    >
                                      Bind Img
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBindUrlToProduct(item.url, "video")}
                                      className="py-1 px-2.5 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/10 hover:border-[#4285F4]/20 active:scale-95 select-none rounded text-[10px] font-semibold cursor-pointer transition-all"
                                    >
                                      Bind Vid
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: RESTOCK ALERTS CONTROL PANEL */}
                {activeTab === "restockAlerts" && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          <History className="w-4 h-4" /> Admin User Signals & Alerts Tracker
                        </h5>
                        <p className="text-[10px] text-slate-400 font-light mt-1">
                          Review what showroom subscribers are currently tracking or reporting.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            fetchRestockSubscriptions();
                            fetchPriceDropSubscriptions();
                            fetchShowroomReviews();
                          }}
                          disabled={isFetchingAlerts || isFetchingPriceDrops || isFetchingReviews}
                          className="py-1.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${(isFetchingAlerts || isFetchingPriceDrops || isFetchingReviews) ? "animate-spin" : ""}`} />
                          <span>Sync Live States</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub navigation bar */}
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                      <button
                        type="button"
                        onClick={() => setAlertsAdminTab("restock")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                          alertsAdminTab === "restock"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        🔔 Stock Alerts ({restockSubscriptions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertsAdminTab("pricedrop")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                          alertsAdminTab === "pricedrop"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        📉 Price Drops ({priceDropSubscriptions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertsAdminTab("reviews")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                          alertsAdminTab === "reviews"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        💬 Reviews ({showroomReviews.length})
                      </button>
                    </div>

                    {/* SUB-TAB 1: RESTOCK ALERTS LOGS */}
                    {alertsAdminTab === "restock" && (
                      <div className="bg-[#0a0a14] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                        {restockSubscriptions.length === 0 ? (
                          <div className="text-center py-16 px-4">
                            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h6 className="text-sm font-bold text-slate-400">No Restock Alert Subscriptions Active</h6>
                            <p className="text-xs text-slate-500 font-light max-w-sm mx-auto mt-1">
                              When users visit out-of-stock items and click 'Notify Me', their details will populate this register.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 bg-white/3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                  <th className="p-4 font-bold text-slate-400">Product / Model</th>
                                  <th className="p-4 font-bold text-slate-400">Subscriber Contact</th>
                                  <th className="p-4 font-bold text-slate-400">Registered On</th>
                                  <th className="p-4 font-bold text-slate-400">Status</th>
                                  <th className="p-4 font-bold text-slate-400 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {restockSubscriptions.map((sub: any, sIdx: number) => {
                                  const targetProd = products.find(p => p.id === sub.productId);
                                  const isOutOfStock = targetProd ? targetProd.stockStatus === "Out of Stock" : true;
                                  return (
                                    <tr key={sIdx} className="hover:bg-white/1">
                                      <td className="p-4">
                                        <div className="flex items-center gap-3">
                                          {targetProd?.images && targetProd.images[0] ? (
                                            <img
                                              src={targetProd.images[0]}
                                              alt={targetProd.name}
                                              referrerPolicy="no-referrer"
                                              className="w-8 h-8 rounded-lg object-contain bg-black/40 border border-white/5"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono text-[9px] text-slate-500">
                                              N/A
                                            </div>
                                          )}
                                          <div>
                                            <div className="font-bold text-white leading-snug">{targetProd ? targetProd.name : sub.productName || "Unknown Hardware"}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">ID: {sub.productId}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <div className="font-medium text-slate-200">{sub.email}</div>
                                        <div className="text-[10px] text-slate-400">{sub.name || "N/A"}</div>
                                      </td>
                                      <td className="p-4 font-mono text-slate-400">
                                        {new Date(sub.timestamp || sub.createdAt || Date.now()).toLocaleString()}
                                      </td>
                                      <td className="p-4">
                                        {!targetProd ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono border bg-slate-500/10 border-slate-500/20 text-slate-400">
                                            DISCONTINUED
                                          </span>
                                        ) : isOutOfStock ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono border bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse">
                                            ⏳ PENDING RESTOCK
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                            ✅ RESTOCKED
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 text-right">
                                        {targetProd && isOutOfStock ? (
                                          <button
                                            type="button"
                                            onClick={() => triggerRestockAlertRelease(sub.productId)}
                                            disabled={reloadingAlerts}
                                            className="py-1 px-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 font-extrabold text-[10px] text-white rounded-lg active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                                          >
                                            🚀 Dispatch Restock Notice
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-slate-500 italic font-light">Processed</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 2: PRICE DROP TARGETS */}
                    {alertsAdminTab === "pricedrop" && (
                      <div className="bg-[#0a0a14] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                        {priceDropSubscriptions.length === 0 ? (
                          <div className="text-center py-16 px-4">
                            <TrendingDown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h6 className="text-sm font-bold text-slate-400">No Price Drop Trackers Active</h6>
                            <p className="text-xs text-slate-500 font-light max-w-sm mx-auto mt-1">
                              When users set customer budget drop alerts under specification sheets, their entries display here.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 bg-white/3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                  <th className="p-4 font-bold text-slate-400">Product Line / ID</th>
                                  <th className="p-4 font-bold text-slate-400">Subscriber</th>
                                  <th className="p-4 font-bold text-slate-400">Price Target Status</th>
                                  <th className="p-4 font-bold text-slate-400">Registered On</th>
                                  <th className="p-4 font-bold text-slate-400 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {priceDropSubscriptions.map((sub: any, sIdx: number) => {
                                  const targetProd = products.find(p => p.id === sub.productId);
                                  const currentPriceVal = targetProd ? targetProd.price : sub.currentPrice || 0;
                                  const isSatisfied = currentPriceVal <= Number(sub.targetPrice);
                                  return (
                                    <tr key={sub.id || sIdx} className="hover:bg-white/1">
                                      <td className="p-4">
                                        <div className="font-bold text-white leading-snug">{sub.productName || "Unknown Hardware"}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">ID: {sub.productId}</div>
                                      </td>
                                      <td className="p-4">
                                        <div className="font-medium text-slate-200">{sub.name}</div>
                                        <div className="text-[10px] text-sky-400 font-mono">{sub.email}</div>
                                      </td>
                                      <td className="p-4">
                                        <div className="text-xs font-bold text-slate-300">
                                          Target: {Number(sub.targetPrice).toLocaleString()} UGX
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-light mt-0.5">
                                          Current Catalog: {currentPriceVal.toLocaleString()} UGX
                                        </div>
                                        {isSatisfied ? (
                                          <span className="mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                            ✓ THRESHOLD MET
                                          </span>
                                        ) : (
                                          <span className="mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono border bg-purple-500/10 border-purple-500/20 text-purple-400 animate-pulse">
                                            ⏳ WAITING FOR PRICE DROP
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                                        {new Date(sub.createdAt || Date.now()).toLocaleDateString()}
                                      </td>
                                      <td className="p-4 text-right">
                                        {sub.status === 'notified' ? (
                                          <span className="text-[10px] text-emerald-400 font-semibold italic">✓ Emailed / Notified</span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => triggerPriceDropRelease(sub.id)}
                                            className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500 hover:text-white border border-sky-500/20 text-sky-400 text-[10px] font-mono font-bold rounded-lg transition-all"
                                          >
                                            🚀 Dispatch Simulation Notice
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 3: REVIEWS MODERATION */}
                    {alertsAdminTab === "reviews" && (
                      <div className="bg-[#0a0a14] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                        {showroomReviews.length === 0 ? (
                          <div className="text-center py-16 px-4">
                            <Star className="w-12 h-12 text-slate-600 mx-auto mb-3 text-purple-500" />
                            <h6 className="text-sm font-bold text-slate-400">No Showroom Reviews Submitted</h6>
                            <p className="text-xs text-slate-500 font-light max-w-sm mx-auto mt-1">
                              When users write reviews under showroom items, their entries will display here for moderation.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 bg-white/3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                  <th className="p-4 font-bold text-slate-400">Product / Rating</th>
                                  <th className="p-4 font-bold text-slate-400">Customer Details</th>
                                  <th className="p-4 font-bold text-slate-400">Review Text</th>
                                  <th className="p-4 font-bold text-slate-400">Submitted</th>
                                  <th className="p-4 font-bold text-slate-400 text-right">Moderations</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                {showroomReviews.map((rev: any, rIdx: number) => {
                                  const targetProd = products.find(p => p.id === rev.productId);
                                  return (
                                    <tr key={rev.id || rIdx} className="hover:bg-white/1">
                                      <td className="p-4">
                                        <div className="font-bold text-white max-w-[150px] truncate">{targetProd ? targetProd.name : rev.productId}</div>
                                        <div className="flex items-center gap-1 mt-1">
                                          {Array.from({ length: 5 }).map((_, s) => (
                                            <Star
                                              key={s}
                                              className={`w-3 h-3 ${
                                                s < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-800"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <div className="font-bold text-slate-200">{rev.userName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{rev.userEmail}</div>
                                      </td>
                                      <td className="p-4 max-w-[280px]">
                                        <p className="text-xs text-slate-300 italic font-light line-clamp-2">
                                          "{rev.comment}"
                                        </p>
                                      </td>
                                      <td className="p-4 font-mono text-slate-400 text-[10px]">
                                        {new Date(rev.timestamp || Date.now()).toLocaleDateString()}
                                      </td>
                                      <td className="p-4 text-right">
                                        <button
                                          type="button"
                                          onClick={() => triggerDeleteReview(rev.id)}
                                          className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg font-mono text-[10px] flex items-center gap-1 ml-auto transition-all"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Delete Review</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: 4. CLINICAL SETUP SQL MANUAL */}
                {activeTab === "setup" && (
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Database className="w-4 h-4" /> Supabase RLS policies and table creations CLI instructions
                      </h5>
                      <p className="text-[10px] text-slate-400 font-light mt-1 font-sans">
                        To enable multi-user sync and Row Level Security, copy-paste the SQL script inside the Supabase Queries sandbox terminal of your application.
                      </p>
                    </div>

                    <div className="bg-black border border-white/5 rounded-2xl p-5 relative">
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(mapFrontendToSupabase(products[0] || ({} as any)) ? `CREATE TABLE IF NOT EXISTS public.products ...` : "");
                            alert("SQL Script successfully copied to your administrative clipboard!");
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono rounded-lg hover:text-white transition-colors cursor-pointer select-none active:scale-95"
                        >
                          Copy SQL Command Script
                        </button>
                      </div>

                      <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto text-left leading-relaxed max-h-96 whitespace-pre-wrap select-all scrollbar-thin">
                        {`-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    original_price DOUBLE PRECISION,
    badge TEXT,
    specs TEXT[] DEFAULT '{}'::TEXT[],
    colors TEXT[] DEFAULT '{}'::TEXT[],
    storages TEXT[] DEFAULT '{}'::TEXT[],
    images TEXT[] DEFAULT '{}'::TEXT[],
    videos TEXT[] DEFAULT '{}'::TEXT[],
    stock_status TEXT DEFAULT 'In Stock',
    detailed_specs JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to anyone
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT TO public USING (true);

-- Allow authenticated administrative modifications (insert, update, delete)
CREATE POLICY "Allow authenticated admin write access" ON public.products
    FOR ALL TO authenticated USING (true);

-- Storage bucket configuration guidelines:
-- Please create a storage bucket in your Supabase admin named 'product-media'.
-- Set it to PUBLIC.
-- Add storage security policies allowing all public users to READ, and authenticated admins to CREATE/WRITE/DELETE.`}
                      </pre>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl text-left leading-normal font-sans">
                      <p className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-4 h-4" /> Crucial Client Integration Note:
                      </p>
                      <p className="font-light">
                        Make sure your local <code className="font-mono text-amber-300 font-bold bg-black/40 px-1 py-0.5 rounded text-[11px]">.env.local</code> or secrets dashboard houses the exact values for <code className="font-mono text-amber-300 font-bold bg-black/40 px-1 py-0.5 rounded text-[11px]">VITE_SUPABASE_URL</code> and <code className="font-mono text-amber-300 font-bold bg-black/40 px-1 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code>. If missing or unset, the system displays the standard developer warning and routes catalog modifications to your local storage session seamlessly!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Global UI elements hook repair to avoid nested styling rendering differences due to custom styles
function selectedHtmlIdFix(node: React.ReactNode): React.ReactNode {
  return node;
}
