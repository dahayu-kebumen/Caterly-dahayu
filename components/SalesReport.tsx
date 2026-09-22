
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, Calendar, Activity,
  Wallet, AlertCircle, Calculator, FileDown, Clock, Sun, Moon, SunMedium,
  Banknote, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Order, MenuItem, Expense } from '../types';

interface SalesReportProps {
  orders: Order[];
  menu: MenuItem[];
  expenses: Expense[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-indigo-600">Rp {payload[0].value.toLocaleString()}</p>
        <div className="mt-2 pt-2 border-t border-slate-50">
          <p className="text-[9px] font-bold text-slate-400">Total Nilai Pesanan</p>
        </div>
      </div>
    );
  }
  return null;
};

const SalesReport: React.FC<SalesReportProps> = ({ orders, menu, expenses }) => {
  const [activeTab, setActiveTab] = useState<'ikhtisar' | 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'sift'>('ikhtisar');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const filteredOrdersByDate = useMemo(() => {
    return orders.filter(o => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(o.date);
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  const filteredExpensesByDate = useMemo(() => {
    return expenses.filter(e => {
      if (!startDate && !endDate) return true;
      const expDate = new Date(e.date);
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      end.setHours(23, 59, 59, 999);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrdersByDate.reduce((acc, o) => acc + o.totalPrice, 0);
    const totalPaid = filteredOrdersByDate.reduce((acc, o) => acc + o.amountPaid, 0);
    const totalActualCost = filteredExpensesByDate.reduce((acc, e) => acc + e.totalCost, 0);
    const totalProfit = totalRevenue - totalActualCost;
    const totalReceivables = totalRevenue - totalPaid;
    
    return { totalRevenue, totalReceivables, totalPaid, totalActualCost, totalProfit };
  }, [filteredOrdersByDate, filteredExpensesByDate]);

  const chartData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    filteredOrdersByDate.forEach(o => {
      grouped[o.date] = (grouped[o.date] || 0) + o.totalPrice;
    });
    
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrdersByDate]);

  const reports = useMemo(() => {
    const daily: any[] = [];
    const weekly: any[] = [];
    const monthly: any[] = [];
    const yearly: any[] = [];
    const shift: any[] = [];

    // Grouping Orders
    filteredOrdersByDate.forEach(o => {
      const d = new Date(o.date);
      const dayKey = o.date;
      const weekKey = `Minggu ${getWeekNumber(d)}, ${d.getFullYear()}`;
      const monthKey = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const yearKey = `${d.getFullYear()}`;
      const shiftKey = o.shift || 'Pagi';

      const processEntry = (arr: any[], key: string, label: string) => {
        let entry = arr.find(x => x.key === key);
        if (!entry) {
          entry = { key, label, revenue: 0, cost: 0, paid: 0, receivables: 0, profit: 0, count: 0, admins: new Set<string>() };
          arr.push(entry);
        }
        entry.revenue += o.totalPrice;
        entry.paid += o.amountPaid;
        entry.receivables += (o.totalPrice - o.amountPaid);
        entry.count += 1;
        if (o.recordedBy) entry.admins.add(o.recordedBy);
      };

      processEntry(daily, dayKey, dayKey);
      processEntry(weekly, weekKey, weekKey);
      processEntry(monthly, monthKey, monthKey);
      processEntry(yearly, yearKey, yearKey);
      processEntry(shift, shiftKey, `Sift ${shiftKey}`);
    });

    // Merging actual expenses into the reports
    filteredExpensesByDate.forEach(e => {
      const d = new Date(e.date);
      const dayKey = e.date;
      const weekKey = `Minggu ${getWeekNumber(d)}, ${d.getFullYear()}`;
      const monthKey = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const yearKey = `${d.getFullYear()}`;

      const addCost = (arr: any[], key: string) => {
        let entry = arr.find(x => x.key === key);
        if (entry) {
          entry.cost += e.totalCost;
        } else {
          // Jika ada pengeluaran tanpa pesanan di hari tersebut
          arr.push({ key, label: key, revenue: 0, cost: e.totalCost, paid: 0, receivables: 0, profit: 0, count: 0, admins: new Set<string>([e.recordedBy]) });
        }
      };

      addCost(daily, dayKey);
      addCost(weekly, weekKey);
      addCost(monthly, monthKey);
      addCost(yearly, yearKey);
    });

    // Recalculate Profit
    const finalize = (arr: any[]) => arr.map(item => ({
      ...item,
      profit: item.revenue - item.cost,
      adminList: Array.from(item.admins).join(' & ') || 'Sistem'
    }));

    return {
      daily: finalize(daily.sort((a, b) => b.key.localeCompare(a.key))),
      weekly: finalize(weekly), 
      monthly: finalize(monthly),
      yearly: finalize(yearly),
      shift: finalize(shift)
    };
  }, [filteredOrdersByDate, filteredExpensesByDate]);

  const handleDownloadCSV = () => {
    let dataToExport = reports.daily;
    const headers = ["Periode", "Pesanan", "Pendapatan", "Pengeluaran (Riil)", "Terbayar", "Piutang", "Laba Bersih"];
    const csvRows = [
      `LAPORAN KEUANGAN - CATERELITE`,
      `Periode Export: ${new Date().toLocaleString()}`,
      "",
      headers.join(";"),
      ...dataToExport.map(row => [
        row.label,
        row.count,
        row.revenue,
        row.cost,
        row.paid,
        row.receivables,
        row.profit
      ].join(";"))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LAPORAN_KEUANGAN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TableView = ({ data, title, desc, icon: Icon }: { data: any[], title: string, desc: string, icon: any }) => (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-sm text-slate-400 font-medium mt-1">{desc}</p>
        </div>
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
          <Icon size={28} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1000px]">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-4 pl-6">Periode</th>
              <th className="pb-4 text-center">Psn</th>
              <th className="pb-4">Pendapatan</th>
              <th className="pb-4">Belanja Bahan (Riil)</th>
              <th className="pb-4">Terbayar</th>
              <th className="pb-4">Piutang</th>
              <th className="pb-4">Laba Bersih</th>
              <th className="pb-4 pr-6">Admin Jaga</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="group hover:bg-slate-50 transition-all">
                <td className="py-6 pl-6 bg-slate-50 border-y border-l border-slate-100 rounded-l-2xl group-hover:bg-white transition-all">
                  <p className="text-sm font-black text-slate-800">{d.label}</p>
                </td>
                <td className="py-6 text-center bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <span className="text-xs font-black text-slate-400">{d.count}</span>
                </td>
                <td className="py-6 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <p className="text-sm font-black text-slate-800">Rp {d.revenue.toLocaleString()}</p>
                </td>
                <td className="py-6 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <p className="text-sm font-bold text-rose-500">Rp {d.cost.toLocaleString()}</p>
                </td>
                <td className="py-6 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <p className="text-sm font-black text-emerald-600">Rp {d.paid.toLocaleString()}</p>
                </td>
                <td className="py-6 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <p className={`text-sm font-bold ${d.receivables > 0 ? 'text-amber-500' : 'text-slate-300'}`}>Rp {d.receivables.toLocaleString()}</p>
                </td>
                <td className="py-6 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-all">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-black ${d.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Rp {d.profit.toLocaleString()}</p>
                    {d.profit >= 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
                  </div>
                </td>
                <td className="py-6 pr-6 bg-slate-50 border-y border-r border-slate-100 rounded-r-2xl group-hover:bg-white transition-all">
                  <span className="text-[10px] font-black text-slate-500 uppercase truncate max-w-[100px] block">{d.adminList}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Keuangan Riil</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Laporan laba rugi katering berdasarkan pengeluaran belanja riil.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
            {(['ikhtisar', 'harian', 'mingguan', 'bulanan', 'tahunan', 'sift'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{t}</button>
            ))}
          </div>
          <button onClick={handleDownloadCSV} className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-50 font-black text-[10px] uppercase tracking-widest group">
            <FileDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="hidden md:inline">Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      {activeTab === 'ikhtisar' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><ShoppingBag size={12} className="text-indigo-500" /> Total Omzet</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Rp {stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Wallet size={12} className="text-rose-500" /> Total Belanja (Riil)</p>
              <h3 className="text-3xl font-black text-rose-600 tracking-tighter">Rp {stats.totalActualCost.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 flex items-center gap-2"><Banknote size={12} className="text-emerald-300" /> Laba Bersih Riil</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">Rp {stats.totalProfit.toLocaleString()}</h3>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Calculator size={12} className="text-indigo-400" /> Margin Profit Riil</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%</h3>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-xl font-black text-slate-800">Tren Performa Omzet</h3>
                 <p className="text-xs text-slate-400 font-medium">Visualisasi omzet harian Anda.</p>
               </div>
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                 <TrendingUp size={24} />
               </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                    minTickGap={30}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'harian' && <TableView data={reports.daily} title="Laba Rugi Harian Riil" desc="Audit pengeluaran belanja harian." icon={Calendar} />}
      {activeTab === 'mingguan' && <TableView data={reports.weekly} title="Rekap Laba Mingguan" desc="Ringkasan performa tiap minggu." icon={Activity} />}
      {activeTab === 'bulanan' && <TableView data={reports.monthly} title="Laporan Bulanan Riil" desc="Audit belanja vs omzet bulanan." icon={Layers} />}
      {activeTab === 'sift' && <TableView data={reports.shift} title="Audit Arus Kas Sift" desc="Pertanggungjawaban omzet per sift admin." icon={Clock} />}
    </div>
  );
};

export default SalesReport;
