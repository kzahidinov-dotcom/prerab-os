@echo off
title Prerab OS - Запуск системы управления компанией
echo ============================================================
echo   PRERAB OS - СИСТЕМА УПРАВЛЕНИЯ СТРОИТЕЛЬНОЙ КОМПАНИЕЙ
echo   0 EUR Cloud Stack ^| ERP ^| CRM ^| Výkaz výmer ^| DPH ^| PAY by square
echo ============================================================
echo.
echo Запуск локального сервера...
set "PATH=%PATH%;C:\Program Files\nodejs"
start http://localhost:3000
npm.cmd run dev
pause
