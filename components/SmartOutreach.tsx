
import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, Send, Calendar, Star, Sparkles, Loader2, 
  Filter, UserCheck, AlertCircle, TrendingUp, Search, 
  Mail, ArrowUpRight, ChevronRight, UserCircle, Activity, Heart, Zap,
  Users, MessageCircle
} from 'lucide-react';
import { getSalesOutreachSuggestions } from '../services/geminiService';
import { Client, AIRecommendation, ClientSegment } from '../types.ts';

interface SmartOutreachProps {
  clients: Client[];
}

const SmartOutreach: React.FC<SmartOutreachProps> = ({ clients }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Logic for refined segmentation
  const segmentedClients = useMemo(() => {
    return clients.map(client => {
      const lastOrder = new Date(client.lastOrderDate);
      const daysSinceLastOrder = Math.floor((new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24));
      
      let segment: ClientSegment = 'Potential';
      
      const isHighSpend = client.totalSpent >= 12000000;
      const isFrequent = client.orderFrequency === 'Weekly';
      const isRecent = daysSinceLastOrder <= 14;
      const isVeryLapsed = daysSinceLastOrder > 30;

      if (isHighSpend && isFrequent && isRecent) {
        segment = 'Loyal VIP';
      } else if (isVeryLapsed) {
        segment = 'At Risk';
      } else if (isRecent && isFrequent && !isHighSpend) {
        segment = 'Rising Star';
      } else {
        segment = 'Potential';
      }
      
      return { ...client, segment, daysSinceLastOrder };
    });
  }, [clients]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const res = await getSalesOutreachSuggestions(segmentedClients);
      setRecommendations(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const segments: { type: ClientSegment; label: string; color: string; icon: any }[] = [
    { type: 'Loyal VIP', label: 'VIP Pelanggan', color: 'amber', icon: Star },
    { type: 'Rising Star', label: 'Bintang Baru', color: 'emerald', icon: Zap },
    { type: 'Potential', label: 'Potensial', color: 'indigo', icon: Activity },
    { type: 'At Risk', label: 'Perlu Perhatian', color: 'rose', icon: AlertCircle },
  ];

  const getHealthScore = (segment: ClientSegment) => {
    switch (segment) {
      case 'At Risk': return 35;
      case 'Potential': return 65;
      case 'Rising Star': return 85;
      case 'Loyal VIP': return 98;
      default: return 50;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* AI Header Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
              <BrainCircuit size={28} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 block mb-1">Sales Catalyst AI</span>
              <h2 className="text-3xl font-black">Segmentasi Pembeli Cerdas</h2>
            </div>
          </div>
          <p className="text-slate-400 max-w-xl mb-8 leading-relaxed font-medium">
            Pisahkan dan analisis perilaku pembeli secara otomatis. Gunakan AI untuk strategi pendekatan yang personal ke setiap segmen.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={generateInsights}
              disabled={loading}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-3 shadow-xl disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Minta Rekomendasi AI
            </button>
            <div className="relative group flex-1 max-w-xs">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari nama pelanggan..." 
                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
      </div>

      {/* Segment Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {segments.map((segment) => {
          const segmentClients = segmentedClients.filter(c => 
            c.segment === segment.type && 
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          return (
            <div key={segment.type} className="flex-shrink-0 w-[320px] space-y-4">
              {/* Segment Header */}
              <div className={`p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${segment.color}-50 text-${segment.color}-500 shadow-sm`}>
                    <segment.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm leading-none mb-1">{segment.label}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{segmentClients.length} Pelanggan</p>
                  </div>
                </div>
                <div className={`text-xs font-black text-${segment.color}-500 bg-${segment.color}-50 px-2 py-1 rounded-lg`}>
                  {getHealthScore(segment.type)}%
                </div>
              </div>

              {/* Column Content */}
              <div className="space-y-4 min-h-[400px]">
                {segmentClients.map((client) => (
                  <div key={client.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-amber-200 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-300 border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all">
                        {client.name.charAt(0)}
                      </div>
                      <button className="text-slate-300 hover:text-slate-900 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-black text-slate-800 text-base leading-tight group-hover:text-amber-600 transition-colors truncate">{client.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                         <Calendar size={10} /> {client.daysSinceLastOrder} Hari Lalu
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Transaksi</p>
                        <p className="text-[10px] font-black text-slate-800">Rp {(client.totalSpent/1000000).toFixed(1)} JT</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Frekuensi</p>
                        <p className="text-[10px] font-black text-slate-800">{client.orderFrequency}</p>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-amber-600 transition-all">
                      <MessageCircle size={14} /> Hubungi
                    </button>

                    {/* Decorative element for group hover */}
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                  </div>
                ))}

                {segmentClients.length === 0 && (
                  <div className="h-32 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-6 grayscale opacity-40">
                    <Users size={24} className="mb-2 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kosong</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations Cards (Floating Overlays) */}
      {recommendations.length > 0 && (
        <div className="fixed bottom-32 right-8 z-[100] w-[340px] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-amber-100 p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Saran Tindakan AI</h3>
              </div>
              <button onClick={() => setRecommendations([])} className="text-slate-400 hover:text-rose-500">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-xs font-black text-slate-900 mb-1">{rec.clientName}</p>
                  <p className="text-[10px] text-slate-500 italic mb-4 leading-relaxed">"{rec.pitch}"</p>
                  <button className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-amber-100">
                    <Send size={12} /> Salin & Kirim
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help helper for icons
// Added optional className to fix TS error
const MoreVertical = ({ size, className = "" }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export default SmartOutreach;
