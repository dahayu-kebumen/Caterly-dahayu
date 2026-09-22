import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, Minus, Trash2, Printer, Receipt, 
  CreditCard, Banknote, QrCode, Share2, CheckCircle2, 
  RotateCcw, Percent, ShoppingBag, User, ArrowRight,
  Clock, Check, X, Sparkles, Tag, Layers, ChevronRight,
  UtensilsCrossed, Phone, DollarSign, Wallet
} from 'lucide-react';
import { MenuItem, Order, ShiftType, StoreSettings, IngredientStock, StockMutation } from '../types';
import { deductStockForOrder } from '../services/inventoryLogic';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface PosCashierProps {
  menu: MenuItem[];
  categories: string[];
  settings: StoreSettings;
  currentShift?: ShiftType;
  currentAdminName?: string;
  onAddOrder: (order: Order) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning') => void;
  inventory?: IngredientStock[];
  onUpdateInventory?: (newInv: IngredientStock[]) => void;
  onAddMutation?: (mutation: StockMutation) => void;
}

interface CartItem {
  menuItem: MenuItem;
  qty: number;
  note?: string;
}

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DP';

export const PosCashier: React.FC<PosCashierProps> = ({
  menu,
  categories,
  settings,
  currentShift = 'Pagi',
  currentAdminName = 'Kasir',
  onAddOrder,
  onNotify,
  inventory = [],
  onUpdateInventory,
  onAddMutation
}) => {
  // State Filter & Pencarian Menu
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // State Keranjang Kasir
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'Walk-in' | 'Take Away' | 'Dine-in' | 'Katering'>('Walk-in');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountNominal, setCustomDiscountNominal] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'NOMINAL'>('PERCENT');

  // State Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  // Modal Cetak Struk
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedOrderDetails, setCompletedOrderDetails] = useState<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashReceived: number;
    change: number;
    receiptNo: string;
    timestamp: string;
  } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Ref untuk cetak struk
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  // Filter Menu
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Kalkulasi Keranjang
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.menuItem.price * item.qty), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((subtotal * discountPercent) / 100);
    }
    return Math.min(customDiscountNominal, subtotal);
  }, [subtotal, discountPercent, customDiscountNominal, discountType]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return Math.max(0, cashReceived - totalAmount);
    }
    return 0;
  }, [cashReceived, totalAmount, paymentMethod]);

  const isCashSufficient = paymentMethod === 'CASH' ? cashReceived >= totalAmount : true;

  // Aksi Keranjang
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.menuItem.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { menuItem: item, qty: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(ci => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.qty + delta;
            return newQty > 0 ? { ...ci, qty: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomDiscountNominal(0);
    setCashReceived(0);
    setDpAmount(0);
  };

  // Preset Uang Cepat
  const quickCashOptions = useMemo(() => {
    if (totalAmount <= 0) return [10000, 20000, 50000, 100000];
    const rounded50 = Math.ceil(totalAmount / 50000) * 50000;
    const rounded100 = Math.ceil(totalAmount / 100000) * 100000;
    const setOptions = new Set<number>([
      totalAmount,
      rounded50 > totalAmount ? rounded50 : totalAmount + 10000,
      rounded100 > totalAmount ? rounded100 : totalAmount + 50000,
      100000,
      200000
    ]);
    return Array.from(setOptions).sort((a, b) => a - b).slice(0, 5);
  }, [totalAmount]);

  // Eksekusi Transaksi POS
  const handleProcessTransaction = () => {
    if (cart.length === 0) {
      onNotify?.('Keranjang kasir masih kosong!', 'warning');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceived < totalAmount) {
      onNotify?.(`Uang tunai kurang Rp ${(totalAmount - cashReceived).toLocaleString('id-ID')}`, 'error');
      return;
    }

    const receiptNumber = `POS-${Date.now().toString().slice(-6)}`;
    const formattedItems = cart.map(ci => `${ci.menuItem.name} (${ci.qty})`);

    let amountPaid = totalAmount;
    let paymentStatus: Order['paymentStatus'] = 'Paid';

    if (paymentMethod === 'DP') {
      amountPaid = Math.min(dpAmount, totalAmount);
      paymentStatus = amountPaid >= totalAmount ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';
    }

    const newOrder: Order = {
      id: receiptNumber,
      customerName: customerName.trim() || 'Pelanggan Walk-in',
      items: formattedItems,
      totalPrice: totalAmount,
      amountPaid: amountPaid,
      date: new Date().toISOString().split('T')[0],
      deliveryTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Confirmed', // Pesanan kasir langsung berstatus Confirmed
      paymentStatus: paymentStatus,
      type: 'Individual',
      shift: currentShift,
      recordedBy: currentAdminName
    };

    // Otomatis potong stok bahan baku jika opsi aktif
    if (autoDeductStock && inventory.length > 0 && onUpdateInventory && onAddMutation) {
      const deduction = deductStockForOrder(newOrder, menu, inventory, currentAdminName);
      if (deduction.mutations.length > 0) {
        onUpdateInventory(deduction.updatedInventory);
        deduction.mutations.forEach(m => onAddMutation(m));
      }
    }

    // Tambah pesanan ke database pesanan
    onAddOrder(newOrder);

    // Simpan detail untuk struk
    setCompletedOrder(newOrder);
    setCompletedOrderDetails({
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total: totalAmount,
      paymentMethod,
      cashReceived: paymentMethod === 'CASH' ? cashReceived : totalAmount,
      change: changeAmount,
      receiptNo: receiptNumber,
      timestamp: new Date().toLocaleString('id-ID', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    });

    setIsReceiptModalOpen(true);
    onNotify?.(`Transaksi kasir #${receiptNumber} berhasil disimpan!`, 'success');

    // Reset keranjang
    clearCart();
    setCustomerName('Pelanggan Walk-in');
    setCustomerPhone('');
  };

  // Cetak Struk Kasir
  const handlePrintReceipt = () => {
    window.print();
  };

  // Kirim WhatsApp Struk
  const handleSendWhatsappReceipt = () => {
    if (!completedOrderDetails) return;
    const phone = customerPhone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    const itemListText = completedOrderDetails.items
      .map(ci => `• ${ci.menuItem.name} x${ci.qty} = Rp ${(ci.menuItem.price * ci.qty).toLocaleString('id-ID')}`)
      .join('\n');

    const message = 
`*NOTA RESMI - ${settings.storeName.toUpperCase()}*
No. Transaksi: ${completedOrderDetails.receiptNo}
Tanggal: ${completedOrderDetails.timestamp}
Kasir: ${currentAdminName} (${currentShift})
Pelanggan: ${completedOrder?.customerName}

-----------------------------
*RINCIAN PESANAN:*
${itemListText}
-----------------------------
Subtotal: Rp ${completedOrderDetails.subtotal.toLocaleString('id-ID')}
${completedOrderDetails.discount > 0 ? `Diskon: -Rp ${completedOrderDetails.discount.toLocaleString('id-ID')}\n` : ''}*TOTAL: Rp ${completedOrderDetails.total.toLocaleString('id-ID')}*
Metode: ${completedOrderDetails.paymentMethod}
${completedOrderDetails.paymentMethod === 'CASH' ? `Tunai Diterima: Rp ${completedOrderDetails.cashReceived.toLocaleString('id-ID')}\nKembalian: Rp ${completedOrderDetails.change.toLocaleString('id-ID')}` : ''}
${completedOrder?.paymentStatus === 'Partial' ? `\n*SISA PIUTANG: Rp ${(completedOrderDetails.total - (completedOrder?.amountPaid || 0)).toLocaleString('id-ID')}*` : ''}

_Terima kasih telah berbelanja di ${settings.storeName}!_`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* HEADER POS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Point of Sale
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Shift {currentShift} • Kasir: {currentAdminName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              Kasir Cepat & Penjualan Langsung
            </h2>
          </div>
        </div>

        {/* Quick Stats or Actions */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoDeductStock} 
              onChange={e => setAutoDeductStock(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Auto Potong Stok (BOM)</span>
          </label>
        </div>
      </div>

      {/* MAIN LAYOUT: MENU CATALOG (LEFT) & REGISTER CART (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: KATALOG MENU (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* SEARCH & CATEGORIES */}
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ketik nama menu untuk kasir cepat..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* CATEGORIES PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategory('Semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCategory === 'Semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({menu.length})
              </button>
              {categories.map(cat => {
                const count = menu.filter(m => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* MENU GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredMenu.map(item => {
              const inCart = cart.find(ci => ci.menuItem.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-white rounded-2xl p-3 border-2 transition-all cursor-pointer select-none flex flex-col justify-between hover:shadow-md active:scale-98 ${
                    inCart 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                      <img 
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-slate-800 shadow-xs">
                        {item.category}
                      </span>
                      {inCart && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                          {inCart.qty}
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-black text-emerald-700">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                    <button 
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        inCart 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white'
                      }`}
                      title="Tambah ke keranjang"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMenu.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
                <UtensilsCrossed size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-black text-slate-800">Menu tidak ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian atau kategori lain.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: KASIR REGISTER & PEMBAYARAN (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sticky top-6">
          {/* REGISTER HEADER */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Nota Pesanan Kasir</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Bersihkan
              </button>
            )}
          </div>

          {/* CUSTOMER & ORDER TYPE DETAILS */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Walk-in..."
                className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Tipe Layanan
              </label>
              <select
                value={orderType}
                onChange={e => setOrderType(e.target.value as any)}
                className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
              >
                <option value="Walk-in">Walk-in (Langsung)</option>
                <option value="Dine-in">Makan di Tempat</option>
                <option value="Take Away">Bungkus (Take Away)</option>
                <option value="Katering">Pesanan Katering</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                No. WhatsApp (Opsional, untuk kirim nota)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="08123456789..."
                className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* CART ITEMS LIST */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <ShoppingBag size={32} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-black text-slate-500">Keranjang masih kosong</p>
                <p className="text-[11px] text-slate-400">Pilih menu di sebelah kiri untuk mulai transaksi.</p>
              </div>
            ) : (
              cart.map(item => (
                <div 
                  key={item.menuItem.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 leading-tight truncate">
                      {item.menuItem.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      @ Rp {item.menuItem.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-slate-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[70px]">
                    <p className="text-xs font-black text-slate-900">
                      Rp {(item.menuItem.price * item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.menuItem.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                    title="Hapus"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* DISKON & POTONGAN */}
          {cart.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-amber-950 flex items-center gap-1">
                  <Tag size={13} className="text-amber-600" /> Diskon & Potongan
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDiscountType('PERCENT')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'PERCENT' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType('NOMINAL')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'NOMINAL' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Rp
                  </button>
                </div>
              </div>

              {discountType === 'PERCENT' ? (
                <div className="flex items-center gap-1.5">
                  {[0, 5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                        discountPercent === pct 
                          ? 'bg-amber-600 text-white shadow-xs' 
                          : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Contoh: 10000"
                    value={customDiscountNominal || ''}
                    onChange={e => setCustomDiscountNominal(Number(e.target.value) || 0)}
                    className="w-full bg-white px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* SUMMARY CALCULATIONS */}
          <div className="space-y-1.5 pt-2 border-t-2 border-slate-100 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({cart.reduce((a, b) => a + b.qty, 0)} item)</span>
              <span className="font-bold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Potongan Diskon</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-black text-slate-950 pt-2 border-t border-slate-200">
              <span>Total Tagihan</span>
              <span className="text-emerald-700">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* METODE PEMBAYARAN */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border-2 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Banknote size={16} /> Tunai
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('QRIS');
                    setCashReceived(totalAmount);
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border-2 transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <QrCode size={16} /> QRIS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('TRANSFER');
                    setCashReceived(totalAmount);
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border-2 transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard size={16} /> Transfer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('DP');
                    setDpAmount(Math.round(totalAmount * 0.5));
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border-2 transition-all ${
                    paymentMethod === 'DP'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Wallet size={16} /> DP Katering
                </button>
              </div>

              {/* INPUT SPESIFIK CASH */}
              {paymentMethod === 'CASH' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Nominal Uang Tunai Diterima:</span>
                    <button
                      onClick={() => setCashReceived(totalAmount)}
                      className="text-[10px] font-black text-emerald-700 hover:underline uppercase"
                    >
                      Uang Pas (Rp {totalAmount.toLocaleString('id-ID')})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-slate-950 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  {/* QUICK BUTTONS */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashOptions.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashReceived(val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          cashReceived === val 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Rp {val.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* KEMBALIAN STATUS */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Uang Kembalian:
                    </span>
                    <span className={`text-base font-black ${
                      isCashSufficient ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {isCashSufficient 
                        ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                        : `Kurang Rp ${(totalAmount - cashReceived).toLocaleString('id-ID')}`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* INPUT DP */}
              {paymentMethod === 'DP' && (
                <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <p className="text-xs text-indigo-900 font-bold">
                    Pembayaran Uang Muka (DP). Sisa tagihan akan otomatis dicatat sebagai Piutang Katering.
                  </p>
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-800 block mb-1">
                      Jumlah Uang Muka Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={dpAmount || ''}
                      onChange={e => setDpAmount(Number(e.target.value) || 0)}
                      placeholder="Nominal DP..."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 font-black text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-black text-indigo-950 pt-1">
                    <span>Sisa Piutang:</span>
                    <span>Rp {Math.max(0, totalAmount - dpAmount).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* TOMBOL BAYAR SELESAI */}
              <button
                type="button"
                onClick={handleProcessTransaction}
                disabled={!isCashSufficient}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  isCashSufficient
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Proses Transaksi & Simpan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CETAK STRUK KASIR MULTI-FORMAT (58MM, 80MM, A4) */}
      <ReceiptPrintModal
        isOpen={isReceiptModalOpen && !!completedOrderDetails}
        onClose={() => setIsReceiptModalOpen(false)}
        order={completedOrder}
        cashierData={completedOrderDetails ? {
          ...completedOrderDetails,
          customerName: completedOrder?.customerName || customerName,
          customerPhone: completedOrder?.customerPhone || customerPhone
        } : null}
        settings={settings}
        currentAdminName={currentAdminName}
        currentShift={currentShift}
        onNotify={onNotify}
      />
    </div>
  );
};

export default PosCashier;
