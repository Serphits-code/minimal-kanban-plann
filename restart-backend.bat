@echo off
echo Reiniciando servidor backend...
cd backend
echo Parando processos existentes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Iniciando servidor backend...
start "Backend Server" cmd /k "npm run dev"
echo Servidor backend iniciado!
echo.
echo Para testar: http://localhost:3001/api/health
pause