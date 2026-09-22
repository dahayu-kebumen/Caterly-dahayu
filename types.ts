
export type ShiftType = 'Pagi' | 'Siang' | 'Malam';
export type UserRole = 'Super Admin' | 'Admin' | 'Kitchen Manager' | 'Sales Admin' | 'Staff';

export interface ShiftConfig {
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  shift: ShiftType;
  password?: string;
  email?: string;
  phone?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'WhatsApp';
  handle: string;
  displayName?: string;
}

export interface FirebaseCredentials {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface CloudConfig {
  enabled: boolean;
  provider: 'firebase' | 'local';
  firebase?: FirebaseCredentials;
  lastSyncedAt?: string;
  status?: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  address: string;
  currencySymbol: string;
  logoUrl?: string;
  geminiApiKey?: string;
  cloudConfig?: CloudConfig;
  socialAccounts: SocialAccount[];
  defaultPrinterPaper?: '58mm' | '80mm' | 'A4';
  receiptFooterMessage?: string;
  bankAccountInfo?: string;
}

export interface MenuRecipe {
  ingredientId: string;
  name: string;
  amountPerUnit: number;
  unit: string;
  unitCost?: number;
  subtotalCost?: number;
  category?: string;
  itemType?: IngredientItemType;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string;
  salesCount: number;
  imageUrl: string;
  recipe?: MenuRecipe[];
  packageItems?: string[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: string[];
  totalPrice: number;
  amountPaid: number;
  date: string;
  deliveryTime?: string; // Jam kirim / jam diambil, misal "11:30"
  deliveryMethod?: 'Delivery' | 'Pickup'; // Dikirim kurir atau diambil sendiri
  deliveryAddress?: string; // Alamat lengkap pengantaran
  deliveryNotes?: string; // Patokan / catatan khusus kurir
  deliveryStatus?: 'Menunggu Jadwal' | 'Disiapkan di Dapur' | 'Sedang Diantar' | 'Tiba di Lokasi' | 'Siap Diambil' | 'Selesai';
  courierName?: string;
  courierPhone?: string;
  vehicleNumber?: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  type: 'Corporate' | 'Wedding' | 'Individual';
  shift?: ShiftType;
  recordedBy?: string;
  kitchenStatus?: 'Menunggu' | 'Sedang Dimasak' | 'Siap Dikemas' | 'Selesai';
  kitchenNotes?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  unit: string;
  totalCost: number;
  date: string;
  recordedBy: string;
  category: 'Bahan Baku' | 'Operasional' | 'Lainnya';
}

export interface PrepRecipeItem {
  rawIngredientId: string;
  rawIngredientName: string;
  amountRequired: number; // Kebutuhan bahan mentah per 1 unit bahan matang
  unit: string;
  unitCost?: number;
}

export type IngredientItemType = 'RAW' | 'PREPARED';

export interface IngredientStock {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  itemType?: IngredientItemType; // 'RAW' = Mentah, 'PREPARED' = Matang / Olahan Siap Pakai
  prepRecipe?: PrepRecipeItem[]; // Formula bahan mentah jika itemType === 'PREPARED'
  cookingNotes?: string;
  shelfLifeDays?: number;
  lastCookedDate?: string;
  minStock?: number;
  costPerUnit?: number;
  category?: string;
  status: 'Aman' | 'Menipis' | 'Habis';
  location?: 'Gudang Utama' | 'Dapur Aktif' | 'Semua Area';
  purchaseUnit?: string;
  purchasePrice?: number;
  yieldQty?: number;
  itemNo?: string | number;
}

export type StockMutationType = 'IN_PURCHASE' | 'OUT_PRODUCTION' | 'ADJUSTMENT' | 'TRANSFER' | 'COOK_PRODUCE' | 'COOK_CONSUME';

export interface StockMutation {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMutationType;
  quantity: number;
  unit: string;
  notes: string;
  date: string;
  referenceId?: string; // ID Pesanan atau ID Belanja
  performedBy: string;
  cost?: number;
}

export type ClientSegment = 'Loyal VIP' | 'At Risk' | 'Rising Star' | 'Potential';

export interface Client {
  id: string;
  name: string;
  email: string;
  lastOrderDate: string;
  orderFrequency: string;
  totalSpent: number;
  preferences: string[];
  segment?: ClientSegment;
}

export interface AIRecommendation {
  clientName: string;
  reason: string;
  suggestedAction: string;
  pitch: string;
}

export interface SocialStrategy {
  platform: string;
  contentIdea: string;
  bestTimeToPost: string;
  suggestedCaption: string;
}

export interface AnalysisResult {
  status: string;
  freshnessScore: number;
  diagnosis: string;
  estimatedQuantity: string;
  recommendations: string[];
}
