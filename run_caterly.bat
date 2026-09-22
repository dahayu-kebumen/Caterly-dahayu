
@echo off
TITLE Caterly OS - Starter
SETLOCAL

:: Cek apakah Node.js sudah terinstal
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan! Silakan instal Node.js terlebih dahulu di https://nodejs.org/
    pause
    exit /b
)

echo ==========================================
echo    CATERLY SMART CATERING OS - LOCAL
echo ==========================================
echo [1/3] Mengunduh dependensi (hanya saat pertama kali)...
call npm install

echo.
echo [2/3] Mempersiapkan server localhost...
echo Menjalankan aplikasi di http://localhost:5000
echo.

echo [3/3] Membuka browser...
:: Menjalankan vite dev server
call npm run dev

pause
