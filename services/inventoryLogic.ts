import { MenuItem, Order, IngredientStock, StockMutation } from '../types';

/**
 * Ekstraksi nama menu dan jumlah porsi dari string item di pesanan.
 * Contoh format: "Nasi Kotak Ayam Bakar Madu (75 porsi)" atau "Paket Buffet Pernikahan Royal (150 porsi)"
 */
export function parseOrderItem(itemStr: string, menuList: MenuItem[]): { menuItem: MenuItem | null; qty: number } {
  // Cek apakah ada format "(X porsi)" atau "(X)"
  const match = itemStr.match(/^(.*?)(?:\s*\((?:(\d+)(?:\s*porsi|\s*box|\s*pcs)?)\))?$/i);
  const rawName = match ? match[1].trim() : itemStr.trim();
  const qty = match && match[2] ? parseInt(match[2], 10) : 1;

  // Cari di menu berdasarkan kecocokan nama
  const found = menuList.find(m => 
    m.name.toLowerCase() === rawName.toLowerCase() ||
    rawName.toLowerCase().includes(m.name.toLowerCase()) ||
    m.name.toLowerCase().includes(rawName.toLowerCase())
  );

  return { menuItem: found || null, qty: isNaN(qty) ? 1 : qty };
}

/**
 * Hitung kebutuhan bahan baku (Bill of Materials) untuk satu pesanan katering
 */
export function calculateOrderBOMRequirements(order: Order, menuList: MenuItem[]): Array<{
  ingredientId: string;
  name: string;
  amountRequired: number;
  unit: string;
}> {
  const result: { [ingId: string]: { name: string; amount: number; unit: string } } = {};

  order.items.forEach(itemStr => {
    const { menuItem, qty } = parseOrderItem(itemStr, menuList);
    if (menuItem && menuItem.recipe) {
      menuItem.recipe.forEach(ing => {
        const totalIngNeeded = (ing.amountPerUnit || 0) * qty;
        if (!result[ing.ingredientId]) {
          result[ing.ingredientId] = {
            name: ing.name,
            amount: 0,
            unit: ing.unit
          };
        }
        result[ing.ingredientId].amount += totalIngNeeded;
      });
    }
  });

  return Object.entries(result).map(([ingredientId, data]) => ({
    ingredientId,
    name: data.name,
    amountRequired: Math.round(data.amount * 100) / 100,
    unit: data.unit
  }));
}

/**
 * Menghitung rincian bahan mentah yang diperlukan untuk memasak/mengolah bahan matang
 */
export function calculateCookingRequirements(
  preparedItem: IngredientStock,
  cookQty: number,
  currentInventory: IngredientStock[]
): {
  requirements: Array<{
    rawIngredientId: string;
    rawIngredientName: string;
    amountNeeded: number;
    unit: string;
    currentStock: number;
    isSufficient: boolean;
    deficit: number;
    unitCost: number;
    subtotalCost: number;
  }>;
  totalProductionCost: number;
  costPerUnit: number;
  allSufficient: boolean;
} {
  const recipe = preparedItem.prepRecipe || [];
  let totalProductionCost = 0;
  let allSufficient = true;

  const requirements = recipe.map(item => {
    const rawInv = currentInventory.find(i => i.id === item.rawIngredientId || i.name.toLowerCase() === item.rawIngredientName.toLowerCase());
    const amountNeeded = Math.round((item.amountRequired * cookQty) * 100) / 100;
    const currentStock = rawInv ? rawInv.quantity : 0;
    const isSufficient = currentStock >= amountNeeded;
    if (!isSufficient) allSufficient = false;

    const unitCost = item.unitCost ?? (rawInv?.costPerUnit || 0);
    const subtotalCost = Math.round(amountNeeded * unitCost);
    totalProductionCost += subtotalCost;

    return {
      rawIngredientId: item.rawIngredientId,
      rawIngredientName: item.rawIngredientName,
      amountNeeded,
      unit: item.unit,
      currentStock,
      isSufficient,
      deficit: isSufficient ? 0 : Math.round((amountNeeded - currentStock) * 100) / 100,
      unitCost,
      subtotalCost
    };
  });

  const costPerUnit = cookQty > 0 ? Math.round(totalProductionCost / cookQty) : (preparedItem.costPerUnit || 0);

  return {
    requirements,
    totalProductionCost,
    costPerUnit,
    allSufficient
  };
}

/**
 * Eksekusi Masak Dapur / Konversi Bahan Mentah menjadi Bahan Matang Siap Pakai (Kitchen Batch Cooking)
 * - Mengurangi stok bahan mentah (mutasi COOK_CONSUME)
 * - Menambah stok bahan matang (mutasi COOK_PRODUCE)
 * - Memperbarui HPP bahan matang sesuai bahan mentah yang dipakai
 */
