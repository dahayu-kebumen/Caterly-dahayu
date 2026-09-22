import React, { useState } from 'react';
import { 
  Lock, Eye, EyeOff, ShieldCheck, 
  User as UserIcon, ArrowRight, ShoppingBag, AlertCircle
} from 'lucide-react';
import { ShiftType, UserRole, ShiftConfig, User, StoreSettings } from '../types';

interface LoginProps {
  onLogin: (name: string, shift: ShiftType, role: UserRole) => void;
  shiftConfigs: ShiftConfig[];
  admins: User[];
  storeSettings?: StoreSettings;
  onOpenCustomerMenu?: () => void;
}

const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  shiftConfigs, 
  admins, 
  onOpenCustomerMenu 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('Silakan masukkan username atau nama pengguna.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Silakan masukkan password.');
      return;
    }

    setIsLoading(true);

    // Cari user yang cocok berdasarkan username/nama/email
    setTimeout(() => {
      const matchedUser = admins.find(user => {
        const nameMatch = user.name.toLowerCase() === cleanUsername;
        const emailMatch = user.email ? user.email.toLowerCase() === cleanUsername : false;
        // Izinkan 'admin' untuk mencocokkan akun bertipe admin/superadmin
        const genericAdminMatch = cleanUsername === 'admin' && (user.role === 'Super Admin' || user.role === 'Admin' || user.id === 'admin_1');
        return nameMatch || emailMatch || genericAdminMatch;
      });

      if (matchedUser && matchedUser.password === cleanPassword) {
        // Tentukan shift secara otomatis berdasarkan jam saat ini jika tidak dispesifikasi
        const currentHour = new Date().getHours();
        let autoShift: ShiftType = 'Pagi';
        if (currentHour >= 14 && currentHour < 22) {
          autoShift = 'Siang';
        } else if (currentHour >= 22 || currentHour < 6) {
          autoShift = 'Malam';
        }

        const effectiveShift = matchedUser.shift || autoShift;
        onLogin(matchedUser.name, effectiveShift, matchedUser.role);
      } else if (!matchedUser && admins.length === 0 && cleanUsername === 'admin' && cleanPassword === 'admin') {
        // Fallback darurat jika belum ada admin tersimpan
        onLogin('Admin Utama', 'Pagi', 'Super Admin');
      } else {
        setIsLoading(false);
        setErrorMessage('Username atau password tidak sesuai. Silakan coba lagi.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-950">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden relative">
        
        {/* Header Identitas Aplikasi */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-slate-50/70">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center mb-3 p-1">
            <img src="/logo.jpg" alt="Caterly OS Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Caterly Smart OS
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-0.5">
            Login Sistem Operasional & Kasir
          </p>
        </div>

        {/* Formulir Sederhana: Username & Password Saja */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {/* Kolom Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Username / Nama Pengguna
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <UserIcon size={18} />
              </div>
              <input 
                type="text"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-950 outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Kolom Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                className={`w-full bg-slate-50 border-2 ${errorMessage ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'} rounded-xl pl-11 pr-11 py-3.5 text-sm font-bold text-slate-950 outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400`}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Pesan Kesalahan */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tombol Submit */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-950 text-white py-3.5 sm:py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Akses Cepat ke Katalog Konsumen */}
        {onOpenCustomerMenu && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onOpenCustomerMenu}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors py-1 px-3 rounded-lg hover:bg-emerald-50"
            >
              <ShoppingBag size={14} />
              <span>Buka Halaman Katalog Konsumen (Publik)</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-6 text-xs text-slate-600 font-semibold">
        Caterly Smart Catering OS • Manajemen Dapur, Kasir & Delivery
      </div>
    </div>
  );
};

export default Login;
