
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, MoreHorizontal, X, Check, 
  User, CreditCard, Clock, Truck, CheckCircle2, 
  Building2, User2, Calendar, Filter, Wallet, ArrowRight,
  AlertCircle, Banknote, Sun, Moon, SunMedium, Trash2, ListPlus,
  ShoppingBag, ChevronDown, Hash, Users, ReceiptText, PackageCheck, MapPin, Printer
} from 'lucide-react';
import { Order, ShiftType, MenuItem, StoreSettings } from '../types';
import { calculateOrderBOMRequirements } from '../services/inventoryLogic';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface OrdersListProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onConfirmAndDeductStock?: (order: Order) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  currentShift?: ShiftType;
  currentAdminName?: string;
  menu: MenuItem[];
  settings?: StoreSettings;
}

const OrdersList: React.FC<OrdersListProps> = ({ 
  orders, 
  onAddOrder, 
  onUpdateOrder, 
  onConfirmAndDeductStock,
  onNotify, 
  currentShift, 
  currentAdminName, 
  menu,
  settings = {
    storeName: 'Catering & Kitchen',
    whatsappNumber: '',
    address: '',
    currencySymbol: 'Rp',
    socialAccounts: []
  }
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  
  const [selectedItems, setSelectedItems] = useState<{menuId: string, name: string, qty: number, price: number}[]>([]);
  const [newItemSelector, setNewItemSelector] = useState({ menuId: '', qty: 1 });

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customerName: '',
    type: 'Individual',
    totalPrice: 0,
    amountPaid: 0,
    items: [],
    deliveryTime: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        const matchesSearch = 
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.id.includes(searchQuery) ||
          o.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDate = dateFilter ? o.date === dateFilter : true;
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [orders, searchQuery, dateFilter]);

  // Statistics for top bar
  const activeOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
  const todayOrders = orders.filter(o => o.date === new Date().toISOString().split('T')[0]).length;
  const totalReceivable = orders.reduce((acc, o) => acc + (o.totalPrice - o.amountPaid), 0);

  const handleAddItem = () => {
    if (!newItemSelector.menuId) return;
    const menuItem = menu.find(m => m.id === newItemSelector.menuId);
    if (!menuItem) return;

    const existingIdx = selectedItems.findIndex(si => si.menuId === menuItem.id);
    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].qty += newItemSelector.qty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        menuId: menuItem.id,
        name: menuItem.name,
        qty: newItemSelector.qty,
        price: menuItem.price
      }]);
    }
    setNewItemSelector({ menuId: '', qty: 1 });
  };

  const removeItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const calculatedTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [selectedItems]);

  const handleSaveOrder = () => {
    if (!newOrder.customerName?.trim()) return onNotify?.('Nama pelanggan wajib diisi!', 'error');
    if (selectedItems.length === 0 && !newOrder.totalPrice) return onNotify?.('Minimal harus ada 1 barang atau isi total harga!', 'error');

    const total = newOrder.totalPrice || calculatedTotal;
    const paid = newOrder.amountPaid || 0;
    
    let paymentStatus: Order['paymentStatus'] = 'Unpaid';
    if (paid >= total) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partial';

    const formattedItems = selectedItems.map(si => `${si.name} (${si.qty})`);

    const orderToSave: Order = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customerName: newOrder.customerName || '',
      type: newOrder.type || 'Individual',
      totalPrice: total,
      amountPaid: paid,
      items: formattedItems.length > 0 ? formattedItems : ['Custom Order'],
      deliveryTime: newOrder.deliveryTime || '',
      date: newOrder.date || new Date().toISOString().split('T')[0],
      status: 'Pending',
      paymentStatus: paymentStatus,
      shift: currentShift || 'Pagi',
      recordedBy: currentAdminName || 'Sistem'
    };

    onAddOrder(orderToSave);
    setIsModalOpen(false);
    onNotify?.(`Pesanan #${orderToSave.id} berhasil dicatat.`, 'success');
    
    setNewOrder({ customerName: '', type: 'Individual', totalPrice: 0, amountPaid: 0, items: [], deliveryTime: '', date: new Date().toISOString().split('T')[0] });
    setSelectedItems([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500 text-white shadow-emerald-100';
      case 'Confirmed': return 'bg-indigo-500 text-white shadow-indigo-100';
      case 'Pending': return 'bg-amber-500 text-white shadow-amber-100';
      case 'Cancelled': return 'bg-slate-400 text-white shadow-slate-100';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER SECTION WITH STATS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-3.5 sm:gap-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Pusat Pesanan Katering</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Monitoring aktivitas katering secara realtime.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full lg:w-auto">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-4 min-w-0">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border border-indigo-200">
               <PackageCheck size={18} />
             </div>
             <div className="min-w-0">
               <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Aktif</p>
               <p className="text-base sm:text-lg font-black text-slate-900 truncate">{activeOrdersCount}</p>
             </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-2.5 sm:gap-4 min-w-0">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
               <Truck size={18} />
             </div>
             <div className="min-w-0">
               <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hari Ini</p>
               <p className="text-base sm:text-lg font-black text-slate-900 truncate">{todayOrders}</p>
             </div>
          </div>
          <div className="hidden md:flex bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs items-center gap-4 min-w-0">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-200">
               <Banknote size={18} />
             </div>
             <div className="min-w-0">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sisa Piutang</p>
               <p className="text-lg font-black text-slate-900 truncate">Rp {(totalReceivable/1000).toFixed(0)}k</p>
             </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 sm:gap-4 items-stretch md:items-center">
        <div className="relative flex-1 group w-full min-w-0">
           <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-slate-950 transition-colors pointer-events-none" />
           <input 
            type="text" 
            placeholder="Cari nama, ID pesanan, atau menu..." 
            className="w-full pl-9 sm:pl-12 pr-3.5 sm:pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 outline-none focus:border-slate-950 transition-all placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto min-w-0">
          <div className="relative group flex-1 md:w-auto min-w-0">
            <Calendar size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input 
              type="date" 
              className="w-full pl-8 sm:pl-11 pr-2 sm:pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 outline-none focus:border-slate-950 transition-all min-w-0"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl text-xs font-bold shrink-0 transition-colors"
              title="Reset Tanggal"
            >
              <X size={16} />
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-950 hover:bg-black text-white px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Plus size={16} /> <span className="inline">+ Pesanan</span>
          </button>
        </div>
      </div>

      {/* ORDERS LIST UI */}
      <div className="space-y-3.5 sm:space-y-4">
        {filteredOrders.map((o) => {
          const debt = o.totalPrice - o.amountPaid;
          return (
            <div 
              key={o.id} 
              className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-400 transition-all duration-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4 lg:gap-6 group"
            >
              {/* Customer Info (and Status on Mobile) */}
              <div className="flex items-center justify-between lg:justify-start gap-3 lg:w-[260px] shrink-0 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                    o.type === 'Corporate' ? 'bg-indigo-50 text-indigo-900 border-indigo-300' : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {o.type === 'Corporate' ? <Building2 size={20} /> : <User2 size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-950 leading-tight truncate">
                      #{o.id} {o.customerName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded border ${
                        o.type === 'Corporate' ? 'bg-indigo-100 text-indigo-950 border-indigo-300' : 'bg-slate-100 text-slate-900 border-slate-300'
                      }`}>
                        {o.type}
                      </span>
                      <span className="lg:hidden text-[10px] font-bold text-slate-500 flex items-center gap-1 truncate">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{o.deliveryTime || o.date}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Status Badge on top right */}
                <div className="lg:hidden shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${getStatusBadge(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              </div>

              {/* Items List & Delivery Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {o.items.map((it, idx) => (
                    <span key={idx} className="bg-slate-50 border border-slate-300 text-slate-900 text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0"></span> 
                      <span className="truncate max-w-[200px] sm:max-w-none">{it}</span>
                    </span>
                  ))}
                </div>

                {/* Delivery & Address Snippet */}
                {o.deliveryAddress && (
                  <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    <Truck size={12} className="text-emerald-700 shrink-0" />
                    <span className="text-emerald-800 font-bold shrink-0">
                      {o.deliveryMethod === 'Pickup' ? 'Ambil di Dapur' : 'Kirim'}:
                    </span>
                    <span className="truncate">{o.deliveryAddress}</span>
                    {o.deliveryTime && (
                      <span className="text-slate-800 font-black shrink-0">({o.deliveryTime} WIB)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Timing (Desktop only) */}
              <div className="hidden lg:flex flex-col items-start gap-1 lg:w-[170px] shrink-0">
                 <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${getStatusBadge(o.status)}`}>
                    {o.status}
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock size={13} className="text-slate-600" /> 
                    <span>{o.date} • {o.deliveryTime || '--:--'}</span>
                 </div>
              </div>

              {/* Payment Summary & Action Buttons */}
              <div className="flex items-center justify-between lg:justify-end gap-3 pt-2.5 lg:pt-0 border-t border-slate-100 lg:border-t-0 shrink-0">
                {/* Payment Summary */}
                <div className="text-left lg:text-right shrink-0">
                   <p className="text-sm sm:text-base font-black text-slate-950 tracking-tight leading-tight">
                     Rp {o.totalPrice.toLocaleString()}
                   </p>
                   <div className="flex items-center lg:justify-end gap-1.5 mt-0.5">
                      {debt > 0 ? (
                        <span className="text-[10px] sm:text-xs font-black text-rose-800 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-200">
                          Piutang: Rp {debt.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Lunas
                        </span>
                      )}
                   </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                  {o.status === 'Pending' && onConfirmAndDeductStock && (
                    <button
                      onClick={() => onConfirmAndDeductStock(o)}
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1"
                      title="Konfirmasi Pesanan & Potong Stok Dapur Otomatis"
                    >
                      <PackageCheck size={14} /> <span>Produksi</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedOrderForPrint(o)}
                    className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl transition-all border border-slate-200"
                    title="Cetak Struk POS (58mm/80mm) atau Invoice A4"
                    aria-label="Cetak Struk atau Invoice"
                  >
                    <Printer size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedOrderForAction(o)}
                    className="p-1.5 sm:p-2 bg-white text-slate-800 hover:bg-slate-950 hover:text-white rounded-xl transition-all border-2 border-slate-300"
                    title="Opsi Pesanan & Detail Bahan"
                    aria-label="Opsi Pesanan"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={40} className="text-slate-200" />
             </div>
             <h3 className="text-xl font-black text-slate-800">Tidak Ada Pesanan</h3>
             <p className="text-slate-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter tanggal Anda.</p>
          </div>
        )}
      </div>

      {/* INPUT ORDER MODAL - THE "PENCATATAN PESANAN" PART */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl sm:rounded-[3rem] w-full max-w-6xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-8 lg:p-10 pb-3 sm:pb-6 flex justify-between items-center bg-white border-b border-slate-100">
              <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-900 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                  <ReceiptText size={20} className="sm:hidden" />
                  <ReceiptText size={32} className="hidden sm:block" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-2xl font-black text-slate-900 leading-tight truncate">Pencatatan Pesanan Katering</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 sm:mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-indigo-500" /> Form Digital Order
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100 shadow-xs shrink-0"><X size={20} /></button>
            </div>
            
            <div className="p-4 sm:p-8 lg:p-10 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
              {/* LEFT COLUMN: Profil Pelanggan & Keuangan */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <Users size={16} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Detail Pelanggan</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="relative group">
                       <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1">Nama Customer / Organisasi</label>
                       <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
                        placeholder="Contoh: Bpk. Heru / PT. Maju Jaya"
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1">Kategori Acara</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none" value={newOrder.type} onChange={(e) => setNewOrder({...newOrder, type: e.target.value as any})}>
                          <option value="Individual">Individual (Pribadi)</option>
                          <option value="Corporate">Corporate (Kantor)</option>
                          <option value="Wedding">Wedding (Nikahan)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1">Tanggal Event</label>
                        <input 
                          type="date" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none" 
                          value={newOrder.date} 
                          onChange={(e) => setNewOrder({...newOrder, date: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1">Estimasi Waktu Pengiriman</label>
                      <div className="relative">
                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="time" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-black" 
                          value={newOrder.deliveryTime} 
                          onChange={(e) => setNewOrder({...newOrder, deliveryTime: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-2 relative z-10"><Wallet size={16} className="text-amber-400" /> Finansial Summary</h4>
                  <div className="space-y-5 relative z-10">
                    <div>
                      <label className="text-[9px] font-black uppercase text-white/40 mb-2 block ml-1">Total Nilai Order (Auto-Calculate)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-sm font-black">Rp</span>
                        <input 
                          type="number" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-xl font-black text-white outline-none focus:bg-white/10 focus:ring-4 focus:ring-white/5 transition-all" 
                          value={newOrder.totalPrice || calculatedTotal} 
                          onChange={(e) => setNewOrder({...newOrder, totalPrice: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-white/40 mb-2 block ml-1">Uang Muka / Down Payment (DP)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400/30 text-sm font-black">Rp</span>
                        <input 
                          type="number" 
                          className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl pl-14 pr-6 py-5 text-xl font-black text-emerald-400 outline-none focus:bg-emerald-500/10 transition-all placeholder:text-emerald-900" 
                          placeholder="Berapa yang dibayar hari ini?"
                          value={newOrder.amountPaid || ''} 
                          onChange={(e) => setNewOrder({...newOrder, amountPaid: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Daftar Belanja / Menu Items */}
              <div className="lg:col-span-7 flex flex-col space-y-8">
                <div className="flex-1 bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col min-h-[500px] shadow-inner shadow-slate-100">
                   <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                          <ListPlus size={18} />
                        </div>
                        Keranjang Pesanan
                     </h4>
                     <div className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 border border-slate-100">
                        {selectedItems.length} Item Terpilih
                     </div>
                   </div>
                   
                   <div className="flex gap-4 mb-8">
                      <div className="flex-1 relative">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-[1.2rem] px-6 py-4 text-sm font-bold text-slate-800 outline-none shadow-sm appearance-none"
                          value={newItemSelector.menuId}
                          onChange={e => setNewItemSelector({...newItemSelector, menuId: e.target.value})}
                        >
                          <option value="">Pilih Menu dari Katalog...</option>
                          {menu.map(m => <option key={m.id} value={m.id}>{m.name} (Rp {m.price.toLocaleString()})</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                           <ChevronDown size={20} />
                        </div>
                      </div>
                      <div className="w-24">
                        <input 
                          type="number" 
                          className="w-full bg-white border border-slate-200 rounded-[1.2rem] px-3 py-4 text-sm font-black text-center outline-none shadow-sm"
                          value={newItemSelector.qty}
                          onChange={e => setNewItemSelector({...newItemSelector, qty: Number(e.target.value)})}
                          min="1"
                        />
                      </div>
                      <button 
                        onClick={handleAddItem}
                        className="px-8 bg-indigo-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                      >
                        <Plus size={18} /> Tambah
                      </button>
                   </div>

                   <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1 mb-8">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-[1.8rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {item.qty}x
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800 leading-tight">{item.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rp {(item.price * item.qty).toLocaleString()}</p>
                              </div>
                           </div>
                           <button onClick={() => removeItem(idx)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                              <Trash2 size={20} />
                           </button>
                        </div>
                      ))}
                      {selectedItems.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic py-16">
                           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm opacity-50">
                             <ShoppingBag size={32} />
                           </div>
                           <p className="text-sm font-bold">Daftar belanja masih kosong.</p>
                        </div>
                      )}
                   </div>

                   <div className="mt-auto pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estimasi Total Biaya</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">Rp {calculatedTotal.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={handleSaveOrder} 
                        className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-4 active:scale-95"
                      >
                         <CheckCircle2 size={24} /> Konfirmasi & Simpan
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DETAIL PESANAN & KEBUTUHAN BAHAN (BOM) */}
      {selectedOrderForAction && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrderForAction(null)}></div>
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg overflow-y-auto max-h-[92vh] shadow-2xl relative z-10 p-5 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  #{selectedOrderForAction.id}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedOrderForAction.customerName}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForAction(null)} 
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-4 mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Item Pesanan:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                {selectedOrderForAction.items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOM Ingredients Required */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-2">
                <PackageCheck size={16} className="text-indigo-600" />
                <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">Kebutuhan Bahan Dapur (BOM)</p>
              </div>
              <div className="space-y-1.5 text-xs text-indigo-900 font-medium">
                {(() => {
                  const bom = calculateOrderBOMRequirements(selectedOrderForAction, menu);
                  if (bom.length === 0) {
                    return <p className="text-slate-500 italic text-[11px]">Resep otomatis tidak terdeteksi untuk pesanan kustom ini.</p>;
                  }
                  return bom.map(b => (
                    <div key={b.ingredientId} className="flex justify-between items-center py-0.5 border-b border-indigo-100/50">
                      <span>{b.name}</span>
                      <span className="font-black">{b.amountRequired} {b.unit}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Status Flow Actions */}
            <div className="space-y-3">
              {/* Cetak Struk / Invoice POS & A4 */}
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForPrint(selectedOrderForAction);
                  setSelectedOrderForAction(null);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Printer size={16} /> Cetak Struk POS (58/80mm) / Invoice A4
              </button>

              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ubah Status & Alur Kerja:</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedOrderForAction.status === 'Pending' && onConfirmAndDeductStock && (
                  <button
                    onClick={() => {
                      onConfirmAndDeductStock(selectedOrderForAction);
                      setSelectedOrderForAction(null);
                    }}
                    className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <PackageCheck size={16} /> Konfirmasi & Potong Stok Sekarang
                  </button>
                )}

                {selectedOrderForAction.status !== 'Confirmed' && (
                  <button
                    onClick={() => {
                      onUpdateOrder(selectedOrderForAction.id, { status: 'Confirmed' });
                      setSelectedOrderForAction(null);
                      onNotify?.(`Pesanan #${selectedOrderForAction.id} diubah ke Terkonfirmasi.`, 'success');
                    }}
                    className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-200"
                  >
                    Set Terkonfirmasi
                  </button>
                )}

                {selectedOrderForAction.status !== 'Delivered' && (
                  <button
                    onClick={() => {
                      onUpdateOrder(selectedOrderForAction.id, { status: 'Delivered' });
                      setSelectedOrderForAction(null);
                      onNotify?.(`Pesanan #${selectedOrderForAction.id} telah Selesai Terkirim!`, 'success');
                    }}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                  >
                    Set Selesai (Delivered)
                  </button>
                )}

                {selectedOrderForAction.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      onUpdateOrder(selectedOrderForAction.id, { status: 'Cancelled' });
                      setSelectedOrderForAction(null);
                      onNotify?.(`Pesanan #${selectedOrderForAction.id} dibatalkan.`, 'warning');
                    }}
                    className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-200"
                  >
                    Batalkan Pesanan
                  </button>
                )}

                {selectedOrderForAction.paymentStatus !== 'Paid' && (
                  <button
                    onClick={() => {
                      onUpdateOrder(selectedOrderForAction.id, { 
                        paymentStatus: 'Paid', 
                        amountPaid: selectedOrderForAction.totalPrice 
                      });
                      setSelectedOrderForAction(null);
                      onNotify?.(`Pembayaran #${selectedOrderForAction.id} berhasil ditandai Lunas!`, 'success');
                    }}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200"
                  >
                    Tandai Lunas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK STRUK & INVOICE MULTI-FORMAT */}
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

export default OrdersList;
