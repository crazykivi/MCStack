@echo off
mode 60,20 >nul
chcp 65001 >nul

:: Proverka, ustanovlen li Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    goto docker_not_found
)

:: Osnovnoe menu
:start
cls
echo.
echo         ========== MCStack Manager ==========
echo.
echo  [1] Start all services (all)
echo  [2] Start local-redis (without frontend)
echo  [3] Start frontend (without redis)
echo  [4] Start only API
echo  [5] Stop containers
echo  [6] Restart containers
echo  [7] View logs
echo  [0] Exit
echo.
set /p "choice=Select action (1-7) or 0 to exit: "

if "%choice%"=="1" (
    set COMPOSE_PROFILES=all
    docker compose up -d
    echo Started with profile: all
    pause
    goto start
)

if "%choice%"=="2" (
    set COMPOSE_PROFILES=local-redis
    docker compose up -d
    echo Started with profile: local-redis
    pause
    goto start
)

if "%choice%"=="3" (
    set COMPOSE_PROFILES=frontend
    docker compose up -d
    echo Started with profile: frontend
    pause
    goto start
)

if "%choice%"=="4" (
    set COMPOSE_PROFILES=
    docker compose up -d
    echo Only API started
    pause
    goto start
)

if "%choice%"=="5" (
    docker compose down
    echo Containers stopped
    pause
    goto start
)

if "%choice%"=="6" (
    docker compose restart
    echo Containers restarted
    pause
    goto start
)

if "%choice%"=="7" (
    docker compose logs -f
    pause
    goto start
)

if "%choice%"=="0" (
    echo Exiting...
    exit /b
)

echo Invalid choice...
pause
goto start

:: Esli Docker ne naiden
:docker_not_found
cls
echo.
echo         ========== MCStack Manager ==========
echo.
echo    Error: Docker is not installed or unavailable!
echo    Important: If you already have Docker installed but it says 
echo    that Docker is unavailable:
echo    Restart Docker and the start.bat script after
echo    Docker starts.
echo.
echo    [1] Install Docker Desktop
echo    [0] Exit
echo.
set /p "choice=Select action (1 or 0): "

if "%choice%"=="1" (
    echo Installing Docker Desktop...
    echo Downloading installer...

    :: Skachivanie Docker s proverkoi i User-Agent
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe ' -OutFile '%TEMP%\DockerInstaller.exe' -Headers @{'User-Agent'='Windows'}"

    echo Checking download...
    if not exist "%TEMP%\DockerInstaller.exe" (
        echo Error: Failed to download installer!
        pause
        goto docker_not_found
    )

    echo Running installer...
    start /wait "" "%TEMP%\DockerInstaller.exe"
    echo Installation complete.

    echo Deleting installer...
    del /f /q "%TEMP%\DockerInstaller.exe" >nul

    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    echo Waiting for Docker to start...
    timeout /t 15 >nul
    echo Restarting terminal after Docker installation.
    start "" "%COMSPEC%" /k "%cd%\%~nx0"
    
    exit /b
)

if "%choice%"=="0" (
    echo Exiting...
    exit /b
)

echo Invalid choice...
pause
goto docker_not_found