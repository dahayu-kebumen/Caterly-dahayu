import { IngredientStock } from '../types';

/**
 * 6 Kategori Standar Master Bahan Baku Katering dari Spreadsheet:
 * A. BAHAN POKOK
 * B. BAHAN BAKU LK UTAMA
 * C. BAHAN LK PENDAMPING
 * D. BAHAN SAYURAN & REBUSAN
 * E. BUMBU DAPUR & REMPAH
 * F. PACKAGING & KEMASAN
 */
export const SPREADSHEET_INGREDIENT_CATEGORIES = [
  'Bahan Pokok',
  'Lauk Utama',
  'Lauk Pendamping',
  'Sayuran & Rebusan',
  'Bumbu Dapur',
  'Packaging & Kemasan'
] as const;

export type SpreadsheetCategory = typeof SPREADSHEET_INGREDIENT_CATEGORIES[number];

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Bahan Pokok': 'Beras, Oyek, Ketan, Basmati',
  'Lauk Utama': 'Ayam, Daging Sapi, Ikan, Udang, Cumi, Jeroan',
  'Lauk Pendamping': 'Tahu, Tempe, Telor, Kerupuk, Bakso, Sosis',
  'Sayuran & Rebusan': 'Sayuran, Kentang, Wortel, Rebusan, Lalapan',
  'Bumbu Dapur': 'Cabai, Bawang, Rempah, Minyak, Kecap, Saus, Garam',
  'Packaging & Kemasan': 'Dus Nasi, Box Snack, Mika, Plastik, Sendok, Sticker'
};

/**
 * Data Master Bahan Baku Katering dari Spreadsheet User
 */
