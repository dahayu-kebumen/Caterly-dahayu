import React, { useState } from 'react';
import { 
  X, Copy, Check, MessageCircle, ExternalLink, 
  Share2, QrCode, Store, Sparkles
} from 'lucide-react';
import { StoreSettings } from '../types';

interface ShareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onNotify: (msg: string, type: 'success' | 'info') => void;
}

const ShareCatalogModal: React.FC<ShareCatalogModalProps> = ({
  isOpen,
  onClose,
  settings,
  onNotify
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // URL Katalog Mandiri yang bisa diakses langsung oleh konsumen
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const catalogUrl = `${origin}${pathname}?katalog=true`;

  const broadcastMessage = `Halo Bapak/Ibu! 👋\n\nSilakan melihat daftar menu, paket katering, dan snack box ${settings.storeName || 'kami'}.\nAnda dapat langsung memesan dengan menentukan jumlah porsi (misal 115 porsi) serta jadwal jam pengantaran langsung melalui link katalog resmi kami:\n\n👉 ${catalogUrl}\n\nTerima kasih, kami siap melayani katering terbaik untuk acara Anda!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    onNotify('Link katalog mandiri berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(broadcastMessage);
    onNotify('Teks pesan broadcast WhatsApp berhasil disalin!', 'success');
  };

  const handleOpenWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(broadcastMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base sm:text-lg">Link Katalog Mandiri Konsumen</h3>
              <p className="text-slate-500 text-xs font-semibold">Tautan langsung tanpa perlu login</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-900">
          
          {/* Card URL */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Alamat Link Publik (Tinggal Dibagikan)
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border-2 border-slate-200">
              <input 
                type="text" 
                readOnly 
                value={catalogUrl} 
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 px-2 py-1 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Actions: WhatsApp & Test View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleOpenWhatsAppShare}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle size={16} />
              <span>Bagikan ke WhatsApp</span>
            </button>

            <a
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink size={16} />
              <span>Buka Tampilan Konsumen</span>
            </a>
          </div>

          {/* Template Broadcast */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Template Chat Siap Kirim
              </span>
              <button
                onClick={handleCopyBroadcast}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Copy size={12} /> Salin Teks
              </button>
            </div>
            <p className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed bg-white p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
              {broadcastMessage}
            </p>
          </div>

          {/* Tips Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
            <Sparkles size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-semibold">
              <span className="font-black">Aman & Terisolasi:</span> Konsumen yang membuka link ini hanya akan melihat foto menu, kalkulasi porsi katering, dan formulir pengiriman. Tombol kasir, stok dapur, dan pembukuan disembunyikan sepenuhnya.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCatalogModal;
