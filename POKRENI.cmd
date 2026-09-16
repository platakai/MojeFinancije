@echo off
REM Moje Financije Native - pokretanje aplikacije na Windowsima.
setlocal
cd /d "%~dp0"
call "%~dp0PRIPREMI.cmd"
if errorlevel 1 (
  pause
  exit /b 1
)
call npm.cmd start
set "APP_EXIT=%ERRORLEVEL%"
if not "%APP_EXIT%"=="0" echo Aplikacija je zavrsila s greskom %APP_EXIT%.
pause
exit /b %APP_EXIT%
