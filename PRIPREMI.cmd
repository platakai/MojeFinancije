@echo off
REM Moje Financije Native - provjera i popravak NodeGUI ovisnosti.
setlocal
cd /d "%~dp0"
if errorlevel 1 (echo Ne mogu otvoriti mapu aplikacije. & exit /b 1)
call npm.cmd --version >nul 2>&1
if errorlevel 1 (echo Node.js/npm nisu dostupni. Zatvorite i ponovno otvorite VS Code. & exit /b 1)
if not exist "node_modules\@nodegui\nodegui\package.json" (
  echo Instaliram pakete i Qt. Ovo moze potrajati nekoliko minuta.
  call npm.cmd install
  if errorlevel 1 (echo Instalacija nije uspjela. Pogledajte pogresku iznad. & exit /b 1)
)
if not exist "node_modules\@nodegui\nodegui\build\Release\nodegui_core.node" (
  echo Nedostaje izvorni NodeGUI modul. Pokusavam obnoviti instalaciju.
  call npm.cmd rebuild @nodegui/nodegui
  if errorlevel 1 (echo Obnova NodeGUI modula nije uspjela. Pogledajte pogresku iznad. & exit /b 1)
)
if not exist "node_modules\@nodegui\nodegui\build\Release\nodegui_core.node" (
  echo Datoteka nodegui_core.node jos uvijek nedostaje.
  exit /b 1
)
if defined QT_INSTALL_DIR goto check_custom_qt
if not exist "node_modules\@nodegui\nodegui\miniqt\6.10.2\msvc2022_64\bin\Qt6Core.dll" (
  echo Nedostaju Qt DLL datoteke. Pokusavam obnoviti instalaciju.
  call npm.cmd rebuild @nodegui/nodegui
  if errorlevel 1 (echo Qt instalacija nije uspjela. Pogledajte pogresku iznad. & exit /b 1)
)
if not exist "node_modules\@nodegui\nodegui\miniqt\6.10.2\msvc2022_64\bin\Qt6Core.dll" (
  echo Qt6Core.dll jos uvijek nedostaje.
  exit /b 1
)
goto ready
:check_custom_qt
if not exist "%QT_INSTALL_DIR%\bin\Qt6Core.dll" (
  echo QT_INSTALL_DIR ne sadrzi bin\Qt6Core.dll.
  exit /b 1
)
:ready
exit /b 0
