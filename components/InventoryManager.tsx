import React, { useState, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, ShoppingCart, 
  ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Layers, FileSpreadsheet, 
  SlidersHorizontal, Sparkles, Check, X, ShieldAlert,
  Calendar, User, ArrowRight, DollarSign, ChevronRight,
  TrendingDown, TrendingUp, Download, Pencil, Flame, ChefHat, Utensils
} from 'lucide-react';
import { IngredientStock, StockMutation, Order, MenuItem, Expense, IngredientItemType, PrepRecipeItem } from '../types';
import { ImportIngredientsModal } from './ImportIngredientsModal';
import { ManageIngredientCategoriesModal } from './ManageIngredientCategoriesModal';
import { KitchenBatchCookingModal } from './KitchenBatchCookingModal';
import { executeKitchenBatchCooking } from '../services/inventoryLogic';
import { 
  generateMasterTemplateCsv, 
  downloadCsvFile,
  SPREADSHEET_INGREDIENT_CATEGORIES,
  CATEGORY_DESCRIPTIONS
} from '../services/ingredientImporter';

interface InventoryManagerProps {
  inventory: IngredientStock[];
  onUpdateInventory: (inventory: IngredientStock[]) => void;
  ingredientCategories?: string[];
  onUpdateIngredientCategories?: (newCategories: string[]) => void;
  mutations: StockMutation[];
  onAddMutation: (mutation: StockMutation) => void;
  orders: Order[];
  menu: MenuItem[];
  onAddExpense?: (expense: Expense) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  currentAdmin?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateInventory,
  ingredientCategories,
  onUpdateIngredientCategories,
  mutations,
  onAddMutation,
  orders,
  menu,
  onAddExpense,
  onNotify,
  currentAdmin = 'Admin'
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'purchasing' | 'opname' | 'history'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  // Filter Tipe Bahan: Semua, Mentah, Matang / Olahan
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | 'RAW' | 'PREPARED'>('ALL');

  // Modal Masak Dapur (Batch Cooking)
  const [isCookModalOpen, setIsCookModalOpen] = useState(false);
  const [cookPreselectedId, setCookPreselectedId] = useState<string | undefined>(undefined);

