import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  Smartphone, 
  Monitor, 
  Truck, 
  Info,
  Calendar,
  Clock,
  MapPin,
  Building2,
  DollarSign,
  Star,
  Zap,
  Radio
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { 
  PrintPaperSize, 
  PrintReceiptData, 
  executePrint, 
  generateReceiptHtml,
  generateWhatsappReceiptText,
  openRawBtPrint
} from '../services/printService';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Bisa menerima dari Order (Daftar Pesanan)
  order?: Order | null;
  // Atau langsung dari transaksi kasir walk-in
  cashierData?: {
    receiptNo: string;
    items: { menuItem: { name: string; price: number }; qty: number }[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashReceived: number;
    change: number;
    timestamp: string;
    customerName?: string;
    customerPhone?: string;
  } | null;
  settings: StoreSettings;
  currentAdminName?: string;
  currentShift?: string;
  onNotify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  cashierData,
  settings,
  currentAdminName = 'Kasir',
  currentShift = 'Pagi',
  onNotify
}) => {
  const defaultSaved = (typeof window !== 'undefined' ? localStorage.getItem('caterly_default_printer_paper') as PrintPaperSize : null) || settings.defaultPrinterPaper || '80mm';
  const [paperFormat, setPaperFormat] = useState<PrintPaperSize>(defaultSaved);
  const [defaultFormat, setDefaultFormat] = useState<PrintPaperSize>(defaultSaved);
  const [docType, setDocType] = useState<'receipt' | 'surat-jalan'>('receipt');
  const [isCopied, setIsCopied] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(true);

  const handleSetDefaultFormat = (size: PrintPaperSize) => {
    localStorage.setItem('caterly_default_printer_paper', size);
    setDefaultFormat(size);
    onNotify?.(`Format ${size.toUpperCase()} disimpan sebagai printer default!`, 'success');
  };

  // Normalisasi data pesanan menjadi format print seragam
  const printData: PrintReceiptData | null = useMemo(() => {
    if (cashierData) {
      return {
        storeName: settings.storeName,
        storeAddress: settings.address,
        storePhone: settings.whatsappNumber,
        logoUrl: settings.logoUrl,
        receiptNo: cashierData.receiptNo,
        date: cashierData.timestamp.split(' ')[0] || new Date().toLocaleDateString('id-ID'),
        time: cashierData.timestamp.split(' ')[1] || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        customerName: cashierData.customerName || 'Pelanggan Walk-in',
        customerPhone: cashierData.customerPhone,
        cashierName: currentAdminName,
        shift: currentShift,
        items: cashierData.items.map(ci => ({
          name: ci.menuItem.name,
          qty: ci.qty,
          price: ci.menuItem.price,
          subtotal: ci.menuItem.price * ci.qty
        })),
        subtotal: cashierData.subtotal,
        discount: cashierData.discount,
        total: cashierData.total,
        amountPaid: cashierData.total,
        paymentStatus: 'Paid',
        paymentMethod: cashierData.paymentMethod,
        cashReceived: cashierData.cashReceived,
        change: cashierData.change,
        orderType: 'POS Kasir Walk-in',
        footerMessage: 'Terima kasih atas kunjungan Anda!'
      };
    }

    if (order) {
      // Parse items dari format string array `["Ayam Bakar x50", "Es Teh x50"]`
      const parsedItems = order.items.map(it => {
        const match = it.match(/^(.*?)\s*x\s*(\d+)$/i);
        if (match) {
          return {
            name: match[1].trim(),
            qty: parseInt(match[2], 10),
            notes: ''
          };
        }
        return {
          name: it,
          qty: 1,
          notes: ''
        };
      });

      return {
        storeName: settings.storeName,
        storeAddress: settings.address,
        storePhone: settings.whatsappNumber,
        logoUrl: settings.logoUrl,
        receiptNo: order.id,
        date: order.date,
        time: order.deliveryTime,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryMethod: order.deliveryMethod || 'Delivery',
        deliveryAddress: order.deliveryAddress,
        deliveryTime: order.deliveryTime,
        deliveryNotes: order.deliveryNotes,
        cashierName: order.recordedBy || currentAdminName,
        shift: order.shift || currentShift,
        items: parsedItems,
        subtotal: order.totalPrice,
        discount: 0,
        total: order.totalPrice,
        amountPaid: order.amountPaid,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentStatus === 'Paid' ? 'Lunas' : 'DP / Bertahap',
        orderType: order.type,
        footerMessage: 'Terima kasih telah memesan layanan katering kami!'
      };
    }

    return null;
  }, [cashierData, order, settings, currentAdminName, currentShift]);

  if (!isOpen || !printData) return null;

  const debt = Math.max(0, printData.total - (printData.amountPaid ?? printData.total));

  // Render HTML Konten Thermal 58mm
  const renderThermal58Html = () => `
    <div style="text-align: center; margin-bottom: 4px;">
      ${printData.logoUrl ? `<img src="${printData.logoUrl}" class="logo-img" alt="Logo" />` : ''}
      <div style="font-size: 13px; font-weight: bold; text-transform: uppercase;">${printData.storeName}</div>
      ${printData.storeAddress ? `<div style="font-size: 8px;">${printData.storeAddress}</div>` : ''}
      ${printData.storePhone ? `<div style="font-size: 8px;">WA: ${printData.storePhone}</div>` : ''}
    </div>
    <div class="divider"></div>
    <table class="thermal-table">
      <tr><td>No</td><td class="text-right font-bold">${printData.receiptNo}</td></tr>
      <tr><td>Tgl</td><td class="text-right">${printData.date} ${printData.time || ''}</td></tr>
      <tr><td>Kasir</td><td class="text-right">${printData.cashierName || '-'}</td></tr>
      <tr><td>Plg</td><td class="text-right font-bold">${printData.customerName}</td></tr>
      ${printData.deliveryAddress ? `<tr><td colspan="2" style="font-size: 8px;">Kirim: ${printData.deliveryAddress}</td></tr>` : ''}
    </table>
    <div class="divider-double"></div>
    <table class="thermal-table">
      ${printData.items.map(item => `
        <tr>
          <td colspan="2" class="font-bold">${item.name}</td>
        </tr>
        <tr>
          <td style="padding-left: 6px;">${item.qty}x ${item.price ? `@${item.price.toLocaleString('id-ID')}` : ''}</td>
          <td class="text-right font-bold">${item.subtotal ? `Rp ${item.subtotal.toLocaleString('id-ID')}` : `${item.qty} porsi`}</td>
        </tr>
      `).join('')}
    </table>
    <div class="divider"></div>
    <table class="thermal-table">
      <tr><td>Total:</td><td class="text-right font-bold">Rp ${printData.total.toLocaleString('id-ID')}</td></tr>
      ${printData.discount && printData.discount > 0 ? `<tr><td>Diskon:</td><td class="text-right">-Rp ${printData.discount.toLocaleString('id-ID')}</td></tr>` : ''}
      ${printData.amountPaid !== undefined ? `<tr><td>Bayar:</td><td class="text-right">Rp ${printData.amountPaid.toLocaleString('id-ID')}</td></tr>` : ''}
      ${debt > 0 ? `<tr><td class="font-bold" style="color: #000;">SISA DP:</td><td class="text-right font-bold">Rp ${debt.toLocaleString('id-ID')}</td></tr>` : ''}
      ${printData.change && printData.change > 0 ? `<tr><td>Kembali:</td><td class="text-right">Rp ${printData.change.toLocaleString('id-ID')}</td></tr>` : ''}
      ${printData.paymentMethod ? `<tr><td>Metode:</td><td class="text-right">${printData.paymentMethod.toUpperCase()}</td></tr>` : ''}
    </table>
    <div class="divider-double"></div>
    <div class="text-center" style="font-size: 9px; margin-top: 4px;">
      <div class="font-bold">${debt === 0 ? '*** LUNAS ***' : '*** BELUM LUNAS / DP ***'}</div>
      <div>${printData.footerMessage}</div>
      <div style="font-size: 8px; margin-top: 4px;">Caterly POS System</div>
    </div>
  `;

  // Render HTML Konten Thermal 80mm
  const renderThermal80Html = () => `
    <div style="text-align: center; margin-bottom: 6px;">
      ${printData.logoUrl ? `<img src="${printData.logoUrl}" class="logo-img" alt="Logo" />` : ''}
      <div style="font-size: 15px; font-weight: bold; text-transform: uppercase;">${printData.storeName}</div>
      ${printData.storeAddress ? `<div style="font-size: 10px; color: #333;">${printData.storeAddress}</div>` : ''}
      ${printData.storePhone ? `<div style="font-size: 10px;">Telp/WA: ${printData.storePhone}</div>` : ''}
    </div>
    <div class="divider"></div>
    <table class="thermal-table" style="font-size: 11px;">
      <tr>
        <td style="width: 50%;">No. Nota: <strong>${printData.receiptNo}</strong></td>
        <td class="text-right">Kasir: ${printData.cashierName || '-'} (${printData.shift || 'Pagi'})</td>
      </tr>
      <tr>
        <td>Tanggal: ${printData.date} ${printData.time ? `• ${printData.time} WIB` : ''}</td>
        <td class="text-right">Tipe: <strong>${printData.orderType || 'Katering'}</strong></td>
      </tr>
      <tr>
        <td colspan="2">Pelanggan: <strong>${printData.customerName}</strong> ${printData.customerPhone ? `(${printData.customerPhone})` : ''}</td>
      </tr>
      ${printData.deliveryAddress ? `
        <tr>
          <td colspan="2" style="font-size: 10px; padding-top: 2px;">
            Alamat Kirim: <strong>${printData.deliveryAddress}</strong>
            ${printData.deliveryNotes ? `<br/><em>Patokan: ${printData.deliveryNotes}</em>` : ''}
          </td>
        </tr>
      ` : ''}
    </table>
    <div class="divider-double"></div>
    <table class="thermal-table">
      <thead>
        <tr style="border-bottom: 1px dashed #000;">
          <th style="text-align: left; padding-bottom: 3px;">Menu / Item</th>
          <th style="text-align: center; width: 40px; padding-bottom: 3px;">Qty</th>
          <th style="text-align: right; width: 65px; padding-bottom: 3px;">Harga</th>
          <th style="text-align: right; width: 75px; padding-bottom: 3px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${printData.items.map(item => `
          <tr>
            <td style="font-weight: bold; padding-top: 3px;">${item.name}</td>
            <td class="text-center" style="padding-top: 3px;">${item.qty}</td>
            <td class="text-right" style="padding-top: 3px;">${item.price ? `Rp ${item.price.toLocaleString('id-ID')}` : '-'}</td>
            <td class="text-right font-bold" style="padding-top: 3px;">${item.subtotal ? `Rp ${item.subtotal.toLocaleString('id-ID')}` : `${item.qty} porsi`}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="divider"></div>
    <table class="thermal-table" style="font-size: 11px;">
      <tr>
        <td style="width: 55%;">Subtotal Pesanan:</td>
        <td class="text-right">Rp ${printData.subtotal.toLocaleString('id-ID')}</td>
      </tr>
      ${printData.discount && printData.discount > 0 ? `
        <tr>
          <td>Diskon / Potongan:</td>
          <td class="text-right">- Rp ${printData.discount.toLocaleString('id-ID')}</td>
        </tr>
      ` : ''}
      <tr style="font-size: 13px; font-weight: bold;">
        <td style="padding-top: 3px; border-top: 1px dashed #000;">TOTAL AKHIR:</td>
        <td class="text-right" style="padding-top: 3px; border-top: 1px dashed #000;">Rp ${printData.total.toLocaleString('id-ID')}</td>
      </tr>
      ${printData.amountPaid !== undefined ? `
        <tr>
          <td>Pembayaran Diterima:</td>
          <td class="text-right">Rp ${printData.amountPaid.toLocaleString('id-ID')}</td>
        </tr>
      ` : ''}
      ${debt > 0 ? `
        <tr style="font-size: 12px; font-weight: bold;">
          <td>SISA PIUTANG / PELUNASAN:</td>
          <td class="text-right">Rp ${debt.toLocaleString('id-ID')}</td>
        </tr>
      ` : `
        <tr>
          <td>Status Pembayaran:</td>
          <td class="text-right font-bold">[ LUNAS ]</td>
        </tr>
      `}
      ${printData.change && printData.change > 0 ? `
        <tr>
          <td>Kembalian Tunai:</td>
          <td class="text-right font-bold">Rp ${printData.change.toLocaleString('id-ID')}</td>
        </tr>
      ` : ''}
      ${printData.paymentMethod ? `
        <tr>
          <td>Metode Bayar:</td>
          <td class="text-right uppercase">${printData.paymentMethod}</td>
        </tr>
      ` : ''}
    </table>
    <div class="divider-double"></div>
    <div class="text-center" style="font-size: 10px; margin-top: 6px; line-height: 1.4;">
      <div class="font-bold">${printData.footerMessage}</div>
      <div>Simpan struk ini sebagai bukti transaksi resmi katering.</div>
      <div style="font-size: 8px; margin-top: 5px; color: #555;">Dicetak otomatis oleh Caterly Smart OS</div>
    </div>
  `;

  // Render HTML Konten Dokumen Resmi A4
  const renderA4Html = () => `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        ${printData.logoUrl ? `<img src="${printData.logoUrl}" class="logo-img" style="margin-bottom: 6px;" alt="Logo" />` : ''}
        <h1 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a;">${printData.storeName}</h1>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">${printData.storeAddress || 'Layanan Katering & Kuliner Berkualitas'}</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Kontak Resmi / WhatsApp: <strong>${printData.storePhone || '-'}</strong></p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">
          ${docType === 'surat-jalan' ? 'SURAT JALAN' : 'INVOICE RESMI'}
        </div>
        <div style="font-size: 12px; font-weight: bold; color: #475569;">No: ${printData.receiptNo}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Tanggal: ${printData.date} ${printData.time ? `(${printData.time} WIB)` : ''}</div>
        <div style="display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase; ${debt === 0 ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' : 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'}">
          ${debt === 0 ? 'STATUS: LUNAS' : `STATUS: DP (SISA Rp ${debt.toLocaleString('id-ID')})`}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 11px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <div style="font-weight: bold; text-transform: uppercase; color: #64748b; font-size: 10px; margin-bottom: 4px;">Informasi Pemesan:</div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${printData.customerName}</div>
        ${printData.customerPhone ? `<div>No. HP/WA: ${printData.customerPhone}</div>` : ''}
        <div>Kategori Acara: ${printData.orderType || 'Katering'}</div>
        <div>Petugas Admin: ${printData.cashierName || 'Admin Kasir'}</div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <div style="font-weight: bold; text-transform: uppercase; color: #64748b; font-size: 10px; margin-bottom: 4px;">Detail Pengantaran / Lokasi:</div>
        <div>Metode: <strong>${printData.deliveryMethod === 'Pickup' ? 'Ambil Sendiri di Dapur' : 'Pengantaran ke Lokasi'}</strong></div>
        ${printData.deliveryAddress ? `<div>Alamat: <strong>${printData.deliveryAddress}</strong></div>` : '<div>Alamat: Diambil di outlet</div>'}
        ${printData.deliveryNotes ? `<div>Catatan Khusus: <em>${printData.deliveryNotes}</em></div>` : ''}
        ${printData.deliveryTime ? `<div>Jadwal Kirim: <strong>${printData.deliveryTime} WIB</strong></div>` : ''}
      </div>
    </div>

    <table class="a4-table">
      <thead>
        <tr>
          <th style="text-align: center; width: 35px;">No</th>
          <th style="text-align: left;">Deskripsi Menu / Hidangan</th>
          <th style="text-align: center; width: 80px;">Kuantitas</th>
          <th style="text-align: right; width: 120px;">Harga Satuan</th>
          <th style="text-align: right; width: 130px;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${printData.items.map((it, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="font-bold">${it.name}</td>
            <td class="text-center">${it.qty} porsi</td>
            <td class="text-right">${it.price ? `Rp ${it.price.toLocaleString('id-ID')}` : '-'}</td>
            <td class="text-right font-bold">${it.subtotal ? `Rp ${it.subtotal.toLocaleString('id-ID')}` : `${it.qty} porsi`}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 16px;">
      <div style="width: 50%; font-size: 11px;">
        ${showBankInfo ? `
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 12px;">
            <div style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #475569; margin-bottom: 4px;">Informasi Pembayaran & Rekening:</div>
            <div>Pembayaran Transfer Bank / QRIS dapat dilakukan ke rekening resmi katering kami.</div>
            <div style="margin-top: 4px; font-weight: bold;">Konfirmasi bukti bayar ke WA: ${printData.storePhone || '-'}</div>
          </div>
        ` : ''}
        <div style="color: #64748b; font-size: 10px; line-height: 1.4;">
          * Pesanan yang sudah diproses tidak dapat dibatalkan secara sepihak tanpa konfirmasi dapur.<br/>
          * Terima kasih atas kepercayaan Anda telah menggunakan jasa katering kami.
        </div>
      </div>

      <div style="width: 42%;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 4px 0;">Subtotal:</td>
            <td class="text-right">Rp ${printData.subtotal.toLocaleString('id-ID')}</td>
          </tr>
          ${printData.discount && printData.discount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #b45309;">Potongan Diskon:</td>
              <td class="text-right" style="color: #b45309;">- Rp ${printData.discount.toLocaleString('id-ID')}</td>
            </tr>
          ` : ''}
          <tr style="border-top: 2px solid #0f172a; font-size: 14px; font-weight: 900;">
            <td style="padding: 6px 0;">TOTAL TAGIHAN:</td>
            <td class="text-right">Rp ${printData.total.toLocaleString('id-ID')}</td>
          </tr>
          ${printData.amountPaid !== undefined ? `
            <tr>
              <td style="padding: 4px 0;">Sudah Dibayar (DP/Tunai):</td>
              <td class="text-right" style="font-weight: bold; color: #166534;">Rp ${printData.amountPaid.toLocaleString('id-ID')}</td>
            </tr>
          ` : ''}
          ${debt > 0 ? `
            <tr style="font-weight: bold; color: #dc2626; font-size: 13px;">
              <td style="padding: 4px 0;">SISA YANG HARUS DILUNASI:</td>
              <td class="text-right">Rp ${debt.toLocaleString('id-ID')}</td>
            </tr>
          ` : `
            <tr style="font-weight: bold; color: #166534;">
              <td style="padding: 4px 0;">Status Pelunasan:</td>
              <td class="text-right">LUNAS SEPENUHNYA</td>
            </tr>
          `}
        </table>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; margin-top: 36px; font-size: 11px;">
      <div>
        <p style="margin: 0 0 50px 0; color: #64748b;">Penerima / Pemesan,</p>
        <p style="font-weight: bold; text-decoration: underline; margin: 0;">( ${printData.customerName} )</p>
      </div>
      <div>
        <p style="margin: 0 0 50px 0; color: #64748b;">Kurir / Pengantar,</p>
        <p style="font-weight: bold; text-decoration: underline; margin: 0;">( ................................ )</p>
      </div>
      <div>
        <p style="margin: 0 0 50px 0; color: #64748b;">Hormat Kami (Admin Katering),</p>
        <p style="font-weight: bold; text-decoration: underline; margin: 0;">( ${printData.cashierName || settings.storeName} )</p>
      </div>
    </div>
  `;

  // Trigger Print Iframe sesuai format yang dipilih pengguna
  const handlePrint = () => {
    const content = generateReceiptHtml(printData, paperFormat, {
      docType,
      showBankInfo,
      bankAccountInfo: settings.bankAccountInfo
    });

    executePrint(content, paperFormat);
    onNotify?.(`Mencetak format ${paperFormat.toUpperCase()} ke printer...`, 'info');
  };

  // Cetak langsung lewat aplikasi RawBT (Android Bluetooth Printer)
  const handlePrintRawBt = () => {
    openRawBtPrint(printData);
    onNotify?.('Mengirim teks nota ke printer Bluetooth via RawBT...', 'info');
  };

  // Kirim WhatsApp
  const handleShareWhatsApp = () => {
    const text = generateWhatsappReceiptText(printData);
    const phone = (printData.customerPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
    onNotify?.('Membuka WhatsApp untuk mengirim nota pesanan...', 'success');
  };

  // Salin Teks
  const handleCopyText = () => {
    const text = generateWhatsappReceiptText(printData);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    onNotify?.('Teks nota transaksi berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-300 shrink-0">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Pusat Cetak Struk & Invoice
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Pilih format printer POS thermal (58mm / 80mm) atau dokumen A4
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMAT SELECTOR CONTROLS */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setPaperFormat('58mm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                paperFormat === '58mm'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone size={14} />
              <span>POS 58mm</span>
              {defaultFormat === '58mm' && <Star size={11} className="fill-current text-amber-200 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('80mm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                paperFormat === '80mm'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Printer size={14} />
              <span>POS 80mm</span>
              {defaultFormat === '80mm' && <Star size={11} className="fill-current text-emerald-200 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('A4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                paperFormat === 'A4'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={14} />
              <span>Invoice A4</span>
              {defaultFormat === 'A4' && <Star size={11} className="fill-current text-indigo-200 ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {defaultFormat !== paperFormat ? (
              <button
                type="button"
                onClick={() => handleSetDefaultFormat(paperFormat)}
                className="text-[11px] font-bold text-slate-700 hover:text-emerald-800 bg-white border border-slate-300 hover:border-emerald-500 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                title="Simpan ukuran ini sebagai format default setiap kali mencetak"
              >
                <Star size={12} className="text-amber-500" />
                <span>Simpan Sebagai Default</span>
              </button>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                <Check size={12} /> Format Bawaan ({defaultFormat})
              </span>
            )}
            <div className="text-[11px] font-bold text-slate-500 hidden sm:flex items-center gap-1.5">
              <Info size={14} className="text-slate-400" />
              <span>
                {paperFormat === '58mm' && 'Thermal mini / bluetooth'}
                {paperFormat === '80mm' && 'Thermal kasir standar meja'}
                {paperFormat === 'A4' && 'Invoice resmi kertas A4 / PDF'}
              </span>
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex justify-center items-start">
          {paperFormat === '58mm' && (
            <div className="w-full max-w-[280px] bg-white p-4 rounded-xl border border-slate-300 shadow-md font-mono text-slate-900 text-[11px] space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                {printData.logoUrl && (
                  <img src={printData.logoUrl} alt="Logo" className="w-10 h-10 mx-auto mb-1 object-contain grayscale" />
                )}
                <p className="font-bold text-xs uppercase">{printData.storeName}</p>
                <p className="text-[9px] text-slate-500">{printData.storeAddress}</p>
                <p className="text-[9px] text-slate-500">WA: {printData.storePhone}</p>
              </div>

              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>No:</span><span className="font-bold">{printData.receiptNo}</span></div>
                <div className="flex justify-between"><span>Tgl:</span><span>{printData.date} {printData.time}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{printData.cashierName}</span></div>
                <div className="flex justify-between"><span>Pelanggan:</span><span className="font-bold truncate max-w-[140px]">{printData.customerName}</span></div>
                {printData.deliveryAddress && (
                  <div className="text-[9px] text-slate-600 pt-0.5">Alamat: {printData.deliveryAddress}</div>
                )}
              </div>

              <div className="space-y-1.5 py-1 border-b-2 border-dashed border-slate-400">
                {printData.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold truncate">{it.name}</div>
                    <div className="flex justify-between text-[10px] text-slate-600 pl-2">
                      <span>{it.qty}x {it.price ? `@${it.price.toLocaleString('id-ID')}` : ''}</span>
                      <span className="font-bold">{it.subtotal ? `Rp ${it.subtotal.toLocaleString('id-ID')}` : `${it.qty} porsi`}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>Rp {printData.total.toLocaleString('id-ID')}</span>
                </div>
                {debt > 0 ? (
                  <>
                    <div className="flex justify-between text-emerald-700">
                      <span>DP Masuk:</span>
                      <span>Rp {(printData.amountPaid || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Sisa DP:</span>
                      <span>Rp {debt.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Status:</span>
                    <span>LUNAS</span>
                  </div>
                )}
                {printData.change && printData.change > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Kembalian:</span>
                    <span>Rp {printData.change.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
                <p className="font-bold text-[10px] uppercase">
                  {debt === 0 ? '*** LUNAS ***' : '*** BELUM LUNAS / DP ***'}
                </p>
                <p className="text-[9px] text-slate-500">{printData.footerMessage}</p>
              </div>
            </div>
          )}

          {paperFormat === '80mm' && (
            <div className="w-full max-w-[380px] bg-white p-5 rounded-xl border border-slate-300 shadow-md font-mono text-slate-900 text-xs space-y-3">
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
                {printData.logoUrl && (
                  <img src={printData.logoUrl} alt="Logo" className="w-12 h-12 mx-auto mb-1 object-contain grayscale" />
                )}
                <h4 className="font-black text-sm uppercase tracking-tight">{printData.storeName}</h4>
                <p className="text-[10px] text-slate-500 font-sans">{printData.storeAddress}</p>
                <p className="text-[10px] text-slate-500">Telp/WA: {printData.storePhone}</p>
              </div>

              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>No. Nota:</span><span className="font-bold">{printData.receiptNo}</span></div>
                <div className="flex justify-between"><span>Waktu:</span><span>{printData.date} {printData.time ? `• ${printData.time} WIB` : ''}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{printData.cashierName} ({printData.shift || 'Pagi'})</span></div>
                <div className="flex justify-between"><span>Pelanggan:</span><span className="font-bold">{printData.customerName}</span></div>
                {printData.deliveryAddress && (
                  <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded">
                    Kirim: <strong>{printData.deliveryAddress}</strong>
                    {printData.deliveryNotes && <span className="block italic text-[9px]">Patokan: {printData.deliveryNotes}</span>}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 py-1 border-b-2 border-dashed border-slate-400">
                <div className="grid grid-cols-12 text-[10px] font-bold border-b border-dashed border-slate-300 pb-1 text-slate-500 uppercase">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Subtotal</div>
                </div>
                {printData.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs py-0.5 items-start">
                    <div className="col-span-6 font-bold truncate pr-1">{it.name}</div>
                    <div className="col-span-2 text-center font-bold text-slate-600">{it.qty}</div>
                    <div className="col-span-4 text-right font-black">
                      {it.subtotal ? `Rp ${it.subtotal.toLocaleString('id-ID')}` : `${it.qty} porsi`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {printData.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {printData.discount && printData.discount > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Diskon:</span>
                    <span>- Rp {printData.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                  <span>TOTAL:</span>
                  <span>Rp {printData.total.toLocaleString('id-ID')}</span>
                </div>
                {debt > 0 ? (
                  <>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Uang Muka / DP:</span>
                      <span>Rp {(printData.amountPaid || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-black text-rose-600 pt-0.5 border-t border-dashed border-slate-300">
                      <span>SISA PIUTANG:</span>
                      <span>Rp {debt.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-emerald-700 font-black">
                    <span>STATUS:</span>
                    <span>LUNAS [ OK ]</span>
                  </div>
                )}
                {printData.change && printData.change > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Kembalian:</span>
                    <span>Rp {printData.change.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t-2 border-dashed border-slate-400 space-y-1">
                <p className="font-bold text-xs uppercase text-slate-950 font-sans">
                  {printData.footerMessage}
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Terima kasih atas kepercayaan Anda kepada {printData.storeName}
                </p>
              </div>
            </div>
          )}

          {paperFormat === 'A4' && (
            <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-md font-sans text-slate-800 text-xs space-y-5">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h4 className="text-xl font-black uppercase text-slate-950 tracking-tight">{printData.storeName}</h4>
                  <p className="text-slate-600 text-xs mt-0.5">{printData.storeAddress}</p>
                  <p className="text-slate-600 text-xs">WhatsApp: {printData.storePhone}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black uppercase text-slate-950 tracking-wider block">INVOICE RESMI</span>
                  <span className="text-xs font-bold text-slate-500">#{printData.receiptNo}</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      debt === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {debt === 0 ? 'LUNAS' : `DP (Sisa Rp ${debt.toLocaleString('id-ID')})`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemesan:</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{printData.customerName}</p>
                  <p className="text-slate-600">{printData.customerPhone || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengantaran:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{printData.deliveryAddress || 'Diambil di Outlet'}</p>
                  <p className="text-slate-600">Jadwal: {printData.date} {printData.time && `• ${printData.time} WIB`}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5">Menu / Hidangan</th>
                      <th className="p-2.5 text-center w-20">Kuantitas</th>
                      <th className="p-2.5 text-right w-28">Harga</th>
                      <th className="p-2.5 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printData.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">{it.name}</td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{it.qty} porsi</td>
                        <td className="p-2.5 text-right text-slate-600">{it.price ? `Rp ${it.price.toLocaleString('id-ID')}` : '-'}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {it.subtotal ? `Rp ${it.subtotal.toLocaleString('id-ID')}` : `${it.qty} porsi`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-start pt-2">
                <div className="max-w-xs text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Catatan Pembayaran:</p>
                  <p>Pembayaran transfer dapat dikonfirmasi via WhatsApp resmi katering.</p>
                </div>
                <div className="w-64 space-y-1 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">Rp {printData.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Tagihan:</span>
                    <span>Rp {printData.total.toLocaleString('id-ID')}</span>
                  </div>
                  {debt > 0 ? (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Sisa Pelunasan:</span>
                      <span>Rp {debt.toLocaleString('id-ID')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Status:</span>
                      <span>LUNAS</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
                <div>
                  <p className="text-slate-400 mb-12">Penerima,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block px-6">
                    {printData.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-12">Hormat Kami,</p>
                  <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block px-6">
                    {printData.cashierName || settings.storeName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs"
              title="Kirim Nota ke WhatsApp"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-200"
              title="Salin Teks Nota Transaksi"
            >
              {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintRawBt}
              className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-sky-200"
              title="Cetak via aplikasi RawBT (Bluetooth printer Android)"
            >
              <Radio size={14} className="text-sky-600" />
              <span>RawBT HP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Cetak Sekarang ({paperFormat})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
