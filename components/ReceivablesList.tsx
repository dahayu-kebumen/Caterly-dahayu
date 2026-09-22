
import React, { useState } from 'react';
import { 
  CreditCard, Send, Sparkles, AlertCircle, 
  Search, Loader2, MessageCircle, MoreVertical, CheckCircle2,
  Check, X, Plus, Printer
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { generateCollectionPitch } from '../services/geminiService';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface ReceivablesListProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  settings?: StoreSettings;
  currentAdminName?: string;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ReceivablesList: React.FC<ReceivablesListProps> = ({ 
  orders, 
  onUpdateOrder,
  settings,
  currentAdminName = 'Admin',
  onNotify
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPitch, setAiPitch] = useState<{ id: string, text: string } | null>(null);
  const [recordingPaymentId, setRecordingPaymentId] = useState<string | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);

  const receivables = orders.filter(o => o.paymentStatus !== 'Paid' && o.status !== 'Cancelled');
  
  const filteredReceivables = receivables.filter(o => 
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.id.includes(searchQuery)
  );

  const handleGeneratePitch = async (order: Order) => {
    setGeneratingId(order.id);
    try {
      const amountDue = order.totalPrice - order.amountPaid;
      // Mocking 7 days overdue for demo
      const pitch = await generateCollectionPitch(order.customerName, amountDue, 7);
      setAiPitch({ id: order.id, text: pitch || '' });
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleUpdatePayment = (orderId: string, status: 'Paid' | 'Partial') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let amountPaid = order.amountPaid;
    if (status === 'Paid') amountPaid = order.totalPrice;
    else if (status === 'Partial') {
      // For demo, if partial, we'll set it to 50% or keep current if it's already more than 0
      amountPaid = order.amountPaid > 0 ? order.amountPaid : order.totalPrice / 2;
    }
    
    onUpdateOrder(orderId, { paymentStatus: status, amountPaid });
    setRecordingPaymentId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Buku Piutang (Receivables)</h2>
          <p className="text-sm text-slate-500 mt-1">Pantau tagihan yang belum lunas dan tagih secara profesional.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pelanggan..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReceivables.map((o) => {
          const amountDue = o.totalPrice - o.amountPaid;
          const isGenerating = generatingId === o.id;
          const hasPitch = aiPitch?.id === o.id;
          const isRecording = recordingPaymentId === o.id;

          return (
            <div key={o.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-rose-200 transition-all shadow-sm relative overflow-hidden">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <CreditCard size={28} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-slate-900">{o.customerName}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    o.paymentStatus === 'Unpaid' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {o.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Order #{o.id} • {o.date}</p>
                <div className="mt-3 flex gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Total Tagihan</p>
                    <p className="text-sm font-bold text-slate-800">Rp {o.totalPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Telah Dibayar</p>
                    <p className="text-sm font-bold text-emerald-600">Rp {o.amountPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1 text-rose-500">Sisa Piutang</p>
                    <p className="text-sm font-black text-rose-600">Rp {amountDue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto min-w-[160px]">
                {isRecording ? (
                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => handleUpdatePayment(o.id, 'Paid')}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Full Paid
                    </button>
                    <button 
                      onClick={() => handleUpdatePayment(o.id, 'Partial')}
                      className="bg-amber-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                    >
                      {/* Fix: Added Plus to imports above */}
                      <Plus size={14} /> Partial
                    </button>
                    <button 
                      onClick={() => setRecordingPaymentId(null)}
                      className="text-slate-400 text-[9px] font-bold uppercase hover:text-slate-600 mt-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setSelectedOrderForPrint(o)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
                      title="Cetak Kwitansi / Struk Pelunasan Piutang"
                    >
                      <Printer size={14} className="text-slate-600" />
                      <span>Cetak Kwitansi</span>
                    </button>
                    <button 
                      onClick={() => handleGeneratePitch(o)}
                      disabled={isGenerating}
                      className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-slate-200"
                    >
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-400" />}
                      {isGenerating ? 'AI Menulis...' : 'Draft Tagihan AI'}
                    </button>
                    <button 
                      onClick={() => setRecordingPaymentId(o.id)}
                      className="bg-slate-50 text-slate-600 border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      Catat Pembayaran
                    </button>
                  </>
                )}
              </div>

              {hasPitch && (
                <div className="w-full md:absolute md:top-full md:left-0 md:mt-2 md:z-20 bg-amber-50 border border-amber-200 p-5 rounded-3xl animate-in slide-in-from-top-4 duration-500 shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Draf Pesan WhatsApp</span>
                    <button onClick={() => setAiPitch(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-slate-700 text-sm italic leading-relaxed mb-4">"{aiPitch.text}"</p>
                  <button className="bg-[#25D366] text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 w-full justify-center">
                    <MessageCircle size={18} />
                    Kirim via WhatsApp
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredReceivables.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <CheckCircle2 size={48} className="mx-auto text-emerald-200 mb-4" />
            <p className="text-slate-400 font-bold italic">Semua tagihan sudah lunas! Arus kas aman.</p>
          </div>
        )}
      </div>

      {/* MODAL CETAK STRUK & KWITANSI PIUTANG */}
      <ReceiptPrintModal
        isOpen={!!selectedOrderForPrint}
        onClose={() => setSelectedOrderForPrint(null)}
        order={selectedOrderForPrint}
        settings={settings}
        currentAdminName={currentAdminName}
        onNotify={onNotify}
      />
    </div>
  );
};

export default ReceivablesList;
