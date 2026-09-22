
import React, { useState } from 'react';
import { 
  UserPlus, ShieldCheck, Mail, Phone, MoreVertical, Trash2, Edit3, 
  User, Clock, Sun, SunMedium, Moon, Save, Sparkles, X, Eye, EyeOff, Lock, UserCog
} from 'lucide-react';
import { ShiftConfig, ShiftType, UserRole, User as AdminUser } from '../types';

interface AdminProfilesProps {
  shiftConfigs: ShiftConfig[];
  onUpdateShiftConfigs: (configs: ShiftConfig[]) => void;
  admins: AdminUser[];
  onUpdateAdmins: (admins: AdminUser[]) => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

const AdminProfiles: React.FC<AdminProfilesProps> = ({ shiftConfigs, onUpdateShiftConfigs, admins, onUpdateAdmins, onNotify }) => {
  const [localShifts, setLocalShifts] = useState<ShiftConfig[]>(shiftConfigs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<Partial<AdminUser>>({
    name: '',
    role: 'Staff',
    email: '',
    phone: '',
    password: ''
  });

  const handleShiftChange = (type: ShiftType, field: 'startTime' | 'endTime', value: string) => {
    setLocalShifts(prev => prev.map(s => s.type === type ? { ...s, [field]: value } : s));
  };

  const saveShifts = () => {
    onUpdateShiftConfigs(localShifts);
    onNotify?.("Jadwal operasional sift berhasil diperbarui!", "success");
  };

  const handleAddAdmin = () => {
    if (!formData.name || !formData.password) {
      return onNotify?.("Nama dan Password wajib diisi!", "error");
    }

    const newAdmin: AdminUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      role: formData.role || 'Staff',
      email: formData.email || '',
      phone: formData.phone || '',
      password: formData.password || '',
      shift: 'Pagi',
      avatarUrl: `https://ui-avatars.com/api/?name=${formData.name}&background=random`
    };

    onUpdateAdmins([...admins, newAdmin]);
    setIsModalOpen(false);
    setFormData({ name: '', role: 'Staff', email: '', phone: '', password: '' });
    onNotify?.(`Admin ${newAdmin.name} berhasil ditambahkan!`, 'success');
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Kitchen Manager': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Sales Admin': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Tim & Admin</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola hak akses dan jadwal sift petugas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
        >
          <UserPlus size={18} /> Tambah Admin Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg mb-4 bg-slate-50 flex items-center justify-center text-slate-300">
                {admin.avatarUrl ? <img src={admin.avatarUrl} alt={admin.name} className="w-full h-full object-cover" /> : <UserCog size={32} />}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{admin.name}</h3>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-6 ${getRoleStyle(admin.role)}`}>
                <ShieldCheck size={14} />
                {admin.role}
              </div>
              <div className="w-full flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Lock size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pass: ••••••••</span>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50 w-full flex justify-end">
                <button onClick={() => onUpdateAdmins(admins.filter(a => a.id !== admin.id))} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <Clock size={24} className="text-indigo-600" />
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Konfigurasi Jam Sift</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localShifts.map((shift) => (
            <div key={shift.type} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <span className="font-black text-sm text-slate-800 block mb-4">Sift {shift.type}</span>
              <div className="space-y-3">
                <input type="time" value={shift.startTime} onChange={(e) => handleShiftChange(shift.type, 'startTime', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
                <input type="time" value={shift.endTime} onChange={(e) => handleShiftChange(shift.type, 'endTime', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveShifts} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Simpan Jadwal Sift</button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight">Tambah Admin</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="Budi Santoso" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Jabatan / Role</label>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                  <option value="Sales Admin">Sales Admin</option>
                  <option value="Kitchen Manager">Kitchen Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password Akses</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button onClick={handleAddAdmin} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">
                Simpan Admin Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfiles;
