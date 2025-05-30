@echo off
echo ===============================================
echo    InnovalApp - Configuración de Docker
echo ===============================================
echo.

echo 1. Verificando Docker Desktop...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no está instalado o no está ejecutándose
    echo Por favor, inicia Docker Desktop y vuelve a ejecutar este script
    pause
    exit /b 1
)
echo [OK] Docker está disponible

echo.
echo 2. Levantando contenedores MySQL y phpMyAdmin...
docker-compose up -d

echo.
echo 3. Esperando que MySQL esté listo...
timeout /t 10

echo.
echo 4. Generando cliente de Prisma...
npx prisma generate

echo.
echo 5. Aplicando schema a la base de datos...
npx prisma db push

echo.
echo ===============================================
echo           Configuración completada
echo ===============================================
echo.
echo Servicios disponibles:
echo - Base de datos MySQL: localhost:3306
echo - phpMyAdmin: http://localhost:8080
echo.
echo Credenciales:
echo - Usuario DB: innovalapp_user
echo - Password DB: innovalapp_password
echo - Usuario phpMyAdmin: root
echo - Password phpMyAdmin: rootpassword
echo.
echo Para ver el estado de los contenedores:
echo   docker-compose ps
echo.
echo Para ver logs:
echo   docker-compose logs
echo.
echo Para parar los contenedores:
echo   docker-compose down
echo.
pause 