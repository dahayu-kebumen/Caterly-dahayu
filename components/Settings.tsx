import React, { useRef, useState, useEffect } from 'react';
import { 
  Save, Store, CheckCircle2, 
  X, Instagram, Facebook, 
  Video, Plus, Trash2, Link2, 
  Globe, Layout, Share2, 
  ExternalLink, Smartphone, MessageCircle, MapPin,
  Cloud, CloudUpload, CloudOff, RefreshCw, Download, Upload,
  ShieldCheck, ShieldAlert, Key, HelpCircle, HardDrive, Sparkles, Check, AlertCircle, Terminal
} from 'lucide-react';
import { StoreSettings, SocialAccount, CloudConfig, FirebaseCredentials } from '../types';
import { testFirebaseConnection } from '../services/storageService';

interface SettingsProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onSyncAllToCloud?: (creds: FirebaseCredentials) => Promise<{ success: boolean; message: string }>;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => Promise<void>;
  currentCloudStatus?: 'connected' | 'disconnected' | 'syncing' | 'error';
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onUpdateSettings,
  onSyncAllToCloud,
  onExportBackup,
  onImportBackup,
  currentCloudStatus = 'disconnected'
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSaved, setShowSaved] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'cloud' | 'social' | 'ai'>('cloud');
  
  // Cloud configuration state
  const [cloudMode, setCloudMode] = useState<'local' | 'firebase'>(
    localSettings.cloudConfig?.enabled ? 'firebase' : 'local'
  );
  const [firebaseCreds, setFirebaseCreds] = useState<FirebaseCredentials>({
    apiKey: localSettings.cloudConfig?.firebase?.apiKey || '',
    authDomain: localSettings.cloudConfig?.firebase?.authDomain || '',
    projectId: localSettings.cloudConfig?.firebase?.projectId || '',
    storageBucket: localSettings.cloudConfig?.firebase?.storageBucket || '',
    messagingSenderId: localSettings.cloudConfig?.firebase?.messagingSenderId || '',
    appId: localSettings.cloudConfig?.firebase?.appId || ''
  });
  const [pastedConfigText, setPastedConfigText] = useState('');
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  // Social account state
  const [newAccount, setNewAccount] = useState<{platform: SocialAccount['platform'], handle: string, name: string}>({
    platform: 'Instagram',
    handle: '',
    name: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
    if (settings.cloudConfig?.firebase) {
      setFirebaseCreds(settings.cloudConfig.firebase);
    }
    setCloudMode(settings.cloudConfig?.enabled ? 'firebase' : 'local');
  }, [settings]);

  const handleSave = () => {
    const updatedCloudConfig: CloudConfig = {
      enabled: cloudMode === 'firebase',
      provider: cloudMode,
      firebase: cloudMode === 'firebase' ? firebaseCreds : undefined,
      status: cloudMode === 'firebase' ? (localSettings.cloudConfig?.status || 'connected') : 'disconnected',
      lastSyncedAt: new Date().toISOString()
    };

    const updated = {
      ...localSettings,
      cloudConfig: updatedCloudConfig
    };

    setLocalSettings(updated);
    onUpdateSettings(updated);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleAddAccount = () => {
    if (!newAccount.handle) return;
    const account: SocialAccount = {
      id: Math.random().toString(36).substr(2, 9),
      platform: newAccount.platform,
      handle: newAccount.handle,
      displayName: newAccount.name || newAccount.handle
    };
    setLocalSettings({
      ...localSettings,
      socialAccounts: [...(localSettings.socialAccounts || []), account]
    });
    setNewAccount({ ...newAccount, handle: '', name: '' });
  };

  const handleRemoveAccount = (id: string) => {
    setLocalSettings({
      ...localSettings,
      socialAccounts: (localSettings.socialAccounts || []).filter(a => a.id !== id)
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Parsing cerdas snippet kode Firebase dari console
  const handleParseFirebaseSnippet = () => {
    if (!pastedConfigText.trim()) return;

    try {
      const text = pastedConfigText;
      const extractField = (fieldName: string) => {
        const regex = new RegExp(`["']?${fieldName}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
      };

      const extractedApiKey = extractField('apiKey');
      const extractedProjectId = extractField('projectId');
      const extractedAuthDomain = extractField('authDomain');
      const extractedStorageBucket = extractField('storageBucket');
      const extractedMessagingSenderId = extractField('messagingSenderId');
      const extractedAppId = extractField('appId');

      if (!extractedProjectId && !extractedApiKey) {
        setTestResult({
          success: false,
          message: 'Format tidak terdeteksi. Pastikan Anda menyalin blok objek firebaseConfig dari Firebase Console.'
        });
        return;
      }

      setFirebaseCreds({
        apiKey: extractedApiKey || firebaseCreds.apiKey,
        projectId: extractedProjectId || firebaseCreds.projectId,
        authDomain: extractedAuthDomain || firebaseCreds.authDomain,
        storageBucket: extractedStorageBucket || firebaseCreds.storageBucket,
        messagingSenderId: extractedMessagingSenderId || firebaseCreds.messagingSenderId,
        appId: extractedAppId || firebaseCreds.appId
      });

      setTestResult({
        success: true,
        message: 'Konfigurasi Firebase berhasil diekstrak! Klik "Uji Koneksi Cloud" untuk memverifikasi.'
      });
      setPastedConfigText('');
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Gagal membaca format konfigurasi: ' + e.message
      });
    }
  };

  const handleTestCloudConnection = async () => {
    if (!firebaseCreds.projectId || !firebaseCreds.apiKey) {
      setTestResult({
        success: false,
        message: 'Mohon isi Project ID dan API Key terlebih dahulu.'
      });
      return;
    }

    setIsTestingCloud(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection(firebaseCreds);
      setTestResult(res);
      if (res.success) {
        // Otomatis aktifkan mode firebase dan simpan
        setCloudMode('firebase');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal.' });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncAllToCloud) return;
    if (!firebaseCreds.projectId || !firebaseCreds.apiKey) {
      setSyncResult({ success: false, message: 'Harap konfigurasi Firebase terlebih dahulu.' });
      return;
    }

    setIsSyncingData(true);
    setSyncResult(null);
    try {
      const res = await onSyncAllToCloud(firebaseCreds);
      setSyncResult(res);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message || 'Gagal sinkronisasi.' });
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleBackupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBackup) {
      await onImportBackup(file);
      e.target.value = '';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram size={20} className="text-pink-500" />;
      case 'TikTok': return <Video size={20} className="text-slate-900" />;
      case 'Facebook': return <Facebook size={20} className="text-blue-600" />;
      case 'WhatsApp': return <MessageCircle size={20} className="text-emerald-500" />;
      default: return <Link2 size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center sticky top-0 bg-white z-20 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Pengaturan Sistem</h3>
          <p className="text-[11px] text-slate-400 font-medium">Koneksi Cloud, Profil Bisnis, dan Preferensi Aplikasi</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
        >
          <Save size={16} />
          Simpan Pengaturan
        </button>
      </div>

      {showSaved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in slide-in-from-top-2">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">Pengaturan berhasil disimpan dan disinkronkan ke aplikasi!</p>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('cloud')}
          className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 ${
            activeSubTab === 'cloud' 
              ? 'bg-white text-emerald-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cloud size={15} />
          <span>Koneksi Cloud</span>
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 ${
            activeSubTab === 'profile' 
              ? 'bg-white text-indigo-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store size={15} />
          <span>Profil Bisnis</span>
        </button>
        <button
          onClick={() => setActiveSubTab('social')}
          className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 ${
            activeSubTab === 'social' 
              ? 'bg-white text-slate-800 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 size={15} />
          <span>Sosial Media</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 ${
            activeSubTab === 'ai' 
              ? 'bg-white text-amber-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe size={15} />
          <span>AI & Integrasi</span>
        </button>
      </div>

      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* ========================================================================= */}
        {/* TAB 1: KONEKSI CLOUD MANDIRI (BRING YOUR OWN CLOUD) */}
        {/* ========================================================================= */}
        {activeSubTab === 'cloud' && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-slate-950 text-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Cloud size={18} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Arsitektur: Bring Your Own Cloud (BYOC)
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black mb-1">
                    {cloudMode === 'firebase' && firebaseCreds.projectId
                      ? `Terhubung ke Firebase: ${firebaseCreds.projectId}`
                      : 'Penyimpanan Mandiri (Mode Lokal Browser)'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                    Aplikasi tidak membutuhkan server lokal XAMPP. Anda dapat menghubungkannya ke akun 
                    <strong> Google Firebase Cloud Firestore</strong> milik pengguna agar data tersimpan otomatis 24/7 dan bisa diakses bersama.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border ${
                    cloudMode === 'firebase' && firebaseCreds.projectId
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${cloudMode === 'firebase' ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
                    {cloudMode === 'firebase' ? 'Cloud Firestore Aktif' : 'Mode Lokal (Tanpa Server)'}
                  </div>

                  {onSyncAllToCloud && cloudMode === 'firebase' && firebaseCreds.projectId && (
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncingData}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow disabled:opacity-50"
                      title="Sinkronkan seluruh data lokal ke Firebase sekarang"
                    >
                      {isSyncingData ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Menyinkronkan...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload size={16} />
                          <span>Sinkronkan ke Cloud</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Pilih Metode Penyimpanan</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Firebase Cloud */}
                <div 
                  onClick={() => setCloudMode('firebase')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    cloudMode === 'firebase' 
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-md shadow-emerald-500/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Cloud size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Rekomendasi
                    </span>
                  </div>
                  <h5 className="text-sm font-black text-slate-800 mb-1">Google Firebase Cloud (Milik Pengguna)</h5>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Data tersimpan aman di cloud Google Firestore milik pengguna. Real-time, multi-perangkat, dan gratis tanpa repot XAMPP.
                  </p>
                </div>

                {/* Option 2: Local Storage */}
                <div 
                  onClick={() => setCloudMode('local')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    cloudMode === 'local' 
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md shadow-indigo-500/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <HardDrive size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      Offline Saja
                    </span>
                  </div>
                  <h5 className="text-sm font-black text-slate-800 mb-1">Penyimpanan Internal Browser (Offline)</h5>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Data tersimpan langsung di browser komputer saat ini. Sangat cepat, tanpa internet, dan tidak butuh setup akun cloud apa pun.
                  </p>
                </div>
              </div>
            </div>

            {/* Firebase Configuration Form */}
            {cloudMode === 'firebase' && (
              <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                      <Key size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Kredensial Firebase Pengguna</h4>
                      <p className="text-xs text-slate-400">Didapatkan langsung dari Firebase Console proyek milik Anda/pengguna</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 underline"
                  >
                    <HelpCircle size={14} />
                    {showFirebaseGuide ? 'Tutup Panduan' : 'Cara Dapatkan Gratis?'}
                  </button>
                </div>

                {/* Collapsible Guide */}
                {showFirebaseGuide && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-3 animate-in fade-in">
                    <p className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                      Panduan 3 Langkah Menghubungkan Firebase (100% Gratis):
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                      <li>
                        Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">console.firebase.google.com</a> dan buat proyek baru (contoh: <em>Katering-Berkah</em>).
                      </li>
                      <li>
                        Pilih menu <strong>Build &gt; Firestore Database</strong> &gt; klik <strong>Create Database</strong> (pilih lokasi terdekat seperti asia-southeast2 / Jakarta, lalu pilih <strong>Start in test mode</strong>).
                      </li>
                      <li>
                        Klik ikon <strong>Settings (Gear) &gt; Project Settings</strong>, scroll ke bawah ke bagian <em>"Your apps"</em> &gt; klik ikon Web <code>&lt;/&gt;</code> &gt; salin konfigurasi <code>firebaseConfig</code> dan tempel pada kotak di bawah ini!
                      </li>
                    </ol>
                  </div>
                )}

                {/* Quick Paste Snippet Box */}
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-600" />
                      Fitur Praktis: Tempel Kode Konfigurasi Firebase
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold">Auto-Detect</span>
                  </div>
                  <textarea
                    rows={3}
                    className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Tempel teks seperti: const firebaseConfig = { apiKey: 'AIza...', projectId: 'katering-app', ... };"
                    value={pastedConfigText}
                    onChange={(e) => setPastedConfigText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleParseFirebaseSnippet}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <Check size={14} />
                      Ekstrak & Isi Otomatis
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                      Project ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono"
                      value={firebaseCreds.projectId}
                      onChange={(e) => setFirebaseCreds({ ...firebaseCreds, projectId: e.target.value.trim() })}
                      placeholder="contoh: katering-smart-123"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                      API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono"
                      value={firebaseCreds.apiKey}
                      onChange={(e) => setFirebaseCreds({ ...firebaseCreds, apiKey: e.target.value.trim() })}
                      placeholder="contoh: AIzaSy..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                      Auth Domain (Opsional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none font-mono"
                      value={firebaseCreds.authDomain || ''}
                      onChange={(e) => setFirebaseCreds({ ...firebaseCreds, authDomain: e.target.value.trim() })}
                      placeholder="katering-app.firebaseapp.com"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                      App ID (Opsional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none font-mono"
                      value={firebaseCreds.appId || ''}
                      onChange={(e) => setFirebaseCreds({ ...firebaseCreds, appId: e.target.value.trim() })}
                      placeholder="1:123456789:web:abcdef"
                    />
                  </div>
                </div>

                {/* Test & Sync Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={handleTestCloudConnection}
                    disabled={isTestingCloud}
                    className="w-full sm:w-auto justify-center bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isTestingCloud ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Menguji Koneksi...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} className="text-emerald-400" />
                        Uji Koneksi Cloud
                      </>
                    )}
                  </button>

                  {onSyncAllToCloud && (
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncingData || !firebaseCreds.projectId}
                      className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {isSyncingData ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Menyinkronkan...
                        </>
                      ) : (
                        <>
                          <CloudUpload size={16} />
                          Unggah Data Lokal ke Cloud
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 animate-in fade-in ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.message}</p>
                    </div>
                  </div>
                )}

                {syncResult && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 animate-in fade-in ${
                    syncResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="font-bold">{syncResult.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Backup & Restore Utility */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Cadangan & Pemulihan Mandiri (Backup JSON)</h4>
                  <p className="text-xs text-slate-400">Unduh seluruh data katering (menu, pesanan, resep, keuangan) ke file komputer</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {onExportBackup && (
                  <button
                    onClick={onExportBackup}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200"
                  >
                    <Download size={16} className="text-indigo-600" />
                    Unduh Cadangan (.JSON)
                  </button>
                )}

                {onImportBackup && (
                  <div>
                    <input
                      type="file"
                      ref={backupInputRef}
                      onChange={handleBackupUpload}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => backupInputRef.current?.click()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200"
                    >
                      <Upload size={16} className="text-emerald-600" />
                      Pulihkan dari File (.JSON)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROFIL BISNIS & BRANDING */}
        {/* ========================================================================= */}
        {activeSubTab === 'profile' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Store size={20} className="text-slate-600" />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Profil Bisnis & Branding</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-10">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {localSettings.logoUrl && localSettings.logoUrl !== '/logo.jpg' ? (
                    <img 
                      src={localSettings.logoUrl} 
                      alt="Logo Bisnis" 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center uppercase mb-1">
                        {localSettings.storeName ? localSettings.storeName.slice(0, 2) : 'KT'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Unggah Logo</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-[2.5rem] transition-all font-black text-[8px] uppercase tracking-widest"
                >
                  Ganti Logo
                </button>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Nama Katering / Perusahaan</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={localSettings.storeName}
                    onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})}
                    placeholder="Masukkan nama brand Anda"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Alamat Lengkap Katering</label>
                  <div className="relative">
                    <div className="absolute left-5 top-5 text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <textarea 
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                      rows={2}
                      value={localSettings.address}
                      onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
                      placeholder="Contoh: Jl. Katering Elite No. 88, Jakarta Selatan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">WhatsApp Blast (Bot MRP)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">+</span>
                      <input 
                        type="text" 
                        className="w-full pl-9 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none"
                        value={localSettings.whatsappNumber}
                        onChange={(e) => setLocalSettings({...localSettings, whatsappNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Simbol Mata Uang</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-800 outline-none"
                      value={localSettings.currencySymbol}
                      onChange={(e) => setLocalSettings({...localSettings, currencySymbol: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SOSIAL MULTI-AKUN */}
        {/* ========================================================================= */}
        {activeSubTab === 'social' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Share2 size={20} className="text-indigo-600" />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Koneksi Multi-Akun Sosial</h3>
              </div>
              <div className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                {(localSettings.socialAccounts || []).length} Akun Terdaftar
              </div>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Tambahkan semua akun sosial media katering Anda. Gunakan fitur ini untuk mengelola berbagai cabang atau persona brand yang berbeda dalam satu platform.
            </p>

            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Plus size={14} className="text-indigo-500" /> Pendaftaran Akun Baru
              </p>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Pilih Platform</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={newAccount.platform}
                    onChange={(e) => setNewAccount({...newAccount, platform: e.target.value as any})}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Username / Tautan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Link2 size={16} /></span>
                    <input 
                      type="text" 
                      placeholder="Contoh: @brand.pusat"
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={newAccount.handle}
                      onChange={(e) => setNewAccount({...newAccount, handle: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Label Akun (Alias)</label>
                  <input 
                    type="text" 
                    placeholder="Admin Pusat / Sales Bali"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button 
                    onClick={handleAddAccount}
                    className="w-full bg-slate-900 text-white rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100 active:scale-95"
                  >
                    <Plus size={16} /> Tambah Akun
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(localSettings.socialAccounts || []).map((account) => (
                <div key={account.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-50">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 transition-all group-hover:bg-indigo-50">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 truncate">{account.displayName}</p>
                        <ExternalLink size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">@{account.handle}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveAccount(account.id)}
                    className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AI & GEMINI */}
        {/* ========================================================================= */}
        {activeSubTab === 'ai' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <Globe size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Konfigurasi Kecerdasan Buatan (AI)</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Aplikasi ini menggunakan <strong>Google Gemini AI</strong> untuk fitur Smart Advisor, Optimasi Menu, dan Analisis Bahan Baku. 
                Jika menggunakan aplikasi versi mandiri / Desktop, Anda dapat memasukkan API Key Google AI Studio Anda sendiri di bawah ini.
              </p>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-3 block">Gemini API Key</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <ShieldAlert size={18} />
                  </div>
                  <input 
                    type="password" 
                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    value={localSettings.geminiApiKey || ''}
                    onChange={(e) => setLocalSettings({...localSettings, geminiApiKey: e.target.value})}
                    placeholder="Masukkan API Key Gemini Anda"
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Terminal size={12} className="text-emerald-500" />
                  <span>Dapatkan kunci gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Google AI Studio</a></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
