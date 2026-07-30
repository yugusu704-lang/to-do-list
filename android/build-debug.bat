@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd /d D:\to-do-list\android
call D:\to-do-list\android\gradlew.bat assembleDebug

set APK_DIR=D:\to-do-list\android\app\build\outputs\apk\debug
set RELEASE_DIR=D:\to-do-list\apk-releases
set VERSION_FILE=D:\to-do-list\.apk-version

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

set VERSION=0
if exist "%VERSION_FILE%" set /p VERSION=<"%VERSION_FILE%"
set /a VERSION+=1
echo %VERSION%> "%VERSION_FILE%"

copy "%APK_DIR%\app-debug.apk" "%RELEASE_DIR%\app-v%VERSION%.apk"
echo.
echo APK saved: apk-releases\app-v%VERSION%.apk
