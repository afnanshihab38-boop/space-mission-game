@echo off
title Deploy COSMODEX to Vercel
echo ========================================================
echo   Deploying COSMODEX to Vercel
echo ========================================================
echo.
echo Step 1: Logging in to Vercel (your browser will open)...
call npx vercel login
if errorlevel 1 (
    echo Login failed or was cancelled.
    pause
    exit /b %errorlevel%
)
echo.
echo Step 2: Deploying to Production...
call npx vercel deploy --prod --yes
echo.
echo ========================================================
echo   Deployment Complete! Check the URL above.
echo ========================================================
pause

