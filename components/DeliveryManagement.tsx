import React, { useState, useMemo } from 'react';
import { 
  Truck, Clock, MapPin, Phone, MessageCircle, 
  Calendar, CheckCircle2, AlertCircle, Search, 
  Filter, User, ChevronRight, Navigation, FileText, 
  Printer, ArrowUpRight, PackageCheck, Eye, Plus, 
  X, Check, ExternalLink, ShieldCheck, Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface DeliveryManagementProps {
  orders: Order[];
  onUpdateOrder: (id: string, updates: Partial<Order>) => void;
  onAddOrder?: (order: Order) => void;
  settings: StoreSettings;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentAdminName?: string;
}

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({
  orders,
  onUpdateOrder,
  onAddOrder,
  settings,
  onNotify,
  currentAdminName = 'Admin'
}) => {
  const [filterDate, setFilterDate] = useState<'today' | 'tomorrow' | 'upcoming' | 'all'>('today');
  const [filterMethod, setFilterMethod] = useState<'all' | 'Delivery' | 'Pickup'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected order for Delivery Slip Modal (Surat Jalan Pengiriman)
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modal edit / assign driver
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('');
  const [courierPhoneInput, setCourierPhoneInput] = useState('');
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered orders with delivery awareness
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter
      if (filterDate === 'today' && order.date !== todayStr) return false;
      if (filterDate === 'tomorrow' && order.date !== tomorrowStr) return false;
      if (filterDate === 'upcoming' && order.date < todayStr) return false;

      // Method filter
      const method = order.deliveryMethod || 'Delivery';
      if (filterMethod !== 'all' && method !== filterMethod) return false;

      // Status filter
      const delivStatus = order.deliveryStatus || (order.status === 'Delivered' ? 'Selesai' : 'Menunggu Jadwal');
      if (filterStatus !== 'all' && delivStatus !== filterStatus) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesAddress = (order.deliveryAddress || '').toLowerCase().includes(q);
        const matchesCourier = (order.courierName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesAddress && !matchesCourier) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by date, then by deliveryTime
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const timeA = a.deliveryTime || '23:59';
      const timeB = b.deliveryTime || '23:59';
      return timeA.localeCompare(timeB);
    });
  }, [orders, filterDate, filterMethod, filterStatus, searchQuery, todayStr, tomorrowStr]);

  // Operational metrics for delivery team
  const todayOrders = useMemo(() => orders.filter(o => o.date === todayStr && o.status !== 'Cancelled'), [orders, todayStr]);
  
  // Total portions to transport today
  const totalPortionsToday = useMemo(() => {
    return todayOrders.reduce((sum, order) => {
      const portionsInOrder = order.items.reduce((itemSum, itemStr) => {
        const match = itemStr.match(/(\d+)\s*(?:porsi|box|x)/i);
        return itemSum + (match ? parseInt(match[1], 10) : 1);
      }, 0);
      return sum + portionsInOrder;
    }, 0);
  }, [todayOrders]);

  const onDeliveryCount = useMemo(() => {
    return todayOrders.filter(o => o.deliveryStatus === 'Sedang Diantar').length;
  }, [todayOrders]);

  const deliveredCount = useMemo(() => {
    return todayOrders.filter(o => o.deliveryStatus === 'Selesai' || o.deliveryStatus === 'Tiba di Lokasi' || o.status === 'Delivered').length;
  }, [todayOrders]);

  // Open driver assignment modal
  const handleOpenAssign = (order: Order) => {
    setEditingOrderId(order.id);
    setCourierNameInput(order.courierName || '');
    setCourierPhoneInput(order.courierPhone || '');
    setVehicleNumberInput(order.vehicleNumber || '');
    setNotesInput(order.deliveryNotes || '');
  };

  const handleSaveDriver = (orderId: string) => {
    onUpdateOrder(orderId, {
      courierName: courierNameInput.trim() || undefined,
      courierPhone: courierPhoneInput.trim() || undefined,
      vehicleNumber: vehicleNumberInput.trim() || undefined,
      deliveryNotes: notesInput.trim() || undefined
    });
    setEditingOrderId(null);
    onNotify('Informasi tim kurir & armada pengantaran diperbarui!', 'success');
  };

  // Quick delivery status transition
  const handleUpdateDeliveryStatus = (order: Order, newStatus: Order['deliveryStatus']) => {
    const updates: Partial<Order> = { deliveryStatus: newStatus };
    if (newStatus === 'Selesai' || newStatus === 'Tiba di Lokasi') {
      updates.status = 'Delivered';
    }
    onUpdateOrder(order.id, updates);
    onNotify(`Status pengiriman ${order.id} diubah ke "${newStatus}"`, 'info');
  };

  // Helper to extract total portions in an order
  const getOrderTotalPortions = (items: string[]) => {
    return items.reduce((sum, itemStr) => {
      const match = itemStr.match(/(\d+)\s*(?:porsi|box|x)/i);
      return sum + (match ? parseInt(match[1], 10) : 1);
    }, 0);
  };

  // Vehicle recommendation helper based on catering portions
  const getVehicleAdvice = (portions: number) => {
    if (portions <= 30) return { label: 'Motor / Box Kurir', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (portions <= 80) return { label: 'Motor Bronjong / Mobil', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { label: 'Mobil Box / Van Katering', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header & Operational Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest mb-1.5">
            <Truck size={18} className="stroke-[2.5]" />
            Ruang Operasional Pengiriman (Delivery Team)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
            Jadwal & Logistik Pengantaran Katering
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Pantau jam harus tiba, rute alamat lokasi katering, armada kurir, serta cetak surat jalan pengiriman.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFilterDate('today');
              setFilterStatus('all');
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
          >
            <Clock size={15} />
            Jadwal Hari Ini ({todayOrders.length})
          </button>
        </div>
      </div>

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Antaran Hari Ini</span>
            <Calendar size={18} className="text-slate-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-950">{todayOrders.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Jadwal pengiriman aktif</p>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Total Porsi Diantar</span>
            <ShoppingBag size={18} className="text-emerald-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950">{totalPortionsToday.toLocaleString('id-ID')}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Porsi katering hari ini</p>
        </div>

        <div className="bg-blue-50/70 p-5 rounded-2xl border-2 border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-800 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Sedang Di Jalan</span>
            <Truck size={18} className="text-blue-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-950">{onDeliveryCount}</p>
          <p className="text-xs text-blue-700 font-semibold mt-1">Armada OTW ke lokasi</p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Sudah Tiba / Selesai</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-950">{deliveredCount}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Pengantaran sukses</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari pemesan, no. pesanan, alamat, atau nama kurir..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'tomorrow', label: 'Besok' },
              { id: 'upcoming', label: 'Mendatang' },
              { id: 'all', label: 'Semua Jadwal' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterDate(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                  filterDate === tab.id 
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters (Method & Status) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mr-1">Metode:</span>
          <button
            onClick={() => setFilterMethod('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              filterMethod === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterMethod('Delivery')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
              filterMethod === 'Delivery' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
            }`}
          >
            <Truck size={13} />
            🛵 Dikirim Kurir
          </button>
          <button
            onClick={() => setFilterMethod('Pickup')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
              filterMethod === 'Pickup' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
            }`}
          >
            🏬 Ambil di Dapur
          </button>

          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-auto mr-1">Status Delivery:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Menunggu Jadwal">Menunggu Jadwal</option>
            <option value="Disiapkan di Dapur">Disiapkan di Dapur</option>
            <option value="Sedang Diantar">Sedang Diantar (OTW)</option>
            <option value="Tiba di Lokasi">Tiba di Lokasi</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Deliveries List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200 shadow-sm">
          <Truck size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">Tidak ada jadwal pengiriman pada filter ini</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Gunakan filter lain atau ubah tanggal untuk melihat jadwal katering lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredOrders.map(order => {
            const isPickup = order.deliveryMethod === 'Pickup';
            const totalPortions = getOrderTotalPortions(order.items);
            const vehicleAdvice = getVehicleAdvice(totalPortions);
            const deliveryStatus = order.deliveryStatus || (order.status === 'Delivered' ? 'Selesai' : 'Menunggu Jadwal');
            const isToday = order.date === todayStr;

            return (
              <div 
                key={order.id}
                className={`bg-white rounded-3xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col ${
                  isToday ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'
                }`}
              >
                {/* Delivery Card Top Header */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {isPickup ? '🏬' : '🛵'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-950 uppercase">{order.id}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isPickup 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isPickup ? 'Ambil Sendiri' : 'Pengantaran Kurir'}
                        </span>
                        {isToday && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            HARI INI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Jadwal: <span className="text-slate-800 font-bold">{order.date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Target Delivery Time (BIG DISPLAY) */}
                  <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 text-right shadow-xs">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {isPickup ? 'Jam Diambil' : 'Harus Tiba'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight text-emerald-700 flex items-center gap-1 justify-end">
                      <Clock size={16} />
                      {order.deliveryTime || '11:30'} WIB
                    </span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="p-4 sm:p-5 flex-1 space-y-4">
                  
                  {/* Recipient & Contact Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Penerima Pesanan:</span>
                      <h4 className="text-sm font-black text-slate-950">{order.customerName}</h4>
                      {order.customerPhone ? (
                        <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {order.customerPhone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No. HP belum tercatat</p>
                      )}
                    </div>

                    {/* Direct Contact Actions for Courier */}
                    {order.customerPhone && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Halo Kak ${order.customerName}, kami dari tim kurir ${settings.storeName}. Konfirmasi pesanan katering ${order.id} siap diantar untuk jadwal pukul ${order.deliveryTime || '11:30'} WIB. Apakah lokasi pengantaran sudah siap? Terima kasih.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                        <a 
                          href={`tel:${order.customerPhone}`}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
                          title="Telepon Penerima"
                        >
                          <Phone size={14} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address & Navigation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={13} className="text-rose-500" />
                        {isPickup ? 'Lokasi Pengambilan:' : 'Alamat Tujuan Pengantaran:'}
                      </span>
                      
                      {!isPickup && order.deliveryAddress && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                        >
                          <Navigation size={12} />
                          Navigasi Google Maps
                        </a>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        {order.deliveryAddress || (isPickup ? (settings.address || 'Dapur Pusat Katering') : 'Alamat belum diisi oleh pemesan')}
                      </p>
                      {order.deliveryNotes && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg">
                          <span className="font-black uppercase tracking-wider text-[10px] text-amber-800 block">Patokan / Catatan Khusus Kurir:</span>
                          {order.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cargo Portions & Vehicle Recommendation */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Muatan Katering:</span>
                      <span className="font-black text-slate-950">{totalPortions} Porsi Total</span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="truncate pr-2">• {item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Vehicle recommendation pill */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-500">Rekomendasi Armada:</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${vehicleAdvice.color}`}>
                        {vehicleAdvice.label}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Courier & Vehicle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tim Kurir / Driver:</span>
                      <span className="text-xs font-black text-slate-900">
                        {order.courierName || 'Belum Ditugaskan'}
                      </span>
                      {order.vehicleNumber && (
                        <span className="text-[11px] text-slate-600 font-medium block">
                          Armada: {order.vehicleNumber}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenAssign(order)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 text-xs font-bold transition-all shadow-xs"
                    >
                      {order.courierName ? 'Ubah Driver' : '+ Tugaskan Driver'}
                    </button>
                  </div>

                </div>

                {/* Delivery Card Bottom Controls */}
                <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status:</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                      deliveryStatus === 'Selesai' || deliveryStatus === 'Tiba di Lokasi'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : deliveryStatus === 'Sedang Diantar'
                        ? 'bg-blue-100 text-blue-950 border-blue-300 animate-pulse'
                        : deliveryStatus === 'Disiapkan di Dapur'
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-slate-200 text-slate-800 border-slate-300'
                    }`}>
                      {deliveryStatus}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Print / View Surat Jalan */}
                    <button
                      onClick={() => setSelectedOrderForSlip(order)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
                      title="Lihat Surat Jalan Pengiriman"
                    >
                      <FileText size={14} />
                      Surat Jalan
                    </button>

                    {/* Step Status Buttons */}
                    {deliveryStatus !== 'Sedang Diantar' && deliveryStatus !== 'Selesai' && deliveryStatus !== 'Tiba di Lokasi' && (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(order, 'Sedang Diantar')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Truck size={14} />
                        Kirim Sekarang (OTW)
                      </button>
                    )}

                    {deliveryStatus === 'Sedang Diantar' && (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(order, 'Tiba di Lokasi')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        Sampai di Lokasi
                      </button>
                    )}

                    {deliveryStatus === 'Tiba di Lokasi' && (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(order, 'Selesai')}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <PackageCheck size={14} />
                        Selesai Diterima
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Penugasan Kurir & Armada */}
      {editingOrderId && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base uppercase">Penugasan Kurir / Armada</h3>
                <p className="text-xs text-slate-500 font-medium">Pesanan {editingOrderId}</p>
              </div>
              <button 
                onClick={() => setEditingOrderId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kurir / Driver
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Pak Budi (Driver 1)"
                  value={courierNameInput}
                  onChange={(e) => setCourierNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Telepon / WA Kurir
                </label>
                <input 
                  type="tel" 
                  placeholder="Contoh: 08123456789"
                  value={courierPhoneInput}
                  onChange={(e) => setCourierPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Plat / Jenis Kendaraan
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: B 1234 KTR (Avanza Putih / Blind Van)"
                  value={vehicleNumberInput}
                  onChange={(e) => setVehicleNumberInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Rute / Instruksi Pengantaran
                </label>
                <textarea 
                  rows={2}
                  placeholder="Contoh: Masuk lewat pintu samping, hubungi satpam pos 2"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-emerald-600 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingOrderId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveDriver(editingOrderId)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                Simpan Penugasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Surat Jalan Pengiriman (Delivery Slip / Tanda Terima Katering) */}
      {selectedOrderForSlip && (
        <div className="fixed inset-0 z-[340] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Action Bar on top */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-emerald-700" />
                <h3 className="font-black text-slate-950 text-base uppercase tracking-tight">
                  Surat Jalan & Tanda Terima Pengantaran
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                  title="Pilihan format cetak thermal POS (58mm/80mm) atau A4"
                >
                  <Printer size={14} />
                  Pilihan Cetak (POS / A4)
                </button>
                <button 
                  onClick={() => setSelectedOrderForSlip(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-5 text-slate-900 font-sans print:border-none print:p-0">
              
              {/* Header Surat Jalan */}
              <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    {settings.storeName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium max-w-sm mt-0.5">
                    {settings.address || 'Layanan Katering & Kuliner Berkualitas'}
                  </p>
                  <p className="text-xs text-slate-600 font-bold mt-1">
                    WA / Telp: {settings.whatsappNumber || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                    SURAT JALAN PENGANTARAN
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-1">No: SJ-{selectedOrderForSlip.id}</p>
                  <p className="text-xs text-slate-500 font-semibold">Tgl: {selectedOrderForSlip.date}</p>
                </div>
              </div>

              {/* Info Pengantaran Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tujuan Pengantaran:</span>
                  <p className="font-black text-slate-950 text-sm">{selectedOrderForSlip.customerName}</p>
                  <p className="font-bold text-slate-700">{selectedOrderForSlip.customerPhone || '-'}</p>
                  <p className="text-slate-600 font-medium leading-relaxed mt-1">
                    {selectedOrderForSlip.deliveryAddress || 'Alamat Belum Tertera'}
                  </p>
                  {selectedOrderForSlip.deliveryNotes && (
                    <p className="text-amber-800 font-bold bg-amber-50 p-1.5 rounded mt-1">
                      Catatan: {selectedOrderForSlip.deliveryNotes}
                    </p>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jadwal & Armada:</span>
                  <p className="font-black text-emerald-800 text-sm">
                    Target Tiba: {selectedOrderForSlip.deliveryTime || '11:30'} WIB
                  </p>
                  <p className="text-slate-700 font-bold">
                    Metode: {selectedOrderForSlip.deliveryMethod === 'Pickup' ? 'Diambil Sendiri di Dapur' : 'Pengantaran Kurir'}
                  </p>
                  <p className="text-slate-700 font-medium">
                    Kurir Bertugas: <span className="font-bold">{selectedOrderForSlip.courierName || 'Tim Kurir Dapur'}</span>
                  </p>
                  <p className="text-slate-700 font-medium">
                    Kendaraan: <span className="font-bold">{selectedOrderForSlip.vehicleNumber || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Rincian Menu & Porsi */}
              <div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-200/80 border-b border-slate-300 font-black text-slate-800 uppercase text-[10px]">
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Rincian Menu & Paket</th>
                      <th className="py-2 px-3 text-right">Kuantitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedOrderForSlip.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900">{item}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">Lengkap</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-600">Disiapkan Oleh (Dapur)</p>
                  <div className="h-16"></div>
                  <p className="font-black border-t border-slate-400 pt-1 text-slate-900">( Staff Dapur )</p>
                </div>

                <div>
                  <p className="font-bold text-slate-600">Petugas Pengantar (Kurir)</p>
                  <div className="h-16"></div>
                  <p className="font-black border-t border-slate-400 pt-1 text-slate-900">
                    ( {selectedOrderForSlip.courierName || 'Kurir Pengantar'} )
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-600">Diterima Oleh (Pemesan)</p>
                  <div className="h-16"></div>
                  <p className="font-black border-t border-slate-400 pt-1 text-slate-900">
                    ( {selectedOrderForSlip.customerName} )
                  </p>
                </div>
              </div>

            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CETAK STRUK & DOKUMEN MULTI-FORMAT (POS 58MM, 80MM, A4) */}
      <ReceiptPrintModal
        isOpen={isPrintModalOpen && !!selectedOrderForSlip}
        onClose={() => setIsPrintModalOpen(false)}
        order={selectedOrderForSlip}
        settings={settings}
        currentAdminName={currentAdminName}
        onNotify={onNotify}
      />

    </div>
  );
};

export default DeliveryManagement;
