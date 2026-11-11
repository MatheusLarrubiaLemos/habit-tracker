@echo off
title Habit Tracker - Servidor
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  O Node.js nao esta instalado neste computador.
  echo  Baixe a versao LTS em https://nodejs.org , instale e abra este arquivo de novo.
  echo.
  pause
  exit /b 1
)

if not exist "backend\node_modules\better-sqlite3" (
  echo  Instalando dependencias do servidor - so na primeira vez...
  call npm --prefix backend install
  if errorlevel 1 (
    echo  Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

node backend\server.js
echo.
echo  O servidor foi desligado.
pause
