import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Menu as MenuIcon, LogOut, RefreshCw, 
  Cloud, HardDrive, CheckCircle2,
  AlertCircle, Settings as SettingsIcon, LayoutDashboard,
  ShoppingBag, ClipboardList, Package, Store, Truck, Share2
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import MenuManager from './components/MenuManager.tsx';
import PublicMenu from './components/PublicMenu.tsx';
import Sidebar from './components/Sidebar.tsx';
import OrdersList from './components/OrdersList.tsx';
import DeliveryManagement from './components/DeliveryManagement.tsx';
import ReceivablesList from './components/ReceivablesList.tsx';
import SmartAdvisor from './components/SmartAdvisor.tsx';
import InventoryManager from './components/InventoryManager.tsx';
import Settings from './components/Settings.tsx';
import AdminProfiles from './components/AdminProfiles.tsx';
import SocialAnalytics from './components/SocialAnalytics.tsx';
import AccountSecurity from './components/AccountSecurity.tsx';
import SalesReport from './components/SalesReport.tsx';
import Login from './components/Login.tsx';
import PosCashier from './components/PosCashier.tsx';
import ShareCatalogModal from './components/ShareCatalogModal.tsx';
import { 
  MenuItem, Order, StoreSettings, User, 
  ShiftType, IngredientStock, ShiftConfig, Expense, 
  FirebaseCredentials, StockMutation 
} from './types.ts';
import { 
  loadAllCaterlyData, 
  saveCaterlyData, 
  syncAllLocalToCloud, 
  exportBackupJSON, 
  parseBackupJSON,
  requestPersistentStorage 
} from './services/storageService.ts';
import { setGeminiApiKey } from './services/geminiService.ts';
import { deductStockForOrder } from './services/inventoryLogic.ts';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_INGREDIENT_CATEGORIES,
  INITIAL_MENU, 
  INITIAL_ORDERS, 
  INITIAL_INVENTORY, 
  INITIAL_MUTATIONS,
  INITIAL_EXPENSES, 
  INITIAL_SETTINGS, 
  INITIAL_ADMINS, 
  INITIAL_SHIFTS 
} from './services/initialData.ts';

const VALID_TABS = [
  'dashboard', 'pos', 'menu', 'orders', 'delivery', 
  'inventory', 'receivables', 'advisor', 'admins', 
  'social', 'security', 'sales-report'
] as const;

type ActiveTab = typeof VALID_TABS[number];

const AUTH_STORAGE_KEY = 'caterly_authenticated_user';
const TAB_STORAGE_KEY = 'caterly_active_tab';

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) return parsed as User;
    }
  } catch (e) {
    console.warn('Gagal membaca sesi user:', e);
  }
  return null;
};

