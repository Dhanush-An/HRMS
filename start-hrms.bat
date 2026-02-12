@echo off
TITLE HRMS Application Starter
echo ==========================================
echo    Starting HRMS Application (Unified)...
echo ==========================================

:: Start Backend (which now handles everything if built)
echo Starting Backend Server...
cd /d "d:\HRMS\server"
start "HRMS Server" /min cmd /k "npm run dev"

:: Start Frontend (for development refresh)
echo Starting Frontend Development Server...
cd /d "d:\HRMS\client"
start "HRMS Client" /min cmd /k "npm run dev"

:: Wait for Vite to initialize
echo Waiting for servers to initialize...
timeout /t 5 /nobreak

:: Open Browser
echo Opening HRMS Website...
start http://localhost:5173

echo ==========================================
echo    HRMS is now running!
echo    Frontend (Dev): http://localhost:5173
echo    Backend/API: http://localhost:5000
echo ==========================================
exit
