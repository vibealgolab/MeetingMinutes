@echo off
echo Building Meeting Minutes AI...

:: 1. Variables
set "DIST_DIR=dist_electron\win-unpacked"
set "RECORDINGS_DIR=%DIST_DIR%\Recordings"
set "BACKUP_DIR=_Recordings_Backup"

:: 2. Backup Recordings if they exist
if exist "%RECORDINGS_DIR%" (
    echo [Backup] Found Recordings folder. Backing up to %BACKUP_DIR%...
    if exist "%BACKUP_DIR%" rd /s /q "%BACKUP_DIR%"
    xcopy "%RECORDINGS_DIR%" "%BACKUP_DIR%\" /E /I /H /Y
) else (
    echo [Backup] No existing Recordings folder found. Skipping backup.
)

:: 3. Run Build
call npm run build

:: 4. Restore Recordings if backup exists
if exist "%BACKUP_DIR%" (
    echo [Restore] Restoring Recordings from %BACKUP_DIR%...
    if not exist "%RECORDINGS_DIR%" mkdir "%RECORDINGS_DIR%"
    xcopy "%BACKUP_DIR%" "%RECORDINGS_DIR%\" /E /I /H /Y
    
    echo [Cleanup] Removing backup folder...
    rd /s /q "%BACKUP_DIR%"
) else (
    echo [Restore] No backup found to restore.
)

echo.
echo Build Complete!
pause
