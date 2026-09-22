import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Sparkles, Trash2, Loader2, X, Image as ImageIcon, Save, CheckCircle, 
  Upload, Share2, Copy, QrCode, ExternalLink, Check, Tag, AlertCircle, 
  ListPlus, Box, BrainCircuit, Target, TrendingUp, Lightbulb, Wand2, 
  PencilLine, PackageOpen, Calculator, DollarSign, ArrowUpRight, 
  RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { MenuItem, MenuRecipe, IngredientStock } from '../types';
import { optimizeMenuDescription, analyzeMenuAppeal } from '../services/geminiService';

interface MenuManagerProps {
  menu: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
  categories: string[];
  onUpdateCategories: (categories: string[]) => void;
  inventory: IngredientStock[];
  onUpdateInventory?: (inventory: IngredientStock[]) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ 
  menu, 
  onUpdateMenu, 
  categories, 
  onUpdateCategories, 
  inventory, 
  onUpdateInventory,
  onNotify 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyzingInModal, setAnalyzingInModal] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [modalAiInsight, setModalAiInsight] = useState<any>(null);
  const [tempPackageItem, setTempPackageItem] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  
  // Filter kategori bahan di dropdown resep
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState<string>('Semua');

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: categories[0] || '',
    price: 0,
    cost: 0,
    description: '',
    imageUrl: '',
    recipe: [],
    packageItems: []
  });
  
  const [newIngredient, setNewIngredient] = useState<{
    ingredientId: string;
    amountPerUnit: number;
    unit: string;
  }>({
    ingredientId: '',
    amountPerUnit: 1,
    unit: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hitung total HPP bahan resep
  const totalRecipeHpp = useMemo(() => {
    return (formData.recipe || []).reduce((sum, item) => {
      const subtotal = item.subtotalCost ?? ((item.amountPerUnit || 0) * (item.unitCost || 0));
      return sum + subtotal;
    }, 0);
  }, [formData.recipe]);

  // Breakdown HPP: Bahan Pangan vs Packaging
  const hppBreakdown = useMemo(() => {
    let foodCost = 0;
    let packCost = 0;

    (formData.recipe || []).forEach(item => {
      const subtotal = item.subtotalCost ?? ((item.amountPerUnit || 0) * (item.unitCost || 0));
      const cat = (item.category || '').toLowerCase();
      if (cat.includes('pack') || cat.includes('kemas') || cat.includes('box')) {
        packCost += subtotal;
      } else {
        foodCost += subtotal;
      }
    });

    return { foodCost, packCost, total: foodCost + packCost };
  }, [formData.recipe]);

  // Hitung Margin & Laba Kotor saat ini
  const currentSellingPrice = formData.price || 0;
  const currentCost = formData.cost && formData.cost > 0 ? formData.cost : totalRecipeHpp;
  const currentGrossProfit = currentSellingPrice - currentCost;
  const currentMarginPercent = currentSellingPrice > 0 ? (currentGrossProfit / currentSellingPrice) * 100 : 0;

  // Daftar kategori bahan yang ada di inventaris
  const ingredientCategories = useMemo(() => {
    const cats = Array.from(new Set(inventory.map(i => i.category || 'Bahan Pokok')));
    return ['Semua', ...cats];
  }, [inventory]);

  // Filter bahan baku untuk dropdown
  const filteredInventoryForRecipe = useMemo(() => {
    if (selectedIngredientCategory === 'Semua') return inventory;
    return inventory.filter(i => (i.category || 'Bahan Pokok') === selectedIngredientCategory);
  }, [inventory, selectedIngredientCategory]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setModalAiInsight(null);
    setNewCategoryInput('');
    setFormData({
      name: '',
      category: categories[0] || '',
      price: 0,
      cost: 0,
      description: '',
      imageUrl: '',
      recipe: [],
      packageItems: []
    });
    setNewIngredient({ ingredientId: '', amountPerUnit: 1, unit: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingId(item.id);
    setModalAiInsight(null);
    setNewCategoryInput('');
    
    // Pastikan resep terisi unitCost & subtotalCost jika ada di inventaris
    const enrichedRecipe = (item.recipe || []).map(r => {
      const inv = inventory.find(i => i.id === r.ingredientId);
      const unitCost = r.unitCost ?? (inv?.costPerUnit || 0);
      const subtotalCost = r.subtotalCost ?? Math.round((r.amountPerUnit || 0) * unitCost);
      const category = r.category ?? inv?.category;
      return {
        ...r,
        unitCost,
        subtotalCost,
        category
      };
    });

    const calculatedCost = enrichedRecipe.reduce((sum, r) => sum + (r.subtotalCost || 0), 0);

    setFormData({ 
      ...item, 
      recipe: enrichedRecipe,
      cost: item.cost && item.cost > 0 ? item.cost : calculatedCost,
      packageItems: item.packageItems || [] 
    });
    setNewIngredient({ ingredientId: '', amountPerUnit: 1, unit: '' });
    setIsModalOpen(true);
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    
    if (categories.includes(trimmed)) {
      setFormData({ ...formData, category: trimmed });
      setNewCategoryInput('');
      return;
    }

    onUpdateCategories([...categories, trimmed]);
    setFormData({ ...formData, category: trimmed });
    setNewCategoryInput('');
    onNotify?.(`Kategori "${trimmed}" berhasil ditambahkan!`, 'success');
  };

  const handleAiWriteDescription = async () => {
    if (!formData.name) {
      return onNotify?.('Beri nama menu dulu agar AI bisa menulis deskripsi!', 'warning');
    }
    
    setIsAiWriting(true);
    try {
      const ingredientNames = formData.recipe?.map(r => r.name) || [];
      const polishedDesc = await optimizeMenuDescription(formData.name, formData.description || '', ingredientNames);
      setFormData(prev => ({ ...prev, description: polishedDesc || prev.description }));
      onNotify?.('Deskripsi telah dipoles secara gourmet oleh AI!', 'success');
    } catch (error) {
      onNotify?.('Gagal memanggil AI Writer.', 'error');
    } finally {
      setIsAiWriting(false);
    }
  };

  const handleAnalyzeInModal = async () => {
    if (!formData.name || !formData.description) {
      return onNotify?.('Lengkapi Nama dan Deskripsi sebelum menganalisis strategi!', 'warning');
    }
    setAnalyzingInModal(true);
    setModalAiInsight(null);
    try {
      const insight = await analyzeMenuAppeal(formData as MenuItem);
      setModalAiInsight(insight);
      onNotify?.('Strategi pemasaran AI telah dirangkai!', 'success');
    } catch (error) {
      onNotify?.('Gagal mendapatkan insight AI.', 'error');
    } finally {
      setAnalyzingInModal(false);
    }
  };

  // TAMBAH BAHAN KE RESEP & HITUNG HPP OTOMATIS
  const handleAddIngredientToRecipe = () => {
    if (!newIngredient.ingredientId || !newIngredient.amountPerUnit || newIngredient.amountPerUnit <= 0) {
      onNotify?.('Pilih bahan dan tentukan jumlah pakai!', 'warning');
      return;
    }
    const invItem = inventory.find(i => i.id === newIngredient.ingredientId);
    if (!invItem) return;

    const unitCost = invItem.costPerUnit || 0;
    const amount = Number(newIngredient.amountPerUnit);
    const subtotalCost = Math.round(unitCost * amount);

    const recipeItem: MenuRecipe = {
      ingredientId: invItem.id,
      name: invItem.name,
      amountPerUnit: amount,
      unit: invItem.unit,
      unitCost: unitCost,
      subtotalCost: subtotalCost,
      category: invItem.category,
      itemType: invItem.itemType || 'RAW'
    };

    const updatedRecipe = [...(formData.recipe || []), recipeItem];
    const newTotalCost = updatedRecipe.reduce((sum, item) => sum + (item.subtotalCost || 0), 0);

    setFormData({
      ...formData,
      recipe: updatedRecipe,
      cost: newTotalCost // Update otomatis HPP modal menu
    });

    setNewIngredient({ ingredientId: '', amountPerUnit: 1, unit: '' });
    onNotify?.(`${invItem.name} ditambahkan ke resep (+Rp ${subtotalCost.toLocaleString()})`, 'success');
  };

  // HAPUS BAHAN DARI RESEP & REKALKULASI HPP
  const handleRemoveRecipeItem = (idx: number) => {
    const updatedRecipe = (formData.recipe || []).filter((_, i) => i !== idx);
    const newTotalCost = updatedRecipe.reduce((sum, item) => {
      const sub = item.subtotalCost ?? ((item.amountPerUnit || 0) * (item.unitCost || 0));
      return sum + sub;
    }, 0);

    setFormData({
      ...formData,
      recipe: updatedRecipe,
      cost: newTotalCost
    });
  };

  // TERAPKAN PRESET MARGIN KE HARGA JUAL
  const applyMarginTarget = (targetMarginPercent: number) => {
    const cost = totalRecipeHpp > 0 ? totalRecipeHpp : (formData.cost || 0);
    if (cost <= 0) {
      onNotify?.('Masukkan bahan resep atau isi HPP terlebih dahulu!', 'warning');
      return;
    }

    // Formula: SellingPrice = Cost / (1 - targetMargin)
    // Dibulatkan ke kelipatan Rp 500 terdekat
    const calculatedPrice = Math.ceil((cost / (1 - (targetMarginPercent / 100))) / 500) * 500;
    setFormData(prev => ({
      ...prev,
      price: calculatedPrice,
      cost: cost
    }));

    onNotify?.(`Harga jual diatur ke Rp ${calculatedPrice.toLocaleString()} (Target Margin ${targetMarginPercent}%)`, 'success');
  };

  const handleAddPackageItem = () => {
    if (!tempPackageItem.trim()) return;
    setFormData(prev => ({
      ...prev,
      packageItems: [...(prev.packageItems || []), tempPackageItem.trim()]
    }));
    setTempPackageItem('');
  };

  const handleRemovePackageItem = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      packageItems: (prev.packageItems || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSaveItem = () => {
    if (!formData.name?.trim()) return onNotify?.('Nama hidangan wajib diisi!', 'error');
    if (!formData.price || formData.price <= 0) return onNotify?.('Harga jual harus lebih dari 0!', 'error');

    const finalCost = formData.cost && formData.cost > 0 ? formData.cost : totalRecipeHpp;

    if (editingId) {
      const updatedMenu = menu.map(item => 
        item.id === editingId ? { ...item, ...formData, cost: finalCost } as MenuItem : item
      );
      onUpdateMenu(updatedMenu);
      onNotify?.(`${formData.name} berhasil diperbarui (HPP: Rp ${finalCost.toLocaleString()}).`, 'success');
    } else {
      const newItem: MenuItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Menu Baru',
        category: formData.category || categories[0] || 'Uncategorized',
        price: Number(formData.price) || 0,
        cost: Number(finalCost) || 0,
        description: formData.description || '',
        salesCount: 0,
        recipe: formData.recipe || [],
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        packageItems: formData.packageItems || []
      };
      onUpdateMenu([newItem, ...menu]);
      onNotify?.(`${formData.name} ditambahkan ke katalog menu.`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOP BAR HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Katalog Menu & HPP</h2>
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Kalkulasi Otomatis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Hitung HPP otomatis saat meracik bahan resep dan atur margin keuntungan hidangan katering.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-wider shadow-md active:scale-95 shrink-0"
        >
          <Plus size={16} /> Tambah Menu Baru
        </button>
      </div>

      {/* GRID MENU CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {menu.map((item) => {
          // Hitung HPP dan Margin untuk card
          const itemRecipeCost = (item.recipe || []).reduce((sum, r) => {
            const sub = r.subtotalCost ?? ((r.amountPerUnit || 0) * (r.unitCost || 0));
            return sum + sub;
          }, 0);

          const itemHpp = item.cost && item.cost > 0 ? item.cost : itemRecipeCost;
          const profit = item.price - itemHpp;
          const marginPercent = item.price > 0 ? (profit / item.price) * 100 : 0;

          return (
            <div key={item.id} className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-200">
              <div className="h-44 sm:h-48 overflow-hidden relative">
                <img 
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow border border-slate-200">
                  {item.category}
                </div>

                {/* MARGIN BADGE OVER IMAGE */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black shadow ${
                    marginPercent >= 35 
                      ? 'bg-emerald-600 text-white' 
                      : marginPercent >= 20 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-rose-600 text-white'
                  }`}>
                    {marginPercent >= 0 ? `+${marginPercent.toFixed(0)}%` : `${marginPercent.toFixed(0)}%`} Margin
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-slate-950 text-base tracking-tight leading-snug">{item.name}</h3>
                  <span className="text-slate-950 font-black text-base whitespace-nowrap ml-2">
                    Rp {item.price.toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-600 text-xs font-medium leading-relaxed mb-4 line-clamp-2 italic">
                  "{item.description || 'Hidangan lezat katering pilihan.'}"
                </p>

                {/* HPP & PROFIT STRIP */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">HPP Modal:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      Rp {itemHpp.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Untung Kotor:</span>
                    <span className={`font-black text-sm ${profit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      Rp {profit.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* PACKAGE ITEMS */}
                {item.packageItems && item.packageItems.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <PackageOpen size={13} /> Isi Paket ({item.packageItems.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.packageItems.slice(0, 4).map((p, i) => (
                        <span key={i} className="text-[10px] font-bold bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-100">
                          {p}
                        </span>
                      ))}
                      {item.packageItems.length > 4 && (
                        <span className="text-[10px] font-bold text-indigo-500 py-0.5 px-1">
                          +{item.packageItems.length - 4} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* INGREDIENTS PRODUCTION BADGES */}
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Box size={13} className="text-amber-600" /> Komponen Resep ({item.recipe?.length || 0})
                    </p>
                    {itemRecipeCost > 0 && (
                      <span className="text-[10px] font-black text-emerald-700">
                        Total: Rp {itemRecipeCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.recipe?.map((r, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                        {r.name} ({r.amountPerUnit} {r.unit})
                      </span>
                    ))}
                    {(!item.recipe || item.recipe.length === 0) && (
                      <span className="text-[11px] text-slate-400 italic">Resep belum diisi</span>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="flex-1 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs"
                  >
                    Edit Resep & HPP
                  </button>
                  <button 
                    className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-rose-200" 
                    onClick={() => onUpdateMenu(menu.filter(m => m.id !== item.id))}
                    title="Hapus Menu"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL EDIT / TAMBAH MENU BESERTA KALKULATOR HPP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] border-2 border-slate-200">
            
            {/* MODAL HEADER */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {editingId ? 'Edit Menu & Kalkulasi HPP Resep' : 'Tambah Menu Baru & Racik HPP'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    HPP dihitung otomatis per bahan baku (bahan pokok, lauk, sayur, bumbu, packaging).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 sm:p-8 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* LEFT COLUMN: IDENTITAS MENU & HARGA JUAL (Lg: 4 Cols) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* IMAGE PREVIEW */}
                <div className="h-36 sm:h-40 rounded-2xl bg-slate-100 overflow-hidden relative group border-2 border-slate-200">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Unggah Foto Hidangan</span>
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-black text-xs uppercase tracking-wider"
                  >
                    Ganti Foto
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                {/* NAMA MENU */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block tracking-wider">
                    Nama Hidangan / Paket Katering
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                    placeholder="Contoh: Nasi Box Ayam Bakar Dahayu" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>

                {/* KATEGORI */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block flex items-center gap-1.5">
                      <Tag size={12} className="text-indigo-600" /> Kategori Menu
                    </label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none placeholder:text-slate-400" 
                      placeholder="+ Kategori baru..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                    />
                    <button 
                      onClick={handleAddNewCategory}
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-bold"
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* KALKULATOR HARGA JUAL & MARGIN PROFIT */}
                <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-700" /> Kalkulator Margin & Harga
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Live
                    </span>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">HPP Modal Resep</span>
                      <span className="text-sm sm:text-base font-black text-emerald-700">
                        Rp {totalRecipeHpp.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Untung Kotor</span>
                      <span className={`text-sm sm:text-base font-black ${currentGrossProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        Rp {currentGrossProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* MARGIN STATUS BADGE */}
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs">
                    <span className="text-[11px] font-bold text-slate-600">Margin Keuntungan:</span>
                    <span className={`font-black px-2.5 py-0.5 rounded-md ${
                      currentMarginPercent >= 35 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : currentMarginPercent >= 20 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentMarginPercent.toFixed(1)}% {currentMarginPercent >= 35 ? '(Ideal)' : currentMarginPercent >= 20 ? '(Cukup)' : '(Tipis)'}
                    </span>
                  </div>

                  {/* INPUT HARGA JUAL */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-700 mb-1.5 block">
                      Harga Jual Menu (Rp / Porsi)
                    </label>
                    <input 
                      type="number" 
                      className="w-full bg-white border-2 border-emerald-400 rounded-xl px-4 py-2.5 text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20" 
                      placeholder="Contoh: 35000" 
                      value={formData.price || ''} 
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    />
                  </div>

                  {/* PRESET TARGET MARGIN CEPAT */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                      Rekomendasi Harga Berdasarkan Target Margin:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[30, 40, 50].map(pct => {
                        const cost = totalRecipeHpp > 0 ? totalRecipeHpp : (formData.cost || 0);
                        const recPrice = cost > 0 ? Math.ceil((cost / (1 - (pct / 100))) / 500) * 500 : 0;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => applyMarginTarget(pct)}
                            className="bg-white hover:bg-emerald-600 hover:text-white text-slate-800 p-2 rounded-lg border border-emerald-200 text-center transition-all group"
                          >
                            <span className="text-[10px] font-bold block">{pct}%</span>
                            <span className="text-[11px] font-black block">
                              {recPrice > 0 ? `${(recPrice / 1000).toFixed(0)}k` : '-'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ISI PAKET / RINCIAN KONSUMSI */}
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-3">
                  <label className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                    <PackageOpen size={14} className="text-indigo-600" /> Rincian Isi Paket (Muncul di Nota)
                  </label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Contoh: Nasi, Ayam, Sambal, Dus 20x20..." 
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      value={tempPackageItem}
                      onChange={e => setTempPackageItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddPackageItem()}
                    />
                    <button 
                      onClick={handleAddPackageItem} 
                      className="bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 text-xs font-bold"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formData.packageItems?.map((item, idx) => (
                      <div key={idx} className="bg-white border border-indigo-200 pl-2.5 pr-1 py-0.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-700">{item}</span>
                        <button onClick={() => handleRemovePackageItem(idx)} className="p-0.5 text-slate-400 hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* MIDDLE COLUMN: FORMULA RESEP & HPP BREAKDOWN (Lg: 5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* DESKRIPSI MENU */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Deskripsi Menu
                    </label>
                    <button 
                      onClick={handleAiWriteDescription}
                      disabled={isAiWriting}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[10px] font-bold tracking-wider"
                    >
                      {isAiWriting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      AI Auto-Writer
                    </button>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none" 
                    rows={3} 
                    placeholder="Contoh: Paket nasi kotak lengkap dengan ayam bakar bumbu kecap manis rempah, tahu tempe, lalapan segar dan sambal..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {/* FORMULA RACIKAN RESEP & HPP */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <ListPlus size={18} className="text-emerald-600" />
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                        Komposisi Bahan Baku & HPP
                      </h4>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {formData.recipe?.length || 0} Bahan
                    </span>
                  </div>

                  {/* ADD INGREDIENT BOX */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    
                    {/* CATEGORY FILTER FOR INGREDIENTS */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Filter:</span>
                      {ingredientCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedIngredientCategory(cat)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                            selectedIngredientCategory === cat
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* SELECT INGREDIENT & QTY */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 sm:col-span-7">
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:bg-white"
                          value={newIngredient.ingredientId}
                          onChange={e => {
                            const inv = inventory.find(i => i.id === e.target.value);
                            setNewIngredient({
                              ...newIngredient, 
                              ingredientId: e.target.value, 
                              unit: inv?.unit || ''
                            });
                          }}
                        >
                          <option value="">-- Pilih Bahan Baku / Dus --</option>
                          {/* OPSI BAHAN MATANG / SIAP SAJI */}
                          {filteredInventoryForRecipe.some(i => i.itemType === 'PREPARED') && (
                            <optgroup label="🍲 Bahan Matang / Siap Saji (Olahan Dapur)">
                              {filteredInventoryForRecipe.filter(i => i.itemType === 'PREPARED').map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  🍲 {inv.name} (HPP: Rp {(inv.costPerUnit || 0).toLocaleString()} / {inv.unit})
                                </option>
                              ))}
                            </optgroup>
                          )}

                          {/* OPSI BAHAN MENTAH */}
                          {filteredInventoryForRecipe.some(i => (i.itemType || 'RAW') === 'RAW' && !((i.category || '').toLowerCase().includes('pack') || (i.category || '').toLowerCase().includes('kemas'))) && (
                            <optgroup label="🥩 Bahan Baku Mentah & Bumbu">
                              {filteredInventoryForRecipe.filter(i => (i.itemType || 'RAW') === 'RAW' && !((i.category || '').toLowerCase().includes('pack') || (i.category || '').toLowerCase().includes('kemas'))).map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  🥩 {inv.name} (HPP: Rp {(inv.costPerUnit || 0).toLocaleString()} / {inv.unit})
                                </option>
                              ))}
                            </optgroup>
                          )}

                          {/* OPSI PACKAGING */}
                          {filteredInventoryForRecipe.some(i => ((i.category || '').toLowerCase().includes('pack') || (i.category || '').toLowerCase().includes('kemas'))) && (
                            <optgroup label="📦 Kemasan & Packaging">
                              {filteredInventoryForRecipe.filter(i => ((i.category || '').toLowerCase().includes('pack') || (i.category || '').toLowerCase().includes('kemas'))).map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  📦 {inv.name} (HPP: Rp {(inv.costPerUnit || 0).toLocaleString()} / {inv.unit})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <div className="col-span-3 sm:col-span-3">
                        <div className="relative">
                          <input 
                            type="number" 
                            step="any"
                            min="0.01"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-black text-center outline-none focus:bg-white" 
                            placeholder="Qty" 
                            value={newIngredient.amountPerUnit || ''} 
                            onChange={e => setNewIngredient({...newIngredient, amountPerUnit: parseFloat(e.target.value) || 0})}
                          />
                          {newIngredient.unit && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                              {newIngredient.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-2">
                        <button 
                          type="button"
                          onClick={handleAddIngredientToRecipe} 
                          className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black transition-all shadow-xs"
                          title="Tambah ke Resep"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* SUB-TOTAL PREVIEW OF SELECTED ITEM */}
                    {newIngredient.ingredientId && (
                      <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>Estimasi Subtotal:</span>
                        <span className="font-bold text-emerald-700">
                          Rp {((inventory.find(i => i.id === newIngredient.ingredientId)?.costPerUnit || 0) * (newIngredient.amountPerUnit || 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RECIPE ITEMS LIST */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {formData.recipe?.map((r, i) => {
                      const cost = r.subtotalCost ?? ((r.amountPerUnit || 0) * (r.unitCost || 0));
                      const isPrepared = r.itemType === 'PREPARED' || inventory.find(inv => inv.id === r.ingredientId)?.itemType === 'PREPARED';
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 group hover:border-slate-300 transition-colors">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-black text-slate-900 leading-tight">{r.name}</p>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                isPrepared 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {isPrepared ? '🍲 Matang' : '🥩 Mentah'}
                              </span>
                              {r.category && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                                  {r.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {r.amountPerUnit} {r.unit} × Rp {(r.unitCost || 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700">
                              Rp {cost.toLocaleString()}
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveRecipeItem(i)} 
                              className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                              title="Hapus Bahan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {(!formData.recipe || formData.recipe.length === 0) && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <Box size={24} className="mx-auto mb-2 text-slate-300" />
                        Belum ada bahan baku produksi yang ditambahkan ke resep ini.
                      </div>
                    )}
                  </div>

                  {/* GRAND TOTAL HPP STRIP */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Bahan Makanan (Lauk, Nasi, Sayur, Bumbu):</span>
                      <span className="font-bold text-slate-700">Rp {hppBreakdown.foodCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Packaging & Kemasan (Dus, Mika, Sendok):</span>
                      <span className="font-bold text-slate-700">Rp {hppBreakdown.packCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="font-black text-slate-900 uppercase">Grand Total HPP / Porsi:</span>
                      <span className="text-sm font-black text-emerald-700">
                        Rp {totalRecipeHpp.toLocaleString()}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: AI INSIGHT & ACTION (Lg: 3 Cols) */}
              <div className="lg:col-span-3 space-y-5">
                
                {/* AI STRATEGIST */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4">
                  <div className="flex items-center gap-2.5">
                    <BrainCircuit size={18} className="text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider">AI Strategist Insight</h4>
                  </div>

                  <button 
                    type="button"
                    onClick={handleAnalyzeInModal}
                    disabled={analyzingInModal}
                    className="w-full py-2.5 bg-white text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors"
                  >
                    {analyzingInModal ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {analyzingInModal ? 'Menganalisis...' : 'Analisis Menu AI'}
                  </button>

                  {modalAiInsight ? (
                    <div className="space-y-3 text-xs animate-in fade-in">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Segmen</span>
                        <span className="font-bold text-emerald-400">{modalAiInsight.targetAudience}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Keunggulan</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {modalAiInsight.sellingPoints?.map((p: string, i: number) => (
                            <span key={i} className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] font-bold text-amber-300 block uppercase">Saran Upselling</span>
                        <p className="text-[11px] text-slate-300 italic mt-0.5">"{modalAiInsight.upsellTip}"</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      Dapatkan rekomendasi segmentasi target dan strategi harga jual dari AI.
                    </p>
                  )}
                </div>

                {/* SAVE BUTTON */}
                <button 
                  type="button"
                  onClick={handleSaveItem}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  <Save size={18} /> {editingId ? 'Simpan Perubahan Menu' : 'Simpan ke Katalog'}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MenuManager;
