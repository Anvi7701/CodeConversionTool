@echo off
echo ============================================
echo Cleaning Vite + React project environment...
echo ============================================

:: Step 1: Delete node_modules
echo Deleting node_modules...
rmdir /s /q node_modules

:: Step 2: Delete package-lock.json
echo Deleting package-lock.json...
del /f /q package-lock.json

:: Step 3: Clear npm cache
echo Clearing npm cache...
npm cache clean --force

:: Step 4: Reinstall dependencies
echo Reinstalling dependencies...
npm install

:: Step 5: Start Vite dev server
echo Starting Vite development server...
npm run dev

pause