@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd /d D:\to-do-list\android
call D:\to-do-list\android\gradlew.bat assembleDebug

set APK_DIR=D:\to-do-list\android\app\build\outputs\apk\debug
set RELEASE_DIR=D:\to-do-list\apk-releases

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

copy /y "%APK_DIR%\app-debug.apk" "%RELEASE_DIR%\app-v31-dev.apk"
echo.
echo Dev APK saved: %RELEASE_DIR%\app-v31-dev.apk
