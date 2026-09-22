
@echo off
TITLE Caterly Smart OS - Master Launcher
SETLOCAL

echo ====================================================
echo    CATERLY SMART CATERING OS - STARTUP SYSTEM
echo ====================================================
echo.

:: 1. Cek folder node_modules
if not exist "node_modules\" (
    echo [INFO] Mengunduh modul aplikasi untuk pertama kali...
    echo Ini mungkin memakan waktu 1-2 menit tergantung internet.
    call npm install
)

echo.
echo [INFO] Menjalankan Server Database (Backend)...
:: Menjalankan backend di jendela terpisah dan membiarkannya tetap terbuka jika error (/K)
start "Caterly_Backend" cmd /k "node electron/server.js"

echo.
echo [INFO] Menunggu koneksi server (5 detik)...
timeout /t 5 /nobreak >nul

echo.
echo [INFO] Menjalankan Antarmuka (Frontend)...
echo JANGAN TUTUP JENDELA INI.
echo.
:: Menjalankan frontend di jendela ini
call npm run dev

pause
