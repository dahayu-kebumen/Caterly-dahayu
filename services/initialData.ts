import { MenuItem, Order, IngredientStock, Expense, StoreSettings, User, ShiftConfig, StockMutation } from '../types';
import { DEFAULT_MASTER_INGREDIENTS } from './ingredientImporter';

export const INITIAL_CATEGORIES: string[] = [
  'Paket Buffet', 
  'Snack Box', 
  'Nasi Kotak', 
  'Tumpeng'
];

/**
 * Kategori Standar Master Bahan Baku Katering dari Spreadsheet:
 * A. BAHAN POKOK
 * B. BAHAN BAKU LK UTAMA
 * C. BAHAN LK PENDAMPING
 * D. BAHAN SAYURAN & REBUSAN
 * E. BUMBU DAPUR & REMPAH
 * F. PACKAGING & KEMASAN
 */
export const INITIAL_INGREDIENT_CATEGORIES: string[] = [
  'Bahan Pokok',
  'Lauk Utama',
  'Lauk Pendamping',
  'Sayuran & Rebusan',
  'Bumbu Dapur',
  'Packaging & Kemasan'
];

export const INITIAL_SHIFTS: ShiftConfig[] = [
  { type: 'Pagi', startTime: '06:00', endTime: '14:00' },
  { type: 'Siang', startTime: '14:00', endTime: '22:00' },
  { type: 'Malam', startTime: '22:00', endTime: '06:00' },
];