const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const rawHash = window.location.hash.replace('#', '').trim();
    if (rawHash && VALID_TABS.includes(rawHash as ActiveTab)) {
      return rawHash as ActiveTab;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam as ActiveTab)) {
      return tabParam as ActiveTab;
    }
    try {
      const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
      if (savedTab && VALID_TABS.includes(savedTab as ActiveTab)) {
        return savedTab as ActiveTab;
      }
    } catch (e) {}
  }
  return 'dashboard';
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Data state
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [ingredientCategories, setIngredientCategories] = useState<string[]>(INITIAL_INGREDIENT_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [inventory, setInventory] = useState<IngredientStock[]>(INITIAL_INVENTORY);
  const [mutations, setMutations] = useState<StockMutation[]>(INITIAL_MUTATIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [admins, setAdmins] = useState<User[]>(INITIAL_ADMINS);
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>(INITIAL_SHIFTS);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleTabChange = useCallback((newTab: ActiveTab, pushHistory: boolean = true) => {
    setActiveTab(newTab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, newTab);
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const targetHash = `#${newTab}`;
      if (window.location.hash !== targetHash) {
        if (pushHistory) {
          window.history.pushState({ tab: newTab, viewMode: 'admin' }, '', targetHash);
        } else {
          window.history.replaceState({ tab: newTab, viewMode: 'admin' }, '', targetHash);
        }
      }
    }
  }, []);

  // Aktifkan tombol navigasi browser (Back, Forward, Refresh, Hash)
  useEffect(() => {
    const syncFromUrl = (event?: PopStateEvent) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.replace('#', '').trim();
      const isCatalog = params.has('katalog') || params.has('menu') || params.get('mode') === 'katalog' || rawHash === 'katalog';

      if (isCatalog) {
        setViewMode('customer');
        return;
      } else {
        setViewMode('admin');
      }

      const targetTab = (event && event.state && event.state.tab) || (VALID_TABS.includes(rawHash as ActiveTab) ? rawHash : null);
      if (targetTab && VALID_TABS.includes(targetTab as ActiveTab)) {
        setActiveTab(targetTab as ActiveTab);
        try {
          localStorage.setItem(TAB_STORAGE_KEY, targetTab);
        } catch (e) {}
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);

    // Pastikan hash URL selaras saat halaman pertama kali dibuka
    const initialHash = window.location.hash.replace('#', '').trim();
    const params = new URLSearchParams(window.location.search);
    const isCatalog = params.has('katalog') || params.has('menu') || params.get('mode') === 'katalog' || initialHash === 'katalog';
    if (!isCatalog && (!initialHash || !VALID_TABS.includes(initialHash as ActiveTab))) {
      const curTab = getInitialTab();
      window.history.replaceState({ tab: curTab, viewMode: 'admin' }, '', `#${curTab}`);
    }

    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  // Sinkronkan judul tab browser dengan halaman yang aktif
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (viewMode === 'customer') {
      document.title = `${settings.storeName || 'Katering'} - Katalog & Pemesanan Online`;
      return;
    }
    const TAB_NAMES: Record<ActiveTab, string> = {
      dashboard: 'Dashboard',
      pos: 'Kasir (POS)',
      menu: 'Katalog Menu & HPP',
      orders: 'Daftar Pesanan',
      delivery: 'Ruang Delivery',
      inventory: 'Stok & Gudang',
      receivables: 'Buku Piutang',
      advisor: 'Dapur & MRP',
      admins: 'Manajemen Admin',
      social: 'Strategi Sosial',
      security: 'Keamanan Akun',
      'sales-report': 'Laporan Penjualan'
    };
    const title = TAB_NAMES[activeTab] || 'Dashboard';
    document.title = `${title} | ${settings.storeName || 'Caterly Smart OS'}`;
  }, [activeTab, viewMode, settings.storeName]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  // Muat data dari penyimpanan mandiri (Cloud Firebase pengguna / LocalStorage)
  const initializeApplicationData = async () => {
    try {
      requestPersistentStorage().catch(() => {});
      const data = await loadAllCaterlyData();
      setMenu(data.menu);
      setCategories(data.categories);
      if (data.ingredientCategories && data.ingredientCategories.length > 0) {
        setIngredientCategories(data.ingredientCategories);
      }
      setOrders(data.orders);
      setInventory(data.inventory);
      if (data.mutations) setMutations(data.mutations);
      setExpenses(data.expenses);
      const loadedSettings = { 
        ...data.settings, 
        storeName: (data.settings.storeName === 'Caterly Smart OS' || data.settings.storeName === 'caterly' || !data.settings.storeName) 
          ? 'Katering Berkah Rasa' 
          : data.settings.storeName,
        logoUrl: data.settings.logoUrl === '/logo.jpg' ? '' : (data.settings.logoUrl || '') 
      };
      setSettings(loadedSettings);
      setAdmins(data.admins);
      setShiftConfigs(data.shifts);

      if (data.settings.geminiApiKey) {
        setGeminiApiKey(data.settings.geminiApiKey);
      }
    } catch (err) {
      console.warn('Gagal memuat data awal, menggunakan default lokal:', err);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    initializeApplicationData();
  }, []);

  // Simpan otomatis ke penyimpanan mandiri (LocalStorage + Firestore jika cloud aktif)
  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('menu', menu, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [menu, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('orders', orders, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [orders, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('inventory', inventory, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [inventory, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('mutations', mutations, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [mutations, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('expenses', expenses, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [expenses, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('categories', categories, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [categories, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('ingredientCategories', ingredientCategories, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [ingredientCategories, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('admins', admins, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [admins, isDataLoaded, settings.cloudConfig]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const t = setTimeout(() => {
      saveCaterlyData('shifts', shiftConfigs, settings.cloudConfig);
    }, 1000);
    return () => clearTimeout(t);
  }, [shiftConfigs, isDataLoaded, settings.cloudConfig]);

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveCaterlyData('settings', newSettings, newSettings.cloudConfig);
    if (newSettings.geminiApiKey) {
      setGeminiApiKey(newSettings.geminiApiKey);
    }
    addNotification('Pengaturan berhasil diperbarui', 'success');
  };

  const handleSyncAllToCloud = async (creds: FirebaseCredentials) => {
    const res = await syncAllLocalToCloud(creds, {
      menu,
      categories,
      ingredientCategories,
      orders,
      inventory,
      mutations,
      expenses,
      settings,
      admins,
      shifts: shiftConfigs
    });
    if (res.success) {
      addNotification('Semua data katering telah diunggah ke Firebase Cloud!', 'success');
    } else {
      addNotification(res.message, 'error');
    }
    return res;
  };

  const handleExportBackup = () => {
    exportBackupJSON({
      menu,
      categories,
      orders,
      inventory,
      mutations,
      expenses,
      settings,
      admins,
      shifts: shiftConfigs
    });
    addNotification('File cadangan JSON berhasil diunduh ke komputer Anda.', 'success');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const data = await parseBackupJSON(file);
      if (data.menu) setMenu(data.menu);
      if (data.categories) setCategories(data.categories);
      if (data.orders) setOrders(data.orders);
      if (data.inventory) setInventory(data.inventory);
      if (data.mutations) setMutations(data.mutations);
      if (data.expenses) setExpenses(data.expenses);
      if (data.settings) setSettings(data.settings);
      if (data.admins) setAdmins(data.admins);
      if (data.shifts) setShiftConfigs(data.shifts);

      // Simpan langsung ke penyimpanan
      await Promise.all(
        Object.entries(data).map(([k, v]) => saveCaterlyData(k, v, settings.cloudConfig))
      );

      addNotification('Data berhasil dipulihkan dari file cadangan!', 'success');
    } catch (err: any) {
      addNotification(err.message || 'Gagal memulihkan file cadangan.', 'error');
    }
  };

  const handleLogin = (n: string, s: ShiftType, r: UserRole) => {
    const userObj: User = { id: '1', name: n, role: r, shift: s };
    setCurrentUser(userObj);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
    } catch (e) {}
    setViewMode('admin');
    addNotification(`Selamat datang kembali, ${n} (${r})!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    addNotification('Sesi berhasil keluar. Silakan login kembali.', 'info');
  };

  const handleOpenCustomerCatalog = () => {
    setViewMode('customer');
    if (typeof window !== 'undefined') {
      window.history.pushState({ viewMode: 'customer' }, '', '#katalog');
    }
  };

  // 1. Jika dalam mode customer (katalog mandiri publik), tampilkan langsung tanpa perlu login
  if (viewMode === 'customer') {
    return (
      <PublicMenu 
        menu={menu} 
        settings={settings} 
        categories={categories} 
        isStandalone={!currentUser}
        onBackToAdmin={() => {
          setViewMode('admin');
          if (typeof window !== 'undefined') {
            const targetHash = `#${activeTab}`;
            window.history.pushState({ tab: activeTab, viewMode: 'admin' }, '', targetHash);
          }
        }} 
        onPlaceOrder={(orderData) => {
          const newOrder: Order = {
            id: `WEB-${Date.now().toString().slice(-6)}`,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            items: orderData.items,
            totalPrice: orderData.total,
            amountPaid: 0,
            date: orderData.date,
            deliveryTime: orderData.deliveryTime,
            deliveryMethod: orderData.deliveryMethod,
            deliveryAddress: orderData.deliveryAddress,
            deliveryNotes: orderData.deliveryNotes,
            deliveryStatus: 'Menunggu Jadwal',
            status: 'Pending',
            paymentStatus: 'Unpaid',
            type: orderData.totalItems >= 20 ? 'Corporate' : 'Individual',
            shift: 'Pagi',
            recordedBy: 'Katalog Online'
          };
          setOrders(prev => [newOrder, ...prev]);
          addNotification(`Pesanan online baru diterima dari ${orderData.customerName} (${orderData.totalItems} porsi)! Jadwal & rute masuk ke Ruang Delivery.`, 'success');
        }}
      />
    );
  }

  // 2. Jika belum login dan di mode admin, tampilkan form Login sederhana (Hanya Username & Password)
  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        shiftConfigs={shiftConfigs} 
        admins={admins} 
        storeSettings={settings}
        onOpenCustomerMenu={handleOpenCustomerCatalog}
      />
    );
  }

  const handleConfirmAndDeductStock = (order: Order) => {
    const result = deductStockForOrder(order, menu, inventory, currentUser?.name || 'Admin');
    
    // Update order status to Confirmed
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Confirmed' } : o));
    
    // Update inventory if there were ingredients deducted
    if (result.mutations.length > 0) {
      setInventory(result.updatedInventory);
      setMutations(prev => [...result.mutations, ...prev]);
      addNotification(`Pesanan #${order.id} dikonfirmasi! Stok bahan dapur (${result.deductedCount} item) telah otomatis dipotong.`, 'success');
    } else {
      addNotification(`Pesanan #${order.id} telah dikonfirmasi.`, 'success');
    }
  };

  const handleAddMutation = (newMut: StockMutation) => {
    setMutations(prev => [newMut, ...prev]);
  };

  const isCloudActive = settings.cloudConfig?.enabled && !!settings.cloudConfig.firebase?.projectId;

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-950">
      <Sidebar 
        isOpen={true} 
        setIsOpen={() => {}} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onPreviewMenu={handleOpenCustomerCatalog} 
        onShareCatalog={() => setIsShareModalOpen(true)}
        logoUrl={settings.logoUrl} 
        storeName={settings.storeName}
        onOpenSettings={() => setIsSettingsOpen(true)} 
        role={currentUser.role} 
        isDesktop={true} 
      />

      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen relative bg-white">
        <header className="h-16 sm:h-20 bg-white border-b-2 border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-[100]">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-xl shrink-0" 
              aria-label="Buka menu"
            >
              <MenuIcon size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider leading-none mb-0.5 sm:mb-1 truncate max-w-[130px] sm:max-w-none">
                {settings.storeName}
              </h2>
              <p className="text-sm sm:text-lg font-black uppercase tracking-tight text-slate-950 truncate leading-tight">
                {activeTab === 'pos' ? 'Kasir (POS)' : activeTab === 'delivery' ? 'Ruang Delivery' : activeTab.replace('-', ' ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Tombol Bagikan Link Katalog Mandiri untuk Konsumen */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs"
              title="Bagikan Link Katalog Konsumen"
            >
              <Share2 size={16} className="shrink-0" />
              <span className="hidden sm:inline">Share Katalog</span>
            </button>

            {/* Tombol Pengaturan Cepat & Indikator Cloud */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
              title="Buka Pengaturan & Sinkronisasi Cloud"
            >
              <SettingsIcon size={16} className="text-slate-700 shrink-0" />
              <span className="hidden sm:inline">Pengaturan</span>
              {isCloudActive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Cloud Aktif" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Mode Lokal" />
              )}
            </button>

            <button 
              onClick={handleLogout} 
              className="p-2 sm:p-2.5 text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all border-2 border-slate-200 shrink-0"
              title="Keluar / Ganti Shift"
              aria-label="Keluar / Ganti Shift"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-10 pb-28 sm:pb-24 bg-white overflow-x-hidden min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {activeTab === 'dashboard' && (
              <Dashboard 
                orders={orders} 
                menu={menu} 
                inventory={inventory} 
                onShareCatalog={() => setIsShareModalOpen(true)}
                onOpenCatalog={handleOpenCustomerCatalog}
              />
            )}
            {activeTab === 'pos' && (
              <PosCashier
                menu={menu}
                categories={categories}
                settings={settings}
                currentShift={currentUser.shift}
                currentAdminName={currentUser.name}
                onAddOrder={(newOrder) => setOrders(prev => [newOrder, ...prev])}
                onNotify={addNotification}
                inventory={inventory}
                onUpdateInventory={setInventory}
                onAddMutation={handleAddMutation}
              />
            )}
            {activeTab === 'menu' && (
              <MenuManager 
                menu={menu} 
                onUpdateMenu={setMenu} 
                categories={categories} 
                onUpdateCategories={setCategories} 
                inventory={inventory} 
                onUpdateInventory={setInventory}
                onNotify={addNotification} 
              />
            )}
            {activeTab === 'orders' && (
              <OrdersList 
                orders={orders} 
                onAddOrder={(o) => setOrders([o, ...orders])} 
                onUpdateOrder={(id, up) => setOrders(orders.map(o => o.id === id ? {...o, ...up} : o))} 
                onConfirmAndDeductStock={handleConfirmAndDeductStock}
                menu={menu} 
                currentAdminName={currentUser.name} 
                settings={settings}
                onNotify={addNotification} 
              />
            )}
            {activeTab === 'delivery' && (
              <DeliveryManagement 
                orders={orders} 
                onUpdateOrder={(id, up) => setOrders(orders.map(o => o.id === id ? {...o, ...up} : o))} 
                onAddOrder={(newOrd) => setOrders(prev => [newOrd, ...prev])} 
                settings={settings} 
                onNotify={addNotification} 
                currentAdminName={currentUser.name} 
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryManager 
                inventory={inventory} 
                onUpdateInventory={setInventory} 
                ingredientCategories={ingredientCategories}
                onUpdateIngredientCategories={setIngredientCategories}
                mutations={mutations} 
                onAddMutation={handleAddMutation} 
                orders={orders} 
                menu={menu} 
                onAddExpense={(e) => setExpenses([e, ...expenses])} 
                onNotify={addNotification} 
                currentAdmin={currentUser.name} 
              />
            )}
            {activeTab === 'advisor' && (
              <SmartAdvisor 
                inventory={inventory} 
                orders={orders} 
                menu={menu} 
                onUpdateInventory={setInventory} 
                onNotify={addNotification} 
                currentAdmin={currentUser.name} 
                onAddExpense={(e) => setExpenses([e, ...expenses])} 
                onUpdateOrder={(orderId, updates) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o))}
              />
            )}
            {activeTab === 'sales-report' && (
              <SalesReport orders={orders} menu={menu} expenses={expenses} />
            )}
            {activeTab === 'receivables' && (
              <ReceivablesList 
                orders={orders} 
                onUpdateOrder={(id, up) => setOrders(orders.map(o => o.id === id ? {...o, ...up} : o))} 
                settings={settings}
                currentAdminName={currentUser.name}
                onNotify={addNotification}
              />
            )}
            {activeTab === 'admins' && (
              <AdminProfiles 
                shiftConfigs={shiftConfigs} 
                onUpdateShiftConfigs={setShiftConfigs} 
                admins={admins} 
                onUpdateAdmins={setAdmins} 
                onNotify={addNotification} 
              />
            )}
            {activeTab === 'social' && (
              <SocialAnalytics 
                menu={menu} 
                settings={settings} 
                onUpdateSettings={setSettings} 
              />
            )}
            {activeTab === 'security' && (
              <AccountSecurity />
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Mudah dijangkau jempol di layar HP) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 px-1.5 py-1.5 flex items-center justify-around shadow-lg">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </button>

          <button
            onClick={() => handleTabChange('pos')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'pos' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Store size={18} className={activeTab === 'pos' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Kasir</span>
          </button>

          <button
            onClick={() => handleTabChange('orders')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'orders' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <ClipboardList size={18} className={activeTab === 'orders' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Pesanan</span>
          </button>

          <button
            onClick={() => handleTabChange('delivery')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'delivery' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Truck size={18} className={activeTab === 'delivery' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Delivery</span>
          </button>

          <button
            onClick={() => handleTabChange('menu')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'menu' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <ShoppingBag size={18} className={activeTab === 'menu' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Katalog</span>
          </button>

          <button
            onClick={() => handleTabChange('inventory')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'inventory' ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Package size={18} className={activeTab === 'inventory' ? 'text-emerald-700 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Stok</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold transition-all"
          >
            <div className="relative">
              <SettingsIcon size={18} />
              {isCloudActive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <span className="text-[10px] mt-0.5">Setting</span>
          </button>
        </nav>
      </div>

      {isSidebarOpen && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onPreviewMenu={handleOpenCustomerCatalog} 
          onShareCatalog={() => setIsShareModalOpen(true)}
          logoUrl={settings.logoUrl} 
          storeName={settings.storeName} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          role={currentUser.role} 
          isDesktop={false} 
        />
      )}

      {/* Modal Berbagi Link Katalog Mandiri untuk Konsumen */}
      <ShareCatalogModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        settings={settings} 
        onNotify={addNotification} 
      />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="w-full sm:max-w-2xl bg-white h-full relative z-[260] shadow-2xl p-4 sm:p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-800">Pengaturan Sistem</h3>
                <p className="text-xs text-slate-400">Konfigurasi Cloud, Sinkronisasi, Profil Katering & Preferensi</p>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <Settings 
              settings={settings} 
              onUpdateSettings={handleUpdateSettings} 
              onSyncAllToCloud={handleSyncAllToCloud}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              currentCloudStatus={isCloudActive ? 'connected' : 'disconnected'}
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-4 rounded-2xl shadow-xl border animate-in slide-in-from-right duration-300 flex items-center gap-3 pointer-events-auto ${
              n.type === 'error' 
                ? 'bg-rose-600 text-white border-rose-500' 
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {n.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-300 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <p className="text-xs font-bold">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
