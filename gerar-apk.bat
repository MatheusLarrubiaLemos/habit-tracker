@echo off
title Habit Tracker - Gerar APK
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo  O Node.js nao esta instalado. Baixe em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\@capacitor\cli" (
  echo  Instalando dependencias do app - so na primeira vez...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

echo  [1/3] Copiando o app (pasta www) para o projeto Android...
call npx cap sync android
if errorlevel 1 ( pause & exit /b 1 )

if not defined JAVA_HOME (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)

echo  [2/3] Compilando o APK (pode levar alguns minutos na primeira vez)...
pushd android
call gradlew.bat assembleDebug
if errorlevel 1 ( popd & echo  Falha ao compilar. Tente abrir a pasta android no Android Studio. & pause & exit /b 1 )
popd

echo  [3/3] Copiando o APK para a Area de Trabalho...
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "%USERPROFILE%\Desktop\HabitTracker.apk" >nul

echo.
echo  Pronto! O arquivo HabitTracker.apk esta na sua Area de Trabalho.
echo  Mande para o celular (cabo USB, Google Drive, WhatsApp...) e instale.
echo.
pause
