
import React from 'react';
import { 
  UtensilsCrossed, 
  Eye, 
  X,
  Settings as SettingsIcon,
  Share2,
  Shield,
  BarChart3,
  LayoutDashboard,
  ChevronRight,
  UserCog,
  ShoppingBag,
  ClipboardList,
  Wallet,
  CookingPot,
  Sparkles,
  Zap,
  Package,
  Store,
  Truck
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onPreviewMenu: () => void;
  onShareCatalog?: () => void;
  logoUrl?: string;
  storeName: string;
  onOpenSettings: () => void;
  role: UserRole;
  isDesktop?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen, 
  onPreviewMenu, 
  onShareCatalog,
  logoUrl,
  storeName,
  onOpenSettings,
  setActiveTab,
  activeTab,
  role,
  isDesktop = false
}) => {
  const isSuperAdmin = role === 'Super Admin';

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir (POS)', icon: Store },
    { id: 'orders', label: 'Pesanan', icon: ClipboardList },
    { id: 'delivery', label: 'Ruang Delivery', icon: Truck },
    { id: 'menu', label: 'Katalog Menu', icon: ShoppingBag },
    { id: 'inventory', label: 'Stok & Gudang', icon: Package },
    { id: 'advisor', label: 'Dapur & MRP', icon: CookingPot },
    { id: 'receivables', label: 'Buku Piutang', icon: Wallet },
  ];

  const secondaryMenuItems = [
    { id: 'sales-report', label: 'Laporan', icon: BarChart3 },
    { id: 'social', label: 'Strategi Sosial', icon: Share2 },
    ...(isSuperAdmin ? [{ id: 'admins', label: 'Manajemen Admin', icon: UserCog }] : []),
    { id: 'security', label: 'Keamanan', icon: Shield },
  ];

  const sidebarInnerContent = (
    <div className="h-full bg-white flex flex-col border-r-2 border-slate-200">
      {/* BRANDING HEADER: USER BUSINESS LOGO & STORE NAME ONLY */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b-2 border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center shrink-0">
            {logoUrl && logoUrl !== '/logo.jpg' ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-900 text-white font-black text-sm flex items-center justify-center uppercase">
                {storeName ? storeName.slice(0, 2) : 'KT'}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-950 leading-tight truncate uppercase">
              {storeName || 'Katering Saya'}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mt-0.5">
              Panel Operasional
            </span>
          </div>
        </div>
        {!isDesktop && (
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl shrink-0" aria-label="Tutup menu">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-4 space-y-7 custom-scrollbar">
        <div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 ml-3">Operasional</p>
          <nav className="space-y-1.5">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (!isDesktop) setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-slate-950 text-white shadow-md font-black' 
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-700 group-hover:text-slate-950'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight size={16} className="text-white/70" />}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 ml-3">Manajemen</p>
          <nav className="space-y-1.5">
            {secondaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (!isDesktop) setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-slate-950 text-white shadow-md font-black' 
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-700 group-hover:text-slate-950'} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t-2 border-slate-200 space-y-2 bg-slate-50/50">
        {onShareCatalog && (
          <button 
            onClick={() => {
              onShareCatalog();
              if(!isDesktop) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wide hover:bg-emerald-800 transition-all shadow-sm"
          >
            <Share2 size={18} /> Bagikan Link Katalog
          </button>
        )}
        
        <button 
          onClick={() => {
            onPreviewMenu();
            if(!isDesktop) setIsOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-100 transition-all border border-slate-300"
        >
          <Eye size={16} /> Buka Katalog
        </button>
        
        {isSuperAdmin && (
          <button 
            onClick={() => {
              onOpenSettings();
              if(!isDesktop) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-100 transition-all border border-slate-300"
          >
            <SettingsIcon size={16} /> Settings Bisnis
          </button>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-40">
        {sidebarInnerContent}
      </aside>
    );
  }

  return (
    <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={() => setIsOpen(false)}
      ></div>
      <div className={`absolute top-0 left-0 w-64 h-full bg-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarInnerContent}
      </div>
    </div>
  );
};

export default Sidebar;
