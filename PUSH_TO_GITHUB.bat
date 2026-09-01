@echo off
title GitHub'ga yuklash - Yuksak Academy
echo ========================================
echo   LOYIHANI GITHUB'GA YUKLASH SKRIPTI
echo ========================================
echo.

set REPO_URL=github.com/testbek6-code/yuksak-academy.git
set TOKEN=YOUR_GITHUB_TOKEN

echo [+] GitHub'ga avtomatik yuklash boshlanmoqda...
git config --global http.postBuffer 524288000
git config --global http.sslVerify false
git add .
git commit -m "Auto Update Yuksak Academy Bot and Website"
git branch -M main

git remote remove origin >nul 2>&1
git remote add origin https://%TOKEN%@%REPO_URL%

echo.
echo GitHub'ga yuklanmoqda...
git push -u origin main --force

echo.
echo ========================================
echo   TAYYOR! Loyiha GitHub'ga yuklandi.
echo ========================================
pause
