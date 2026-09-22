import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Monitor, MessageCircle, 
  Clock, MapPin, ChevronRight, Plus, Minus, 
  CheckCircle, Award, Utensils, Info, Loader2,
  ShoppingBag, Trash2, Calendar, User, Phone,
  FileText, ArrowRight, X, Sparkles, Truck, Navigation, Lock, Share2, Copy
} from 'lucide-react';
import { MenuItem, StoreSettings } from '../types';

interface PublicMenuProps {
  menu: MenuItem[];
  settings: StoreSettings;
  categories: string[];
  isStandalone?: boolean;
  onBackToAdmin: () => void;
  onPlaceOrder?: (orderData: { 
    customerName: string;
    customerPhone?: string;
    date: string;
    deliveryTime: string;
    deliveryMethod: 'Delivery' | 'Pickup';
    deliveryAddress: string;
    deliveryNotes?: string;
    items: string[];
    total: number;
    totalItems: number;
  }) => void;
}

const PublicMenu: React.FC<PublicMenuProps> = ({ 
  menu, 
  settings, 
  categories, 
  isStandalone = false,
  onBackToAdmin, 
  onPlaceOrder 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state: mapping of menuItem id -> quantity (support manual number > 100)
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  
  // Modals & Drawers
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [tempModalQty, setTempModalQty] = useState<number>(1);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Delivery & Schedule Form State (Crucial for Delivery Team)
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [deliveryMethod, setDeliveryMethod] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState(tomorrow);
  const [deliveryTime, setDeliveryTime] = useState('11:30');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [courierInstructions, setCourierInstructions] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const displayCategories = ['Semua', ...categories];

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, activeCategory, searchQuery]);

  // Direct manual cart updater
  const updateCartQty = (id: string, qty: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      const safeQty = Math.max(0, Math.floor(qty));
      if (safeQty > 0) {
        newCart[id] = safeQty;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const addQuickQty = (id: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = cart[id] || 0;
    updateCartQty(id, current + delta);
  };

  const removeFromCart = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  // Cart totals
  const cartEntries = useMemo(() => {
    return (Object.entries(cart) as [string, number][])
      .map(([id, qty]) => {
        const item = menu.find(m => m.id === id);
        return { item, qty, id };
      })
      .filter((entry): entry is { item: MenuItem; qty: number; id: string } => !!entry.item);
  }, [cart, menu]);

  const cartTotal = useMemo(() => {
    return cartEntries.reduce((total, { item, qty }) => total + item.price * qty, 0);
  }, [cartEntries]);

  const cartCount = useMemo(() => {
    return cartEntries.reduce((total, { qty }) => total + qty, 0);
  }, [cartEntries]);

  // Open item detail modal
  const handleOpenItemDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setTempModalQty(cart[item.id] || 1);
  };

  const handleSaveModalQty = () => {
    if (!selectedItem) return;
    updateCartQty(selectedItem.id, tempModalQty);
    setSelectedItem(null);
  };

  // Preset time picker helper
  const setQuickTime = (time: string) => {
    setDeliveryTime(time);
  };

  const handleSendWhatsAppOrder = () => {
    if (cartCount === 0) return;
    if (!customerName.trim()) {
      alert('Mohon masukkan nama pemesan.');
      return;
    }
    if (deliveryMethod === 'Delivery' && !deliveryAddress.trim()) {
      alert('Mohon masukkan alamat lengkap pengiriman untuk tim delivery.');
      return;
    }

    setIsProcessing(true);

    const itemsList = cartEntries.map(({ item, qty }) => {
      const subtotal = item.price * qty;
      return `• ${item.name} (${qty} porsi) : Rp ${subtotal.toLocaleString('id-ID')}`;
    });

    const plainItemsList = cartEntries.map(({ item, qty }) => `${item.name} (${qty}x)`);

    const finalAddress = deliveryMethod === 'Delivery'
      ? deliveryAddress.trim()
      : (settings.address ? `Ambil di Dapur Katering: ${settings.address}` : 'Ambil Sendiri di Dapur Katering');

    const combinedDeliveryNotes = [
      courierInstructions.trim() ? `Patokan Kurir: ${courierInstructions.trim()}` : '',
      orderNotes.trim() ? `Catatan Menu: ${orderNotes.trim()}` : ''
    ].filter(Boolean).join(' | ');

    // Callback to parent/admin to record order in app & Ruang Delivery
    if (onPlaceOrder) {
      onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        date: eventDate,
        deliveryTime: deliveryTime,
        deliveryMethod: deliveryMethod,
        deliveryAddress: finalAddress,
        deliveryNotes: combinedDeliveryNotes,
        items: plainItemsList,
        total: cartTotal,
        totalItems: cartCount
      });
    }

    // Format formatted WhatsApp message with full delivery details
    const formattedDate = new Date(eventDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const waText = 
`Halo *${settings.storeName}*, saya ingin memesan katering dengan rincian berikut:

📋 *RINCIAN MENU PESANAN:*
${itemsList.join('\n')}

📦 *Total Pesanan:* ${cartCount.toLocaleString('id-ID')} Porsi
💰 *Total Estimasi:* Rp ${cartTotal.toLocaleString('id-ID')}

⏰ *WAKTU HARUS DIKIRIM / DIAMBIL:*
• Metode: ${deliveryMethod === 'Delivery' ? '🛵 DIKIRIM OLEH TIM DELIVERY' : '🏬 DIAMBIL SENDIRI DI DAPUR'}
• Tanggal: ${formattedDate}
• Waktu/Jam: ${deliveryTime} WIB (${deliveryMethod === 'Delivery' ? 'Harus Tiba di Lokasi' : 'Waktu Pengambilan'})

📍 *DATA PEMESAN & ALAMAT PENGIRIMAN:*
• Nama Pemesan: ${customerName}
${customerPhone ? `• No. WhatsApp: ${customerPhone}\n` : ''}• Alamat: ${finalAddress}
${courierInstructions ? `• Patokan / Petunjuk Kurir: ${courierInstructions}\n` : ''}${orderNotes ? `• Catatan Khusus: ${orderNotes}\n` : ''}
Mohon konfirmasi ketersediaan slot dapur dan jadwal tim pengiriman. Terima kasih!`;

    setTimeout(() => {
      const cleanPhone = (settings.whatsappNumber || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
      setIsProcessing(false);
      setOrderSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 pb-36 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[350] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-8 animate-in fade-in duration-200">
           <div className="relative mb-6">
              <Loader2 className="animate-spin text-emerald-400" size={56} />
              <div className="absolute inset-0 flex items-center justify-center">
                 <ShoppingBag size={22} className="text-white" />
              </div>
           </div>
           <h2 className="text-2xl font-black mb-2">Menyiapkan Pesanan WhatsApp...</h2>
           <p className="text-slate-300 max-w-sm text-sm font-medium leading-relaxed">
             Memformat jadwal pengiriman dan total pesanan {cartCount} porsi ke WhatsApp {settings.storeName}.
           </p>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[360] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Pesanan Terkirim!</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Jendela WhatsApp telah terbuka untuk mengonfirmasi pesanan katering Anda secara langsung dengan tim dapur kami.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setIsCartDrawerOpen(false);
                  setCart({});
                }}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative h-[48vh] min-h-[360px] w-full overflow-hidden bg-slate-950">
        <img 
          src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-40 scale-105" 
          alt="Catering Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30"></div>
        
        {/* Top Navbar */}
        <div className="absolute top-0 left-0 right-0 p-6 sm:p-8 flex justify-between items-center z-50">
          <div className="flex items-center gap-3.5 bg-white/95 backdrop-blur px-4 sm:px-5 py-2.5 rounded-2xl border border-white/40 shadow-xl">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden shrink-0">
              {settings.logoUrl && settings.logoUrl !== '/logo.jpg' ? (
                <img src={settings.logoUrl} alt={settings.storeName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-900 text-white font-black text-xs flex items-center justify-center uppercase">
                  {settings.storeName ? settings.storeName.slice(0, 2) : 'KT'}
                </div>
              )}
            </div>
            <div className="block">
              <span className="font-black text-xs sm:text-sm tracking-wider text-slate-950 uppercase block leading-none">
                {settings.storeName}
              </span>
              {settings.address && (
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1 flex items-center gap-1 line-clamp-1 max-w-[200px] sm:max-w-xs">
                  <MapPin size={10} className="text-emerald-600 shrink-0" /> {settings.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {cartCount > 0 && (
              <button 
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Keranjang</span>
                <span className="bg-white text-emerald-800 text-[11px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                  {cartCount}
                </span>
              </button>
            )}

            {!isStandalone && (
              <button 
                onClick={onBackToAdmin} 
                className="px-4 py-2.5 bg-white/95 hover:bg-white text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-md border border-slate-200 flex items-center gap-2 transition-all"
                title="Kembali ke Mode Admin"
              >
                <Monitor size={16} className="text-slate-700" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Title & Badges */}
        <div className="absolute bottom-12 left-0 right-0 px-6 sm:px-8 max-w-6xl mx-auto text-white">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              <CheckCircle size={13} /> Higienis & Halal
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              <Award size={13} /> Siap Porsi Besar & 100+ Box
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-md">
            {settings.storeName}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 font-medium max-w-xl">
            Pesan paket katering, nasi box, prasmanan, dan tumpeng lezat untuk acara keluarga, kantor, maupun pesta Anda.
          </p>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="bg-white rounded-2xl shadow-xl -mt-6 relative z-30 p-2 sm:p-3 flex items-center gap-3 border border-slate-200">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Cari hidangan katering favorit Anda..." 
            className="flex-1 bg-transparent outline-none text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Categories Filter */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 mt-8">
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {displayCategories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 mt-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Utensils size={22} className="text-emerald-600" />
            Daftar Pilihan Menu
          </h2>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            {filteredMenu.length} Menu
          </span>
        </div>

        {filteredMenu.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8">
            <Utensils size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-black text-slate-700 text-base">Menu tidak ditemukan</p>
            <p className="text-xs text-slate-600 mt-1">Coba gunakan kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredMenu.map(item => {
              const currentQty = cart[item.id] || 0;
              const hasInCart = currentQty > 0;

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col overflow-hidden group shadow-sm hover:shadow-lg ${
                    hasInCart ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Image and Category Badge */}
                  <div 
                    onClick={() => handleOpenItemDetail(item)}
                    className="relative aspect-[4/3] overflow-hidden cursor-pointer bg-slate-100"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                        {item.category}
                      </span>
                    </div>
                    {hasInCart && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                        <CheckCircle size={12} /> {currentQty} Porsi
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div onClick={() => handleOpenItemDetail(item)} className="cursor-pointer">
                      <h3 className="font-black text-base sm:text-lg text-slate-950 mb-1.5 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4 line-clamp-2">
                        {item.description || 'Pilihan lezat dengan bahan berkualitas untuk acara spesial Anda.'}
                      </p>
                    </div>

                    {/* Price and Action Section */}
                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Harga per Porsi</span>
                        <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* KOLOM PENGISIAN JUMLAH ORDER (DIRECT INPUT FIELD) */}
                      <div className="space-y-2">
                        <div className={`p-2.5 rounded-2xl border-2 transition-all ${
                          hasInCart 
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 focus-within:border-emerald-600 focus-within:bg-white'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5 px-0.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                              Kolom Jumlah Order:
                            </span>
                            {hasInCart ? (
                              <span className="text-xs font-black text-emerald-800">
                                Subtotal: Rp {(item.price * currentQty).toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold">Ketik porsi</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="0"
                              placeholder="Isi porsi (misal: 115)..."
                              value={currentQty > 0 ? currentQty : ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateCartQty(item.id, isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-sm font-black text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium placeholder:text-xs shadow-inner"
                              title="Ketik jumlah pesanan (misal 115 porsi)"
                            />
                            <span className="text-xs font-black text-slate-700 uppercase bg-slate-200/90 px-2.5 py-2 rounded-xl shrink-0">
                              Porsi
                            </span>
                            {hasInCart && (
                              <button
                                onClick={() => updateCartQty(item.id, 0)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                                title="Kosongkan pesanan menu ini"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Portion Shortcuts */}
                        <div className="flex items-center justify-between text-[11px] px-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Porsi Cepat:</span>
                          <div className="flex items-center gap-1.5">
                            {[50, 100, 115, 200].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateCartQty(item.id, val)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                                  currentQty === val 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail & Custom Quantity Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[320] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="relative aspect-[16/9] bg-slate-100 shrink-0">
              <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  {selectedItem.category}
                </span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950 leading-tight mb-1">{selectedItem.name}</h3>
                <p className="text-lg font-black text-emerald-600">Rp {selectedItem.price.toLocaleString('id-ID')} <span className="text-xs text-slate-600 font-bold">/ porsi</span></p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedItem.description || 'Pilihan menu katering terbaik yang dimasak higienis dengan bumbu rempah pilihan.'}
              </p>

              {/* Package contents if any */}
              {selectedItem.packageItems && selectedItem.packageItems.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Isi Paket Termasuk:</p>
                  <ul className="space-y-1">
                    {selectedItem.packageItems.map((pkg, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {pkg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manual Quantity Input section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Jumlah Pesanan (Isi Manual):
                  </label>
                  <span className="text-xs font-bold text-slate-600">Bisa lebih dari 100 porsi</span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setTempModalQty(Math.max(1, tempModalQty - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black shadow-sm"
                  >
                    <Minus size={16} />
                  </button>

                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      min="1"
                      value={tempModalQty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setTempModalQty(isNaN(v) ? 0 : Math.max(0, v));
                      }}
                      className="w-full text-center py-2.5 px-3 bg-white border-2 border-emerald-500 rounded-xl font-black text-lg text-slate-900 outline-none shadow-inner"
                      placeholder="Contoh: 150"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600 uppercase">
                      Porsi
                    </span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setTempModalQty(tempModalQty + 1)}
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center font-black shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Quick Batch Catering Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[25, 50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTempModalQty(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                        tempModalQty === amt 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-800'
                      }`}
                    >
                      {amt} Porsi
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-600">Subtotal Estimasi:</span>
                  <span className="text-base font-black text-emerald-700">
                    Rp {(selectedItem.price * tempModalQty).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-white"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveModalQty}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                Simpan {tempModalQty} Porsi ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Bottom Bar */}
      {cartCount > 0 && !isCartDrawerOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl bg-slate-950/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-2xl flex items-center justify-between text-white z-[200] border border-white/20 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-white shadow-lg border border-emerald-400 shrink-0">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pesanan</p>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                  {cartCount.toLocaleString('id-ID')} Porsi
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-white leading-tight">
                Rp {cartTotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsCartDrawerOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 sm:px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg flex items-center gap-2"
          >
            <span>Lanjut Pesan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Cart & Scheduling Drawer / Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-[280] flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCartDrawerOpen(false)}
          />

          <div className="w-full max-w-xl bg-white h-full relative z-[290] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight leading-none">
                    Keranjang & Jadwal
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    {cartCount} porsi katering siap diproses
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* 1. Item List with Manual Quantity Edit */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    1. Rincian Porsi Menu
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600">
                    Bisa edit angka manual
                  </span>
                </div>

                <div className="space-y-3">
                  {cartEntries.map(({ item, qty }) => (
                    <div 
                      key={item.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-14 h-14 object-cover rounded-xl shrink-0 border border-slate-200" 
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-black text-sm text-slate-900 truncate leading-snug">{item.name}</h5>
                          <p className="text-xs text-slate-600 mt-0.5">Rp {item.price.toLocaleString('id-ID')} / porsi</p>
                          <p className="text-xs font-black text-emerald-700 mt-1">
                            Subtotal: Rp {(item.price * qty).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                          title="Hapus dari pesanan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Manual Quantity Editor inside Cart */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Jumlah:</span>
                        
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-300">
                          <button 
                            onClick={() => updateCartQty(item.id, qty - 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                          >
                            <Minus size={12} />
                          </button>

                          <input 
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateCartQty(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-16 text-center font-black text-xs text-slate-900 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-600 uppercase pr-1">Porsi</span>

                          <button 
                            onClick={() => updateCartQty(item.id, qty + 1)}
                            className="w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Quick Presets inside Drawer */}
                        <div className="flex items-center gap-1 ml-auto">
                          <button 
                            onClick={() => addQuickQty(item.id, 50)}
                            className="px-2 py-1 bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-[10px] font-black text-slate-700"
                          >
                            +50
                          </button>
                          <button 
                            onClick={() => addQuickQty(item.id, 100)}
                            className="px-2 py-1 bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-[10px] font-black text-slate-700"
                          >
                            +100
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Pilihan Metode & Waktu Pengantaran / Pengambilan (PENTING UNTUK TEAM DELIVERY) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-950 font-black text-sm uppercase tracking-tight border-b border-slate-200 pb-2.5">
                  <Clock size={16} className="text-emerald-600" />
                  2. Metode & Waktu Pengiriman (Penting untuk Tim Delivery)
                </div>

                {/* Pilihan Metode: Delivery vs Pickup */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Layanan Pengantaran / Pengambilan:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Delivery')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 ${
                        deliveryMethod === 'Delivery'
                          ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                        <Truck size={16} className={deliveryMethod === 'Delivery' ? 'text-emerald-700' : 'text-slate-500'} />
                        <span>🛵 Dikirim Kurir</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Diantar langsung ke lokasi acara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Pickup')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 ${
                        deliveryMethod === 'Pickup'
                          ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                        <ShoppingBag size={16} className={deliveryMethod === 'Pickup' ? 'text-emerald-700' : 'text-slate-500'} />
                        <span>🏬 Ambil di Dapur</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Diambil sendiri oleh pemesan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Tanggal Acara */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Acara / Pengiriman <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Waktu / Jam Harus Tiba */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      {deliveryMethod === 'Delivery' ? 'Jam Harus Tiba di Lokasi' : 'Jam Rencana Diambil'} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="time" 
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Preset Tombol Waktu Cepat */}
                <div>
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Pilihan Waktu Acara Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickTime('08:00')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        deliveryTime === '08:00'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      Pagi (08:00 WIB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('11:30')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        deliveryTime === '11:30'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      Makan Siang (11:30 WIB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('16:30')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        deliveryTime === '16:30'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      Sore (16:30 WIB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('19:00')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        deliveryTime === '19:00'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      Malam (19:00 WIB)
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Data Pemesan & Alamat Pengiriman (SANGAT VITAL UNTUK TIM DELIVERY) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-950 font-black text-sm uppercase tracking-tight border-b border-slate-200 pb-2.5">
                  <MapPin size={16} className="text-emerald-600" />
                  3. Data Pemesan & Alamat Pengiriman
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Nama Pemesan / Instansi <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Ibu Rina / PT Maju Sejahtera"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Nomor WhatsApp / HP Penerima di Lokasi <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      placeholder="Contoh: 08123456789 (untuk kurir)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {deliveryMethod === 'Delivery' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Alamat Lengkap Pengantaran (Wajib untuk Tim Delivery) <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="Nama gedung, jalan, nomor rumah, lantai/ruangan, RT/RW, kelurahan..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Patokan Khusus / Panduan Kurir
                      </label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Masuk lewat gerbang utara, lift barang lt. 2, lapor satpam pos utama"
                        value={courierInstructions}
                        onChange={(e) => setCourierInstructions(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-black uppercase tracking-wider block mb-1">Lokasi Dapur Pusat Katering:</span>
                    <p className="font-bold">{settings.address || 'Dapur Pusat Katering'}</p>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Pesanan dapat diambil tepat pada jam <span className="font-black">{deliveryTime} WIB</span>.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Menu / Katering (Opsional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Pisahkan sambal, bungkus kuah terpisah, sediakan sendok garpu"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 4. Total Ringkasan Biaya */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-1">
                  <span>Total Kuantitas:</span>
                  <span className="font-black text-sm">{cartCount.toLocaleString('id-ID')} Porsi</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-2">
                  <span>Estimasi Biaya Menu:</span>
                  <span className="font-black text-base text-emerald-800">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-normal border-t border-emerald-200/80 pt-2">
                  * Biaya akhir dan ongkos kirim (jika ada) akan dikonfirmasi langsung oleh pihak {settings.storeName} via WhatsApp.
                </p>
              </div>

            </div>

            {/* Drawer Bottom Action */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-white space-y-2.5">
              <button 
                onClick={handleSendWhatsAppOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-98 flex items-center justify-center gap-2.5"
              >
                <MessageCircle size={18} />
                Kirim Pesanan via WhatsApp
              </button>

              <p className="text-center text-[10px] text-slate-600 font-medium">
                Pesan akan otomatis dikirim ke nomor WhatsApp resmi {settings.storeName}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 py-20 border-t border-slate-200 bg-white flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border-2 border-slate-200 overflow-hidden p-1">
            {settings.logoUrl && settings.logoUrl !== '/logo.jpg' ? (
              <img src={settings.logoUrl} alt={settings.storeName} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-900 text-white font-black text-lg flex items-center justify-center uppercase">
                {settings.storeName ? settings.storeName.slice(0, 2) : 'KT'}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-2xl font-black text-slate-950 leading-none uppercase">{settings.storeName}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Layanan Katering & Kuliner Terpercaya</p>
          </div>
        </div>
        <div className="text-center space-y-2 px-6">
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {settings.address || 'Melayani pesanan katering harian, nasi box, prasmanan pesta, dan tumpeng berkualitas.'}
          </p>
          <div className="h-px w-20 bg-slate-100 mx-auto my-2"></div>
          <p className="text-[11px] font-medium text-slate-400">
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>

          {onBackToAdmin && (
            <div className="pt-3">
              <button 
                onClick={onBackToAdmin}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-100"
              >
                <Lock size={12} className="text-slate-600" />
                <span>Akses Masuk Staf / Pengelola</span>
              </button>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
};

export default PublicMenu;
