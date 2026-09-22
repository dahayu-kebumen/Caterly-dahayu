import React, { useState, useRef, useMemo } from 'react';
import { 
  ChefHat, 
  Flame, 
  Clock, 
  Package, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  ShoppingCart, 
  ListChecks, 
  Banknote, 
  Printer, 
  Copy, 
  Check, 
  Search, 
  Calendar, 
  Share2, 
  Camera, 
  Sparkles, 
  Loader2, 
  X, 
  Plus, 
  MessageSquare, 
  Truck, 
  Layers, 
  ArrowRight,
  Info,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { analyzeKitchenStock } from '../services/geminiService';
import { AnalysisResult, IngredientStock, Order, MenuItem, Expense } from '../types';

interface SmartAdvisorProps {
  inventory: IngredientStock[];
  orders: Order[];
  menu: MenuItem[];
  onUpdateInventory: (inventory: IngredientStock[]) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onAddExpense?: (expense: Expense) => void;
  currentAdmin?: string;
  onUpdateOrder?: (orderId: string, updates: Partial<Order>) => void;
}

const SmartAdvisor: React.FC<SmartAdvisorProps> = ({ 
  inventory, 
  orders, 
  menu, 
  onUpdateInventory, 
  onNotify, 
  onAddExpense, 
  currentAdmin = 'Admin Dapur',
  onUpdateOrder 
}) => {
  // Navigation Tabs: 'kitchen' (Layar Dapur), 'mrp' (Perencanaan Belanja), 'scanner' (Pindai AI)
  const [activeMainTab, setActiveMainTab] = useState<'kitchen' | 'mrp' | 'scanner'>('kitchen');

  // Today & Tomorrow date references
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // -------------------------------------------------------------
  // 1. STATE & LOGIC UNTUK LAYAR DAPUR (KITCHEN DISPLAY SYSTEM)
  // -------------------------------------------------------------
  const [kitchenDateFilter, setKitchenDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming'>('all');
  const [kitchenStatusFilter, setKitchenStatusFilter] = useState<'all' | 'Menunggu' | 'Sedang Dimasak' | 'Siap Dikemas' | 'Selesai'>('all');
  const [kitchenSearchQuery, setKitchenSearchQuery] = useState('');
  
  // Local checked items per order for chef line-item checklist
  const [checkedOrderItems, setCheckedOrderItems] = useState<{ [key: string]: boolean }>({});

  // Kitchen note edit modal
  const [editingNoteOrder, setEditingNoteOrder] = useState<Order | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Kitchen print ticket slip modal
  const [printingTicketOrder, setPrintingTicketOrder] = useState<Order | null>(null);
  const [isCopiedTicket, setIsCopiedTicket] = useState(false);

  // Helper untuk menentukan status masak order
  const getOrderKitchenStatus = (order: Order): 'Menunggu' | 'Sedang Dimasak' | 'Siap Dikemas' | 'Selesai' => {
    if (order.kitchenStatus) return order.kitchenStatus;
    if (order.deliveryStatus === 'Sedang Diantar' || order.deliveryStatus === 'Tiba di Lokasi' || order.deliveryStatus === 'Selesai') {
      return 'Selesai';
    }
    if (order.deliveryStatus === 'Disiapkan di Dapur') {
      return 'Sedang Dimasak';
    }
    return 'Menunggu';
  };

  // Filtered orders for kitchen display
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(order => order.status !== 'Cancelled')
      .filter(order => {
        // Date filter
        if (kitchenDateFilter === 'today') return order.date === todayStr;
        if (kitchenDateFilter === 'tomorrow') return order.date === tomorrowStr;
        if (kitchenDateFilter === 'upcoming') return order.date > tomorrowStr;
        return true;
      })
      .filter(order => {
        // Status filter
        const currentKStatus = getOrderKitchenStatus(order);
        if (kitchenStatusFilter === 'all') return true;
        return currentKStatus === kitchenStatusFilter;
      })
      .filter(order => {
        // Search query
        if (!kitchenSearchQuery.trim()) return true;
        const q = kitchenSearchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.items.some(it => it.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Sort by date then deliveryTime
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return (a.deliveryTime || '23:59').localeCompare(b.deliveryTime || '23:59');
      });
  }, [orders, kitchenDateFilter, kitchenStatusFilter, kitchenSearchQuery, todayStr, tomorrowStr]);

  // Kitchen Metrics
  const kitchenMetrics = useMemo(() => {
    const totalActive = orders.filter(o => o.status !== 'Cancelled').length;
    let waiting = 0;
    let cooking = 0;
    let packing = 0;
    let completed = 0;

    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      const st = getOrderKitchenStatus(o);
      if (st === 'Menunggu') waiting++;
      else if (st === 'Sedang Dimasak') cooking++;
      else if (st === 'Siap Dikemas') packing++;
      else if (st === 'Selesai') completed++;
    });

    return { totalActive, waiting, cooking, packing, completed };
  }, [orders]);

  // Akumulasi Porsi Menu yang Harus Dimasak (Portion Tally Board)
  const portionTally = useMemo(() => {
    const tallyMap: { [menuName: string]: { totalQty: number, ordersCount: number } } = {};
    kitchenOrders
      .filter(o => getOrderKitchenStatus(o) !== 'Selesai')
      .forEach(order => {
        order.items.forEach(itemStr => {
          const match = itemStr.match(/(.*)\s\((\d+)\s*(porsi|box|paket|pcs)?\)/i);
          let itemName = itemStr;
          let qty = 1;
          if (match) {
            itemName = match[1].trim();
            qty = parseInt(match[2], 10) || 1;
          }
          if (!tallyMap[itemName]) {
            tallyMap[itemName] = { totalQty: 0, ordersCount: 0 };
          }
          tallyMap[itemName].totalQty += qty;
          tallyMap[itemName].ordersCount += 1;
        });
      });

    return Object.entries(tallyMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalQty - a.totalQty);
  }, [kitchenOrders]);

  // Handle Update Kitchen Workflow Status
  const handleSetKitchenStatus = (order: Order, nextStatus: 'Menunggu' | 'Sedang Dimasak' | 'Siap Dikemas' | 'Selesai') => {
    if (!onUpdateOrder) return;

    let deliveryStatusUpdate = order.deliveryStatus;
    if (nextStatus === 'Sedang Dimasak') {
      deliveryStatusUpdate = 'Disiapkan di Dapur';
    } else if (nextStatus === 'Siap Dikemas') {
      deliveryStatusUpdate = 'Disiapkan di Dapur';
    } else if (nextStatus === 'Selesai') {
      if (order.deliveryMethod === 'Pickup') {
        deliveryStatusUpdate = 'Siap Diambil';
      } else {
        deliveryStatusUpdate = 'Disiapkan di Dapur';
      }
    }

    onUpdateOrder(order.id, {
      kitchenStatus: nextStatus,
      deliveryStatus: deliveryStatusUpdate
    });

    onNotify?.(`Pesanan #${order.id} kini berstatus: ${nextStatus}`, 'success');
  };

  // Handle Save Note
  const handleSaveKitchenNote = () => {
    if (!editingNoteOrder || !onUpdateOrder) return;
    onUpdateOrder(editingNoteOrder.id, {
      kitchenNotes: noteInput.trim()
    });
    onNotify?.(`Catatan dapur untuk #${editingNoteOrder.id} berhasil disimpan!`, 'success');
    setEditingNoteOrder(null);
    setNoteInput('');
  };

  // -------------------------------------------------------------
  // 2. STATE & LOGIC UNTUK MRP (MATERIAL REQUIREMENTS PLANNING)
  // -------------------------------------------------------------
  const [mrpScopeFilter, setMrpScopeFilter] = useState<'all' | 'today' | 'tomorrow' | '7days'>('all');
  const [isBulkPurchaseOpen, setIsBulkPurchaseOpen] = useState(false);
  const [isSinglePurchaseOpen, setIsSinglePurchaseOpen] = useState(false);
  const [selectedSingleItem, setSelectedSingleItem] = useState<any>(null);
  const [singlePurchaseForm, setSinglePurchaseForm] = useState({ amount: 0, cost: 0 });
  const [bulkPurchasePrices, setBulkPurchasePrices] = useState<{ [key: string]: number }>({});
  const [isCopiedWhatsappText, setIsCopiedWhatsappText] = useState(false);

  // Orders in scope for MRP
  const mrpEligibleOrders = useMemo(() => {
    const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    return orders.filter(o => {
      if (o.status === 'Cancelled') return false;
      if (o.status === 'Delivered') return false;
      const kStatus = getOrderKitchenStatus(o);
      if (kStatus === 'Selesai') return false; // Sudah selesai dimasak

      if (mrpScopeFilter === 'today') return o.date === todayStr;
      if (mrpScopeFilter === 'tomorrow') return o.date === tomorrowStr;
      if (mrpScopeFilter === '7days') return o.date >= todayStr && o.date <= next7DaysStr;
      return true;
    });
  }, [orders, mrpScopeFilter, todayStr, tomorrowStr]);

  // BOM EXPLOSION CALCULATION
  const mrpRequirements = useMemo(() => {
    const reqs: { 
      [key: string]: { 
        name: string; 
        unit: string; 
        requiredAmount: number; 
        category?: string;
        itemType?: 'RAW' | 'PREPARED';
        costPerUnit: number;
      } 
    } = {};

    mrpEligibleOrders.forEach(order => {
      order.items.forEach(orderItemStr => {
        const match = orderItemStr.match(/(.*)\s\((\d+)\s*(porsi|box|paket|pcs)?\)/i);
        let itemName = orderItemStr;
        let qty = 1;
        if (match) {
          itemName = match[1].trim();
          qty = parseInt(match[2], 10) || 1;
        }

        const menuItem = menu.find(m => m.name.toLowerCase() === itemName.toLowerCase());
        if (menuItem?.recipe && menuItem.recipe.length > 0) {
          menuItem.recipe.forEach(ing => {
            const needed = (ing.amountPerUnit || 0) * qty;
            const invItem = inventory.find(i => i.id === ing.ingredientId);
            const key = ing.ingredientId || ing.name;

            if (!reqs[key]) {
              reqs[key] = {
                name: ing.name,
                unit: ing.unit,
                requiredAmount: 0,
                category: invItem?.category || ing.category || 'Bahan Baku',
                itemType: invItem?.itemType || 'RAW',
                costPerUnit: invItem?.costPerUnit || ing.unitCost || 0
              };
            }
            reqs[key].requiredAmount += needed;
          });
        }
      });
    });

    return Object.entries(reqs).map(([id, data]) => {
      const inv = inventory.find(i => i.id === id || i.name.toLowerCase() === data.name.toLowerCase());
      const stockQty = inv ? inv.quantity : 0;
      const deficit = Math.max(0, data.requiredAmount - stockQty);
      const percentFilled = data.requiredAmount > 0 ? (stockQty / data.requiredAmount) * 100 : 100;
      const estimatedCost = deficit * (data.costPerUnit || inv?.costPerUnit || 0);

      return {
        id: inv?.id || id,
        ...data,
        stockQty,
        deficit,
        percentFilled: Math.min(100, Math.max(0, percentFilled)),
        estimatedCost
      };
    }).sort((a, b) => b.deficit - a.deficit);
  }, [mrpEligibleOrders, menu, inventory]);

  const mrpDeficits = useMemo(() => mrpRequirements.filter(r => r.deficit > 0), [mrpRequirements]);
  const totalEstimatedBelanja = useMemo(() => mrpDeficits.reduce((sum, d) => sum + d.estimatedCost, 0), [mrpDeficits]);

  // Handle Single Item Purchase
  const handleOpenSinglePurchase = (item: any) => {
    setSelectedSingleItem(item);
    setSinglePurchaseForm({
      amount: Math.ceil(item.deficit * 10) / 10,
      cost: Math.round(item.deficit * (item.costPerUnit || 10000))
    });
    setIsSinglePurchaseOpen(true);
  };

  const handleExecuteSinglePurchase = () => {
    if (!selectedSingleItem || singlePurchaseForm.amount <= 0) {
      onNotify?.("Masukkan jumlah bahan yang dibeli.", "warning");
      return;
    }

    // 1. Tambah Expense
    if (onAddExpense && singlePurchaseForm.cost > 0) {
      const expense: Expense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Belanja Pasar: ${selectedSingleItem.name}`,
        amount: singlePurchaseForm.amount,
        unit: selectedSingleItem.unit,
        totalCost: singlePurchaseForm.cost,
        date: todayStr,
        recordedBy: currentAdmin,
        category: 'Bahan Baku'
      };
      onAddExpense(expense);
    }

    // 2. Tambah Stok Gudang
    const updatedInventory = inventory.map(item => {
      if (item.id === selectedSingleItem.id || item.name.toLowerCase() === selectedSingleItem.name.toLowerCase()) {
        const newQty = (item.quantity || 0) + singlePurchaseForm.amount;
        const newUnitCost = singlePurchaseForm.cost > 0 ? Math.round(singlePurchaseForm.cost / singlePurchaseForm.amount) : item.costPerUnit;
        return {
          ...item,
          quantity: newQty,
          costPerUnit: newUnitCost || item.costPerUnit,
          status: (newQty > (item.minStock || 10) ? 'Aman' : newQty > 0 ? 'Menipis' : 'Habis') as any
        };
      }
      return item;
    });

    onUpdateInventory(updatedInventory);
    onNotify?.(`Berhasil belanja ${singlePurchaseForm.amount} ${selectedSingleItem.unit} ${selectedSingleItem.name}! Stok gudang telah bertambah.`, 'success');
    setIsSinglePurchaseOpen(false);
    setSelectedSingleItem(null);
  };

  // Handle Bulk Purchase Execution
  const handleExecuteBulkPurchase = () => {
    let recordedExpenses = 0;
    const invMap = new Map(inventory.map(i => [i.id, { ...i }]));

    mrpDeficits.forEach(def => {
      const enteredCost = bulkPurchasePrices[def.id];
      const purchaseQty = Math.ceil(def.deficit * 10) / 10;

      // Expense record
      if (onAddExpense && enteredCost && enteredCost > 0) {
        const exp: Expense = {
          id: `exp_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: `Belanja Pasar: ${def.name}`,
          amount: purchaseQty,
          unit: def.unit,
          totalCost: enteredCost,
          date: todayStr,
          recordedBy: currentAdmin,
          category: 'Bahan Baku'
        };
        onAddExpense(exp);
        recordedExpenses++;
      }

      // Update stock map
      const existing = invMap.get(def.id) || Array.from(invMap.values()).find(x => x.name.toLowerCase() === def.name.toLowerCase());
      if (existing) {
        const newQty = (existing.quantity || 0) + purchaseQty;
        existing.quantity = newQty;
        if (enteredCost && enteredCost > 0) {
          existing.costPerUnit = Math.round(enteredCost / purchaseQty);
        }
        existing.status = (newQty > (existing.minStock || 10) ? 'Aman' : newQty > 0 ? 'Menipis' : 'Habis') as any;
      }
    });

    onUpdateInventory(Array.from(invMap.values()));
    setIsBulkPurchaseOpen(false);
    setBulkPurchasePrices({});
    onNotify?.(`Belanja masal berhasil! ${mrpDeficits.length} bahan telah ditambahkan ke stok gudang & dicatat di pengeluaran.`, 'success');
  };

  // Format WhatsApp Message for Shopping List
  const generateWhatsappShoppingList = () => {
    let text = `*📋 DAFTAR BELANJA PASAR KATERING*\n`;
    text += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    text += `Lingkup Pesanan: ${mrpScopeFilter === 'today' ? 'Hari Ini Saja' : mrpScopeFilter === 'tomorrow' ? 'Besok Saja' : mrpScopeFilter === '7days' ? '7 Hari Ke Depan' : 'Semua Pesanan Aktif'} (${mrpEligibleOrders.length} Pesanan)\n`;
    text += `------------------------------------\n\n`;

    if (mrpDeficits.length === 0) {
      text += `✅ *Alhamdulillah, semua stok bahan mencukupi! Tidak ada defisit bahan yang perlu dibeli.*\n`;
    } else {
      text += `*⚠️ DAFTAR BAHAN YANG HARUS DIBELI:* \n\n`;
      mrpDeficits.forEach((d, idx) => {
        text += `${idx + 1}. *${d.name}* [${d.category || 'Bahan'}]\n`;
        text += `   - Butuh Produksi: ${d.requiredAmount.toFixed(1)} ${d.unit}\n`;
        text += `   - Stok Saat Ini: ${d.stockQty} ${d.unit}\n`;
        text += `   👉 *BELI: ${Math.ceil(d.deficit * 10) / 10} ${d.unit}*\n`;
        if (d.costPerUnit > 0) {
          text += `   (Estimasi: Rp ${(d.deficit * d.costPerUnit).toLocaleString()})\n`;
        }
        text += `\n`;
      });
      text += `------------------------------------\n`;
      text += `*💰 Total Estimasi Biaya:* Rp ${Math.round(totalEstimatedBelanja).toLocaleString()}\n`;
      text += `Mohon segera dibelanjakan ke pasar/supplier untuk kelancaran jadwal produksi dapur. Terima kasih! 🙏`;
    }

    return text;
  };

  const handleCopyWhatsappText = () => {
    const text = generateWhatsappShoppingList();
    navigator.clipboard.writeText(text);
    setIsCopiedWhatsappText(true);
    onNotify?.("Format WhatsApp daftar belanja berhasil disalin ke clipboard!", "success");
    setTimeout(() => setIsCopiedWhatsappText(false), 2500);
  };

  // -------------------------------------------------------------
  // 3. STATE & LOGIC UNTUK AI STOCK SCANNER (VISION)
  // -------------------------------------------------------------
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setScanPreview(base64String);
        setAnalyzing(true);
        try {
          const res = await analyzeKitchenStock(base64String);
          setAiResult(res as any);
          onNotify?.("AI Vision berhasil menganalisis kondisi stok dapur!", "success");
        } catch (error) {
          console.error("AI Analysis failed", error);
          onNotify?.("Gagal menganalisis gambar dengan AI.", "error");
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER UTAMA: TITLE & TAB SWITCHER */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
              <ChefHat size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Dapur & MRP Katering</h1>
              <p className="text-xs font-bold text-slate-600">Instruksi Memasak Dapur & Perencanaan Belanja Bahan Otomatis</p>
            </div>
          </div>
        </div>

        {/* PRIMARY SUB-TAB NAVIGATION */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMainTab('kitchen')}
            className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeMainTab === 'kitchen'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-bold'
            }`}
          >
            <Flame size={15} className={activeMainTab === 'kitchen' ? 'text-amber-400 animate-pulse' : ''} />
            <span>Layar Dapur (KDS)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeMainTab === 'kitchen' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'}`}>
              {kitchenMetrics.totalActive - kitchenMetrics.completed}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('mrp')}
            className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeMainTab === 'mrp'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-bold'
            }`}
          >
            <ClipboardList size={15} className={activeMainTab === 'mrp' ? 'text-indigo-400' : ''} />
            <span>MRP & Belanja Pasar</span>
            {mrpDeficits.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-black animate-pulse">
                {mrpDeficits.length} Kurang
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('scanner')}
            className={`flex-1 md:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeMainTab === 'scanner'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-bold'
            }`}
          >
            <Sparkles size={15} className="text-amber-500" />
            <span>Pindai AI</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW: LAYAR DAPUR (KITCHEN DISPLAY SYSTEM - KDS)                      */}
      {/* ========================================================================= */}
      {activeMainTab === 'kitchen' && (
        <div className="space-y-6">
          
          {/* STATS METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <p className="text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Total Antrean Dapur</p>
              <p className="text-xl sm:text-2xl font-black text-slate-950">{kitchenMetrics.totalActive} <span className="text-xs text-slate-500 font-bold">pesanan</span></p>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Sedang Dimasak</p>
                <Flame size={16} className="text-amber-600 animate-pulse" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-950">{kitchenMetrics.cooking} <span className="text-xs text-amber-800 font-bold">proses</span></p>
            </div>
            <div className="bg-indigo-50/60 p-4 rounded-2xl border-2 border-indigo-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-black text-indigo-900 uppercase tracking-wider mb-1">Siap Dikemas (Packing)</p>
                <Package size={16} className="text-indigo-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-indigo-950">{kitchenMetrics.packing} <span className="text-xs text-indigo-800 font-bold">pesanan</span></p>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">Selesai Siap Kirim</p>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-950">{kitchenMetrics.completed} <span className="text-xs text-emerald-800 font-bold">siap</span></p>
            </div>
          </div>

          {/* PORTION TALLY BOARD (AKUMULASI TOTAL PORSI MENU YANG HARUS DIMASAK) */}
          {portionTally.length > 0 && (
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                    <ChefHat size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">
                      Portion Tally Board (Akumulasi Porsi Harus Dimasak)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Total porsi gabungan dari seluruh pesanan yang belum selesai dimasak</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  {portionTally.length} Ragam Menu
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                {portionTally.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-black text-white truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.ordersCount} pesanan katering</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-base sm:text-lg font-black text-amber-400">{item.totalQty}</span>
                      <span className="text-[10px] font-bold text-slate-300 ml-1">porsi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILTER & SEARCH BAR */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* DATE TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                onClick={() => setKitchenDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  kitchenDateFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Jadwal
              </button>
              <button
                onClick={() => setKitchenDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  kitchenDateFilter === 'today'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setKitchenDateFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  kitchenDateFilter === 'tomorrow'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Besok
              </button>
              <button
                onClick={() => setKitchenDateFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  kitchenDateFilter === 'upcoming'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mendatang
              </button>
            </div>

            {/* STATUS & SEARCH */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setKitchenStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    kitchenStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Semua Status
                </button>
                <button
                  onClick={() => setKitchenStatusFilter('Menunggu')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    kitchenStatusFilter === 'Menunggu' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ⏳ Menunggu
                </button>
                <button
                  onClick={() => setKitchenStatusFilter('Sedang Dimasak')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    kitchenStatusFilter === 'Sedang Dimasak' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  🔥 Dimasak
                </button>
                <button
                  onClick={() => setKitchenStatusFilter('Siap Dikemas')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    kitchenStatusFilter === 'Siap Dikemas' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800'
                  }`}
                >
                  📦 Packing
                </button>
                <button
                  onClick={() => setKitchenStatusFilter('Selesai')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    kitchenStatusFilter === 'Selesai' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  ✅ Selesai
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari order..."
                  value={kitchenSearchQuery}
                  onChange={e => setKitchenSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                />
              </div>
            </div>

          </div>

          {/* KITCHEN CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kitchenOrders.map(order => {
              const kStatus = getOrderKitchenStatus(order);
              const isToday = order.date === todayStr;

              return (
                <div 
                  key={order.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border-2 shadow-xs transition-all flex flex-col justify-between overflow-hidden ${
                    kStatus === 'Sedang Dimasak'
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : kStatus === 'Siap Dikemas'
                      ? 'border-indigo-300'
                      : kStatus === 'Selesai'
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className={`p-4 border-b ${
                    kStatus === 'Sedang Dimasak' 
                      ? 'bg-amber-500/10 border-amber-200' 
                      : kStatus === 'Siap Dikemas'
                      ? 'bg-indigo-50 border-indigo-100'
                      : kStatus === 'Selesai'
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-950 font-mono tracking-wider">#{order.id}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                            {order.type || 'Katering'}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black text-slate-900 mt-1 leading-tight">{order.customerName}</p>
                      </div>

                      {/* BADGE STATUS MASAK */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 ${
                        kStatus === 'Sedang Dimasak'
                          ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                          : kStatus === 'Siap Dikemas'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : kStatus === 'Selesai'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {kStatus === 'Sedang Dimasak' && <Flame size={12} />}
                        {kStatus === 'Siap Dikemas' && <Package size={12} />}
                        {kStatus === 'Selesai' && <CheckCircle2 size={12} />}
                        {kStatus === 'Menunggu' && <Clock size={12} />}
                        <span>{kStatus}</span>
                      </span>
                    </div>

                    {/* JAM KIRIM / PENGAMBILAN */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-2.5 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{order.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black">
                        <Clock size={12} className="text-amber-500" />
                        <span>Kirim: {order.deliveryTime || '11:00'} WIB</span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ({order.deliveryMethod === 'Pickup' ? 'Ambil Sendiri' : 'Kurir'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD BODY: ITEMS & CHECKLIST */}
                  <div className="p-4 space-y-3 flex-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Daftar Menu yang Dimasak:</p>
                      <div className="space-y-2">
                        {order.items.map((itemStr, idx) => {
                          const checkKey = `${order.id}_${idx}`;
                          const isChecked = !!checkedOrderItems[checkKey];

                          return (
                            <div 
                              key={idx}
                              onClick={() => setCheckedOrderItems(prev => ({ ...prev, [checkKey]: !isChecked }))}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isChecked 
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 line-through opacity-70' 
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-black leading-tight truncate">{itemStr}</span>
                              </div>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shrink-0">
                                Siap
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CATATAN KHUSUS DAPUR (KITCHEN NOTES) */}
                    <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                          <MessageSquare size={11} /> Catatan Koki & Pelanggan:
                        </p>
                        <button
                          onClick={() => {
                            setEditingNoteOrder(order);
                            setNoteInput(order.kitchenNotes || order.deliveryNotes || '');
                          }}
                          className="text-[10px] font-black text-amber-800 hover:underline"
                        >
                          {order.kitchenNotes ? 'Ubah' : '+ Catatan'}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-800 italic">
                        "{order.kitchenNotes || order.deliveryNotes || 'Tidak ada instruksi khusus dari pemesan.'}"
                      </p>
                    </div>
                  </div>

                  {/* CARD FOOTER: ACTIONS */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPrintingTicketOrder(order)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      title="Cetak Tiket Dapur / Kitchen Slip"
                    >
                      <Printer size={15} />
                    </button>

                    {/* ACTION WORKFLOW BUTTONS */}
                    {kStatus === 'Menunggu' && (
                      <button
                        onClick={() => handleSetKitchenStatus(order, 'Sedang Dimasak')}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Flame size={14} className="animate-pulse" /> Mulai Masak
                      </button>
                    )}

                    {kStatus === 'Sedang Dimasak' && (
                      <button
                        onClick={() => handleSetKitchenStatus(order, 'Siap Dikemas')}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Package size={14} /> Masuk Packing
                      </button>
                    )}

                    {kStatus === 'Siap Dikemas' && (
                      <button
                        onClick={() => handleSetKitchenStatus(order, 'Selesai')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <CheckCircle2 size={14} /> Selesai & Siap Kirim
                      </button>
                    )}

                    {kStatus === 'Selesai' && (
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Dapur Selesai
                        </span>
                        <button
                          onClick={() => handleSetKitchenStatus(order, 'Sedang Dimasak')}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline"
                        >
                          Ulang Masak
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {kitchenOrders.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                <ChefHat size={40} className="text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-800">Tidak ada antrean pesanan dapur</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm mx-auto">
                  Semua pesanan pada filter ini telah selesai dimasak atau belum ada pesanan aktif yang terdaftar.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW: MRP & PERENCANAAN BELANJA (MATERIAL REQUIREMENTS PLANNING)       */}
      {/* ========================================================================= */}
      {activeMainTab === 'mrp' && (
        <div className="space-y-6">
          
          {/* MRP CONTROL & METRIC BAR */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  BOM Explosion Engine
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Kalkulasi {mrpEligibleOrders.length} Pesanan Aktif
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-1">Perencanaan Kebutuhan Bahan (MRP)</h2>
              <p className="text-xs font-bold text-slate-600">
                Pembedahan resep otomatis: bandingkan total kebutuhan produksi vs stok gudang riil
              </p>
            </div>

            {/* ACTION BUTTONS: WHATSAPP LIST & BULK PROCUREMENT */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyWhatsappText}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs"
              >
                {isCopiedWhatsappText ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
                <span>{isCopiedWhatsappText ? 'Tersalin!' : 'Salin Format WA Pasar'}</span>
              </button>

              {mrpDeficits.length > 0 && (
                <button
                  onClick={() => {
                    const initPrices: { [key: string]: number } = {};
                    mrpDeficits.forEach(d => {
                      initPrices[d.id] = Math.round(d.deficit * (d.costPerUnit || 10000));
                    });
                    setBulkPurchasePrices(initPrices);
                    setIsBulkPurchaseOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs shadow-rose-200"
                >
                  <ShoppingCart size={15} />
                  <span>Belanja Masal ({mrpDeficits.length} Bahan Kurang)</span>
                </button>
              )}
            </div>
          </div>

          {/* MRP SCOPE SELECTOR */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-black uppercase text-slate-400 mr-1">Lingkup Pesanan:</span>
            <button
              onClick={() => setMrpScopeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mrpScopeFilter === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua Pesanan Belum Selesai
            </button>
            <button
              onClick={() => setMrpScopeFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mrpScopeFilter === 'today' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hari Ini Saja
            </button>
            <button
              onClick={() => setMrpScopeFilter('tomorrow')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mrpScopeFilter === 'tomorrow' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Besok Saja
            </button>
            <button
              onClick={() => setMrpScopeFilter('7days')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mrpScopeFilter === '7days' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              7 Hari Ke Depan
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pesanan Dalam Analisis</p>
              <p className="text-xl font-black text-slate-950 mt-0.5">{mrpEligibleOrders.length} <span className="text-xs font-bold text-slate-500">acara</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Ragam Bahan</p>
              <p className="text-xl font-black text-slate-950 mt-0.5">{mrpRequirements.length} <span className="text-xs font-bold text-slate-500">item resep</span></p>
            </div>
            <div className="bg-rose-50/60 p-4 rounded-2xl border-2 border-rose-200 shadow-xs">
              <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Bahan Kurang (Defisit)</p>
              <p className="text-xl font-black text-rose-700 mt-0.5">{mrpDeficits.length} <span className="text-xs font-bold text-rose-600">perlu dibeli</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estimasi Belanja Pasar</p>
              <p className="text-xl font-black text-slate-950 mt-0.5">Rp {Math.round(totalEstimatedBelanja).toLocaleString()}</p>
            </div>
          </div>

          {/* MRP REQUIREMENTS TABLE & CARDS */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-950">Daftar Kebutuhan Bahan Produksi</h3>
                <p className="text-xs text-slate-500 font-bold">Hasil komparasi kebutuhan resep dengan stok gudang saat ini</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {mrpRequirements.length} Bahan Terkalkulasi
              </span>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Nama Bahan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Butuh Produksi</th>
                    <th className="py-3 px-4 text-center">Stok Gudang</th>
                    <th className="py-3 px-4 text-center">Ketersediaan</th>
                    <th className="py-3 px-4 text-center">Status Defisit</th>
                    <th className="py-3 px-5 text-right">Aksi Belanja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {mrpRequirements.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-950">{req.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
                            req.itemType === 'PREPARED' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {req.itemType === 'PREPARED' ? '🍲 Matang' : '🥩 Mentah'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">HPP: Rp {(req.costPerUnit || 0).toLocaleString()} / {req.unit}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px]">
                          {req.category || 'Bahan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-950">{req.requiredAmount.toFixed(1)}</span> {req.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-black ${req.stockQty < req.requiredAmount ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {req.stockQty}
                        </span> {req.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${req.deficit > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${req.percentFilled}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-500">{Math.round(req.percentFilled)}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {req.deficit > 0 ? (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-black text-[10px] border border-rose-200 inline-flex items-center gap-1">
                            <TrendingDown size={12} /> Kurang {req.deficit.toFixed(1)} {req.unit}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Cukup
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {req.deficit > 0 ? (
                          <button
                            onClick={() => handleOpenSinglePurchase(req)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 transition-all"
                          >
                            <ShoppingCart size={11} /> Belanja
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Stok Siap</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW FOR MRP */}
            <div className="md:hidden divide-y divide-slate-100">
              {mrpRequirements.map((req) => (
                <div key={req.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-black text-slate-950 leading-tight">{req.name}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${
                          req.itemType === 'PREPARED' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {req.itemType === 'PREPARED' ? '🍲 Matang' : '🥩 Mentah'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Kategori: {req.category || 'Bahan'}</p>
                    </div>

                    {req.deficit > 0 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-black text-[10px] border border-rose-200 shrink-0">
                        -{req.deficit.toFixed(1)} {req.unit}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200 shrink-0">
                        Cukup
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl">
                    <span>Butuh: <strong className="text-slate-950">{req.requiredAmount.toFixed(1)} {req.unit}</strong></span>
                    <span>Stok Gudang: <strong className={req.stockQty < req.requiredAmount ? 'text-amber-700' : 'text-emerald-700'}>{req.stockQty} {req.unit}</strong></span>
                  </div>

                  {req.deficit > 0 && (
                    <button
                      onClick={() => handleOpenSinglePurchase(req)}
                      className="w-full py-2 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart size={13} /> Belanja Sekarang
                    </button>
                  )}
                </div>
              ))}
            </div>

            {mrpRequirements.length === 0 && (
              <div className="py-16 text-center text-slate-400 font-bold p-8">
                <ClipboardList size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Belum ada pesanan aktif pada rentang waktu ini untuk dikalkulasi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW: PINDAI AI STOK DAPUR (VISION SCANNER)                            */}
      {/* ========================================================================= */}
      {activeMainTab === 'scanner' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                  <Sparkles size={14} /> AI Kitchen Vision
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Pindai Visual Dapur & Chiller</h2>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
                  Ambil foto rak bumbu, chiller daging, atau karung beras. AI akan mendiagnosis sisa kapasitas stok dan memberikan rekomendasi belanja instan.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95"
                  >
                    <Camera size={16} /> Ambil Foto / Upload Gambar
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
              
              <div className="w-full md:w-72 aspect-square bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                {scanPreview ? (
                  <img src={scanPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Package size={40} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Preview Foto Bahan</p>
                  </div>
                )}
                {analyzing && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 className="animate-spin text-amber-400 mb-2" size={32} />
                    <span className="text-white text-[10px] font-black tracking-widest uppercase">AI MENGANALISIS...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI RESULT DIAGNOSIS */}
          {aiResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-500">
              <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">Hasil Deteksi</span>
                  <span className="text-xs font-black text-slate-500">Estimasi: {aiResult.estimatedQuantity || 'Terdeteksi'}</span>
                </div>
                <h4 className="text-xl font-black text-slate-950">{aiResult.status}</h4>
                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                  "{aiResult.diagnosis}"
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Rekomendasi Operasional Dapur</h3>
                <div className="space-y-2">
                  {aiResult.recommendations?.map((rec, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CATAT BELANJA TUNGGAL                                            */}
      {/* ========================================================================= */}
      {isSinglePurchaseOpen && selectedSingleItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsSinglePurchaseOpen(false)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">Catat Belanja Bahan</h3>
                  <p className="text-xs font-bold text-slate-500">{selectedSingleItem.name}</p>
                </div>
              </div>
              <button onClick={() => setIsSinglePurchaseOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Jumlah Dibeli ({selectedSingleItem.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={singlePurchaseForm.amount}
                  onChange={e => setSinglePurchaseForm({ ...singlePurchaseForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Kebutuhan defisit: {selectedSingleItem.deficit.toFixed(1)} {selectedSingleItem.unit}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Total Biaya Belanja (Rp)
                </label>
                <input
                  type="number"
                  value={singlePurchaseForm.cost || ''}
                  onChange={e => setSinglePurchaseForm({ ...singlePurchaseForm, cost: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Contoh: 75000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-800 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteSinglePurchase}
                className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider transition-all"
              >
                Konfirmasi & Tambah Stok
              </button>
              <button
                onClick={() => setIsSinglePurchaseOpen(false)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-wider"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT BELANJA MASAL (BULK PROCUREMENT)                          */}
      {/* ========================================================================= */}
      {isBulkPurchaseOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsBulkPurchaseOpen(false)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs font-black">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">Belanja Masal Pasar Katering</h3>
                  <p className="text-xs font-bold text-slate-500">{mrpDeficits.length} bahan memerlukan pengadaan segera</p>
                </div>
              </div>
              <button onClick={() => setIsBulkPurchaseOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
              {mrpDeficits.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-950 truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-rose-600">
                      Beli: {Math.ceil(item.deficit * 10) / 10} {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-48 shrink-0">
                    <span className="text-[10px] font-black text-slate-400">Rp</span>
                    <input
                      type="number"
                      placeholder="Total harga..."
                      value={bulkPurchasePrices[item.id] || ''}
                      onChange={e => setBulkPurchasePrices({ ...bulkPurchasePrices, [item.id]: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={handleExecuteBulkPurchase}
                className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Selesaikan Belanja & Perbarui Stok
              </button>
              <button
                onClick={() => setIsBulkPurchaseOpen(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-black text-xs uppercase tracking-wider"
              >
                Batal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UBAH CATATAN KHUSUS KOKI / DAPUR                                 */}
      {/* ========================================================================= */}
      {editingNoteOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setEditingNoteOrder(null)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-950">Catatan Dapur #{editingNoteOrder.id}</h3>
              <button onClick={() => setEditingNoteOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Instruksi Khusus (Contoh: "Sambal dipisah", "Ayam paha semua", "Pedas sedang")
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Tuliskan catatan khusus untuk tim masak..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveKitchenNote}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-800"
              >
                Simpan Catatan
              </button>
              <button
                onClick={() => setEditingNoteOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CETAK TIKET DAPUR (KITCHEN SLIP / KDS TICKET)                    */}
      {/* ========================================================================= */}
      {printingTicketOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPrintingTicketOrder(null)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-slate-900" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Tiket Dapur (KDS Slip)</span>
              </div>
              <button onClick={() => setPrintingTicketOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* SLIP CONTENT */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-900">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <p className="font-black uppercase text-sm">TIKET PRODUKSI DAPUR</p>
                <p className="text-[10px] text-slate-500">#{printingTicketOrder.id} • {printingTicketOrder.type || 'Katering'}</p>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemesan:</span>
                  <strong className="text-right truncate max-w-[150px]">{printingTicketOrder.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl Acara:</span>
                  <strong>{printingTicketOrder.date}</strong>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Waktu Kirim:</span>
                  <strong>{printingTicketOrder.deliveryTime || '11:00'} WIB ({printingTicketOrder.deliveryMethod || 'Delivery'})</strong>
                </div>
              </div>

              <div className="py-2 border-t border-b border-dashed border-slate-300 space-y-1.5">
                <p className="text-[10px] font-black uppercase text-slate-500">DAFTAR MENU:</p>
                {printingTicketOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-start justify-between font-black text-slate-950">
                    <span>[ ] {it}</span>
                  </div>
                ))}
              </div>

              {(printingTicketOrder.kitchenNotes || printingTicketOrder.deliveryNotes) && (
                <div className="py-1 text-[10px] font-bold text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                  <p className="font-black uppercase">Catatan Dapur:</p>
                  <p>"{printingTicketOrder.kitchenNotes || printingTicketOrder.deliveryNotes}"</p>
                </div>
              )}

              <div className="pt-2 text-center text-[9px] text-slate-400">
                Paraf Koki: ______________ | QC Packing: ______________
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-slate-800"
              >
                <Printer size={14} /> Cetak Nota Dapur
              </button>
              <button
                onClick={() => {
                  let slipText = `TIKET DAPUR #${printingTicketOrder.id}\n`;
                  slipText += `Pemesan: ${printingTicketOrder.customerName}\n`;
                  slipText += `Jadwal: ${printingTicketOrder.date} (${printingTicketOrder.deliveryTime || '11:00'} WIB)\n`;
                  slipText += `Metode: ${printingTicketOrder.deliveryMethod || 'Delivery'}\n`;
                  slipText += `--------------------\n`;
                  printingTicketOrder.items.forEach(it => {
                    slipText += `[ ] ${it}\n`;
                  });
                  if (printingTicketOrder.kitchenNotes || printingTicketOrder.deliveryNotes) {
                    slipText += `Catatan: ${printingTicketOrder.kitchenNotes || printingTicketOrder.deliveryNotes}\n`;
                  }
                  navigator.clipboard.writeText(slipText);
                  setIsCopiedTicket(true);
                  setTimeout(() => setIsCopiedTicket(false), 2000);
                  onNotify?.("Tiket dapur disalin ke clipboard!", "success");
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-black text-xs flex items-center gap-1"
              >
                {isCopiedTicket ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SmartAdvisor;
