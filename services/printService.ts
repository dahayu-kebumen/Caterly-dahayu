export type PrintPaperSize = '58mm' | '80mm' | 'A4';

export interface PrintReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  logoUrl?: string;
  receiptNo: string;
  date: string;
  time?: string;
  customerName: string;
  customerPhone?: string;
  deliveryMethod?: 'Delivery' | 'Pickup';
  deliveryAddress?: string;
  deliveryTime?: string;
  deliveryNotes?: string;
  cashierName?: string;
  shift?: string;
  items: {
    name: string;
    qty: number;
    price?: number;
    subtotal?: number;
    notes?: string;
  }[];
  subtotal: number;
  discount?: number;
  total: number;
  amountPaid?: number;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial';
  paymentMethod?: string;
  cashReceived?: number;
  change?: number;
  orderType?: string;
  footerMessage?: string;
}

/**
 * Render kode HTML struk / invoice sesuai ukuran kertas yang ditentukan.
 */
export const generateReceiptHtml = (
  printData: PrintReceiptData,
  paperSize: PrintPaperSize,
  options?: { docType?: 'receipt' | 'surat-jalan'; showBankInfo?: boolean; bankAccountInfo?: string }
): string => {
  const debt = Math.max(0, printData.total - (printData.amountPaid ?? printData.total));
  const docType = options?.docType || 'receipt';
  const showBankInfo = options?.showBankInfo ?? true;
  const bankInfo = options?.bankAccountInfo || 'Transfer Bank / QRIS Resmi Katering';

  if (paperSize === '58mm') {
    return `
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
        ${debt > 0 ? `<tr><td class="font-bold">SISA DP:</td><td class="text-right font-bold">Rp ${debt.toLocaleString('id-ID')}</td></tr>` : ''}
        ${printData.change && printData.change > 0 ? `<tr><td>Kembali:</td><td class="text-right">Rp ${printData.change.toLocaleString('id-ID')}</td></tr>` : ''}
        ${printData.paymentMethod ? `<tr><td>Metode:</td><td class="text-right">${printData.paymentMethod.toUpperCase()}</td></tr>` : ''}
      </table>
      <div class="divider-double"></div>
      <div class="text-center" style="font-size: 9px; margin-top: 4px;">
        <div class="font-bold">${debt === 0 ? '*** LUNAS ***' : '*** BELUM LUNAS / DP ***'}</div>
        <div>${printData.footerMessage || 'Terima kasih atas pesanan Anda!'}</div>
        <div style="font-size: 8px; margin-top: 4px;">Caterly POS System</div>
      </div>
    `;
  }

  if (paperSize === '80mm') {
    return `
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
        <div class="font-bold">${printData.footerMessage || 'Terima kasih atas pesanan Anda!'}</div>
        <div>Simpan struk ini sebagai bukti transaksi resmi katering.</div>
        <div style="font-size: 8px; margin-top: 5px; color: #555;">Dicetak otomatis oleh Caterly Smart OS</div>
      </div>
    `;
  }

  // Format A4
  return `
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
            <div>${bankInfo}</div>
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
        <p style="font-weight: bold; text-decoration: underline; margin: 0;">( ${printData.cashierName || printData.storeName} )</p>
      </div>
    </div>
  `;
};

/**
 * Eksekusi cetak menggunakan iframe terisolasi agar format CSS thermal 58mm/80mm/A4
 * langsung diterapkan sempurna tanpa terpengaruh tampilan web utama browser.
 */
export const executePrint = (contentHtml: string, paperSize: PrintPaperSize) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const pageCss = paperSize === '58mm'
    ? `@page { size: 58mm auto; margin: 0; }
       body { 
         width: 52mm; 
         margin: 0 auto; 
         padding: 2mm 1mm; 
         font-family: 'Courier New', Courier, monospace, sans-serif; 
         font-size: 10px; 
         line-height: 1.25; 
         color: #000; 
         background: #fff; 
       }
       .thermal-table { width: 100%; border-collapse: collapse; }
       .thermal-table td, .thermal-table th { padding: 1px 0; font-size: 10px; }
       .text-right { text-align: right; }
       .text-center { text-align: center; }
       .font-bold { font-weight: bold; }
       .divider { border-top: 1px dashed #000; margin: 4px 0; }
       .divider-double { border-top: 2px dashed #000; margin: 4px 0; }
       .logo-img { max-width: 40mm; max-height: 14mm; object-fit: contain; margin: 0 auto 2px auto; display: block; filter: grayscale(100%) contrast(150%); }`
    : paperSize === '80mm'
    ? `@page { size: 80mm auto; margin: 0; }
       body { 
         width: 72mm; 
         margin: 0 auto; 
         padding: 3mm 2mm; 
         font-family: 'Courier New', Courier, monospace, sans-serif; 
         font-size: 12px; 
         line-height: 1.35; 
         color: #000; 
         background: #fff; 
       }
       .thermal-table { width: 100%; border-collapse: collapse; }
       .thermal-table td, .thermal-table th { padding: 2px 0; font-size: 11px; }
       .text-right { text-align: right; }
       .text-center { text-align: center; }
       .font-bold { font-weight: bold; }
       .divider { border-top: 1px dashed #000; margin: 6px 0; }
       .divider-double { border-top: 2px dashed #000; margin: 6px 0; }
       .logo-img { max-width: 48mm; max-height: 18mm; object-fit: contain; margin: 0 auto 3px auto; display: block; filter: grayscale(100%) contrast(150%); }`
    : `@page { size: A4 portrait; margin: 12mm; }
       body { 
         width: 100%; 
         margin: 0; 
         padding: 0; 
         font-family: 'Plus Jakarta Sans', Arial, sans-serif; 
         font-size: 12px; 
         line-height: 1.5; 
         color: #1e293b; 
         background: #fff; 
       }
       .a4-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
       .a4-table th { background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; font-weight: bold; border-bottom: 2px solid #cbd5e1; }
       .a4-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
       .text-right { text-align: right; }
       .text-center { text-align: center; }
       .font-bold { font-weight: bold; }
       .logo-img { max-width: 50mm; max-height: 22mm; object-fit: contain; }`;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk - ${paperSize}</title>
        <style>
          * { box-sizing: border-box; }
          ${pageCss}
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.postMessage({ type: 'PRINT_COMPLETED' }, '*');
              }, 400);
            }, 200);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'PRINT_COMPLETED') {
      window.removeEventListener('message', handleMessage);
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }
  };
  window.addEventListener('message', handleMessage);
};

