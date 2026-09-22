import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { CloudConfig, FirebaseCredentials, StoreSettings } from '../types';
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
} from './initialData';

const STORAGE_PREFIX = 'caterly_data_';

let firestoreInstance: Firestore | null = null;
let currentApp: FirebaseApp | null = null;
let currentProjectId: string | null = null;

/**
 * Inisialisasi Firebase instance secara dinamis menggunakan konfigurasi milik pengguna.
 */
export const getOrInitFirestore = (creds?: FirebaseCredentials): Firestore | null => {
  if (!creds || !creds.projectId || !creds.apiKey) {
    return null;
  }

  // Jika sudah ada instance dengan project ID yang sama, gunakan kembali
  if (firestoreInstance && currentProjectId === creds.projectId) {
    return firestoreInstance;
  }

  try {
    const appName = `caterly_user_${creds.projectId}`;
    const existingApps = getApps();
    const found = existingApps.find(a => a.name === appName);

    if (found) {
      currentApp = found;
    } else {
      currentApp = initializeApp(
        {
          apiKey: creds.apiKey,
          authDomain: creds.authDomain || `${creds.projectId}.firebaseapp.com`,
          projectId: creds.projectId,
          storageBucket: creds.storageBucket || `${creds.projectId}.appspot.com`,
          messagingSenderId: creds.messagingSenderId,
          appId: creds.appId
        },
        appName
      );
    }

    firestoreInstance = getFirestore(currentApp);
    currentProjectId = creds.projectId;
    return firestoreInstance;
  } catch (err: any) {
    console.error('[Firebase Init Error]', err.message);
    return null;
  }
};

/**
 * Uji koneksi ke Firebase Firestore pengguna dengan membaca/menulis token uji coba kecil.
 */
export const testFirebaseConnection = async (creds: FirebaseCredentials): Promise<{ success: boolean; message: string }> => {
  try {
    const db = getOrInitFirestore(creds);
    if (!db) {
      return { success: false, message: 'Gagal inisialisasi Firebase. Pastikan Project ID & API Key valid.' };
    }

    const testDocRef = doc(db, 'caterly_data', '_ping_connection');
    await setDoc(testDocRef, {
      pingTime: new Date().toISOString(),
      appName: 'Caterly Smart OS',
      status: 'active'
    });

    const verifySnap = await getDoc(testDocRef);
    if (verifySnap.exists()) {
      return { 
        success: true, 
        message: `Koneksi Berhasil! Database Firebase Firestore terhubung ke proyek "${creds.projectId}".` 
      };
    } else {
      return { success: false, message: 'Dokumen tes tidak dapat dibaca kembali.' };
    }
  } catch (err: any) {
    console.error('[Test Connection Error]', err);
    let msg = err.message || 'Terjadi kesalahan saat menghubungi Firebase.';
    if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
      msg = 'Izin ditolak (Permission Denied). Buka Firebase Console > Firestore Database > Rules, lalu ubah aturan agar mengizinkan read/write (misal: "allow read, write: if true;").';
    } else if (msg.includes('not-found')) {
      msg = 'Database Firestore belum dibuat. Buka Firebase Console > Buat Database Firestore di mode test.';
    }
    return { success: false, message: msg };
  }
};

/**
 * Simpan data kunci tertentu ke penyimpanan lokal dan Cloud jika diaktifkan.
 */
export const saveCaterlyData = async (
  key: string,
  data: any,
  cloudConfig?: CloudConfig
): Promise<void> => {
  // 1. Selalu simpan di LocalStorage untuk respon secepat kilat & cadangan offline
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('[LocalStorage Save Error]', e);
  }

  // 2. Jika Cloud Firebase aktif, kirim juga ke Firestore
  if (cloudConfig?.enabled && cloudConfig.firebase) {
    try {
      const db = getOrInitFirestore(cloudConfig.firebase);
      if (db) {
        const docRef = doc(db, 'caterly_data', key);
        await setDoc(docRef, {
          payload: data,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn(`[Cloud Save Warning for ${key}]`, err.message);
    }
  }
};

/**
 * Muat data dari penyimpanan (prioritas Cloud jika aktif, fallback ke LocalStorage, lalu data awal).
 */
export const loadCaterlyData = async <T>(
  key: string,
  defaultVal: T,
  cloudConfig?: CloudConfig
): Promise<T> => {
  // 1. Jika Cloud Firebase diaktifkan, coba muat dari Cloud dulu
  if (cloudConfig?.enabled && cloudConfig.firebase) {
    try {
      const db = getOrInitFirestore(cloudConfig.firebase);
      if (db) {
        const docRef = doc(db, 'caterly_data', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudVal = docSnap.data()?.payload;
          if (cloudVal !== undefined) {
            // Update cache lokal
            try {
              localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cloudVal));
            } catch (e) {}
            return cloudVal as T;
          }
        }
      }
    } catch (err) {
      console.warn(`[Cloud Load Warning for ${key}, falling back to local]`, err);
    }
  }

  // 2. Baca dari LocalStorage
  try {
    const localStr = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (localStr) {
      return JSON.parse(localStr) as T;
    }
  } catch (e) {
    console.warn(`[LocalStorage Read Error for ${key}]`, e);
  }

  // 3. Gunakan data awal
  return defaultVal;
};

/**
 * Memuat semua modul data sekaligus saat inisialisasi aplikasi.
 */
