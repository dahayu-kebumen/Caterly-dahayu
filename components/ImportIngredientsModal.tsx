import React, { useState, useRef } from 'react';
import { 
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, 
  X, RefreshCw, Eye, Layers, ArrowRight, Check, Sparkles, HelpCircle 
} from 'lucide-react';
import { IngredientStock } from '../types';
import { 
  parseMasterIngredientsCsv, 
  generateMasterTemplateCsv, 
  downloadCsvFile,
  DEFAULT_MASTER_INGREDIENTS 
} from '../services/ingredientImporter';

interface ImportIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingInventory: IngredientStock[];
  activeCategories?: string[];
  onImportSuccess: (newInventory: IngredientStock[], mode: 'merge' | 'replace') => void;
  onAddDiscoveredCategories?: (newCategories: string[]) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export const ImportIngredientsModal: React.FC<ImportIngredientsModalProps> = ({
  isOpen,
  onClose,
  existingInventory,
  activeCategories,
  onImportSuccess,
  onAddDiscoveredCategories,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preview'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    data: IngredientStock[];
    stats: { total: number; categories: Record<string, number> };
    detectedCategories?: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csv = generateMasterTemplateCsv(undefined, activeCategories);
    downloadCsvFile('Template_Master_Bahan_Baku_Katering.csv', csv);
    onNotify?.('Template Master Bahan Baku berhasil diunduh. Format kategori sudah sesuai daftar terbaru Anda!', 'success');
  };

  const handleExportCurrentData = () => {
    const csv = generateMasterTemplateCsv(existingInventory, activeCategories);
    downloadCsvFile(`Data_Master_Bahan_Baku_${new Date().toISOString().split('T')[0]}.csv`, csv);
    onNotify?.('Data Bahan Baku saat ini berhasil diekspor ke CSV!', 'success');
  };

  const handleLoadSampleData = () => {
    const res = parseMasterIngredientsCsv(generateMasterTemplateCsv(DEFAULT_MASTER_INGREDIENTS, activeCategories), activeCategories);
    if (res.success) {
      setParsedResult({
        data: res.data,
        stats: res.stats,
        detectedCategories: res.detectedCategories
      });
      setFileName('Master_Bahan_Katering_Default (60+ Bahan)');
      setActiveTab('preview');
      onNotify?.(`Berhasil memuat ${res.data.length} master bahan baku standar katering!`, 'success');
    }
  };

  const processCsvString = (content: string, name: string = 'Data Input') => {
    try {
      const result = parseMasterIngredientsCsv(content, activeCategories);
      if (!result.success || result.data.length === 0) {
        onNotify?.('Tidak ada data bahan baku yang valid ditemukan dalam file/teks.', 'error');
        return;
      }

      setParsedResult({
        data: result.data,
        stats: result.stats,
        detectedCategories: result.detectedCategories
      });
      setFileName(name);
      setActiveTab('preview');
      onNotify?.(`Berhasil membaca ${result.data.length} bahan baku dari spreadsheet!`, 'success');
    } catch (err: any) {
      onNotify?.(`Gagal membaca file: ${err.message || 'Format tidak dikenali'}`, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvString(content, file.name);
    };
    reader.onerror = () => {
      onNotify?.('Gagal membaca file.', 'error');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) {
      onNotify?.('Tempelkan teks tabel spreadsheet terlebih dahulu!', 'warning');
      return;
    }
    processCsvString(pasteText, 'Teks Paste Spreadsheet');
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.data.length === 0) return;

    let finalInventory: IngredientStock[] = [];

    if (importMode === 'replace') {
      finalInventory = parsedResult.data;
    } else {
      // Merge mode: perbarui jika nama sama (case-insensitive), tambahkan jika belum ada
      const existingMap = new Map<string, IngredientStock>();
      existingInventory.forEach(item => {
        existingMap.set(item.name.toLowerCase().trim(), { ...item });
      });

      parsedResult.data.forEach(newItem => {
        const key = newItem.name.toLowerCase().trim();
        if (existingMap.has(key)) {
          const old = existingMap.get(key)!;
          existingMap.set(key, {
            ...old,
            costPerUnit: newItem.costPerUnit || old.costPerUnit,
            purchasePrice: newItem.purchasePrice || old.purchasePrice,
            purchaseUnit: newItem.purchaseUnit || old.purchaseUnit,
            yieldQty: newItem.yieldQty || old.yieldQty,
            category: newItem.category || old.category,
            unit: newItem.unit || old.unit
          });
        } else {
          existingMap.set(key, newItem);
        }
      });

      finalInventory = Array.from(existingMap.values());
    }

    if (onAddDiscoveredCategories && parsedResult.detectedCategories && parsedResult.detectedCategories.length > 0) {
      onAddDiscoveredCategories(parsedResult.detectedCategories);
    }

    onImportSuccess(finalInventory, importMode);
    onNotify?.(`Sukses menerapkan ${parsedResult.data.length} bahan baku ke master sistem!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Import Master Bahan Baku & HPP
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Format spreadsheet multi-kategori (Bahan Pokok, Lauk Utama, Pendamping, Sayur, Bumbu, Kemasan).
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* TAB HEADER */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'upload' 
                  ? 'bg-white text-slate-900 border-t-2 border-x border-slate-200 -mb-px' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'paste' 
                  ? 'bg-white text-slate-900 border-t-2 border-x border-slate-200 -mb-px' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={14} /> Copy-Paste CSV / Tabel
            </button>
            {parsedResult && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'preview' 
                    ? 'bg-white text-emerald-700 border-t-2 border-x border-slate-200 -mb-px font-black' 
                    : 'text-emerald-600 hover:text-emerald-800'
                }`}
              >
                <Eye size={14} /> Preview ({parsedResult.data.length} Bahan)
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
              title="Unduh file format Excel/CSV kosong"
            >
              <Download size={13} /> Download Template
            </button>
            <button
              onClick={handleExportCurrentData}
              className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
              title="Ekspor data bahan saat ini"
            >
              <Download size={13} /> Ekspor Data Saat Ini
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh] space-y-6">
          
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt,.xlsx,.xls" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 shadow-xs">
                  <Upload size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  Klik untuk Memilih File Spreadsheet / CSV
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-md">
                  Mendukung format file <b>.csv</b> atau <b>.txt</b> dengan susunan kolom persis spreadsheet katering Anda.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
                    Format Standar Master Katering Dikenali Otomatis
                  </span>
                </div>
              </div>

              {/* ACTION QUICK BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Download size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900">Belum Punya File Format?</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Unduh template resmi dengan susunan kategori A-F agar pengisian rapi.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Download Template Excel (.csv) <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900">Gunakan Master Standar (60+ Bahan)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Langsung muat 60+ bahan baku lengkap dari katering (Ayam, Sapi, Beras, Bumbu, Dus Dahayu).
                    </p>
                    <button
                      onClick={handleLoadSampleData}
                      className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      Muat 60+ Bahan Standar <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COPY-PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-2">
                  Tempelkan Baris Teks dari Excel / Google Sheets
                </label>
                <textarea
                  rows={8}
                  placeholder="Contoh:&#10;A.,BAHAN POKOK,1,beras,1000,gr,Rp16.500,11,Rp1.500,UNIT&#10;B.,BAHAN BAKU LK UTAMA,1,ayam boiler ,1000,gr,Rp40.000,7,Rp5.714,ptg&#10;,,2,ayam kampung,1,ekor,Rp45.000,4,Rp11.250,ptg..."
                  className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPasteText('')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Bersihkan Teks
                </button>
                <button
                  onClick={handleProcessPastedText}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Eye size={15} /> Proses & Tampilkan Preview
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW & VERIFIKASI */}
          {activeTab === 'preview' && parsedResult && (
            <div className="space-y-5">
              
              {/* STATS HEADER */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h4 className="text-sm font-black text-emerald-950">
                      Terbaca {parsedResult.data.length} Bahan Baku dari Spreadsheet
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Sumber: <span className="font-bold">{fileName || 'Data Spreadsheet'}</span>
                  </p>
                </div>

                {/* CATEGORY BADGES */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(parsedResult.stats.categories).map(([cat, count]) => (
                    <span key={cat} className="text-[10px] font-bold bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                      {cat}: <b>{count}</b>
                    </span>
                  ))}
                </div>
              </div>

              {/* IMPORT MODE OPTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Pilih Cara Penggabungan Data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    importMode === 'merge' ? 'border-emerald-500 bg-white shadow-xs' : 'border-slate-200 bg-slate-100/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')} 
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900">Perbarui & Gabungkan (Direkomendasikan)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        Update harga bahan yang sudah ada dengan harga baru, dan tambahkan bahan yang belum ada.
                      </p>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    importMode === 'replace' ? 'border-rose-500 bg-white shadow-xs' : 'border-slate-200 bg-slate-100/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')} 
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900">Ganti Semua (Reset Penuh)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        Hapus seluruh bahan lama dan ganti 100% dengan bahan dari spreadsheet ini.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* PREVIEW TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Bahan</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-right">Harga Beli</th>
                        <th className="py-2.5 px-3 text-center">Isi / Yield</th>
                        <th className="py-2.5 px-3 text-right text-emerald-700">HPP Satuan</th>
                        <th className="py-2.5 px-3">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedResult.data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-bold">{item.itemNo || idx + 1}</td>
                          <td className="py-2 px-3 font-black text-slate-900">{item.name}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {item.purchasePrice ? `Rp ${item.purchasePrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700 font-bold">
                            {item.yieldQty || 1}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-600 bg-emerald-50/40">
                            Rp {(item.costPerUnit || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>

          {parsedResult && activeTab === 'preview' ? (
            <button
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95"
            >
              <Check size={16} /> Simpan & Terapkan ke Master Bahan
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Upload file atau tempelkan data untuk melanjutkan
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
