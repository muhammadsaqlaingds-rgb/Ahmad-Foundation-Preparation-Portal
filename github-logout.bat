@echo off
title GitHub Account Logout & Cleanup

echo ================================================
echo   GitHub Account Logout - Full Cleanup Tool
echo ================================================
echo.

:: ── 1. GitHub CLI logout ────────────────────────
echo [1/5] Checking GitHub CLI (gh)...
where gh >nul 2>&1
if %errorlevel% == 0 (
    echo       Found! Logging out...
    gh auth logout --hostname github.com
) else (
    echo       GitHub CLI not installed - skipping.
)
echo.

:: ── 2. Windows Credential Manager ───────────────
echo [2/5] Removing GitHub from Windows Credential Manager...
cmdkey /delete:git:https://github.com >nul 2>&1
cmdkey /delete:https://github.com >nul 2>&1
cmdkey /delete:github.com >nul 2>&1
echo       Done.
echo.

:: ── 3. Git global user config ───────────────────
echo [3/5] Clearing git user.name and user.email...
git config --global --unset user.name >nul 2>&1
git config --global --unset user.email >nul 2>&1
echo       Done.
echo.

:: ── 4. Credential helper ────────────────────────
echo [4/5] Clearing git credential helper...
git config --global --unset credential.helper >nul 2>&1
echo       Done.
echo.

:: ── 5. Session tokens ───────────────────────────
echo [5/5] Clearing session tokens...
set GITHUB_TOKEN=
set GH_TOKEN=
echo       Done.
echo.

echo ================================================
echo   SUCCESS! All GitHub credentials removed.
echo   You can now log in with a new account.
echo ================================================
echo.
echo Press any key to close...
pause >nul