  // Daftar Kategori Bahan Baku aktif (dari state props atau kombinasi spreadsheet + stok)
  const allCategories = useMemo(() => {
    const baseCats = ingredientCategories && ingredientCategories.length > 0
      ? ingredientCategories
      : SPREADSHEET_INGREDIENT_CATEGORIES;
    const customCats = inventory
      .map(i => i.category)
      .filter((c): c is string => Boolean(c && !baseCats.includes(c as any)));
    return Array.from(new Set([...baseCats, ...customCats]));
  }, [ingredientCategories, inventory]);

  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  // Modal State: Pembelian Cepat (Barang Masuk)
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    ingredientId: '',
    newName: '',
    category: 'Bahan Pokok' as string,
    quantity: 0,
    unit: 'kg',
    totalCost: 0,
    location: 'Dapur Aktif' as const,
    notes: 'Belanja stok katering'
  });

  // Modal State: Penyesuaian Fisik / Stock Opname (Mekari style)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<IngredientStock | null>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Selisih Fisik Dapur (Susut Masak / Tercecer)');

  // Modal State: Tambah Bahan Baru ke Master Katalog (Sesuai Spreadsheet)
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    itemType: 'RAW' as IngredientItemType,
    category: 'Bahan Pokok' as string,
    purchaseUnit: '1000 gr',
    purchasePrice: 0,
    yieldQty: 1,
    costPerUnit: 0,
    unit: 'porsi',
    quantity: 0,
    minStock: 10,
    location: 'Dapur Aktif' as 'Dapur Aktif' | 'Gudang Utama',
    cookingNotes: '',
    shelfLifeDays: 1,
    prepRecipe: [] as PrepRecipeItem[]
  });

  // Modal State: Edit Master Bahan Baku
  const [editingItem, setEditingItem] = useState<IngredientStock | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    itemType: 'RAW' as IngredientItemType,
    category: 'Bahan Pokok' as string,
    purchaseUnit: '',
    purchasePrice: 0,
    yieldQty: 1,
    costPerUnit: 0,
    unit: 'porsi',
    quantity: 0,
    minStock: 10,
    location: 'Dapur Aktif' as 'Dapur Aktif' | 'Gudang Utama',
    cookingNotes: '',
    shelfLifeDays: 1,
    prepRecipe: [] as PrepRecipeItem[]
  });

  const openEditModal = (item: IngredientStock) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      itemType: item.itemType || 'RAW',
      category: item.category || 'Bahan Pokok',
      purchaseUnit: item.purchaseUnit || '',
      purchasePrice: item.purchasePrice || 0,
      yieldQty: item.yieldQty || 1,
      costPerUnit: item.costPerUnit || 0,
      unit: item.unit || 'porsi',
      quantity: item.quantity,
      minStock: item.minStock || 10,
      location: (item.location as any) || 'Dapur Aktif',
      cookingNotes: item.cookingNotes || '',
      shelfLifeDays: item.shelfLifeDays || 1,
      prepRecipe: item.prepRecipe || []
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editForm.name.trim()) {
      onNotify?.('Nama bahan tidak boleh kosong', 'error');
      return;
    }

    const calculatedCost = editForm.costPerUnit || (editForm.purchasePrice > 0 ? Math.round(editForm.purchasePrice / (editForm.yieldQty || 1)) : editingItem.costPerUnit || 0);

    const updated = inventory.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name: editForm.name.trim(),
          itemType: editForm.itemType,
          category: editForm.category,
          purchaseUnit: editForm.purchaseUnit,
          purchasePrice: editForm.purchasePrice,
          yieldQty: editForm.yieldQty,
          costPerUnit: calculatedCost,
          unit: editForm.unit,
          quantity: editForm.quantity,
          minStock: editForm.minStock,
          location: editForm.location,
          cookingNotes: editForm.cookingNotes,
          shelfLifeDays: editForm.shelfLifeDays,
          prepRecipe: editForm.prepRecipe,
          status: editForm.quantity <= 0 ? 'Habis' : (editForm.quantity <= editForm.minStock ? 'Menipis' : 'Aman')
        };
      }
      return item;
    });

    onUpdateInventory(updated);
    onNotify?.(`Bahan "${editForm.name}" (${editForm.itemType === 'PREPARED' ? 'Bahan Matang' : 'Bahan Mentah'}) berhasil diperbarui!`, 'success');
    setEditingItem(null);
  };

  // Eksekusi Memasak Dapur (Batch Cooking)
  const handleExecuteBatchCooking = (preparedItem: IngredientStock, cookQty: number, notes?: string) => {
    const result = executeKitchenBatchCooking(preparedItem, cookQty, inventory, currentAdmin);
    if (!result.success) {
      onNotify?.(result.message, 'error');
      return;
    }

    onUpdateInventory(result.updatedInventory);
    result.mutations.forEach(m => onAddMutation(m));
    onNotify?.(result.message, 'success');
  };

  // Filtered Inventory
  const filteredStock = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchLoc = selectedLocation === 'Semua' || (item.location || 'Dapur Aktif') === selectedLocation;
      const matchType = itemTypeFilter === 'ALL' || (item.itemType || 'RAW') === itemTypeFilter;
      return matchSearch && matchCat && matchLoc && matchType;
    });
  }, [inventory, searchQuery, selectedCategory, selectedLocation, itemTypeFilter]);

  // Status metrics
  const totalItemsCount = inventory.length;
  const rawItemsCount = inventory.filter(i => (i.itemType || 'RAW') === 'RAW').length;
  const preparedItemsCount = inventory.filter(i => i.itemType === 'PREPARED').length;
  const lowStockCount = inventory.filter(i => i.status === 'Menipis' || i.status === 'Habis').length;
  const totalStockValuation = inventory.reduce((acc, curr) => acc + (curr.quantity * (curr.costPerUnit || 0)), 0);

  // Helper untuk membuka modal Stock Opname
  const openAdjustmentModal = (item: IngredientStock) => {
    setAdjustingItem(item);
    setPhysicalCount(item.quantity);
    setAdjustmentReason('Selisih Fisik Dapur (Susut Masak / Tercecer)');
    setIsAdjustmentOpen(true);
  };

  // Eksekusi Stock Opname / Penyesuaian Fisik
  const handleSaveAdjustment = () => {
    if (!adjustingItem) return;

    const diff = physicalCount - adjustingItem.quantity;
    if (diff === 0) {
      onNotify?.('Jumlah fisik sama dengan data sistem, tidak ada penyesuaian.', 'warning');
      setIsAdjustmentOpen(false);
      return;
    }

    const updatedQty = physicalCount;
    const newStatus = updatedQty <= 0 ? 'Habis' : (updatedQty <= (adjustingItem.minStock || 10) ? 'Menipis' : 'Aman');

    const updatedInventory = inventory.map(i => 
      i.id === adjustingItem.id 
        ? { ...i, quantity: updatedQty, status: newStatus } 
        : i
    );
    onUpdateInventory(updatedInventory);

    // Catat Mutasi
    const mutation: StockMutation = {
      id: `MUT-${Date.now().toString().slice(-4)}`,
      ingredientId: adjustingItem.id,
      ingredientName: adjustingItem.name,
      type: 'ADJUSTMENT',
      quantity: diff,
      unit: adjustingItem.unit,
      notes: `${adjustmentReason} (Sistem: ${adjustingItem.quantity} -> Fisik: ${physicalCount})`,
      date: new Date().toISOString().split('T')[0],
      performedBy: currentAdmin
    };
    onAddMutation(mutation);

    onNotify?.(`Penyesuaian stok "${adjustingItem.name}" berhasil dicatat (${diff > 0 ? `+${diff}` : diff} ${adjustingItem.unit})`, 'success');
    setIsAdjustmentOpen(false);
  };

  // Eksekusi Pembelian Bahan Cepat (Barang Masuk + Beban Belanja)
  const handleSavePurchase = () => {
    let targetIngredientId = purchaseForm.ingredientId;
    let targetName = '';
    let targetUnit = purchaseForm.unit;

    if (purchaseForm.ingredientId === 'NEW') {
      if (!purchaseForm.newName.trim()) {
        onNotify?.('Nama bahan baru wajib diisi', 'error');
        return;
      }
      targetIngredientId = `ing_${Date.now()}`;
      targetName = purchaseForm.newName.trim();
      
      const newIng: IngredientStock = {
        id: targetIngredientId,
        name: targetName,
        quantity: purchaseForm.quantity,
        unit: purchaseForm.unit,
        minStock: 10,
        costPerUnit: purchaseForm.quantity > 0 ? Math.round(purchaseForm.totalCost / purchaseForm.quantity) : 0,
        category: purchaseForm.category,
        location: purchaseForm.location,
        status: purchaseForm.quantity > 10 ? 'Aman' : 'Menipis'
      };
      onUpdateInventory([newIng, ...inventory]);
    } else {
      const existing = inventory.find(i => i.id === targetIngredientId);
      if (!existing) {
        onNotify?.('Pilih bahan yang ingin dibeli', 'error');
        return;
      }
      targetName = existing.name;
      targetUnit = existing.unit;

      const newQty = existing.quantity + purchaseForm.quantity;
      const newStatus = newQty <= 0 ? 'Habis' : (newQty <= (existing.minStock || 10) ? 'Menipis' : 'Aman');
      const unitCost = purchaseForm.quantity > 0 ? Math.round(purchaseForm.totalCost / purchaseForm.quantity) : existing.costPerUnit;

      const updatedInventory = inventory.map(i => 
        i.id === targetIngredientId
          ? { ...i, quantity: newQty, status: newStatus, costPerUnit: unitCost }
          : i
      );
      onUpdateInventory(updatedInventory);
    }

    // Catat Mutasi Barang Masuk
    const mutation: StockMutation = {
      id: `MUT-${Date.now().toString().slice(-4)}`,
      ingredientId: targetIngredientId,
      ingredientName: targetName,
      type: 'IN_PURCHASE',
      quantity: purchaseForm.quantity,
      unit: targetUnit,
      notes: `${purchaseForm.notes} (Total Rp ${purchaseForm.totalCost.toLocaleString()})`,
      date: new Date().toISOString().split('T')[0],
      performedBy: currentAdmin,
      cost: purchaseForm.totalCost
    };
    onAddMutation(mutation);

    // Catat Pengeluaran Finansial jika ada biaya
    if (purchaseForm.totalCost > 0 && onAddExpense) {
      const expense: Expense = {
        id: `exp_${Date.now()}`,
        name: `Belanja Bahan: ${targetName} (${purchaseForm.quantity} ${targetUnit})`,
        amount: purchaseForm.quantity,
        unit: targetUnit,
        totalCost: purchaseForm.totalCost,
        date: new Date().toISOString().split('T')[0],
        recordedBy: currentAdmin,
        category: 'Bahan Baku'
      };
      onAddExpense(expense);
    }

    onNotify?.(`Pembelian ${purchaseForm.quantity} ${targetUnit} ${targetName} berhasil masuk ke ${purchaseForm.location}`, 'success');
    setIsPurchaseOpen(false);
    setPurchaseForm({
      ingredientId: '',
      newName: '',
      category: 'Bahan Pokok',
      quantity: 0,
      unit: 'kg',
      totalCost: 0,
      location: 'Dapur Aktif',
      notes: 'Belanja stok katering'
    });
  };

  // Tambah Master Bahan Baru
  const handleSaveNewItem = () => {
    if (!newItemForm.name.trim()) {
      onNotify?.('Nama bahan tidak boleh kosong', 'error');
      return;
    }

    const newId = `ing_${Date.now()}`;
    const calculatedCost = newItemForm.costPerUnit || (newItemForm.purchasePrice > 0 ? Math.round(newItemForm.purchasePrice / (newItemForm.yieldQty || 1)) : 0);

    const newStock: IngredientStock = {
      id: newId,
      itemNo: `${inventory.length + 1}`,
      name: newItemForm.name.trim(),
      itemType: newItemForm.itemType,
      category: newItemForm.category,
      purchaseUnit: newItemForm.purchaseUnit || '1000 gr',
      purchasePrice: newItemForm.purchasePrice || 0,
      yieldQty: newItemForm.yieldQty || 1,
      quantity: newItemForm.quantity || 0,
      unit: newItemForm.unit || 'porsi',
      minStock: newItemForm.minStock || 10,
      costPerUnit: calculatedCost,
      location: newItemForm.location,
      cookingNotes: newItemForm.cookingNotes,
      shelfLifeDays: newItemForm.shelfLifeDays,
      prepRecipe: newItemForm.prepRecipe,
      status: (newItemForm.quantity || 0) <= 0 ? 'Habis' : ((newItemForm.quantity || 0) <= (newItemForm.minStock || 10) ? 'Menipis' : 'Aman')
    };

    onUpdateInventory([newStock, ...inventory]);

    if (newStock.quantity > 0) {
      onAddMutation({
        id: `MUT-${Date.now().toString().slice(-4)}`,
        ingredientId: newId,
        ingredientName: newStock.name,
        type: 'IN_PURCHASE',
        quantity: newStock.quantity,
        unit: newStock.unit,
        notes: 'Inisialisasi Master Barang',
        date: new Date().toISOString().split('T')[0],
        performedBy: currentAdmin
      });
    }

    onNotify?.(`Bahan "${newStock.name}" (${newStock.itemType === 'PREPARED' ? 'Bahan Matang' : 'Bahan Mentah'}) berhasil didaftarkan`, 'success');
    setIsNewItemOpen(false);
    setNewItemForm({
      name: '',
      itemType: 'RAW',
      category: 'Bahan Pokok',
      purchaseUnit: '1000 gr',
      purchasePrice: 0,
      yieldQty: 1,
      costPerUnit: 0,
      unit: 'porsi',
      quantity: 0,
      minStock: 10,
      location: 'Dapur Aktif',
      cookingNotes: '',
      shelfLifeDays: 1,
      prepRecipe: []
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-3.5 sm:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Sistem Persediaan Terintegrasi
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Manajemen Stok & Produksi (BOM)</h2>
          <p className="text-slate-400 font-medium text-xs sm:text-sm mt-1">
            Pantau stok bahan di gudang & dapur aktif, kurangi otomatis per pesanan, dan sesuaikan fisik 1-klik.
          </p>
        </div>

        {/* TOP METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-xs min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5 sm:mb-1">Total Katalog</p>
            <p className="text-base sm:text-2xl font-black text-slate-950 truncate">{totalItemsCount} <span className="text-xs font-bold text-slate-600">item</span></p>
          </div>
          <div className="bg-amber-50/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-amber-200 shadow-xs min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-amber-900 uppercase tracking-wider mb-0.5 sm:mb-1">Tipe Bahan Dapur</p>
            <p className="text-xs sm:text-sm font-black text-slate-950 mt-1 truncate">
              <span className="text-slate-700">{rawItemsCount} Mentah</span> • <span className="text-amber-800">{preparedItemsCount} Matang</span>
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-xs min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5 sm:mb-1">Stok Kritis</p>
            <p className={`text-base sm:text-2xl font-black truncate ${lowStockCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
              {lowStockCount} <span className="text-xs font-bold text-slate-600">item</span>
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-xs min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5 sm:mb-1">Valuasi Stok</p>
            <p className="text-base sm:text-2xl font-black text-slate-950 truncate">Rp {Math.round(totalStockValuation).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 pb-3 sm:pb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl border-2 border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'stock'
                ? 'bg-white text-slate-950 shadow border border-slate-300 font-black'
                : 'text-slate-700 hover:text-slate-950 font-bold'
            }`}
          >
            <Package size={15} /> <span>Stok Realtime</span>
          </button>
          <button
            onClick={() => setActiveTab('purchasing')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'purchasing'
                ? 'bg-white text-slate-950 shadow border border-slate-300 font-black'
                : 'text-slate-700 hover:text-slate-950 font-bold'
            }`}
          >
            <ShoppingCart size={15} /> <span>Belanja & Masuk</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-white text-slate-950 shadow border border-slate-300 font-black'
                : 'text-slate-700 hover:text-slate-950 font-bold'
            }`}
          >
            <Clock size={15} /> <span>Riwayat Mutasi</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              const csv = generateMasterTemplateCsv(inventory, allCategories);
              downloadCsvFile('Master_Bahan_Baku_Katering.csv', csv);
              onNotify?.('Data Master Bahan Baku berhasil diekspor ke CSV!', 'success');
            }}
            className="px-3 sm:px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
            title="Download Template / Ekspor Master Bahan CSV"
          >
            <Download size={15} /> <span className="hidden sm:inline">Format Excel</span>
          </button>
          <button
            onClick={() => setIsManageCategoriesOpen(true)}
            className="px-3 sm:px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 border-amber-300 active:scale-95"
            title="Kelola, Tambah, Edit Nama, atau Hapus Kategori Bahan"
          >
            <Layers size={15} className="text-amber-700" /> <span>Kelola Kategori</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 sm:px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 border-emerald-300 active:scale-95"
            title="Import Spreadsheet Master Bahan Baku"
          >
            <FileSpreadsheet size={15} /> <span>Import Spreadsheet</span>
          </button>
          <button
            onClick={() => {
              setCookPreselectedId(undefined);
              setIsCookModalOpen(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 border border-amber-400"
            title="Olah Bahan Mentah Jadi Bahan Matang (Batch Cooking)"
          >
            <Flame size={15} className="animate-pulse" /> <span>Masak Dapur</span>
          </button>
          <button
            onClick={() => setActiveTab('purchasing')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <Plus size={15} /> <span>Belanja Masuk</span>
          </button>
          <button
            onClick={() => setIsNewItemOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <Package size={15} /> <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STOK REALTIME & OPNAME */}
      {activeTab === 'stock' && (
        <div className="space-y-4 sm:space-y-6">
          
          {/* FILTER TIPE BAHAN: SEMUA / MENTAH / MATANG */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setItemTypeFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                itemTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Semua Bahan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${itemTypeFilter === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {inventory.length}
              </span>
            </button>
            <button
              onClick={() => setItemTypeFilter('RAW')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                itemTypeFilter === 'RAW'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🥩 Bahan Baku Mentah</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${itemTypeFilter === 'RAW' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {rawItemsCount}
              </span>
            </button>
            <button
              onClick={() => setItemTypeFilter('PREPARED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                itemTypeFilter === 'PREPARED'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-black'
              }`}
            >
              <span>🍲 Bahan Matang / Olahan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${itemTypeFilter === 'PREPARED' ? 'bg-white/25 text-white' : 'bg-amber-200/80 text-amber-900'}`}>
                {preparedItemsCount}
              </span>
            </button>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 sm:gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 w-full min-w-0">
              <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama bahan (contoh: Beras, Ayam Boiler, Rendang, Ayam Ungkep)..."
                className="w-full pl-9 sm:pl-11 pr-3.5 sm:pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Kat:</span>
                <select 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="Semua">Semua Kategori ({inventory.length})</option>
                  {allCategories.map(cat => {
                    const count = inventory.filter(i => (i.category || 'Bahan Pokok') === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tombol Cepat Kelola Kategori di Samping Filter */}
              <button
                type="button"
                onClick={() => setIsManageCategoriesOpen(true)}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                title="Atur Kategori (Tambah, Ubah Nama, Hapus)"
              >
                <Layers size={13} className="text-amber-700" />
                <span className="hidden sm:inline">Kelola</span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Area:</span>
                <select 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                >
                  <option value="Semua">Semua</option>
                  <option value="Dapur Aktif">Dapur</option>
                  <option value="Gudang Utama">Gudang</option>
                </select>
              </div>
            </div>
          </div>

          {/* MOBILE CARDS VIEW OF INVENTORY */}
          <div className="lg:hidden space-y-3">
            {filteredStock.map(item => {
              const isLow = item.quantity <= (item.minStock || 10);
              return (
                <div key={item.id} className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        item.itemType === 'PREPARED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.itemType === 'PREPARED' ? <ChefHat size={16} /> : <Package size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">{item.name}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            item.itemType === 'PREPARED' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.itemType === 'PREPARED' ? '🍲 Matang' : '🥩 Mentah'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{item.category || 'Bahan Pokok'}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
                            <MapPin size={9} className="shrink-0" /> {item.location || 'Dapur Aktif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.quantity <= 0 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                        : isLow 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {item.quantity <= 0 ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Stok Riil / Kritis</p>
                      <p className="font-black text-slate-900 text-sm mt-0.5">
                        {item.quantity.toLocaleString()} <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                        <span className="text-[10px] font-normal text-slate-400 ml-1">/ min {item.minStock || 10}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400">Est. Biaya Satuan</p>
                      <p className="font-black text-slate-900 text-sm mt-0.5">
                        Rp {(item.costPerUnit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center"
                      title="Edit Master Bahan & Kategori"
                    >
                      <Pencil size={13} />
                    </button>
                    {item.itemType === 'PREPARED' ? (
                      <button
                        onClick={() => {
                          setCookPreselectedId(item.id);
                          setIsCookModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all border border-amber-300 flex items-center justify-center gap-1.5"
                      >
                        <Flame size={13} className="text-amber-600 animate-pulse" /> Masak
                      </button>
                    ) : (
                      <button
                        onClick={() => openAdjustmentModal(item)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center justify-center gap-1.5"
                      >
                        <SlidersHorizontal size={13} /> Cek Fisik
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPurchaseForm({
                          ...purchaseForm,
                          ingredientId: item.id,
                          unit: item.unit,
                          category: item.category || 'Bahan Pokok',
                          location: item.location || 'Dapur Aktif',
                          quantity: item.minStock ? Math.max(item.minStock * 2, 10) : 10
                        });
                        setIsPurchaseOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Belanja
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE OF INVENTORY */}
          <div className="hidden lg:block bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-800">
                    <th className="py-3.5 px-6">Nama Bahan</th>
                    <th className="py-3.5 px-6">Kategori & Posisi</th>
                    <th className="py-3.5 px-6 text-right">Stok Riil</th>
                    <th className="py-3.5 px-6 text-right">Batas Kritis</th>
                    <th className="py-3.5 px-6 text-right">Est. Harga Satuan</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                  {filteredStock.map(item => {
                    const isLow = item.quantity <= (item.minStock || 10);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              item.itemType === 'PREPARED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.itemType === 'PREPARED' ? <ChefHat size={16} /> : <Package size={16} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  item.itemType === 'PREPARED' 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {item.itemType === 'PREPARED' ? '🍲 Matang' : '🥩 Mentah'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 mr-2">
                            {item.category || 'Bahan Pokok'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <MapPin size={10} className="text-slate-400" />
                            {item.location || 'Dapur Aktif'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-base font-black text-slate-900">
                            {item.quantity.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 ml-1.5">{item.unit}</span>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-400 font-medium">
                          {item.minStock || 10} {item.unit}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-800">
                          Rp {(item.costPerUnit || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.quantity <= 0 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                              : isLow 
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {item.quantity <= 0 ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Masak Dapur jika Bahan Matang */}
                            {item.itemType === 'PREPARED' && (
                              <button
                                onClick={() => {
                                  setCookPreselectedId(item.id);
                                  setIsCookModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all border border-amber-300 flex items-center gap-1"
                                title="Masak & Tambah Stok Matang"
                              >
                                <Flame size={12} className="text-amber-600 animate-pulse" /> Masak
                              </button>
                            )}

                            {/* Tombol Edit Master Bahan */}
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200"
                              title="Edit Master Bahan & Kategori"
                            >
                              <Pencil size={13} />
                            </button>

                            {/* Tombol Opname / Sesuaikan Fisik */}
                            <button
                              onClick={() => openAdjustmentModal(item)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-200 flex items-center gap-1.5"
                              title="Sesuaikan dengan jumlah fisik riil di dapur"
                            >
                              <SlidersHorizontal size={12} /> Cek Fisik
                            </button>

                            {/* Tombol Belanja Cepat */}
                            <button
                              onClick={() => {
                                setPurchaseForm({
                                  ...purchaseForm,
                                  ingredientId: item.id,
                                  unit: item.unit,
                                  category: item.category || 'Bahan Pokok',
                                  location: item.location || 'Dapur Aktif',
                                  quantity: item.minStock ? Math.max(item.minStock * 2, 10) : 10
                                });
                                setIsPurchaseOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                              title="Beli Tambahan Stok"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStock.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold">Tidak ada bahan yang sesuai pencarian.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PEMBELIAN & BARANG MASUK */}
      {activeTab === 'purchasing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          <div className="lg:col-span-5 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Form Belanja Cepat</h3>
                <p className="text-xs text-slate-400">Barang masuk langsung update stok & catat beban pengeluaran.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Pilih Bahan Baku</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                  value={purchaseForm.ingredientId}
                  onChange={e => {
                    const id = e.target.value;
                    const found = inventory.find(i => i.id === id);
                    setPurchaseForm({
                      ...purchaseForm,
                      ingredientId: id,
                      unit: found ? found.unit : 'kg',
                      category: found?.category || 'Bahan Pokok',
                      location: found?.location || 'Dapur Aktif'
                    });
                  }}
                >
                  <option value="">-- Pilih Bahan dari Master --</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Stok: {i.quantity} {i.unit})</option>
                  ))}
                  <option value="NEW">+ Bahan Baru (Belum Terdaftar)</option>
                </select>
              </div>

              {purchaseForm.ingredientId === 'NEW' && (
                <div className="space-y-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Nama Bahan Baru</label>
                    <input
                      type="text"
                      placeholder="Contoh: Daging Sapi Tetelan, Bawang Bombay..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
                      value={purchaseForm.newName}
                      onChange={e => setPurchaseForm({ ...purchaseForm, newName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Kategori Bahan (Sesuai Spreadsheet)</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
                      value={purchaseForm.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        setPurchaseForm({
                          ...purchaseForm,
                          category: newCat,
                          location: newCat === 'Packaging & Kemasan' ? 'Gudang Utama' : purchaseForm.location
                        });
                      }}
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat} {CATEGORY_DESCRIPTIONS[cat] ? `— (${CATEGORY_DESCRIPTIONS[cat]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Jumlah Belanja</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                    value={purchaseForm.quantity || ''}
                    onChange={e => setPurchaseForm({ ...purchaseForm, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Satuan Ukur</label>
                  <input
                    type="text"
                    placeholder="kg / liter / butir / pcs"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                    value={purchaseForm.unit}
                    onChange={e => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Total Biaya Belanja (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white"
                    value={purchaseForm.totalCost || ''}
                    onChange={e => setPurchaseForm({ ...purchaseForm, totalCost: parseInt(e.target.value) || 0 })}
                  />
                </div>
                {purchaseForm.quantity > 0 && purchaseForm.totalCost > 0 && (
                  <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                    Est. Harga Satuan: Rp {Math.round(purchaseForm.totalCost / purchaseForm.quantity).toLocaleString()} / {purchaseForm.unit}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Tujuan Alokasi</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                    value={purchaseForm.location}
                    onChange={e => setPurchaseForm({ ...purchaseForm, location: e.target.value as any })}
                  >
                    <option value="Dapur Aktif">Dapur Aktif (Langsung Pakai)</option>
                    <option value="Gudang Utama">Gudang Utama (Stok Cadangan)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Catatan / Supplier</label>
                  <input
                    type="text"
                    placeholder="Pasar Induk / Toko Beras Jaya"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                    value={purchaseForm.notes}
                    onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handleSavePurchase}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 size={16} /> Simpan Pembelian & Masuk Stok
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 sm:space-y-6">
            <h3 className="text-sm sm:text-base font-black text-slate-900 pb-3 sm:pb-4 border-b border-slate-100">
              Riwayat Pengadaan Terkini
            </h3>
            <div className="space-y-3">
              {mutations.filter(m => m.type === 'IN_PURCHASE').slice(0, 8).map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ArrowDownLeft size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{m.ingredientName}</p>
                      <p className="text-[10px] text-slate-400">{m.date} • {m.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600">+{m.quantity} {m.unit}</p>
                    {m.cost && <p className="text-[10px] text-slate-500 font-bold">Rp {m.cost.toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT MUTASI LENGKAP (AUDIT TRAIL MEKARI STYLE) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden p-3.5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Buku Mutasi Stok (Audit Trail)</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Rekam jejak setiap butir/gram barang yang masuk, terpakai di pesanan, dan penyesuaian dapur.</p>
            </div>
          </div>

          {/* Mobile View for Mutations */}
          <div className="md:hidden space-y-2.5">
            {mutations.map(m => {
              const isOut = m.quantity < 0 || m.type === 'OUT_PRODUCTION' || m.type === 'COOK_CONSUME';
              return (
                <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{m.ingredientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.date} • #{m.id}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      m.type === 'IN_PURCHASE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.type === 'OUT_PRODUCTION'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : m.type === 'COOK_PRODUCE'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : m.type === 'COOK_CONSUME'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {m.type === 'IN_PURCHASE' ? 'Belanja' : m.type === 'OUT_PRODUCTION' ? 'Produksi' : m.type === 'COOK_PRODUCE' ? 'Hasil Masak' : m.type === 'COOK_CONSUME' ? 'Bahan Olah' : 'Penyesuaian'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                    <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{m.notes || 'Tanpa keterangan'}</p>
                    <span className={`text-xs font-black shrink-0 ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table for Mutations */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Tanggal & ID</th>
                  <th className="py-3 px-4">Bahan Baku</th>
                  <th className="py-3 px-4">Tipe Mutasi</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4">Keterangan / Ref Pesanan</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {mutations.map(m => {
                  const isOut = m.quantity < 0 || m.type === 'OUT_PRODUCTION' || m.type === 'COOK_CONSUME';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-slate-500 block">{m.id}</span>
                        <span className="text-[10px] text-slate-400">{m.date}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">{m.ingredientName}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          m.type === 'IN_PURCHASE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.type === 'OUT_PRODUCTION'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : m.type === 'COOK_PRODUCE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : m.type === 'COOK_CONSUME'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {m.type === 'IN_PURCHASE' ? 'Belanja Masuk' : m.type === 'OUT_PRODUCTION' ? 'Terpakai Produksi' : m.type === 'COOK_PRODUCE' ? '🍲 Hasil Masak Matang' : m.type === 'COOK_CONSUME' ? '🥩 Olah Bahan Mentah' : 'Penyesuaian Fisik'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-black ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.notes}</td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">{m.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: STOCK OPNAME / PENYESUAIAN FISIK (MEKARI STYLE) */}
      {isAdjustmentOpen && adjustingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdjustmentOpen(false)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 p-4 sm:p-7 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Penyesuaian Stok Fisik</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Samakan catatan sistem dengan fisik riil di dapur.</p>
                </div>
              </div>
              <button onClick={() => setIsAdjustmentOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Bahan Baku</p>
                  <p className="text-sm font-black text-slate-900">{adjustingItem.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Tercatat di Sistem</p>
                  <p className="text-sm font-black text-slate-700">{adjustingItem.quantity} {adjustingItem.unit}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">
                  Jumlah Fisik Riil di Dapur ({adjustingItem.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-white border-2 border-indigo-500 rounded-2xl px-5 py-3 text-lg font-black text-slate-900 outline-none"
                    value={physicalCount}
                    onChange={e => setPhysicalCount(parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">
                    {adjustingItem.unit}
                  </span>
                </div>

                {/* Selisih Indicator */}
                <div className="mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Selisih Penyesuaian:</span>
                  <span className={physicalCount - adjustingItem.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {physicalCount - adjustingItem.quantity > 0 ? `+${(physicalCount - adjustingItem.quantity).toFixed(2)}` : (physicalCount - adjustingItem.quantity).toFixed(2)} {adjustingItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">
                  Alasan Penyesuaian
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                >
                  <option value="Selisih Fisik Dapur (Susut Masak / Tercecer)">Selisih Fisik Dapur (Susut Masak / Tercecer)</option>
                  <option value="Barang Rusak / Basi / Kadaluarsa">Barang Rusak / Basi / Kadaluarsa</option>
                  <option value="Koreksi Salah Input Sebelumnya">Koreksi Salah Input Sebelumnya</option>
                  <option value="Hasil Timbangan Ulang Akhir Shift">Hasil Timbangan Ulang Akhir Shift</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handleSaveAdjustment}
                  className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Terapkan Penyesuaian
                </button>
                <button
                  onClick={() => setIsAdjustmentOpen(false)}
                  className="px-6 bg-slate-100 text-slate-500 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MASTER BAHAN (SESUAI FORMAT SPREADSHEET KATERING) */}
      {isNewItemOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsNewItemOpen(false)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 p-4 sm:p-7 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">Tambah Master Bahan Baku Baru</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sesuai Format Master Spreadsheet & HPP</p>
              </div>
              <button onClick={() => setIsNewItemOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Kategori Bahan Sesuai Spreadsheet */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Kategori Bahan (Sesuai Spreadsheet)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-900"
                  value={newItemForm.category}
                  onChange={e => {
                    const cat = e.target.value;
                    setNewItemForm({
                      ...newItemForm,
                      category: cat,
                      location: cat === 'Packaging & Kemasan' ? 'Gudang Utama' : (newItemForm.location || 'Dapur Aktif')
                    });
                  }}
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat} {CATEGORY_DESCRIPTIONS[cat] ? `— (${CATEGORY_DESCRIPTIONS[cat]})` : ''}
                    </option>
                  ))}
                </select>
                {CATEGORY_DESCRIPTIONS[newItemForm.category] && (
                  <p className="mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-lg">
                    💡 Contoh bahan: {CATEGORY_DESCRIPTIONS[newItemForm.category]}
                  </p>
                )}
              </div>

              {/* Nama Bahan Baku */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Nama Bahan Baku</label>
                <input
                  type="text"
                  placeholder="Contoh: Ayam Boiler, Daging Sapi, Beras, Dus Dahayu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-slate-900"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                />
              </div>

              {/* Satuan Beli & Harga Beli (Format Spreadsheet Kolom 4 & 6) */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Satuan Beli Pasar/Supplier</label>
                  <input
                    type="text"
                    placeholder="1000 gr / 1 ekor / 1 pak / 1 bal"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    value={newItemForm.purchaseUnit}
                    onChange={e => setNewItemForm({ ...newItemForm, purchaseUnit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Harga Beli Total (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 40000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    value={newItemForm.purchasePrice || ''}
                    onChange={e => {
                      const pPrice = parseFloat(e.target.value) || 0;
                      const yQty = newItemForm.yieldQty || 1;
                      setNewItemForm({
                        ...newItemForm,
                        purchasePrice: pPrice,
                        costPerUnit: yQty > 0 ? Math.round(pPrice / yQty) : pPrice
                      });
                    }}
                  />
                </div>
              </div>

              {/* Isi / Yield & Harga Satuan Resep (Format Spreadsheet Kolom 7 & 8) */}
              <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Isi / Yield / Porsi</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="1"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                    value={newItemForm.yieldQty || ''}
                    onChange={e => {
                      const yQty = parseFloat(e.target.value) || 1;
                      const pPrice = newItemForm.purchasePrice || 0;
                      setNewItemForm({
                        ...newItemForm,
                        yieldQty: yQty,
                        costPerUnit: yQty > 0 && pPrice > 0 ? Math.round(pPrice / yQty) : newItemForm.costPerUnit
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Satuan Resep</label>
                  <input
                    type="text"
                    placeholder="porsi / ptg / pcs"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Est. Biaya Resep</label>
                  <input
                    type="number"
                    placeholder="Rp Satuan"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-black text-indigo-900 outline-none"
                    value={newItemForm.costPerUnit || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, costPerUnit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Stok Awal & Batas Kritis */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Stok Awal ({newItemForm.unit || 'unit'})</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    value={newItemForm.quantity || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Batas Kritis (Min. Alert)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    value={newItemForm.minStock || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, minStock: parseFloat(e.target.value) || 10 })}
                  />
                </div>
              </div>

              {/* Area Penyimpanan */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Area Penyimpanan</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  value={newItemForm.location}
                  onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value as any })}
                >
                  <option value="Dapur Aktif">Dapur Aktif</option>
                  <option value="Gudang Utama">Gudang Utama</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handleSaveNewItem}
                  className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Simpan ke Katalog
                </button>
                <button
                  onClick={() => setIsNewItemOpen(false)}
                  className="px-6 bg-slate-100 text-slate-500 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MASTER BAHAN BAKU & KATEGORI */}
      {editingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 p-4 sm:p-7 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">Edit Master Bahan Baku</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sesuaikan Kategori & Detail Satuan</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Kategori Bahan Sesuai Spreadsheet */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Kategori Bahan (Sesuai Spreadsheet)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-900"
                  value={editForm.category}
                  onChange={e => {
                    const cat = e.target.value;
                    setEditForm({
                      ...editForm,
                      category: cat,
                      location: cat === 'Packaging & Kemasan' ? 'Gudang Utama' : editForm.location
                    });
                  }}
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat} {CATEGORY_DESCRIPTIONS[cat] ? `— (${CATEGORY_DESCRIPTIONS[cat]})` : ''}
                    </option>
                  ))}
                </select>
                {CATEGORY_DESCRIPTIONS[editForm.category] && (
                  <p className="mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-lg">
                    💡 Contoh bahan: {CATEGORY_DESCRIPTIONS[editForm.category]}
                  </p>
                )}
              </div>

              {/* Nama Bahan Baku */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Nama Bahan Baku</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-slate-900"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              {/* Satuan Beli & Harga Beli */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Satuan Beli Pasar/Supplier</label>
                  <input
                    type="text"
                    placeholder="1000 gr / 1 ekor / 1 pak / 1 bal"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    value={editForm.purchaseUnit}
                    onChange={e => setEditForm({ ...editForm, purchaseUnit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Harga Beli Total (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 40000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    value={editForm.purchasePrice || ''}
                    onChange={e => {
                      const pPrice = parseFloat(e.target.value) || 0;
                      const yQty = editForm.yieldQty || 1;
                      setEditForm({
                        ...editForm,
                        purchasePrice: pPrice,
                        costPerUnit: yQty > 0 ? Math.round(pPrice / yQty) : pPrice
                      });
                    }}
                  />
                </div>
              </div>

              {/* Isi / Yield & Harga Satuan Resep */}
              <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Isi / Yield / Porsi</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="1"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                    value={editForm.yieldQty || ''}
                    onChange={e => {
                      const yQty = parseFloat(e.target.value) || 1;
                      const pPrice = editForm.purchasePrice || 0;
                      setEditForm({
                        ...editForm,
                        yieldQty: yQty,
                        costPerUnit: yQty > 0 && pPrice > 0 ? Math.round(pPrice / yQty) : editForm.costPerUnit
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Satuan Resep</label>
                  <input
                    type="text"
                    placeholder="porsi / ptg / pcs"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-700 mb-1.5 block">Est. Biaya Resep</label>
                  <input
                    type="number"
                    placeholder="Rp Satuan"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-black text-indigo-900 outline-none"
                    value={editForm.costPerUnit || ''}
                    onChange={e => setEditForm({ ...editForm, costPerUnit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Stok Saat Ini & Batas Kritis */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Stok Riil ({editForm.unit || 'unit'})</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    value={editForm.quantity || ''}
                    onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Batas Kritis (Min. Alert)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    value={editForm.minStock || ''}
                    onChange={e => setEditForm({ ...editForm, minStock: parseFloat(e.target.value) || 10 })}
                  />
                </div>
              </div>

              {/* Area Penyimpanan */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Area Penyimpanan</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value as any })}
                >
                  <option value="Dapur Aktif">Dapur Aktif</option>
                  <option value="Gudang Utama">Gudang Utama</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Simpan Perubahan
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-6 bg-slate-100 text-slate-500 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL IMPORT MASTER BAHAN SPREADSHEET */}
      <ImportIngredientsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingInventory={inventory}
        activeCategories={allCategories}
        onImportSuccess={(newInv) => {
          onUpdateInventory(newInv);
        }}
        onAddDiscoveredCategories={(newCats) => {
          if (onUpdateIngredientCategories) {
            const current = allCategories;
            const toAdd = newCats.filter(c => !current.some(x => x.toLowerCase() === c.toLowerCase()));
            if (toAdd.length > 0) {
              onUpdateIngredientCategories([...current, ...toAdd]);
            }
          }
        }}
        onNotify={onNotify}
      />

      {/* MODAL KELOLA KATEGORI MASTER BAHAN BAKU */}
      <ManageIngredientCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={allCategories}
        inventory={inventory}
        onUpdateCategories={(newCats) => {
          if (onUpdateIngredientCategories) {
            onUpdateIngredientCategories(newCats);
          }
        }}
        onUpdateInventory={onUpdateInventory}
        onNotify={onNotify}
      />

      {/* MODAL MASAK DAPUR (BATCH COOKING DARI BAHAN MENTAH KE MATANG) */}
      <KitchenBatchCookingModal
        isOpen={isCookModalOpen}
        onClose={() => {
          setIsCookModalOpen(false);
          setCookPreselectedId(undefined);
        }}
        inventory={inventory}
        preselectedPreparedIngredientId={cookPreselectedId}
        onExecuteCook={handleExecuteBatchCooking}
        onNotify={onNotify}
      />
    </div>
  );
};

export default InventoryManager;