/**
 * Cetak cepat 1-klik langsung ke printer tanpa perlu membuka modal
 */
export const quickPrintReceipt = (
  data: PrintReceiptData,
  paperSize: PrintPaperSize = '80mm',
  options?: { docType?: 'receipt' | 'surat-jalan'; showBankInfo?: boolean; bankAccountInfo?: string }
) => {
  const html = generateReceiptHtml(data, paperSize, options);
  executePrint(html, paperSize);
};

/**
 * Format string teks WhatsApp untuk nota pesanan
 */
export const generateWhatsappReceiptText = (data: PrintReceiptData): string => {
  const debt = Math.max(0, data.total - (data.amountPaid ?? data.total));
  const itemsText = data.items
    .map(i => `• ${i.name} x${i.qty}${i.price ? ` = Rp ${(i.price * i.qty).toLocaleString('id-ID')}` : ''}`)
    .join('\n');

  let text = `*NOTA RESMI - ${data.storeName.toUpperCase()}*\n`;
  text += `No. Dokumen : ${data.receiptNo}\n`;
  text += `Tanggal      : ${data.date} ${data.time ? `${data.time} WIB` : ''}\n`;
  if (data.cashierName) text += `Kasir / PIC  : ${data.cashierName}\n`;
  text += `Pelanggan    : ${data.customerName}\n`;
  if (data.customerPhone) text += `No. Telp/WA  : ${data.customerPhone}\n`;
  if (data.deliveryAddress) {
    text += `Pengantaran  : ${data.deliveryMethod === 'Pickup' ? 'Ambil di Dapur' : 'Kirim ke Alamat'}\n`;
    text += `Alamat Kirim : ${data.deliveryAddress}\n`;
  }
  text += `--------------------------------\n`;
  text += `*Rincian Menu:*\n${itemsText}\n`;
  text += `--------------------------------\n`;
  text += `Subtotal     : Rp ${data.subtotal.toLocaleString('id-ID')}\n`;
  if (data.discount && data.discount > 0) {
    text += `Diskon       : -Rp ${data.discount.toLocaleString('id-ID')}\n`;
  }
  text += `*TOTAL AKHIR : Rp ${data.total.toLocaleString('id-ID')}*\n`;

  if (data.paymentMethod) {
    text += `Metode Bayar : ${data.paymentMethod.toUpperCase()}\n`;
  }

  if (debt > 0) {
    text += `Uang Muka/DP : Rp ${(data.amountPaid || 0).toLocaleString('id-ID')}\n`;
    text += `*Sisa Tagihan: Rp ${debt.toLocaleString('id-ID')}*\n`;
    text += `Status       : BELUM LUNAS / DP\n`;
  } else {
    text += `Status       : LUNAS ✅\n`;
  }

  if (data.change && data.change > 0) {
    text += `Kembalian    : Rp ${data.change.toLocaleString('id-ID')}\n`;
  }

  text += `--------------------------------\n`;
  text += `${data.footerMessage || 'Terima kasih telah mempercayakan hidangan kepada kami!'}\n`;
  if (data.storePhone) text += `Info & Pemesanan: WA ${data.storePhone}\n`;

  return text;
};

/**
 * Buka aplikasi RawBT (Android Bluetooth Printer) untuk cetak langsung 1-klik via HP
 */
export const openRawBtPrint = (data: PrintReceiptData) => {
  const plainText = generateWhatsappReceiptText(data);
  const base64 = btoa(unescape(encodeURIComponent(plainText)));
  window.location.href = `rawbt:data:text/plain;base64,${base64}`;
};
