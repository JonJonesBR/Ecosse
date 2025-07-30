@echo off
echo Building Ecosse Production Assets...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the production build
echo Running production build...
node build-production.js

if %errorlevel% equ 0 (
    echo.
    echo ✓ Production build completed successfully!
    echo.
    echo Generated files:
    echo - css/tailwind.min.css
    echo - css/*.min.css (minified CSS files)
    echo - css/bundle.min.css (combined CSS bundle)
    echo - build-report.json (build statistics)
    echo.
) else (
    echo.
    echo ✗ Production build failed!
    echo Check the error messages above for details.
    echo.
)

pause