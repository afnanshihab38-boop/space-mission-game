@echo off
title COSMODEX — Space Mission Design Game
echo ========================================================
echo   COSMODEX - NASA Space Apps Challenge 2026
echo   Starting local game server...
echo ========================================================
start "" http://localhost:3000
node server.js
pause
