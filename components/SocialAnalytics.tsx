
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Instagram, MessageCircle, Share2, TrendingUp, Sparkles, Loader2, 
  Send, Calendar, Clock, Image as ImageIcon, Video, Facebook,
  ExternalLink, Copy, Download, CheckCircle2, Layout, Link2, 
  ChevronRight, ChevronLeft, Search, UserCircle, Plus, Trash2, Edit3, X, Link as LinkIcon,
  // Fix: Added missing Save icon import
  Save
} from 'lucide-react';
import { generateSocialStrategy, generatePromoImage } from '../services/geminiService';
import { MenuItem, SocialStrategy, StoreSettings, SocialAccount } from '../types';

interface SocialAnalyticsProps {
  menu: MenuItem[];
  settings: StoreSettings;
  onUpdateSettings?: (settings: StoreSettings) => void;
}

const SocialAnalytics: React.FC<SocialAnalyticsProps> = ({ menu, settings, onUpdateSettings }) => {
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [strategies, setStrategies] = useState<SocialStrategy[]>([]);
  const [generatedPost, setGeneratedPost] = useState<{ image: string, caption: string, item: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(settings.socialAccounts?.[0] || null);

  // Modal State for Account Management
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<{
    platform: SocialAccount['platform'],
    handle: string,
    displayName: string
  }>({
    platform: 'Instagram',
    handle: '',
    displayName: ''
  });

  const engagementData = [
    { day: 'Mon', engagement: 1200 },
    { day: 'Tue', engagement: 1900 },
    { day: 'Wed', engagement: 1500 },
    { day: 'Thu', engagement: 2200 },
    { day: 'Fri', engagement: 3000 },
    { day: 'Sat', engagement: 4500 },
    { day: 'Sun', engagement: 3800 },
  ];

  const handleGenerateStrategy = async () => {
    setLoading(true);
    try {
      const topItems = [...menu].sort((a, b) => b.salesCount - a.salesCount).slice(0, 3);
      const res = await generateSocialStrategy(topItems);
      setStrategies(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisualPromo = async (item: MenuItem) => {
    setGenLoading(true);
    try {
      const img = await generatePromoImage(item.name);
      setGeneratedPost({
        image: img,
        caption: `Nikmati kelezatan ${item.name} hari ini! Dibuat dengan bahan premium dan bumbu rahasia yang pasti memanjakan lidah Anda. ✨🍱\n\nHubungi kami sekarang untuk pemesanan katering acara Anda!\n\n#CaterElite #KateringPremium #KulinerJakarta #InstaFood`,
        item: item.name
      });
    } catch (error) {
      console.error(error);
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus("Tersalin!");
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram size={20} className="text-pink-500" />;
      case 'TikTok': return <Video size={20} className="text-slate-900" />;
      case 'Facebook': return <Facebook size={20} className="text-blue-600" />;
      case 'WhatsApp': return <MessageCircle size={20} className="text-emerald-500" />;
      default: return <Link2 size={20} />;
    }
  };

  const filteredStrategies = useMemo(() => {
    if (!selectedAccount) return strategies;
    return strategies.filter(s => s.platform === selectedAccount.platform);
  }, [strategies, selectedAccount]);

  // Account Management Handlers
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setAccountFormData({ platform: 'Instagram', handle: '', displayName: '' });
    setIsAccountModalOpen(true);
  };

  const handleOpenEditModal = (account: SocialAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
    setAccountFormData({
      platform: account.platform,
      handle: account.handle,
      displayName: account.displayName || ''
    });
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateSettings) return;
    const updatedAccounts = settings.socialAccounts.filter(a => a.id !== id);
    onUpdateSettings({ ...settings, socialAccounts: updatedAccounts });
    if (selectedAccount?.id === id) {
      setSelectedAccount(updatedAccounts[0] || null);
    }
  };

  const handleSaveAccount = () => {
    if (!onUpdateSettings || !accountFormData.handle) return;

    let updatedAccounts = [...settings.socialAccounts];
    if (editingAccount) {
      updatedAccounts = updatedAccounts.map(a => 
        a.id === editingAccount.id 
          ? { ...a, ...accountFormData } 
          : a
      );
    } else {
      const newAcc: SocialAccount = {
        id: Math.random().toString(36).substr(2, 9),
        ...accountFormData
      };
      updatedAccounts.push(newAcc);
    }

    onUpdateSettings({ ...settings, socialAccounts: updatedAccounts });
    setIsAccountModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* MULTI-ACCOUNT MONITORING HUB */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Social Media Hub</h3>
            <p className="text-xl font-black text-slate-800 tracking-tight">Ekosistem Media Sosial</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
          >
            <Plus size={14} /> Tambah Akun
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {(settings.socialAccounts || []).map((account) => (
            <div 
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className={`flex-shrink-0 w-72 p-6 rounded-[2.5rem] border transition-all relative overflow-hidden group cursor-pointer ${
                selectedAccount?.id === account.id 
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-50' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
              }`}
            >
              {/* Floating Actions */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleOpenEditModal(account, e)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Edit3 size={12} />
                </button>
                <button 
                  onClick={(e) => handleDeleteAccount(account.id, e)}
                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  selectedAccount?.id === account.id ? 'bg-indigo-500 text-white' : 'bg-slate-50 border border-slate-100'
                }`}>
                  {getPlatformIcon(account.platform)}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-black text-slate-800 truncate leading-none mb-1.5">{account.displayName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate flex items-center gap-1.5">
                    <LinkIcon size={10} /> @{account.handle}
                  </p>
                </div>
              </div>
              
              <div className={`mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                selectedAccount?.id === account.id ? 'text-indigo-600' : 'text-slate-300'
              }`}>
                <span>{account.platform}</span>
                {selectedAccount?.id === account.id && <CheckCircle2 size={14} />}
              </div>
            </div>
          ))}
          
          <button 
            onClick={handleOpenAddModal}
            className="flex-shrink-0 w-64 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 group hover:border-indigo-400 hover:bg-indigo-50 transition-all"
          >
            <Plus size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Daftarkan Akun Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Content Generator Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">AI Visual Promo Generator</h3>
                <p className="text-sm text-slate-400">Pilih menu untuk dibuatkan poster promosi otomatis oleh AI.</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                <Sparkles size={24} />
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
              {menu.slice(0, 5).map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleCreateVisualPromo(item)}
                  className="shrink-0 flex flex-col items-center gap-2 group"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-amber-500 transition-all shadow-md">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-900 transition-colors max-w-[80px] truncate">{item.name}</span>
                </button>
              ))}
            </div>

            {genLoading && (
              <div className="aspect-square w-full max-w-md mx-auto bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 animate-pulse">
                <Loader2 size={40} className="animate-spin text-amber-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">AI SEDANG MENDESAIN POSTER...</p>
              </div>
            )}

            {generatedPost && !genLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="relative group">
                  <div className="aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                    <img src={generatedPost.image} alt="Generated Promo" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-3 bg-white/90 backdrop-blur rounded-xl text-slate-800 hover:bg-white shadow-lg transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex-1 relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Draf Caption AI</span>
                      <button 
                        onClick={() => handleCopyCaption(generatedPost.caption)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {copyStatus ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium italic">"{generatedPost.caption}"</p>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <button className="bg-pink-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-pink-100">
                      <Instagram size={16} /> Instagram
                    </button>
                    <button className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                      <Layout size={16} /> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Strategi Konten {selectedAccount ? `(${selectedAccount.displayName})` : ''}</h3>
                <p className="text-xs text-slate-400 font-medium">Rekomendasi posting untuk meningkatkan engagement.</p>
              </div>
              <button 
                onClick={handleGenerateStrategy}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate Strategi
              </button>
            </div>
            
            <div className="space-y-4">
              {filteredStrategies.length > 0 ? (
                filteredStrategies.map((strat, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{strat.platform}</span>
                        <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1"><Clock size={10} /> {strat.bestTimeToPost}</span>
                      </div>
                      <h4 className="font-bold text-slate-800">{strat.contentIdea}</h4>
                      <p className="text-[10px] text-slate-500 mt-2 line-clamp-1 italic">"{strat.suggestedCaption}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic">
                  Belum ada kalender konten. Klik "Generate Strategi" untuk memulai.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800">Engagement</h3>
              {selectedAccount && getPlatformIcon(selectedAccount.platform)}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" hide />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEngage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Senin</span>
              <span>Minggu</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-black text-xl mb-4 leading-tight">Insight Performa {selectedAccount?.displayName || 'Ekosistem'}</h4>
              <p className="text-indigo-200 text-xs mb-6 leading-relaxed">AI kami mendeteksi tren positif pada jam 19:00 untuk konten video. Pertimbangkan untuk memposting konten 'Behind the Kitchen'.</p>
              <div className="flex items-center gap-4">
                 <div className="flex-1">
                   <p className="text-2xl font-black">12.4k</p>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Impressions</p>
                 </div>
                 <div className="flex-1">
                   <p className="text-2xl font-black text-emerald-400">+18%</p>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth Rate</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAccountModalOpen(false)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
             <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{editingAccount ? 'Edit Akun' : 'Daftarkan Akun'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Ekosistem Sosial</p>
                </div>
                <button onClick={() => setIsAccountModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-all">
                  <X size={24} />
                </button>
             </div>
             
             <div className="p-8 pt-4 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Platform</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Instagram', 'TikTok', 'Facebook', 'WhatsApp'].map((plat) => (
                      <button 
                        key={plat}
                        onClick={() => setAccountFormData({ ...accountFormData, platform: plat as any })}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-center transition-all ${
                          accountFormData.platform === plat 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {getPlatformIcon(plat)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Username / Handle</label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">@</span>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="brand.katering"
                        value={accountFormData.handle}
                        onChange={(e) => setAccountFormData({ ...accountFormData, handle: e.target.value })}
                      />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nama Label (Alias)</label>
                   <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Contoh: Admin Pusat / Marketing"
                    value={accountFormData.displayName}
                    onChange={(e) => setAccountFormData({ ...accountFormData, displayName: e.target.value })}
                  />
                </div>

                <button 
                  onClick={handleSaveAccount}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
                >
                  <Save size={18} /> {editingAccount ? 'Perbarui Akun' : 'Aktifkan Akun'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAnalytics;