export const INITIAL_ADMINS: User[] = [
  { 
    id: 'admin_1', 
    name: 'Admin Utama', 
    role: 'Super Admin', 
    shift: 'Pagi', 
    password: 'admin', 
    avatarUrl: '' 
  },
  { 
    id: 'admin_2', 
    name: 'Chef Bambang', 
    role: 'Kitchen Manager', 
    shift: 'Pagi', 
    password: 'dapur', 
    avatarUrl: '' 
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Katering Berkah Rasa',
  whatsappNumber: '6281234567890',
  address: 'Jl. Melati Raya No. 18, Kebumen, Jawa Tengah',
  currencySymbol: 'Rp',
  logoUrl: '',
  socialAccounts: [
    { id: 'soc_1', platform: 'Instagram', handle: 'berkahrasa.catering', displayName: 'Official Instagram' },
    { id: 'soc_2', platform: 'WhatsApp', handle: '6281234567890', displayName: 'CS Pemesanan' }
  ],
  cloudConfig: {
    enabled: false,
    provider: 'local',
    status: 'disconnected'
  }
};

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'menu_1',
    name: 'Nasi Kotak Ayam Bakar Madu',
    category: 'Nasi Kotak',
    price: 32000,
    cost: 18000,
    description: 'Nasi liwet harum dengan ayam bakar bumbu madu legit, lalapan segar, tahu tempe bacem, dan sambal terasi khas katering.',
    salesCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60',
    packageItems: ['Ayam Bakar Madu', 'Nasi Liwet', 'Tahu Tempe Bacem', 'Sambal Terasi', 'Kerupuk Udang'],
    recipe: [
      { ingredientId: 'ing_1', name: 'Beras Pandan Wangi', amountPerUnit: 0.15, unit: 'kg' },
      { ingredientId: 'ing_2', name: 'Daging Ayam Fillet', amountPerUnit: 0.25, unit: 'kg' },
      { ingredientId: 'ing_4', name: 'Minyak Goreng', amountPerUnit: 0.05, unit: 'liter' },
      { ingredientId: 'ing_5', name: 'Bumbu Rempah Racik', amountPerUnit: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 'menu_2',
    name: 'Paket Buffet Pernikahan Royal',
    category: 'Paket Buffet',
    price: 95000,
    cost: 52000,
    description: 'Menu prasmanan mewah: Daging Sapi Lada Hitam, Ayam Gulung Keju, Sup Kimlo Pengantin, Ikan Gurame Asam Manis, dan Aneka Puding Buah Segar.',
    salesCount: 28,
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop&q=60',
    packageItems: ['Daging Sapi Lada Hitam', 'Ayam Gulung Keju', 'Sup Kimlo', 'Gurame Asam Manis', 'Dessert Corner'],
    recipe: [
      { ingredientId: 'ing_1', name: 'Beras Pandan Wangi', amountPerUnit: 0.2, unit: 'kg' },
      { ingredientId: 'ing_2', name: 'Daging Ayam Fillet', amountPerUnit: 0.3, unit: 'kg' },
      { ingredientId: 'ing_4', name: 'Minyak Goreng', amountPerUnit: 0.08, unit: 'liter' }
    ]
  },
  {
    id: 'menu_3',
    name: 'Tumpeng Mini Nusantara',
    category: 'Tumpeng',
    price: 45000,
    cost: 24000,
    description: 'Nasi kuning rempah gurih berbentuk kerucut mini dengan ayam suwir pedas manis, perkedel kentang, telur dadar iris, kering tempe, dan urap sayur.',
    salesCount: 86,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=60',
    packageItems: ['Nasi Kuning Kerucut', 'Ayam Suwir Pedas', 'Perkedel Kentang', 'Telur Dadar Iris', 'Sambal Bajak'],
    recipe: [
      { ingredientId: 'ing_1', name: 'Beras Pandan Wangi', amountPerUnit: 0.18, unit: 'kg' },
      { ingredientId: 'ing_3', name: 'Telur Ayam Segar', amountPerUnit: 1, unit: 'butir' },
      { ingredientId: 'ing_5', name: 'Bumbu Rempah Racik', amountPerUnit: 0.04, unit: 'kg' }
    ]
  },
  {
    id: 'menu_4',
    name: 'Snack Box Acara VIP (3 Kue + Air)',
    category: 'Snack Box',
    price: 18000,
    cost: 9500,
    description: 'Kombinasi kue asin dan manis premium: Risoles Ragout Daging, Lemper Ayam Bakar, Pie Buah Segar, dan air mineral botol mini.',
    salesCount: 310,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=60',
    packageItems: ['Risoles Ragout Daging', 'Lemper Ayam Bakar', 'Pie Buah', 'Air Mineral'],
    recipe: [
      { ingredientId: 'ing_3', name: 'Telur Ayam Segar', amountPerUnit: 1, unit: 'butir' },
      { ingredientId: 'ing_4', name: 'Minyak Goreng', amountPerUnit: 0.03, unit: 'liter' }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'PT Samudera Logistik (Bpk Hendra)',
    customerPhone: '081298765432',
    items: ['Nasi Kotak Ayam Bakar Madu (75 porsi)', 'Snack Box Acara VIP (75 box)'],
    totalPrice: 3750000,
    amountPaid: 3750000,
    date: new Date().toISOString().split('T')[0],
    deliveryTime: '11:30',
    deliveryMethod: 'Delivery',
    deliveryAddress: 'Gedung Menara Maritim Lt. 8, Jl. Yos Sudarso No. 45, Jakarta Utara',
    deliveryNotes: 'Masuk lewat loading dock basement, lapor satpam minta stiker tamu lift barang.',
    deliveryStatus: 'Sedang Diantar',
    courierName: 'Budi Santoso (Driver 1)',
    courierPhone: '081311223344',
    vehicleNumber: 'B 9283 KTR (Blind Van)',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    type: 'Corporate',
    shift: 'Pagi',
    recordedBy: 'Admin Utama'
  },
  {
    id: 'ORD-1002',
    customerName: 'Ibu Ratna Wedding Gathering',
    customerPhone: '081809876543',
    items: ['Paket Buffet Pernikahan Royal (150 porsi)'],
    totalPrice: 14250000,
    amountPaid: 7000000,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    deliveryTime: '18:00',
    deliveryMethod: 'Delivery',
    deliveryAddress: 'Ballroom Hotel Grand Cempaka, Jl. Letjen Suprapto, Cempaka Putih',
    deliveryNotes: 'Set meja prasmanan harus sudah selesai pukul 16:30 WIB sebelum tamu tiba.',
    deliveryStatus: 'Menunggu Jadwal',
    courierName: 'Tim Logistik & Prasmanan',
    courierPhone: '081233445566',
    vehicleNumber: 'B 8812 KT (Engkel Box)',
    status: 'Confirmed',
    paymentStatus: 'Partial',
    type: 'Wedding',
    shift: 'Siang',
    recordedBy: 'Admin Utama'
  },
  {
    id: 'ORD-1003',
    customerName: 'Syukuran Kelahiran Baby Arka',
    customerPhone: '085712345678',
    items: ['Tumpeng Mini Nusantara (35 porsi)'],
    totalPrice: 1575000,
    amountPaid: 0,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliveryTime: '09:00',
    deliveryMethod: 'Pickup',
    deliveryAddress: 'Diambil Sendiri di Dapur Utama Katering',
    deliveryNotes: 'Akan diambil oleh om dari keluarga dengan mobil pribadi Avanza Hitam.',
    deliveryStatus: 'Disiapkan di Dapur',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    type: 'Individual',
    shift: 'Pagi',
    recordedBy: 'Admin Utama'
  }
];

export const INITIAL_INVENTORY: IngredientStock[] = DEFAULT_MASTER_INGREDIENTS;

export const INITIAL_MUTATIONS: StockMutation[] = [
  {
    id: 'MUT-001',
    ingredientId: 'ing_1',
    ingredientName: 'Beras Pandan Wangi',
    type: 'IN_PURCHASE',
    quantity: 100,
    unit: 'kg',
    notes: 'Belanja stok mingguan Pasar Induk',
    date: new Date().toISOString().split('T')[0],
    performedBy: 'Chef Bambang',
    cost: 1450000
  },
  {
    id: 'MUT-002',
    ingredientId: 'ing_1',
    ingredientName: 'Beras Pandan Wangi',
    type: 'OUT_PRODUCTION',
    quantity: -11.25,
    unit: 'kg',
    notes: 'Produksi Pesanan #ORD-1001 (75 porsi Nasi Kotak)',
    date: new Date().toISOString().split('T')[0],
    referenceId: 'ORD-1001',
    performedBy: 'Sistem Otomatis (BOM)'
  },
  {
    id: 'MUT-003',
    ingredientId: 'ing_2',
    ingredientName: 'Daging Ayam Fillet',
    type: 'OUT_PRODUCTION',
    quantity: -18.75,
    unit: 'kg',
    notes: 'Produksi Pesanan #ORD-1001 (75 porsi Ayam Bakar Madu)',
    date: new Date().toISOString().split('T')[0],
    referenceId: 'ORD-1001',
    performedBy: 'Sistem Otomatis (BOM)'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    name: 'Belanja Daging Ayam Segar (Pasar Induk)',
    amount: 30,
    unit: 'kg',
    totalCost: 1050000,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Chef Bambang',
    category: 'Bahan Baku'
  },
  {
    id: 'exp_2',
    name: 'Gas LPG 12kg Dapur Katering (2 tabung)',
    amount: 2,
    unit: 'tabung',
    totalCost: 440000,
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Admin Utama',
    category: 'Operasional'
  }
];