export function executeKitchenBatchCooking(
  preparedItem: IngredientStock,
  cookQty: number,
  currentInventory: IngredientStock[],
  performedBy: string = 'Chef Dapur'
): {
  updatedInventory: IngredientStock[];
  mutations: StockMutation[];
  success: boolean;
  message: string;
  consumedDetails: string[];
} {
  if (cookQty <= 0) {
    return {
      updatedInventory: currentInventory,
      mutations: [],
      success: false,
      message: 'Jumlah porsi yang dimasak harus lebih dari 0.',
      consumedDetails: []
    };
  }

  const { requirements, costPerUnit } = calculateCookingRequirements(preparedItem, cookQty, currentInventory);
  const dateToday = new Date().toISOString().split('T')[0];
  const mutations: StockMutation[] = [];
  const consumedDetails: string[] = [];
  let updatedInventory = [...currentInventory];

  // 1. Potong stok bahan mentah
  requirements.forEach(req => {
    const rawIdx = updatedInventory.findIndex(i => i.id === req.rawIngredientId || i.name.toLowerCase() === req.rawIngredientName.toLowerCase());
    if (rawIdx > -1) {
      const raw = updatedInventory[rawIdx];
      const newRawQty = Math.max(0, Math.round((raw.quantity - req.amountNeeded) * 100) / 100);
      const newStatus = newRawQty <= 0 ? 'Habis' : (newRawQty <= (raw.minStock || 10) ? 'Menipis' : 'Aman');

      updatedInventory[rawIdx] = {
        ...raw,
        quantity: newRawQty,
        status: newStatus
      };

      mutations.push({
        id: `MUT-COOK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        ingredientId: raw.id,
        ingredientName: raw.name,
        type: 'COOK_CONSUME',
        quantity: -req.amountNeeded,
        unit: req.unit,
        notes: `Digunakan memasak ${cookQty} ${preparedItem.unit} ${preparedItem.name}`,
        date: dateToday,
        referenceId: preparedItem.id,
        performedBy
      });

      consumedDetails.push(`${raw.name}: -${req.amountNeeded} ${req.unit} (Sisa: ${newRawQty} ${req.unit})`);
    }
  });

  // 2. Tambah stok bahan matang
  const prepIdx = updatedInventory.findIndex(i => i.id === preparedItem.id);
  if (prepIdx > -1) {
    const prep = updatedInventory[prepIdx];
    const newPrepQty = Math.round((prep.quantity + cookQty) * 100) / 100;
    const finalUnitCost = costPerUnit > 0 ? costPerUnit : (prep.costPerUnit || 0);

    updatedInventory[prepIdx] = {
      ...prep,
      quantity: newPrepQty,
      status: newPrepQty <= (prep.minStock || 10) ? 'Menipis' : 'Aman',
      costPerUnit: finalUnitCost,
      lastCookedDate: dateToday
    };

    mutations.push({
      id: `MUT-PROD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
      ingredientId: prep.id,
      ingredientName: prep.name,
      type: 'COOK_PRODUCE',
      quantity: cookQty,
      unit: prep.unit,
      notes: `Hasil masak dapur: +${cookQty} ${prep.unit} siap saji`,
      date: dateToday,
      referenceId: prep.id,
      performedBy,
      cost: finalUnitCost
    });
  }

  return {
    updatedInventory,
    mutations,
    success: true,
    message: `Berhasil mengolah ${cookQty} ${preparedItem.unit} ${preparedItem.name}. Stok matang siap digunakan!`,
    consumedDetails
  };
}

/**
 * Kurangi persediaan bahan baku secara otomatis saat pesanan dikonfirmasi / diproduksi (Mekari Jurnal Style)
 */
export function deductStockForOrder(
  order: Order,
  menuList: MenuItem[],
  currentInventory: IngredientStock[],
  performedBy: string = 'Sistem Otomatis (BOM)'
): {
  updatedInventory: IngredientStock[];
  mutations: StockMutation[];
  deductedCount: number;
  details: string[];
} {
  const requirements = calculateOrderBOMRequirements(order, menuList);
  if (requirements.length === 0) {
    return {
      updatedInventory: currentInventory,
      mutations: [],
      deductedCount: 0,
      details: ['Pesanan tidak memiliki resep BOM terdaftar di katalog menu.']
    };
  }

  const dateToday = new Date().toISOString().split('T')[0];
  const mutations: StockMutation[] = [];
  const details: string[] = [];
  let updatedInventory = [...currentInventory];

  requirements.forEach(req => {
    const index = updatedInventory.findIndex(i => i.id === req.ingredientId || i.name.toLowerCase() === req.name.toLowerCase());
    if (index > -1) {
      const current = updatedInventory[index];
      const newQty = Math.max(0, Math.round((current.quantity - req.amountRequired) * 100) / 100);
      const newStatus = newQty <= 0 ? 'Habis' : (newQty <= (current.minStock || 10) ? 'Menipis' : 'Aman');

      updatedInventory[index] = {
        ...current,
        quantity: newQty,
        status: newStatus
      };

      mutations.push({
        id: `MUT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        ingredientId: current.id,
        ingredientName: current.name,
        type: 'OUT_PRODUCTION',
        quantity: -req.amountRequired,
        unit: req.unit,
        notes: `Produksi Pesanan #${order.id} (${order.customerName})`,
        date: dateToday,
        referenceId: order.id,
        performedBy
      });

      details.push(`${current.name}: -${req.amountRequired} ${req.unit} (Sisa: ${newQty} ${req.unit})`);
    } else {
      // Jika bahan belum ada di master stok, buat mutasi catatan
      mutations.push({
        id: `MUT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        ingredientId: req.ingredientId,
        ingredientName: req.name,
        type: 'OUT_PRODUCTION',
        quantity: -req.amountRequired,
        unit: req.unit,
        notes: `Produksi Pesanan #${order.id} (${order.customerName}) - Belum ada di master fisik`,
        date: dateToday,
        referenceId: order.id,
        performedBy
      });
      details.push(`${req.name}: butuh ${req.amountRequired} ${req.unit} (Belum tercatat di master)`);
    }
  });

  return {
    updatedInventory,
    mutations,
    deductedCount: mutations.length,
    details
  };
}
