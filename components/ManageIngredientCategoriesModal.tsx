import React, { useState } from 'react';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  Layers, 
  FileSpreadsheet, 
  Download, 
  ArrowRight,
  Info
} from 'lucide-react';
import { IngredientStock } from '../types';
import { generateMasterTemplateCsv, downloadCsvFile } from '../services/ingredientImporter';

interface ManageIngredientCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  inventory: IngredientStock[];
  onUpdateCategories: (newCategories: string[]) => void;
  onUpdateInventory: (newInventory: IngredientStock[]) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ManageIngredientCategoriesModal: React.FC<ManageIngredientCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  inventory,
  onUpdateCategories,
  onUpdateInventory,
  onNotify
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  
  // State untuk dialog hapus kategori yang masih ada isinya
  const [deleteTarget, setDeleteTarget] = useState<{
    category: string;
    itemCount: number;
    reassignTargetCategory: string;
  } | null>(null);

  if (!isOpen) return null;

  // Hitung jumlah bahan per kategori
  const getIngredientCount = (catName: string) => {
    return inventory.filter(item => (item.category || '').toLowerCase() === catName.toLowerCase()).length;
  };

  // 1. Tambah Kategori Baru
  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      onNotify?.('Nama kategori tidak boleh kosong.', 'warning');
      return;
    }

    // Cek duplikasi
    const exists = categories.some(c => c.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      onNotify?.(`Kategori "${cleanName}" sudah ada dalam daftar.`, 'warning');
      return;
    }

    const updated = [...categories, cleanName];
    onUpdateCategories(updated);
    setNewCategoryName('');
    onNotify?.(`Kategori baru "${cleanName}" berhasil ditambahkan!`, 'success');
  };

  // 2. Simpan Perubahan Nama Kategori
  const handleSaveEditCategory = () => {
    if (!editingCategory) return;
    const cleanNewName = editingCategory.newName.trim();
    const oldName = editingCategory.oldName;

    if (!cleanNewName) {
      onNotify?.('Nama kategori tidak boleh kosong.', 'warning');
      return;
    }

    if (cleanNewName.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }

    // Cek apakah nama baru sudah dipakai kategori lain
    const conflict = categories.some(
      c => c.toLowerCase() === cleanNewName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
    );
    if (conflict) {
      onNotify?.(`Kategori "${cleanNewName}" sudah ada. Gunakan nama lain.`, 'warning');
      return;
    }

    // Perbarui daftar kategori
    const updatedCategories = categories.map(c => c === oldName ? cleanNewName : c);
    onUpdateCategories(updatedCategories);

    // Perbarui semua bahan baku yang menggunakan kategori lama
    let affectedCount = 0;
    const updatedInventory = inventory.map(item => {
      if ((item.category || '').toLowerCase() === oldName.toLowerCase()) {
        affectedCount++;
        return { ...item, category: cleanNewName };
      }
      return item;
    });

    if (affectedCount > 0) {
      onUpdateInventory(updatedInventory);
    }

    setEditingCategory(null);
    onNotify?.(
      `Kategori "${oldName}" diubah menjadi "${cleanNewName}". ${affectedCount} bahan baku otomatis diperbarui!`,
      'success'
    );
  };

  // 3. Konfirmasi Hapus Kategori
  const handleInitiateDelete = (catName: string) => {
    if (categories.length <= 1) {
      onNotify?.('Minimal harus ada 1 kategori bahan baku aktif di sistem.', 'warning');
      return;
    }

    const count = getIngredientCount(catName);
    if (count === 0) {
      // Langsung hapus jika tidak ada bahan di dalamnya
      const updated = categories.filter(c => c !== catName);
      onUpdateCategories(updated);
      onNotify?.(`Kategori "${catName}" berhasil dihapus.`, 'info');
    } else {
      // Masih ada bahan, siapkan dialog pemindahan
      const remainingCats = categories.filter(c => c !== catName);
      setDeleteTarget({
        category: catName,
        itemCount: count,
        reassignTargetCategory: remainingCats[0] || 'Bahan Pokok'
      });
    }
  };

  // 4. Eksekusi Pemindahan Bahan & Hapus Kategori
  const handleConfirmReassignAndDelete = () => {
    if (!deleteTarget) return;
    const { category, reassignTargetCategory, itemCount } = deleteTarget;

    // Pindahkan semua bahan dari kategori ini ke kategori tujuan
    const updatedInventory = inventory.map(item => {
      if ((item.category || '').toLowerCase() === category.toLowerCase()) {
        return { ...item, category: reassignTargetCategory };
      }
      return item;
    });
    onUpdateInventory(updatedInventory);

    // Hapus kategori dari list
    const updatedCategories = categories.filter(c => c !== category);
    onUpdateCategories(updatedCategories);

    setDeleteTarget(null);
    onNotify?.(
      `Kategori "${category}" dihapus. Sebanyak ${itemCount} bahan berhasil dipindahkan ke "${reassignTargetCategory}".`,
      'success'
    );
  };

  // 5. Download Template CSV Sesuai Kategori Aktif Terbaru
  const handleDownloadTemplateWithCurrentCategories = () => {
    const csv = generateMasterTemplateCsv(inventory, categories);
    downloadCsvFile('Template_Master_Bahan_Baku_Katering.csv', csv);
    onNotify?.('Template CSV berhasil diunduh dengan struktur kategori terbaru Anda!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Kelola Kategori Bahan Baku
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Tambah, ubah nama, atau hapus kategori dengan sinkronisasi otomatis ke spreadsheet
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* FORM TAMBAH KATEGORI BARU */}
          <form onSubmit={handleAddCategory} className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <FolderPlus size={16} />
              <span>Tambah Kategori Baru</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Snack & Bakery, Minuman & Buah..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <FolderPlus size={15} />
                <span>+ Tambah</span>
              </button>
            </div>
          </form>

          {/* DAFTAR KATEGORI AKTIF */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Daftar Kategori Aktif ({categories.length})
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">
                Total Bahan: {inventory.length}
              </span>
            </div>

            <div className="space-y-2">
              {categories.map((cat, idx) => {
                const count = getIngredientCount(cat);
                const isEditing = editingCategory?.oldName === cat;

                return (
                  <div 
                    key={cat}
                    className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all gap-2"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCategory.newName}
                          onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                          className="flex-1 px-3 py-1.5 bg-white border-2 border-amber-500 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCategory();
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditCategory}
                          className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shrink-0"
                          title="Simpan Perubahan"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="p-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all shrink-0"
                          title="Batal"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-800 truncate">
                            {cat}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {count} bahan
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                            className="p-2 text-slate-500 hover:text-amber-700 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                            title="Edit Nama Kategori"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(cat)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Hapus Kategori"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KARTU EDUKASI SINKRONISASI SPREADSHEET */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                <FileSpreadsheet size={16} />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-black text-emerald-950">
                  Sinkronisasi Otomatis ke Spreadsheet & Template CSV
                </p>
                <p className="text-emerald-800 font-medium leading-relaxed">
                  Semua kategori yang Anda kelola di sini akan langsung menjadi grup header pada template spreadsheet baru (A., B., C., dst). Saat Anda mengimpor CSV dari luar yang memiliki kategori baru, sistem juga otomatis mendaftarkannya.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplateWithCurrentCategories}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Download size={14} />
                <span>Unduh Template CSV Format Kategori Ini</span>
              </button>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Selesai
          </button>
        </div>

      </div>

      {/* DIALOG AMAN PEMINDAHAN BAHAN SAAT HAPUS KATEGORI BERISI */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-rose-200 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={26} />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                Pindahkan Bahan Sebelum Hapus?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kategori <strong className="text-slate-900">"{deleteTarget.category}"</strong> masih memiliki{' '}
                <span className="font-bold text-rose-600">{deleteTarget.itemCount} bahan baku</span>.
                Pilih kategori baru agar stok Anda tidak hilang:
              </p>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                Pindahkan {deleteTarget.itemCount} Bahan ke:
              </label>
              <select
                value={deleteTarget.reassignTargetCategory}
                onChange={(e) => setDeleteTarget({ ...deleteTarget, reassignTargetCategory: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categories
                  .filter(c => c !== deleteTarget.category)
                  .map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                }
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReassignAndDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Pindahkan & Hapus</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
