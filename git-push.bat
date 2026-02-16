@echo off
echo Starting Git Push Process...

:: Add all changes
echo Adding files...
git add .
if %errorlevel% neq 0 (
    echo Error adding files.
    pause
    exit /b %errorlevel%
)

:: Commit changes with timestamp
set "timestamp=%date% %time%"
echo Committing changes...
git commit -m "Auto-commit: %timestamp%"

:: Push to remote
echo Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo Error pushing to GitHub. Please check your internet connection or credentials.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo Code successfully pushed to GitHub!
echo ==========================================
echo.
pause