export const loadAllCaterlyData = async (): Promise<{
  menu: typeof INITIAL_MENU;
  categories: typeof INITIAL_CATEGORIES;
  ingredientCategories: typeof INITIAL_INGREDIENT_CATEGORIES;
  orders: typeof INITIAL_ORDERS;
  inventory: typeof INITIAL_INVENTORY;
  mutations: typeof INITIAL_MUTATIONS;
  expenses: typeof INITIAL_EXPENSES;
  settings: typeof INITIAL_SETTINGS;
  admins: typeof INITIAL_ADMINS;
  shifts: typeof INITIAL_SHIFTS;
}> => {
  // Muat settings terlebih dahulu untuk mengetahui konfigurasi cloud pengguna
  let savedSettings: StoreSettings = INITIAL_SETTINGS;
  try {
    const rawSettings = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (rawSettings) {
      savedSettings = { ...INITIAL_SETTINGS, ...JSON.parse(rawSettings) };
    }
  } catch (e) {}

  const cloudCfg = savedSettings.cloudConfig;

  const [menu, categories, ingredientCategories, orders, inventory, mutations, expenses, settings, admins, shifts] = await Promise.all([
    loadCaterlyData('menu', INITIAL_MENU, cloudCfg),
    loadCaterlyData('categories', INITIAL_CATEGORIES, cloudCfg),
    loadCaterlyData('ingredientCategories', INITIAL_INGREDIENT_CATEGORIES, cloudCfg),
    loadCaterlyData('orders', INITIAL_ORDERS, cloudCfg),
    loadCaterlyData('inventory', INITIAL_INVENTORY, cloudCfg),
    loadCaterlyData('mutations', INITIAL_MUTATIONS, cloudCfg),
    loadCaterlyData('expenses', INITIAL_EXPENSES, cloudCfg),
    loadCaterlyData('settings', savedSettings, cloudCfg),
    loadCaterlyData('admins', INITIAL_ADMINS, cloudCfg),
    loadCaterlyData('shifts', INITIAL_SHIFTS, cloudCfg)
  ]);

  return { menu, categories, ingredientCategories, orders, inventory, mutations, expenses, settings, admins, shifts };
};

/**
 * Sinkronkan seluruh data lokal yang ada saat ini ke Firebase Cloud milik pengguna.
 */
export const syncAllLocalToCloud = async (
  creds: FirebaseCredentials,
  allData: {
    menu: any;
    categories: any;
    ingredientCategories?: any;
    orders: any;
    inventory: any;
    expenses: any;
    settings: any;
    admins: any;
    shifts: any;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const db = getOrInitFirestore(creds);
    if (!db) {
      return { success: false, message: 'Firebase belum terkonfigurasi dengan benar.' };
    }

    const timestamp = new Date().toISOString();
    const tasks = Object.entries(allData).map(([key, value]) => {
      const docRef = doc(db, 'caterly_data', key);
      return setDoc(docRef, { payload: value, lastUpdated: timestamp });
    });

    await Promise.all(tasks);

    return {
      success: true,
      message: `Berhasil! Semua data (Menu, Pesanan, Stok, Pengeluaran) telah disinkronkan ke Firestore (${creds.projectId}).`
    };
  } catch (err: any) {
    console.error('[Sync All to Cloud Error]', err);
    return { success: false, message: err.message || 'Gagal sinkronisasi data ke cloud.' };
  }
};

/**
 * Tarik seluruh data dari Firebase Cloud milik pengguna ke lokal.
 */
export const importAllCloudToLocal = async (
  creds: FirebaseCredentials
): Promise<{ success: boolean; data?: any; message: string }> => {
  try {
    const db = getOrInitFirestore(creds);
    if (!db) {
      return { success: false, message: 'Firebase belum terkonfigurasi.' };
    }

    const keys = ['menu', 'categories', 'orders', 'inventory', 'expenses', 'settings', 'admins', 'shifts'];
    const resultData: Record<string, any> = {};

    await Promise.all(
      keys.map(async (key) => {
        const docRef = doc(db, 'caterly_data', key);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.payload !== undefined) {
          resultData[key] = snap.data().payload;
          localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(resultData[key]));
        }
      })
    );

    return {
      success: true,
      data: resultData,
      message: 'Berhasil mengunduh data terbaru dari Firebase Cloud.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengambil data dari cloud.' };
  }
};

/**
 * Ekspor seluruh data aplikasi ke file cadangan .JSON
 */
export const exportBackupJSON = (allData: Record<string, any>) => {
  const exportPayload = {
    app: 'Caterly Smart OS',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: allData
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `caterly-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parsing dan validasi file cadangan .JSON yang diunggah
 */
export const parseBackupJSON = async (file: File): Promise<Record<string, any>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.data && typeof parsed.data === 'object') {
          resolve(parsed.data);
        } else if (typeof parsed === 'object') {
          resolve(parsed);
        } else {
          reject(new Error('Format file cadangan tidak valid'));
        }
      } catch (err) {
        reject(new Error('File bukan JSON yang valid'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
};

/**
 * Meminta browser untuk mengunci penyimpanan (Persistent Storage API)
 * agar data LocalStorage / cache aplikasi katering aman dan tidak dihapus otomatis oleh browser.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[Caterly Storage] Persistent storage aktif:', isPersisted);
      return isPersisted;
    } catch (e) {
      console.warn('[Caterly Storage] Gagal meminta persistent storage:', e);
      return false;
    }
  }
  return false;
};

