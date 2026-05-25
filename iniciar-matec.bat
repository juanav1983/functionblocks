@echo off
title MATEC NRD — Inicio

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      MATEC NRD — Iniciando...        ║
echo  ╚══════════════════════════════════════╝
echo.

:: ── Backend (Node.js) ──────────────────────────────────────────
echo  [1/2] Iniciando Backend (puerto 3001)...
start "MATEC Backend" cmd /k "cd /d "%~dp0backend-nrd-matec" && node server.js"

:: Esperar 2 segundos para que el backend arranque primero
timeout /t 2 /nobreak >nul

:: ── Frontend (Vite) ────────────────────────────────────────────
echo  [2/2] Iniciando Frontend (Vite)...
start "MATEC Frontend" cmd /k "cd /d "%~dp0dashboard-nrd-matec" && npm run dev"

echo.
echo  ✅ Ambos procesos iniciados en ventanas separadas.
echo  ✅ Abre http://localhost:5173 en tu navegador.
echo.
pause
