
@echo off
TITLE Caterly Smart OS - Multi-Process Launcher
SETLOCAL

:: 1. Verifikasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [FATAL ERROR] Node.js tidak ditemukan!
    echo Silakan instal Node.js terlebih dahulu.
    pause
    exit /b
)

echo ====================================================
echo    CATERLY SMART CATERING OS - VERSION 2.0
echo ====================================================
echo.

:: 2. Instalasi Dependensi Otomatis
if not exist "node_modules\" (
    echo [STEP 1/3] Mengunduh modul aplikasi (Harap tunggu)...
    call npm install
)

:: 3. Jalankan Backend di Jendela Baru
echo [STEP 2/3] Memulai Backend Server di Port 5050...
start "Caterly Backend Server" cmd /k "node electron/server.js"

:: Beri waktu backend untuk bangun
timeout /t 5 /nobreak >nul

:: 4. Jalankan Frontend
echo [STEP 3/3] Memulai Antarmuka Pengguna (Vite)...
echo.
echo TIPS: Jika browser muncul pesan 'Connection Refused', 
echo tunggu sebentar dan klik tombol 'Hubungkan Kembali' di layar.
echo.
call npm run dev

pause
