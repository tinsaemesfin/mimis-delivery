@echo off
echo ========================================
echo MIMI'S DELIVERY - RELEASE BUILD SCRIPT
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
cd android
call gradlew clean
echo.

echo [2/4] Building release AAB...
call gradlew bundleRelease --exclude-task configureCMakeRelWithDebInfo
echo.

echo [3/4] Checking build output...
if exist "app\build\outputs\bundle\release\app-release.aab" (
    echo ✅ AAB build successful!
    echo.
    echo [4/4] Build information:
    dir app\build\outputs\bundle\release\app-release.aab
    echo.
    echo 📁 AAB Location: android\app\build\outputs\bundle\release\app-release.aab
    echo 🔑 Signed with: release.keystore
    echo 📱 Ready for Google Play Store upload!
) else (
    echo ❌ AAB build failed!
    echo Check the build logs above for errors.
)

echo.
echo ========================================
echo Build process completed!
echo ========================================
pause 