export const DEFAULT_MASTER_INGREDIENTS: IngredientStock[] = [
  // A. BAHAN POKOK
  { id: 'ing_pokok_1', itemNo: '1', name: 'Beras', category: 'Bahan Pokok', purchaseUnit: '1000 gr', purchasePrice: 16500, yieldQty: 11, costPerUnit: 1500, unit: 'porsi', quantity: 50, minStock: 20, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pokok_2', itemNo: '2', name: 'Oyek', category: 'Bahan Pokok', purchaseUnit: '1000 gr', purchasePrice: 15000, yieldQty: 10, costPerUnit: 1500, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pokok_3', itemNo: '3', name: 'Ketan', category: 'Bahan Pokok', purchaseUnit: '1000 gr', purchasePrice: 18000, yieldQty: 10, costPerUnit: 1800, unit: 'porsi', quantity: 15, minStock: 5, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pokok_4', itemNo: '4', name: 'Beras Basmati', category: 'Bahan Pokok', purchaseUnit: '1000 gr', purchasePrice: 90000, yieldQty: 14, costPerUnit: 6429, unit: 'porsi', quantity: 10, minStock: 5, status: 'Aman', location: 'Gudang Utama' },

  // B. BAHAN BAKU LK UTAMA
  { id: 'ing_lk_1', itemNo: '1', name: 'Ayam Boiler', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 7, costPerUnit: 5714, unit: 'ptg', quantity: 35, minStock: 14, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_2', itemNo: '2', name: 'Ayam Kampung', category: 'Lauk Utama', purchaseUnit: '1 ekor', purchasePrice: 45000, yieldQty: 4, costPerUnit: 11250, unit: 'ptg', quantity: 8, minStock: 4, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_3', itemNo: '3', name: 'Ayam Kalasan', category: 'Lauk Utama', purchaseUnit: '25 ekor', purchasePrice: 850000, yieldQty: 100, costPerUnit: 8500, unit: 'ptg', quantity: 50, minStock: 20, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_4', itemNo: '4', name: 'Bebek', category: 'Lauk Utama', purchaseUnit: '1 ekor', purchasePrice: 70000, yieldQty: 4, costPerUnit: 17500, unit: 'ptg', quantity: 6, minStock: 2, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_5', itemNo: '5', name: 'Daging Sapi', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 150000, yieldQty: 20, costPerUnit: 7500, unit: 'pcs', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_6', itemNo: '6', name: 'Gurame', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 45000, yieldQty: 3, costPerUnit: 15000, unit: 'ekor', quantity: 12, minStock: 4, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_7', itemNo: '7', name: 'Nila', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 3, costPerUnit: 13333, unit: 'ekor', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_8', itemNo: '8', name: 'Lele', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 22000, yieldQty: 7, costPerUnit: 3143, unit: 'ekor', quantity: 25, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_9', itemNo: '9', name: 'Ikan Salem', category: 'Lauk Utama', purchaseUnit: '1 unting', purchasePrice: 150000, yieldQty: 40, costPerUnit: 3750, unit: 'ekor', quantity: 40, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_10', itemNo: '10', name: 'Udang', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 85000, yieldQty: 17, costPerUnit: 5000, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_11', itemNo: '11', name: 'Cumi-Cumi', category: 'Lauk Utama', purchaseUnit: '1000 gr', purchasePrice: 45000, yieldQty: 6, costPerUnit: 7500, unit: 'porsi', quantity: 12, minStock: 4, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_13', itemNo: '13', name: 'Tongkol', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 75000, yieldQty: 15, costPerUnit: 5000, unit: 'ptg', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_14', itemNo: '14', name: 'Bandeng Presto', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 100000, yieldQty: 10, costPerUnit: 10000, unit: 'ekor', quantity: 10, minStock: 4, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_15', itemNo: '15', name: 'Ikan Kembung', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 40000, yieldQty: 10, costPerUnit: 4000, unit: 'ekor', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_16', itemNo: '16', name: 'Babat Sapi', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 60000, yieldQty: 15, costPerUnit: 4000, unit: 'porsi', quantity: 10, minStock: 3, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_17', itemNo: '17', name: 'Paru Sapi', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 60000, yieldQty: 15, costPerUnit: 4000, unit: 'porsi', quantity: 10, minStock: 3, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_18', itemNo: '18', name: 'Lidah Sapi', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 100000, yieldQty: 15, costPerUnit: 6667, unit: 'porsi', quantity: 8, minStock: 2, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_19', itemNo: '19', name: 'Iso Sapi', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 60000, yieldQty: 15, costPerUnit: 4000, unit: 'porsi', quantity: 10, minStock: 3, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_lk_20', itemNo: '20', name: 'Kikil Sapi', category: 'Lauk Utama', purchaseUnit: '3000 gr', purchasePrice: 60000, yieldQty: 15, costPerUnit: 4000, unit: 'porsi', quantity: 10, minStock: 3, status: 'Aman', location: 'Dapur Aktif' },

  // C. BAHAN LK PENDAMPING
  { id: 'ing_pend_1', itemNo: '1', name: 'Tahu Bandung', category: 'Lauk Pendamping', purchaseUnit: '1 bungkus', purchasePrice: 5000, yieldQty: 8, costPerUnit: 625, unit: 'pcs', quantity: 40, minStock: 16, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_2', itemNo: '2', name: 'Tempe MGL', category: 'Lauk Pendamping', purchaseUnit: '1 papan', purchasePrice: 11000, yieldQty: 15, costPerUnit: 733, unit: 'ptg', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_3', itemNo: '3', name: 'Telor Ayam', category: 'Lauk Pendamping', purchaseUnit: '1000 gr', purchasePrice: 28000, yieldQty: 16, costPerUnit: 1750, unit: 'butir', quantity: 80, minStock: 30, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_4', itemNo: '4', name: 'Kerupuk', category: 'Lauk Pendamping', purchaseUnit: '500 gr', purchasePrice: 18000, yieldQty: 40, costPerUnit: 450, unit: 'bungkus', quantity: 100, minStock: 40, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_5', itemNo: '5', name: 'Tahu Bakso', category: 'Lauk Pendamping', purchaseUnit: '1 pak', purchasePrice: 140000, yieldQty: 100, costPerUnit: 1400, unit: 'pcs', quantity: 100, minStock: 30, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_6', itemNo: '6', name: 'Sosis', category: 'Lauk Pendamping', purchaseUnit: '120 gr', purchasePrice: 30000, yieldQty: 150, costPerUnit: 200, unit: 'ptg', quantity: 150, minStock: 50, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_7', itemNo: '7', name: 'Tahu Putih', category: 'Lauk Pendamping', purchaseUnit: '1 bks', purchasePrice: 72500, yieldQty: 100, costPerUnit: 725, unit: 'pcs', quantity: 100, minStock: 30, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_8', itemNo: '8', name: 'Bakso Sapi', category: 'Lauk Pendamping', purchaseUnit: '1000 gr', purchasePrice: 70000, yieldQty: 70, costPerUnit: 1000, unit: 'butir', quantity: 70, minStock: 20, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pend_9', itemNo: '9', name: 'Tempe Kotak', category: 'Lauk Pendamping', purchaseUnit: '1 pcs', purchasePrice: 2700, yieldQty: 4, costPerUnit: 675, unit: 'ptg', quantity: 20, minStock: 8, status: 'Aman', location: 'Dapur Aktif' },

  // D. BAHAN SAYURAN & REBUSAN
  { id: 'ing_sayur_1', itemNo: '1', name: 'Kentang', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 20000, yieldQty: 15, costPerUnit: 1333, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_2', itemNo: '2', name: 'Kacang Panjang', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 7000, yieldQty: 20, costPerUnit: 350, unit: 'porsi', quantity: 25, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_3', itemNo: '3', name: 'Kangkung', category: 'Sayuran & Rebusan', purchaseUnit: '1 ikat', purchasePrice: 9000, yieldQty: 15, costPerUnit: 600, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_5', itemNo: '5', name: 'Daun Pepaya', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 10000, yieldQty: 25, costPerUnit: 400, unit: 'porsi', quantity: 25, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_6', itemNo: '6', name: 'Pepaya Muda', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 10000, yieldQty: 20, costPerUnit: 500, unit: 'porsi', quantity: 20, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_7', itemNo: '7', name: 'Buncis', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 12000, yieldQty: 20, costPerUnit: 600, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_9', itemNo: '9', name: 'Putren (Jagung Muda)', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 8000, yieldQty: 15, costPerUnit: 534, unit: 'porsi', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_12', itemNo: '12', name: 'Wortel', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 10000, yieldQty: 20, costPerUnit: 500, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_13', itemNo: '13', name: 'Kol', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 9000, yieldQty: 50, costPerUnit: 180, unit: 'porsi', quantity: 40, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_14', itemNo: '14', name: 'Timun', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 6000, yieldQty: 25, costPerUnit: 240, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_15', itemNo: '15', name: 'Selada', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 25000, yieldQty: 160, costPerUnit: 156, unit: 'lbr', quantity: 100, minStock: 30, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_16', itemNo: '16', name: 'Kemangi', category: 'Sayuran & Rebusan', purchaseUnit: '1 ikat', purchasePrice: 3000, yieldQty: 40, costPerUnit: 75, unit: 'porsi', quantity: 40, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_17', itemNo: '17', name: 'Terong', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 8000, yieldQty: 15, costPerUnit: 533, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_18', itemNo: '18', name: 'Jamur Tiram', category: 'Sayuran & Rebusan', purchaseUnit: '1 bks', purchasePrice: 15000, yieldQty: 50, costPerUnit: 300, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_25', itemNo: '25', name: 'Brokoli', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 30000, yieldQty: 20, costPerUnit: 1500, unit: 'porsi', quantity: 15, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_26', itemNo: '26', name: 'Tomat', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 6000, yieldQty: 10, costPerUnit: 600, unit: 'buah', quantity: 25, minStock: 8, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_28', itemNo: '28', name: 'Toge', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 15000, yieldQty: 50, costPerUnit: 300, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_sayur_30', itemNo: '30', name: 'Bihun', category: 'Sayuran & Rebusan', purchaseUnit: '1 bal', purchasePrice: 85000, yieldQty: 250, costPerUnit: 340, unit: 'porsi', quantity: 200, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_sayur_31', itemNo: '31', name: 'Mie Kuning', category: 'Sayuran & Rebusan', purchaseUnit: '1 karton', purchasePrice: 80000, yieldQty: 216, costPerUnit: 370, unit: 'porsi', quantity: 180, minStock: 40, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_reb_1', itemNo: 'D1', name: 'Pisang Kepok', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 20000, yieldQty: 20, costPerUnit: 1000, unit: 'biji', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_reb_2', itemNo: 'D2', name: 'Ubi Cilembu', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 25000, yieldQty: 12, costPerUnit: 2084, unit: 'ptg', quantity: 25, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_reb_3', itemNo: 'D3', name: 'Kacang Madu', category: 'Sayuran & Rebusan', purchaseUnit: '1000 gr', purchasePrice: 25000, yieldQty: 15, costPerUnit: 1667, unit: 'porsi', quantity: 20, minStock: 5, status: 'Aman', location: 'Dapur Aktif' },

  // E. BUMBU DAPUR & REMPAH
  { id: 'ing_bumbu_1', itemNo: '1', name: 'Cabe TM (Merah Keriting)', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 45000, yieldQty: 1000, costPerUnit: 45, unit: 'gr', quantity: 5000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_2', itemNo: '2', name: 'Cabe Ijo Besar', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 30000, yieldQty: 1000, costPerUnit: 30, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_3', itemNo: '3', name: 'Cabe Rawit', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 60000, yieldQty: 1000, costPerUnit: 60, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_4', itemNo: '4', name: 'Bawang Merah', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 1000, costPerUnit: 40, unit: 'gr', quantity: 6000, minStock: 2000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_5', itemNo: '5', name: 'Bawang Putih', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 45000, yieldQty: 1000, costPerUnit: 45, unit: 'gr', quantity: 6000, minStock: 2000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_8', itemNo: '8', name: 'Kemiri', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 1000, costPerUnit: 40, unit: 'gr', quantity: 2000, minStock: 500, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_9', itemNo: '9', name: 'Ketumbar', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 1000, costPerUnit: 40, unit: 'gr', quantity: 2000, minStock: 500, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_10', itemNo: '10', name: 'Merica', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 200000, yieldQty: 1000, costPerUnit: 200, unit: 'gr', quantity: 1500, minStock: 500, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_11', itemNo: '11', name: 'Jahe', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 30000, yieldQty: 1000, costPerUnit: 30, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_12', itemNo: '12', name: 'Kunyit', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 10000, yieldQty: 1000, costPerUnit: 10, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_13', itemNo: '13', name: 'Lengkuas', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 8000, yieldQty: 1000, costPerUnit: 8, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_14', itemNo: '14', name: 'Serai', category: 'Bumbu Dapur', purchaseUnit: '1 ikat', purchasePrice: 8000, yieldQty: 20, costPerUnit: 400, unit: 'btg', quantity: 40, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_15', itemNo: '15', name: 'Daun Salam', category: 'Bumbu Dapur', purchaseUnit: '1 ikat', purchasePrice: 3000, yieldQty: 100, costPerUnit: 30, unit: 'lembar', quantity: 100, minStock: 20, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_16', itemNo: '16', name: 'Daun Jeruk', category: 'Bumbu Dapur', purchaseUnit: '1 ikat', purchasePrice: 3000, yieldQty: 100, costPerUnit: 30, unit: 'lembar', quantity: 100, minStock: 20, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_17', itemNo: '17', name: 'Garam', category: 'Bumbu Dapur', purchaseUnit: '1 pak', purchasePrice: 40000, yieldQty: 3000, costPerUnit: 13, unit: 'gr', quantity: 6000, minStock: 2000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_18', itemNo: '18', name: 'Gula Pasir', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 19000, yieldQty: 1000, costPerUnit: 19, unit: 'gr', quantity: 5000, minStock: 2000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_19', itemNo: '19', name: 'Gula Merah', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 23000, yieldQty: 1000, costPerUnit: 23, unit: 'gr', quantity: 4000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_22', itemNo: '22', name: 'Kecap Manis', category: 'Bumbu Dapur', purchaseUnit: '3000 gr', purchasePrice: 120000, yieldQty: 3000, costPerUnit: 40, unit: 'gr', quantity: 6000, minStock: 1500, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_24', itemNo: '24', name: 'Saus Tiram', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 40000, yieldQty: 1000, costPerUnit: 40, unit: 'gr', quantity: 2000, minStock: 500, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_25', itemNo: '25', name: 'Santan Kara', category: 'Bumbu Dapur', purchaseUnit: '1 karton', purchasePrice: 185000, yieldQty: 36, costPerUnit: 5139, unit: 'pcs', quantity: 36, minStock: 10, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_bumbu_26', itemNo: '26', name: 'Tepung Terigu', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 15000, yieldQty: 1000, costPerUnit: 15, unit: 'gr', quantity: 5000, minStock: 2000, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_bumbu_31', itemNo: '31', name: 'Margarin', category: 'Bumbu Dapur', purchaseUnit: '1000 gr', purchasePrice: 35000, yieldQty: 1000, costPerUnit: 35, unit: 'gr', quantity: 3000, minStock: 1000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_32', itemNo: '32', name: 'Minyak Goreng', category: 'Bumbu Dapur', purchaseUnit: '1000 ml', purchasePrice: 20000, yieldQty: 1000, costPerUnit: 20, unit: 'ml', quantity: 15000, minStock: 4000, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_34', itemNo: '34', name: 'Terasi', category: 'Bumbu Dapur', purchaseUnit: '60 gr', purchasePrice: 2500, yieldQty: 60, costPerUnit: 42, unit: 'gr', quantity: 300, minStock: 60, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_36', itemNo: '36', name: 'Bawang Goreng', category: 'Bumbu Dapur', purchaseUnit: '250 gr', purchasePrice: 15000, yieldQty: 100, costPerUnit: 150, unit: 'porsi', quantity: 100, minStock: 30, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_olahan_1', itemNo: 'B1', name: 'Bumbu Kuning / Racik', category: 'Bumbu Dapur', purchaseUnit: '8000 gr', purchasePrice: 190000, yieldQty: 20, costPerUnit: 9500, unit: 'resep', quantity: 10, minStock: 3, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_olahan_2', itemNo: 'B2', name: 'Sambel Ijo / Terasi', category: 'Bumbu Dapur', purchaseUnit: '1 batch', purchasePrice: 35000, yieldQty: 50, costPerUnit: 700, unit: 'porsi', quantity: 50, minStock: 15, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_bumbu_olahan_3', itemNo: 'B3', name: 'Bumbu Rica-Rica', category: 'Bumbu Dapur', purchaseUnit: '1 batch', purchasePrice: 40000, yieldQty: 40, costPerUnit: 1000, unit: 'porsi', quantity: 30, minStock: 10, status: 'Aman', location: 'Dapur Aktif' },

  // F. PACKAGING & KEMASAN
  { id: 'ing_pack_1', itemNo: '1', name: 'Daun Pisang', category: 'Packaging & Kemasan', purchaseUnit: '1 ikat', purchasePrice: 5000, yieldQty: 30, costPerUnit: 167, unit: 'lbr', quantity: 60, minStock: 20, status: 'Aman', location: 'Dapur Aktif' },
  { id: 'ing_pack_2', itemNo: '2', name: 'Box Snack Kecil', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 500, yieldQty: 1, costPerUnit: 350, unit: 'pcs', quantity: 200, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_3', itemNo: '3', name: 'Box Snack Sedang', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 800, yieldQty: 1, costPerUnit: 400, unit: 'pcs', quantity: 300, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_4', itemNo: '4', name: 'Box Snack Besar', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 1300, yieldQty: 1, costPerUnit: 1150, unit: 'pcs', quantity: 150, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_5', itemNo: '5', name: 'Box Dahayu 18x18', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 2000, yieldQty: 1, costPerUnit: 1500, unit: 'pcs', quantity: 400, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_6', itemNo: '6', name: 'Box Dahayu 20x20x8 (Putih Sablon)', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 2000, yieldQty: 1, costPerUnit: 1250, unit: 'pcs', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_7', itemNo: '7', name: 'Box Dahayu 20x20x10', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 2500, yieldQty: 1, costPerUnit: 2000, unit: 'pcs', quantity: 300, minStock: 80, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_8', itemNo: '8', name: 'Box Dahayu Premium', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 4000, yieldQty: 1, costPerUnit: 3000, unit: 'pcs', quantity: 100, minStock: 30, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_9', itemNo: '9', name: 'Box Craft Cokelat', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 1000, yieldQty: 1, costPerUnit: 550, unit: 'pcs', quantity: 250, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_10', itemNo: '10', name: 'Mika Bulat', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 5000, yieldQty: 1, costPerUnit: 3000, unit: 'pcs', quantity: 150, minStock: 40, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_11', itemNo: '11', name: 'Mika Kotak', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 5000, yieldQty: 1, costPerUnit: 3500, unit: 'pcs', quantity: 150, minStock: 40, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_12', itemNo: '12', name: 'Nampan Cokelat', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 12000, yieldQty: 1, costPerUnit: 9000, unit: 'pcs', quantity: 50, minStock: 15, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_13', itemNo: '13', name: 'Mika Sekat 18', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 250, yieldQty: 1, costPerUnit: 180, unit: 'pcs', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_14', itemNo: '14', name: 'Mika Sekat 20', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 450, yieldQty: 1, costPerUnit: 360, unit: 'pcs', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_16', itemNo: '16', name: 'Box Premium Hantaran', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 40000, yieldQty: 1, costPerUnit: 35000, unit: 'pcs', quantity: 20, minStock: 5, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_20', itemNo: '20', name: 'Plastik OPP 10', category: 'Packaging & Kemasan', purchaseUnit: '1 lembar', purchasePrice: 60, yieldQty: 1, costPerUnit: 45, unit: 'lembar', quantity: 1000, minStock: 200, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_22', itemNo: '22', name: 'Plastik OPP 12', category: 'Packaging & Kemasan', purchaseUnit: '1 lembar', purchasePrice: 80, yieldQty: 1, costPerUnit: 60, unit: 'lembar', quantity: 1000, minStock: 200, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_24', itemNo: '24', name: 'Plastik Mandarin', category: 'Packaging & Kemasan', purchaseUnit: '1 lembar', purchasePrice: 90, yieldQty: 1, costPerUnit: 65, unit: 'lembar', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_25', itemNo: '25', name: 'Tissue Sendok Pack', category: 'Packaging & Kemasan', purchaseUnit: '1 pak', purchasePrice: 14000, yieldQty: 100, costPerUnit: 140, unit: 'set', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_26', itemNo: '26', name: 'Tusuk Gigi Kemas', category: 'Packaging & Kemasan', purchaseUnit: '1 pak', purchasePrice: 15000, yieldQty: 500, costPerUnit: 30, unit: 'pcs', quantity: 1000, minStock: 200, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_27', itemNo: '27', name: 'Sendok Plastik Makan', category: 'Packaging & Kemasan', purchaseUnit: '1 pak', purchasePrice: 13000, yieldQty: 100, costPerUnit: 130, unit: 'pcs', quantity: 800, minStock: 200, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_32', itemNo: '32', name: 'Thinwall 1000ml', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 2000, yieldQty: 1, costPerUnit: 1580, unit: 'pcs', quantity: 200, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_33', itemNo: '33', name: 'Thinwall 1500ml', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 3200, yieldQty: 1, costPerUnit: 2600, unit: 'pcs', quantity: 150, minStock: 30, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_34', itemNo: '34', name: 'Thinwall 650ml', category: 'Packaging & Kemasan', purchaseUnit: '1 pcs', purchasePrice: 1800, yieldQty: 1, costPerUnit: 1380, unit: 'pcs', quantity: 200, minStock: 50, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_41', itemNo: '41', name: 'Sticker Logo Dahayu Besar', category: 'Packaging & Kemasan', purchaseUnit: '1 lembar', purchasePrice: 300, yieldQty: 1, costPerUnit: 226, unit: 'pcs', quantity: 500, minStock: 100, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_42', itemNo: '42', name: 'Sticker Logo Dahayu Kecil', category: 'Packaging & Kemasan', purchaseUnit: '1 lembar', purchasePrice: 120, yieldQty: 1, costPerUnit: 80, unit: 'pcs', quantity: 800, minStock: 200, status: 'Aman', location: 'Gudang Utama' },
  { id: 'ing_pack_47', itemNo: '47', name: 'Kresek Merah Putra', category: 'Packaging & Kemasan', purchaseUnit: '1 pak', purchasePrice: 23000, yieldQty: 100, costPerUnit: 230, unit: 'lbr', quantity: 200, minStock: 50, status: 'Aman', location: 'Gudang Utama', itemType: 'RAW' },
  { id: 'ing_pack_54', itemNo: '54', name: 'Plastik Sambal Klip', category: 'Packaging & Kemasan', purchaseUnit: '1 pak', purchasePrice: 2000, yieldQty: 100, costPerUnit: 20, unit: 'lbr', quantity: 1000, minStock: 200, status: 'Aman', location: 'Gudang Utama', itemType: 'RAW' },

  // G. BAHAN BAKU MATANG / OLAHAN SIAP PAKAI (PREPARED / COOKED)
  {
    id: 'ing_prep_ayam_ungkep',
    itemNo: 'M-1',
    name: 'Ayam Ungkep Bumbu Kuning',
    category: 'Lauk Utama',
    itemType: 'PREPARED',
    unit: 'ptg',
    quantity: 30,
    minStock: 10,
    costPerUnit: 7000,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Ungkep 45 menit dengan api sedang. Siap digoreng atau dibakar.',
    shelfLifeDays: 3,
    prepRecipe: [
      { rawIngredientId: 'ing_lk_1', rawIngredientName: 'Ayam Boiler', amountRequired: 1, unit: 'ptg', unitCost: 5714 }
    ]
  },
  {
    id: 'ing_prep_ayam_goreng',
    itemNo: 'M-2',
    name: 'Ayam Goreng Lengkuas',
    category: 'Lauk Utama',
    itemType: 'PREPARED',
    unit: 'ptg',
    quantity: 20,
    minStock: 8,
    costPerUnit: 8500,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Digoreng garing kecokelatan dengan kremesan lengkuas.',
    shelfLifeDays: 1,
    prepRecipe: [
      { rawIngredientId: 'ing_prep_ayam_ungkep', rawIngredientName: 'Ayam Ungkep Bumbu Kuning', amountRequired: 1, unit: 'ptg', unitCost: 7000 }
    ]
  },
  {
    id: 'ing_prep_rendang',
    itemNo: 'M-3',
    name: 'Rendang Sapi Matang',
    category: 'Lauk Utama',
    itemType: 'PREPARED',
    unit: 'pcs',
    quantity: 25,
    minStock: 10,
    costPerUnit: 11000,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Dimasak perlahan 4 jam hingga bumbu meresap dan minyak kelapa keluar.',
    shelfLifeDays: 5,
    prepRecipe: [
      { rawIngredientId: 'ing_lk_5', rawIngredientName: 'Daging Sapi', amountRequired: 1, unit: 'pcs', unitCost: 7500 }
    ]
  },
  {
    id: 'ing_prep_tahu_goreng',
    itemNo: 'M-4',
    name: 'Tahu Goreng Matang',
    category: 'Lauk Pendamping',
    itemType: 'PREPARED',
    unit: 'pcs',
    quantity: 35,
    minStock: 15,
    costPerUnit: 1200,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Tahu kuning/putih digoreng garing di luar lembut di dalam.',
    shelfLifeDays: 1,
    prepRecipe: []
  },
  {
    id: 'ing_prep_tempe_goreng',
    itemNo: 'M-5',
    name: 'Tempe Goreng / Bacem Matang',
    category: 'Lauk Pendamping',
    itemType: 'PREPARED',
    unit: 'pcs',
    quantity: 35,
    minStock: 15,
    costPerUnit: 1200,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Tempe bacem gurih manis siap saji.',
    shelfLifeDays: 2,
    prepRecipe: []
  },
  {
    id: 'ing_prep_nasi_putih',
    itemNo: 'M-6',
    name: 'Nasi Putih Matang (Pulen)',
    category: 'Bahan Pokok',
    itemType: 'PREPARED',
    unit: 'porsi',
    quantity: 45,
    minStock: 20,
    costPerUnit: 1800,
    status: 'Aman',
    location: 'Dapur Aktif',
    cookingNotes: 'Nasi dikukus dandang tradisional harum pandan.',
    shelfLifeDays: 1,
    prepRecipe: [
      { rawIngredientId: 'ing_pokok_1', rawIngredientName: 'Beras', amountRequired: 1, unit: 'porsi', unitCost: 1500 }
    ]
  }
];

/**
 * Pembersihan angka dari teks mata uang (contoh: "Rp40.000" -> 40000)
 */
export const parseCleanNumber = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  // Tangani format Rp16.500 atau 16.500,00 atau 40000
  const clean = str.replace(/[^0-9,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
};

/**
 * Normalisasi nama kategori dari spreadsheet
 */
export const normalizeCategory = (
  rawCat: string, 
  currentCategory: string = 'Bahan Pokok',
  knownCategories?: string[]
): string => {
  const upper = (rawCat || '').toUpperCase().trim();
  
  // 1. Cek kecocokan dengan kategori custom pengguna jika ada
  if (knownCategories && knownCategories.length > 0) {
    const matched = knownCategories.find(k => {
      const kUpper = k.toUpperCase().trim();
      return upper === kUpper || upper.includes(kUpper) || kUpper.includes(upper);
    });
    if (matched) return matched;
  }

  // 2. Kategori bawaan standar
  if (upper.includes('POKOK')) return 'Bahan Pokok';
  if (upper.includes('UTAMA') || upper.includes('LK UTAMA') || upper.includes('LAUK UTAMA')) return 'Lauk Utama';
  if (upper.includes('PENDAMPING') || upper.includes('LK PENDAMPING')) return 'Lauk Pendamping';
  if (upper.includes('SAYUR') || upper.includes('REBUSAN')) return 'Sayuran & Rebusan';
  if (upper.includes('BUMBU') || upper.includes('REMPAH')) return 'Bumbu Dapur';
  if (upper.includes('PACKAGING') || upper.includes('KEMASAN') || upper.includes('BOX') || upper.includes('DUS')) return 'Packaging & Kemasan';

  // 3. Jika kategori baru dari spreadsheet (misal: "G.,MINUMAN & BUAH" atau "F. SNACK BOX")
  // Bersihkan prefix huruf/angka A., B., 1., dst
  const cleaned = rawCat.replace(/^[A-Z0-9\.\-\s]+(?=[A-Za-z])/i, '').trim();
  if (cleaned.length >= 3) {
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return currentCategory || 'Bahan Pokok';
};

/**
 * Parser file CSV format Master Bahan Baku Spreadsheet Katering
 */
export const parseMasterIngredientsCsv = (
  csvContent: string,
  knownCategories?: string[]
): { 
  success: boolean; 
  data: IngredientStock[]; 
  errors: string[];
  stats: { total: number; categories: Record<string, number> };
  detectedCategories: string[];
} => {
  const errors: string[] = [];
  const parsedItems: IngredientStock[] = [];
  const categoriesCount: Record<string, number> = {};
  const detectedCategoriesSet = new Set<string>();

  if (!csvContent || !csvContent.trim()) {
    return { success: false, data: [], errors: ['File kosong tidak ada data'], stats: { total: 0, categories: {} }, detectedCategories: [] };
  }

  // Pisahkan baris
  const rawLines = csvContent.split(/\r?\n/);
  let currentCategory = 'Bahan Pokok';

  // Helper pisahkan kolom CSV dengan tanda petik
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        values.push(currentVal.trim());
      }
    }
    values.push(currentVal.trim());
    return values;
  };

  rawLines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Bersihkan header judul seperti ",,,MASTER BAHAN BAKU,,..."
    if (trimmedLine.toUpperCase().includes('MASTER BAHAN BAKU')) return;

    const cols = parseCsvLine(trimmedLine);
    if (cols.length < 3) return;

    // Cek apakah baris ini header kolom tabel ("KATEGORI, NO, Nama Bahan...")
    const rowText = cols.join(' ').toUpperCase();
    if (rowText.includes('NAMA BAHAN') && (rowText.includes('HARGA BELI') || rowText.includes('HARGA SATUAN'))) {
      return;
    }

    // Deteksi Kategori dari kolom 0 atau kolom 1 (contoh: "A.,BAHAN POKOK" atau "B.,BAHAN BAKU LK UTAMA")
    const col0 = cols[0]?.trim() || '';
    const col1 = cols[1]?.trim() || '';

    if (col0.length > 0 && col1.length > 0 && (col0.includes('.') || col0.length <= 3)) {
      currentCategory = normalizeCategory(col1, currentCategory, knownCategories);
      detectedCategoriesSet.add(currentCategory);
    } else if (col1.length > 0 && (col1.includes('BAHAN') || col1.includes('BUMBU') || col1.includes('PACKAGING') || col1.includes('REBUSAN') || col1.length >= 4)) {
      currentCategory = normalizeCategory(col1, currentCategory, knownCategories);
      detectedCategoriesSet.add(currentCategory);
    }

    // Identifikasi kolom nama bahan
    let itemNo = '';
    let itemName = '';
    let purchaseUnit = '';
    let purchasePrice = 0;
    let yieldQty = 1;
    let unitCost = 0;
    let recipeUnit = 'unit';

    let nameIdx = -1;
    for (let c = 2; c <= 4; c++) {
      if (cols[c] && cols[c].length > 1 && isNaN(Number(cols[c].replace(/[^0-9]/g, '')))) {
        nameIdx = c;
        break;
      }
    }

    if (nameIdx === -1) {
      if (cols[3] && cols[3].trim()) {
        nameIdx = 3;
      } else if (cols[2] && cols[2].trim()) {
        nameIdx = 2;
      }
    }

    if (nameIdx !== -1 && cols[nameIdx]) {
      itemName = cols[nameIdx].trim();
      itemNo = cols[nameIdx - 1]?.trim() || `${parsedItems.length + 1}`;

      // Satuan Beli & Qty Beli
      const buyQty = cols[nameIdx + 1]?.trim() || '';
      const buyUnit = cols[nameIdx + 2]?.trim() || '';
      purchaseUnit = [buyQty, buyUnit].filter(Boolean).join(' ');

      // Harga Beli
      const priceStr = cols[nameIdx + 3]?.trim() || '';
      purchasePrice = parseCleanNumber(priceStr);

      // Isi / Porsi / Yield
      const yieldStr = cols[nameIdx + 4]?.trim() || '';
      const parsedYield = parseCleanNumber(yieldStr);
      yieldQty = parsedYield > 0 ? parsedYield : 1;

      // Harga Satuan
      const unitCostStr = cols[nameIdx + 5]?.trim() || '';
      unitCost = parseCleanNumber(unitCostStr);

      // Satuan Pakai / Resep
      recipeUnit = cols[nameIdx + 6]?.trim() || cols[nameIdx + 2]?.trim() || 'unit';
      if (recipeUnit.toUpperCase() === 'UNIT' || recipeUnit === '') {
        recipeUnit = buyUnit || 'porsi';
      }

      // Hitung otomatis jika harga satuan belum ada tapi ada harga beli & isi
      if (unitCost <= 0 && purchasePrice > 0 && yieldQty > 0) {
        unitCost = Math.round(purchasePrice / yieldQty);
      }

      if (isNaN(unitCost)) unitCost = 0;

      // Validasi nama bahan bukan header kosong
      if (itemName && !itemName.toUpperCase().includes('NAMA BAHAN') && itemName.length >= 2) {
        const capitalizedName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
        const itemCategory = currentCategory;
        detectedCategoriesSet.add(itemCategory);

        const newStockItem: IngredientStock = {
          id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          itemNo: itemNo || String(parsedItems.length + 1),
          name: capitalizedName,
          category: itemCategory,
          quantity: yieldQty > 1 ? yieldQty * 2 : 50,
          unit: recipeUnit.toLowerCase(),
          minStock: Math.max(5, Math.round(yieldQty * 0.5)),
          costPerUnit: unitCost,
          purchaseUnit: purchaseUnit || '1 unit',
          purchasePrice: purchasePrice,
          yieldQty: yieldQty,
          status: 'Aman',
          location: itemCategory === 'Packaging & Kemasan' ? 'Gudang Utama' : 'Dapur Aktif'
        };

        parsedItems.push(newStockItem);
        categoriesCount[itemCategory] = (categoriesCount[itemCategory] || 0) + 1;
      }
    }
  });

  return {
    success: parsedItems.length > 0,
    data: parsedItems,
    errors,
    stats: {
      total: parsedItems.length,
      categories: categoriesCount
    },
    detectedCategories: Array.from(detectedCategoriesSet)
  };
};

