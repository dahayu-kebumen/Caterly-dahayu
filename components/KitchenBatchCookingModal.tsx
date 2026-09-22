import React, { useState, useMemo, useEffect } from 'react';
import { Flame, ChefHat, X, AlertTriangle, CheckCircle2, Package, ArrowRight, Sparkles, Scale, Info } from 'lucide-react';
import { IngredientStock } from '../types';
import { calculateCookingRequirements } from '../services/inventoryLogic';

interface KitchenBatchCookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: IngredientStock[];
  preselectedPreparedId?: string;
  onConfirmCooking: (preparedItem: IngredientStock, cookQty: number, notes?: string) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const KitchenBatchCookingModal: React.FC<KitchenBatchCookingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  preselectedPreparedId,
  onConfirmCooking,
  onNotify
}) => {
  // Filter semua bahan bertipe PREPARED (Bahan Baku Matang / Olahan)
  const preparedItems = useMemo(() => {
    return inventory.filter(item => item.itemType === 'PREPARED');
  }, [inventory]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [cookQty, setCookQty] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preselectedPreparedId) {
      setSelectedId(preselectedPreparedId);
    } else if (preparedItems.length > 0 && (!selectedId || !preparedItems.some(p => p.id === selectedId))) {
      setSelectedId(preparedItems[0].id);
    }
  }, [preselectedPreparedId, preparedItems, isOpen]);

  const selectedItem = useMemo(() => {
    return preparedItems.find(p => p.id === selectedId) || null;
  }, [preparedItems, selectedId]);

  // Kalkulasi kebutuhan bahan mentah
  const calculation = useMemo(() => {
    if (!selectedItem || cookQty <= 0) {
      return {
        requirements: [],
        totalProductionCost: 0,
        costPerUnit: selectedItem?.costPerUnit || 0,
        allSufficient: true
      };
    }
    return calculateCookingRequirements(selectedItem, cookQty, inventory);
  }, [selectedItem, cookQty, inventory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      onNotify?.('Pilih bahan matang yang ingin diolah terlebih dahulu.', 'warning');
      return;
    }
    if (cookQty <= 0) {
      onNotify?.('Jumlah porsi yang dimasak harus lebih dari 0.', 'warning');
      return;
    }

    onConfirmCooking(selectedItem, cookQty, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
      
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative z-10 overflow-hidden border-2 border-slate-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Flame size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Masak & Olah Bahan Matang (Batch Cooking)
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                  Dapur Aktif
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Konversi bahan mentah menjadi bahan matang siap saji, potong stok otomatis & hitung HPP riil.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/10 hover:bg-black/25 flex items-center justify-center text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {preparedItems.length === 0 ? (
            <div className="p-8 text-center bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                <ChefHat size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800">Belum Ada Bahan Baku Matang</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Daftarkan bahan baku bertipe <strong>"Bahan Matang / Olahan"</strong> (misal: Ayam Ungkep, Rendang Sapi, Tahu Goreng) di katalog inventori untuk menggunakan fitur ini.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* PILIH BAHAN MATANG & JUMLAH MASAK */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ChefHat size={14} className="text-amber-600" />
                    Pilih Bahan Baku Matang yang Dimasak
                  </label>
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all"
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                  >
                    {preparedItems.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok Saat Ini: {p.quantity} {p.unit}) — Est. HPP: Rp {(p.costPerUnit || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Scale size={14} className="text-amber-600" />
                    Target Hasil ({selectedItem?.unit || 'porsi'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.5"
                      className="w-full bg-slate-50 border-2 border-amber-400 rounded-2xl px-4 py-3 text-base font-black text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition-all"
                      value={cookQty || ''}
                      onChange={e => setCookQty(parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">
                      {selectedItem?.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* INFO BAHAN MATANG DIPILIH */}
              {selectedItem && (
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{selectedItem.name}</span>
                      <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                        {selectedItem.category || 'Olahan Dapur'}
                      </span>
                    </div>
                    {selectedItem.cookingNotes && (
                      <p className="text-[11px] text-slate-600 font-medium mt-1">
                        📝 <em>{selectedItem.cookingNotes}</em>
                      </p>
                    )}
                    {selectedItem.shelfLifeDays && (
                      <p className="text-[10px] text-amber-800 font-bold mt-0.5">
                        ⏱️ Masa Simpan Chiller: ±{selectedItem.shelfLifeDays} hari
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right bg-white px-3.5 py-2 rounded-xl border border-amber-200 shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Stok Siap Saji Dapur</p>
                    <p className="text-sm font-black text-slate-900">
                      {selectedItem.quantity} {selectedItem.unit} <span className="text-amber-600 text-xs">➔ +{cookQty} {selectedItem.unit}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* FORMULA RESEP & ESTIMASI PENGURANGAN BAHAN MENTAH */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-slate-500" />
                    Bahan Mentah yang Akan Terpakai (Otomatis Terpotong)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    {calculation.requirements.length} Bahan Komposisi
                  </span>
                </div>

                {calculation.requirements.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      Bahan matang ini belum diatur resep formula mentahnya. Stok bahan matang akan langsung ditambah tanpa memotong bahan mentah.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden divide-y divide-slate-200">
                    {calculation.requirements.map(req => (
                      <div key={req.rawIngredientId} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate">{req.rawIngredientName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-500">
                              Stok Gudang: {req.currentStock} {req.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] font-medium text-slate-500">
                              Est. Biaya: Rp {req.subtotalCost.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-black text-rose-600 text-sm">
                              -{req.amountNeeded} {req.unit}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              req.isSufficient 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800 font-black animate-pulse'
                            }`}>
                              {req.isSufficient ? 'Stok Cukup' : `Kurang ${req.deficit} ${req.unit}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WARNING JIKA BAHAN MENTAH KURANG */}
              {!calculation.allSufficient && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">Peringatan: Stok bahan mentah tertentu tidak mencukupi di sistem.</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      Jika bahan sudah dibeli langsung di pasar tanpa pencatatan, Anda tetap dapat melanjutkan. Stok bahan mentah akan ditandai habis (0).
                    </p>
                  </div>
                </div>
              )}

              {/* RINGKASAN BIAYA PRODUKSI & HPP BARU */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hasil Produksi Dapur</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    +{cookQty} {selectedItem?.unit} {selectedItem?.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Biaya Bahan Mentah</p>
                    <p className="text-sm font-black text-amber-400 mt-0.5">
                      Rp {calculation.totalProductionCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">HPP per {selectedItem?.unit}</p>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">
                      Rp {calculation.costPerUnit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* CATATAN MASAK (OPSIONAL) */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Catatan Masak / Koki (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dimasak oleh Chef Bambang untuk persiapan katering makan siang..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-slate-900"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <Flame size={16} />
                  <span>Konfirmasi Masak & Tambah Stok Matang</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
