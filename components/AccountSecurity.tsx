
import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Smartphone, Globe, ShieldAlert, 
  History, LogOut, CheckCircle2, ChevronRight, 
  Key, Eye, EyeOff, AlertTriangle, Fingerprint, 
  RefreshCw, Tablet, Laptop
} from 'lucide-react';

const AccountSecurity: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const securityLogs = [
    { id: 1, action: 'Login Berhasil', device: 'Chrome on MacOS', time: 'Hari ini, 08:30', status: 'success' },
    { id: 2, action: 'Update Harga Menu', device: 'Safari on iPhone', time: 'Kemarin, 14:20', status: 'warning' },
    { id: 3, action: 'Perubahan Password', device: 'Chrome on MacOS', time: '3 hari yang lalu', status: 'info' },
  ];

  const activeDevices = [
    { id: 1, name: 'MacBook Pro 14"', location: 'Jakarta, Indonesia', type: 'Desktop', current: true },
    { id: 2, name: 'iPhone 15 Pro', location: 'Bandung, Indonesia', type: 'Mobile', current: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Security Health Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={20} />
              </div>
              <span className="uppercase tracking-[0.3em] text-[10px] font-black text-emerald-400">Account Health: Excellent</span>
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">Benteng Keamanan Bisnis Anda</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium max-w-xl">
              Kami menggunakan enkripsi tingkat militer untuk melindungi data katering, resep rahasia, dan informasi finansial Anda.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-white">98%</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Safety Score</p>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">24/7</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Monitoring</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 aspect-square bg-emerald-500/5 rounded-full border-2 border-emerald-500/20 flex flex-col items-center justify-center p-8 text-center border-dashed relative group">
             <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Fingerprint size={80} className="text-emerald-500 mb-4 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Biometric ID Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Security Controls */}
        <div className="lg:col-span-8 space-y-8">
          {/* Change Password Card */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Kredensial Login</h3>
                  <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi Anda secara berkala.</p>
                </div>
              </div>
              {!isChangingPassword && (
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                >
                  Ubah Kata Sandi
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                        placeholder="Minimal 8 karakter"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="Ulangi password baru"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200">
                    Simpan Perubahan
                  </button>
                  <button 
                    onClick={() => setIsChangingPassword(false)}
                    className="px-8 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-700">••••••••••••••••</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Terakhir diubah: 2 minggu lalu</span>
              </div>
            )}
          </div>

          {/* Activity Log Card */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Log Aktivitas Keamanan</h3>
                  <p className="text-xs text-slate-400 font-medium">Pantau setiap akses ke dashboard Anda.</p>
                </div>
              </div>
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 flex items-center gap-2">
                Unduh Laporan <Globe size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {securityLogs.map(log => (
                <div key={log.id} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                      log.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{log.action}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.device}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Security Controls */}
        <div className="lg:col-span-4 space-y-8">
          {/* 2FA Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mb-6 transition-all duration-500 ${is2FAEnabled ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100' : 'bg-rose-50 text-rose-500 shadow-rose-100'} shadow-2xl`}>
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Verifikasi 2-Langkah</h3>
              <p className="text-xs text-slate-400 font-medium mb-8 px-4">
                Tambahkan lapisan keamanan ekstra. Kode unik akan dikirim ke WhatsApp Anda saat login.
              </p>
              
              <button 
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  is2FAEnabled ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                }`}
              >
                {is2FAEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan Sekarang'}
              </button>
            </div>
            {is2FAEnabled && (
              <div className="absolute top-4 right-4 animate-bounce">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
            )}
          </div>

          {/* Active Devices */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Sesi Perangkat Aktif</h3>
            <div className="space-y-6">
              {activeDevices.map(device => (
                <div key={device.id} className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                    {device.type === 'Desktop' ? <Laptop size={20} /> : <Smartphone size={20} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-slate-800 truncate">{device.name}</p>
                      {device.current && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-100">Current</span>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{device.location}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-10 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
              <LogOut size={16} /> Keluar Dari Semua Sesi
            </button>
          </div>

          {/* Emergency Alert */}
          <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 flex flex-col items-center text-center">
             <div className="p-3 bg-amber-500 text-white rounded-2xl mb-4 shadow-xl shadow-amber-200">
               <AlertTriangle size={24} />
             </div>
             <p className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Kontrol Darurat</p>
             <p className="text-[11px] text-amber-700/60 font-medium leading-relaxed mb-6">
               Jika Anda mendeteksi aktivitas mencurigakan, bekukan akun segera untuk melindungi data.
             </p>
             <button className="w-full py-3 bg-white text-amber-600 border border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm">
               Kunci Akun Sementara
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurity;
