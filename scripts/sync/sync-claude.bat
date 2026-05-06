@echo off
REM sync-claude.bat - Bidirectional sync wrapper for Windows
REM Usage: sync-claude.bat [to-server|to-local|bidirectional]

setlocal

set "SCRIPT_DIR=%~dp0"
set "UNISON=D:\Softwares_new\unison-2.53.8-windows-x86_64\bin\unison.exe"
set "SSH_KEY=C:\Users\Mac\.ssh\id_ed25519_scholars_tea"
set "SSH_USER=zju321"
set "SSH_HOST=10.72.212.33"

REM Actual path (C:\Users\Mac\.claude is a symlink to /e/PostGraduate/...)
set "LOCAL_DIR=E:\PostGraduate\Science_softwares\Claude_CLI\.claude"
set "REMOTE_DIR=/data/home/zju321/.claude"

echo ====================================
echo   Claude Memory Bidirectional Sync
echo ====================================
echo.

if "%1"=="" goto usage
if "%1"=="to-server" goto to_server
if "%1"=="to-local" goto to_local
if "%1"=="bidirectional" goto bidirectional
goto usage

:to_server
echo [1/1] Syncing Local ^<- Server (Local wins)
echo.
"%UNISON%" "%LOCAL_DIR%" "ssh://%SSH_USER%@%SSH_HOST%%REMOTE_DIR%" ^
  -sshargs "-i %SSH_KEY%" ^
  -auto -batch ^
  -prefer "%LOCAL_DIR%" ^
  -ignore "Path {*.log}" ^
  -ignore "Path {*.tmp}" ^
  -ignore "Path {*.swp}" ^
  -ignore "Path {.DS_Store}" ^
  -ignore "Path {Thumbs.db}"
goto done

:to_local
echo [1/1] Syncing Server ^<- Local (Remote wins)
echo.
"%UNISON%" "%LOCAL_DIR%" "ssh://%SSH_USER%@%SSH_HOST%%REMOTE_DIR%" ^
  -sshargs "-i %SSH_KEY%" ^
  -auto -batch ^
  -prefer "%REMOTE_DIR%" ^
  -ignore "Path {*.log}" ^
  -ignore "Path {*.tmp}" ^
  -ignore "Path {*.swp}" ^
  -ignore "Path {.DS_Store}" ^
  -ignore "Path {Thumbs.db}"
goto done

:bidirectional
echo [1/3] Step 1: Local ^<- Remote (Server wins in conflicts)
echo.
"%UNISON%" "%LOCAL_DIR%" "ssh://%SSH_USER%@%SSH_HOST%%REMOTE_DIR%" ^
  -sshargs "-i %SSH_KEY%" ^
  -auto -batch ^
  -prefer "%REMOTE_DIR%" ^
  -ignore "Path {*.log}" ^
  -ignore "Path {*.tmp}" ^
  -ignore "Path {*.swp}" ^
  -ignore "Path {.DS_Store}" ^
  -ignore "Path {Thumbs.db}"

echo.
echo [2/3] Step 2: Pushing local changes to server
echo.
"%UNISON%" "%LOCAL_DIR%" "ssh://%SSH_USER%@%SSH_HOST%%REMOTE_DIR%" ^
  -sshargs "-i %SSH_KEY%" ^
  -auto -batch ^
  -prefer "%LOCAL_DIR%" ^
  -ignore "Path {*.log}" ^
  -ignore "Path {*.tmp}" ^
  -ignore "Path {*.swp}" ^
  -ignore "Path {.DS_Store}" ^
  -ignore "Path {Thumbs.db}"

echo.
echo [3/3] Step 3: Pulling any remaining server changes
echo.
"%UNISON%" "%LOCAL_DIR%" "ssh://%SSH_USER%@%SSH_HOST%%REMOTE_DIR%" ^
  -sshargs "-i %SSH_KEY%" ^
  -auto -batch ^
  -prefer "%REMOTE_DIR%" ^
  -ignore "Path {*.log}" ^
  -ignore "Path {*.tmp}" ^
  -ignore "Path {*.swp}" ^
  -ignore "Path {.DS_Store}" ^
  -ignore "Path {Thumbs.db}"
goto done

:usage
echo Usage: sync-claude.bat [to-server^|to-local^|bidirectional]
echo.
echo   to-server     - Push local changes to server (local wins)
echo   to-local      - Pull server changes to local (server wins)
echo   bidirectional - Full bidirectional sync (3-step)
echo.
exit /b 1

:done
echo.
echo ====================================
echo   Sync Complete
echo ====================================
endlocal
