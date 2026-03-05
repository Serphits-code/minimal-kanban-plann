@echo off
echo Reiniciando servidor frontend...
echo Parando processos existentes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Iniciando servidor frontend...
start "Frontend Server" cmd /k "npm run dev"
echo Servidor frontend iniciado!
echo.
echo Para acessar: http://localhost:5000
pause