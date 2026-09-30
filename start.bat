@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Meta Studio - Toc Chien
if not exist "node_modules\playwright-core" (
  echo Cai dat lan dau...
  call npm install
)
node scripts\server.mjs --open
pause
