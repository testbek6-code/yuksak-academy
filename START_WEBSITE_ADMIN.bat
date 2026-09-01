@echo off
title YUKSAK ACADEMY - WEB SERVER & ADMIN
echo ========================================================
echo YUKSAK ACADEMY Web Server starting...
echo.
echo Website: http://localhost:5000
echo Admin Panel: http://localhost:5000/admin
echo Admin Login: aziz67876578
echo Admin Password: 67596854903876584
echo ========================================================
echo.
timeout /t 2 >nul
start http://localhost:5000/admin
python website/app.py
pause
