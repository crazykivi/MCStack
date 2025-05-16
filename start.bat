@echo off
mode 60,20 >nul
chcp 65001 >nul

:: Проверка, установлен ли Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    goto docker_not_found
)

:: Основное меню
:start
cls
echo.
echo         ========== MCStack Manager ==========
echo.
echo  [1] Запустить все сервисы (all)
echo  [2] Запустить local-redis (без frontend)
echo  [3] Запустить frontend (без redis)
echo  [4] Запустить только API
echo  [5] Остановить контейнеры
echo  [6] Перезапустить контейнеры
echo  [7] Посмотреть логи
echo  [0] Выход
echo.
set /p "choice=Выберите действие (1-7) или 0 для выхода: "

if "%choice%"=="1" (
    set COMPOSE_PROFILES=all
    docker compose up -d
    echo Запущено с профилем: all
    pause
    goto start
)

if "%choice%"=="2" (
    set COMPOSE_PROFILES=local-redis
    docker compose up -d
    echo Запущено с профилем: local-redis
    pause
    goto start
)

if "%choice%"=="3" (
    set COMPOSE_PROFILES=frontend
    docker compose up -d
    echo Запущено с профилем: frontend
    pause
    goto start
)

if "%choice%"=="4" (
    set COMPOSE_PROFILES=
    docker compose up -d
    echo Запущен только API
    pause
    goto start
)

if "%choice%"=="5" (
    docker compose down
    echo Контейнеры остановлены
    pause
    goto start
)

if "%choice%"=="6" (
    docker compose restart
    echo Контейнеры перезапущены
    pause
    goto start
)

if "%choice%"=="7" (
    docker compose logs -f
    pause
    goto start
)

if "%choice%"=="0" (
    echo Выход...
    exit /b
)

echo Неверный выбор...
pause
goto start

:: Если Docker не найден
:docker_not_found
cls
echo.
echo         ========== MCStack Manager ==========
echo.
echo    Ошибка: Docker не установлен или недоступен!
echo    Важно: Если у вас уже установлен Docker, но пишет, 
echo    что Docker не доступен:
echo    Перезапустите Docker и скрипт start.bat после
echo    запуска Docker.
echo.
echo    [1] Установить Docker Desktop
echo    [0] Выйти
echo.
set /p "choice=Выберите действие (1 или 0): "

if "%choice%"=="1" (
    echo Установка Docker Desktop...
    echo Скачивание установщика...

    :: Скачивание Docker с проверкой и User-Agent
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe ' -OutFile '%TEMP%\DockerInstaller.exe' -Headers @{'User-Agent'='Windows'}"

    echo Проверка загрузки...
    if not exist "%TEMP%\DockerInstaller.exe" (
        echo Ошибка: Не удалось скачать установщик!
        pause
        goto docker_not_found
    )

    echo Запуск установщика...
    start /wait "" "%TEMP%\DockerInstaller.exe"
    echo Установка завершена.

    echo Удаление установщика...
    del /f /q "%TEMP%\DockerInstaller.exe" >nul

    echo Запуск Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    echo Ожидание запуска Docker...
    timeout /t 15 >nul
    echo Перезапуск терминала после установки Docker.
    start "" "%COMSPEC%" /k "%cd%\%~nx0"
    
    exit /b
)

if "%choice%"=="0" (
    echo Выход...
    exit /b
)

echo Неверный выбор...
pause
goto docker_not_found