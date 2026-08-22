@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd /d D:\to-do-list\android
call D:\to-do-list\android\gradlew.bat assembleRelease

set APK_DIR=D:\to-do-list\android\app\build\outputs\apk\release
set RELEASE_DIR=D:\to-do-list\apk-releases
set VERSION_FILE=D:\to-do-list\.apk-version

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

set VERSION=0
if exist "%VERSION_FILE%" set /p VERSION=<"%VERSION_FILE%"
set /a VERSION+=1
echo %VERSION%> "%VERSION_FILE%"

copy "%APK_DIR%\app-release.apk" "%RELEASE_DIR%\app-v%VERSION%.apk"
echo.
echo Release APK saved: apk-releases\app-v%VERSION%.apk
