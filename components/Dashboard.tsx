
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingBag, Wallet, Users, Star, AlertTriangle, ArrowRight, Share2, ExternalLink, Sparkles } from 'lucide-react';
import { MenuItem, Order, IngredientStock } from '../types';

interface DashboardProps {
  orders: Order[];
  menu: MenuItem[];
  inventory: IngredientStock[];
  onShareCatalog?: () => void;
  onOpenCatalog?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  orders, 
  menu, 
  inventory,
  onShareCatalog,
  onOpenCatalog 
}) => {
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalReceivables = orders.reduce((acc, curr) => acc + (curr.totalPrice - curr.amountPaid), 0);
  const corporateOrders = orders.filter(o => o.type === 'Corporate').length;
  
  const popularDishes = [...menu]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 3);

  const deficits = useMemo(() => {
    const requirements: { [key: string]: number } = {};
    orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').forEach(order => {
      order.items.forEach(orderItemStr => {
        const match = orderItemStr.match(/(.*)\s\((\d+)\)/);
        if (!match) return;
        const [_, itemName, qtyStr] = match;
        const quantity = parseInt(qtyStr);
        const menuItem = menu.find(m => m.name === itemName.trim());
        if (menuItem?.recipe) {
          menuItem.recipe.forEach(ing => {
            requirements[ing.ingredientId] = (requirements[ing.ingredientId] || 0) + (ing.amountPerUnit * quantity);
          });
        }
      });
    });

    return Object.entries(requirements).map(([id, needed]) => {
      const stock = inventory.find(i => i.id === id);
      const stockQty = stock ? stock.quantity : 0;
      return { name: stock?.name || 'Unknown', deficit: Math.max(0, needed - stockQty) };
    }).filter(d => d.deficit > 0);
  }, [orders, menu, inventory]);

  const revenueData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 6500 },
    { name: 'Thu', sales: 4500 },
    { name: 'Fri', sales: 9000 },
    { name: 'Sat', sales: 12000 },
    { name: 'Sun', sales: 10500 },
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass, iconBg, className = "" }: any) => (
    <div className={`bg-white p-3.5 sm:p-6 rounded-2xl border-2 border-slate-200 flex items-center gap-3 sm:gap-5 shadow-xs ${className}`}>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} ${colorClass} rounded-xl flex items-center justify-center border border-slate-200 shrink-0`}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs text-slate-600 font-extrabold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{title}</p>
        <h3 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight truncate">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {deficits.length > 0 && (
        <div className="bg-amber-600 rounded-2xl p-4 sm:p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md border-2 border-amber-700">
           <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6 animate-pulse text-white" />
              </div>
              <div>
                <h4 className="font-black text-base sm:text-lg text-white">Stok Bahan Kurang ({deficits.length})</h4>
                <p className="text-amber-100 text-xs sm:text-sm font-semibold">Beberapa pesanan membutuhkan bahan yang stoknya habis.</p>
              </div>
           </div>
           <button className="w-full md:w-auto justify-center bg-white text-slate-950 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-50 transition-all flex items-center gap-2 shadow">
              Cek Dapur <ArrowRight size={16} />
           </button>
        </div>
      )}

      {/* Banner Link Katalog Mandiri Konsumen */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-950 rounded-3xl p-5 sm:p-7 text-white shadow-md border-2 border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-emerald-200">
            <Sparkles size={12} /> Halaman Mandiri Konsumen
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Link Katalog Online Siap Dibagikan
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            Konsumen dapat membuka link ini secara mandiri tanpa perlu login untuk memilih paket katering, langsung mengetik jumlah porsi (misal 115 porsi), dan mengatur jam pengantaran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          {onShareCatalog && (
            <button
              onClick={onShareCatalog}
              className="flex-1 md:flex-initial py-3 px-4 bg-white hover:bg-emerald-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow flex items-center justify-center gap-2"
            >
              <Share2 size={16} className="text-emerald-700" />
              <span>Salin & Bagikan Link</span>
            </button>
          )}
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="py-3 px-3.5 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-emerald-500/50 flex items-center justify-center gap-1.5"
              title="Buka Preview Katalog"
            >
              <ExternalLink size={16} />
              <span>Buka Katalog</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Statistik Responsif (2 kolom di HP, 3 kolom di layar lebar) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
        <StatCard 
          title="Omzet Gross" 
          value={`Rp ${(totalRevenue/1000).toFixed(0)}k`} 
          icon={TrendingUp} 
          colorClass="text-emerald-700" 
          iconBg="bg-emerald-50" 
        />
        <StatCard 
          title="Piutang (AR)" 
          value={`Rp ${(totalReceivables/1000).toFixed(0)}k`} 
          icon={Wallet} 
          colorClass="text-rose-700" 
          iconBg="bg-rose-50" 
        />
        <StatCard 
          title="Pesanan Aktif" 
          value={orders.length} 
          icon={ShoppingBag} 
          colorClass="text-indigo-700" 
          iconBg="bg-indigo-50" 
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-8 bg-white p-4 sm:p-8 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide">Tren Pendapatan Mingguan</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] sm:text-xs font-black">Live</div>
          </div>
          <div className="h-[220px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#334155', fontSize: 11, fontWeight: 700}} 
                  dy={8}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '2px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px'}}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]} 
                  barSize={28} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-4 sm:p-8 rounded-2xl border-2 border-slate-200 shadow-xs">
          <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide mb-4 sm:mb-6">Menu Terpopuler</h3>
          <div className="space-y-3 sm:space-y-4">
            {popularDishes.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 hover:bg-slate-50 rounded-xl transition-all border-2 border-slate-100 hover:border-slate-300">
                <div className="relative shrink-0">
                  <img src={item.imageUrl} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200" alt={item.name} />
                  <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 border-white">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-950 truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[10px] sm:text-xs text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Star size={11} fill="currentColor" /> {item.salesCount} Terjual
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