/**
 * Buat string CSV Template yang persis dengan format master user
 * Mengikuti susunan kategori dinamis yang aktif saat ini.
 */
export const generateMasterTemplateCsv = (
  items?: IngredientStock[],
  activeCategories?: string[]
): string => {
  const headers = [
    ',,,MASTER BAHAN BAKU DAN HPP KATERING,,,,,',
    ',KATEGORI,NO,Nama Bahan,Satuan Beli,Satuan,Harga Beli,isi,harga satuan,satuan resep'
  ];

  const sourceItems = items && items.length > 0 ? items : DEFAULT_MASTER_INGREDIENTS;
  
  // Gabungkan kategori dari parameter aktif dan item yang ada
  const categoryOrder: string[] = [];
  if (activeCategories && activeCategories.length > 0) {
    activeCategories.forEach(c => {
      if (!categoryOrder.includes(c)) categoryOrder.push(c);
    });
  }
  sourceItems.forEach(i => {
    const c = i.category || 'Bahan Pokok';
    if (!categoryOrder.includes(c)) categoryOrder.push(c);
  });

  const rows: string[] = [];

  categoryOrder.forEach((cat, catIdx) => {
    const letter = String.fromCharCode(65 + catIdx); // A, B, C, D...
    const catItems = sourceItems.filter(i => (i.category || 'Bahan Pokok') === cat);

    rows.push(`${letter}.,${cat.toUpperCase()},,,,,,,,`);

    if (catItems.length > 0) {
      catItems.forEach((item, idx) => {
        const no = item.itemNo || idx + 1;
        const cleanName = `"${(item.name || '').replace(/"/g, '""')}"`;
        const pUnit = item.purchaseUnit || '1000 gr';
        const pPrice = `Rp${(item.purchasePrice || (item.costPerUnit || 0) * (item.yieldQty || 1)).toLocaleString('id-ID')}`;
        const yieldVal = item.yieldQty || 1;
        const unitCost = `Rp${(item.costPerUnit || 0).toLocaleString('id-ID')}`;
        const recUnit = item.unit || 'porsi';

        rows.push(`,,${no},${cleanName},${pUnit},,${pPrice},${yieldVal},${unitCost},${recUnit}`);
      });
    } else {
      // Jika kategori baru belum punya bahan baku, berikan 1 baris contoh placeholder
      rows.push(`,,1,"Contoh Bahan Baru",1000 gr,,Rp20.000,10,Rp2.000,porsi`);
    }

    rows.push(',,,,,,,,,'); // baris kosong pemisah antar kategori
  });

  return [...headers, ...rows].join('\r\n');
};

/**
 * Trigger file download di browser
 */
export const downloadCsvFile = (fileName: string, csvContent: string): void => {
  // Tambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel otomatis membaca karakter aksen dan format rupiah tanpa rusak
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
