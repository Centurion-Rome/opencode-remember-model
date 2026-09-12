@echo off
setlocal EnableExtensions

title OpenCode - Remember Last Model - Install

set "SOURCE=%~dp0"
set "TARGET=%USERPROFILE%\.config\opencode\plugins\remember-last-model"

echo.
echo ================================================
echo   OpenCode Remember Last Model - Install
echo ================================================
echo.
echo Source:
echo   "%SOURCE%"
echo.
echo Target:
echo   "%TARGET%"
echo.

if not exist "%SOURCE%\index.ts" (
    echo ERROR: Could not find index.ts in the plugin package.
    echo Make sure install.bat is in the root of the opencode-remember-model repo.
    echo.
    pause
    exit /b 1
)

if not exist "%USERPROFILE%\.config\opencode\plugins" (
    mkdir "%USERPROFILE%\.config\opencode\plugins"
    if errorlevel 1 (
        echo ERROR: Could not create the OpenCode plugins directory.
        pause
        exit /b 1
    )
)

if exist "%TARGET%" (
    echo Existing installation found. Updating it...
) else (
    echo Installing plugin...
)

if not exist "%TARGET%" mkdir "%TARGET%"

copy /Y "%SOURCE%\index.ts" "%TARGET%\index.ts" >nul
if errorlevel 1 (
    echo ERROR: Failed to copy index.ts.
    pause
    exit /b 1
)

if exist "%SOURCE%\README.md" copy /Y "%SOURCE%\README.md" "%TARGET%\README.md" >nul
if exist "%SOURCE%\LICENSE" copy /Y "%SOURCE%\LICENSE" "%TARGET%\LICENSE" >nul

echo.
echo SUCCESS: Plugin installed globally.
echo.
echo OpenCode global plugin directory:
echo   "%TARGET%"
echo.
echo Restart OpenCode completely for the plugin to load.
echo.
echo You can verify the plugin with:
echo   opencode plugin list
echo.

pause
exit /b 0
