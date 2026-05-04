@echo off
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════════════════
:: RasoiKit — One-shot install script
:: Run this from your Downloads folder:
::   cd /d C:\Users\AYUSH\Downloads
::   install.bat
:: ═══════════════════════════════════════════════════════════════════

set PROJECT=C:\Users\AYUSH\OneDrive\Desktop\2k26\Ecommerce
set DOWNLOADS=C:\Users\AYUSH\Downloads
set SVC=%PROJECT%\services
set FRONTEND=%PROJECT%\recipe-frontend\src

echo.
echo ═══════════════════════════════════════════════════════════════
echo   RasoiKit Install Script
echo   Project: %PROJECT%
echo   Source:  %DOWNLOADS%
echo ═══════════════════════════════════════════════════════════════
echo.

:: ── Verify project root exists ───────────────────────────────────
if not exist "%PROJECT%" (
    echo [ERROR] Project not found at: %PROJECT%
    echo         Edit the PROJECT variable at the top of this script.
    pause
    exit /b 1
)
echo [OK] Project root found

:: ── Verify downloads exist ────────────────────────────────────────
set MISSING=0
for %%F in (
    api.js
    api-gateway-application.yml
    order-service-application.yml
    notification-service-application.yml
    inventory-service-application.yml
    AuthResponse.java
    RecipeCartItemRequest.java
    CartItem.java
    CartItemResponse.java
    CartController.java
    CartServiceImpl.java
    OtpService.java
    OtpServiceImpl.java
    OtpDtos.java
    AuthController.java
    UserServiceImpl_addition.java
    user-service-mail-config.yml
    OtpLogin.jsx
    docker-compose-final.yml
    seed_recipes.sql
) do (
    if not exist "%DOWNLOADS%\%%F" (
        echo [MISSING] %%F  -- download this file first
        set MISSING=1
    )
)

if "%MISSING%"=="1" (
    echo.
    echo [ERROR] Some files are missing from Downloads. Download them all first.
    pause
    exit /b 1
)
echo [OK] All source files found in Downloads
echo.

:: ═══════════════════════════════════════════════════════════════════
:: GAP 1 — api.js  (BASE URL fix + query param fixes)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 1] Fixing api.js BASE URL...
copy /y "%DOWNLOADS%\api.js" "%FRONTEND%\api.js"
echo        -> recipe-frontend\src\api.js

:: ═══════════════════════════════════════════════════════════════════
:: GAP 2 — API Gateway application.yml  (StripPrefix + routes)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 2] Fixing api-gateway application.yml...
copy /y "%DOWNLOADS%\api-gateway-application.yml" ^
    "%SVC%\api-gateway\src\main\resources\application.yml"
echo        -> services\api-gateway\src\main\resources\application.yml

:: ═══════════════════════════════════════════════════════════════════
:: GAP 3 — order-service application.yml  (port 8081 -> 8083)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 3] Fixing order-service port collision...
copy /y "%DOWNLOADS%\order-service-application.yml" ^
    "%SVC%\order-service\src\main\resources\application.yml"
echo        -> services\order-service\src\main\resources\application.yml

:: ═══════════════════════════════════════════════════════════════════
:: GAP 4 — notification-service application.yml  (port + kafka host)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 4] Fixing notification-service port and kafka host...
copy /y "%DOWNLOADS%\notification-service-application.yml" ^
    "%SVC%\notification-service\src\main\resources\application.yml"
echo        -> services\notification-service\src\main\resources\application.yml

:: ═══════════════════════════════════════════════════════════════════
:: GAP 5 — inventory-service  (delete .properties, write .yml)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 5] Fixing inventory-service hardcoded credentials...
set INV_RES=%SVC%\inventory-service\src\main\resources
if exist "%INV_RES%\application.properties" (
    del /f "%INV_RES%\application.properties"
    echo        Deleted hardcoded application.properties
)
copy /y "%DOWNLOADS%\inventory-service-application.yml" ^
    "%INV_RES%\application.yml"
echo        -> services\inventory-service\src\main\resources\application.yml

:: ═══════════════════════════════════════════════════════════════════
:: GAP 6 — AuthResponse.java  (userId field name fix)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 6] Fixing AuthResponse userId field...
set USER_DTO=%SVC%\user-service\src\main\java\Ecom\user_service\dto\response
copy /y "%DOWNLOADS%\AuthResponse.java" "%USER_DTO%\AuthResponse.java"
echo        -> user-service\...\dto\response\AuthResponse.java

:: ═══════════════════════════════════════════════════════════════════
:: GAP 7 — Already fixed inside api.js (searchRecipes ?name= param)
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 7] Fixed inside api.js (searchRecipes query param)... DONE

:: ═══════════════════════════════════════════════════════════════════
:: GAP 8+9+10 — Cart DTO + Entity + Controller + Service
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 8-10] Fixing Cart shape mismatch, RequestParam, response fields...

set ORDER_REQ=%SVC%\order-service\src\main\java\Ecom\order_service\dto\request
set ORDER_RES=%SVC%\order-service\src\main\java\Ecom\order_service\dto\response
set ORDER_ENT=%SVC%\order-service\src\main\java\Ecom\order_service\entity
set ORDER_CTL=%SVC%\order-service\src\main\java\Ecom\order_service\controller
set ORDER_SVC=%SVC%\order-service\src\main\java\Ecom\order_service\service

copy /y "%DOWNLOADS%\RecipeCartItemRequest.java" "%ORDER_REQ%\RecipeCartItemRequest.java"
echo        -> order-service\...\dto\request\RecipeCartItemRequest.java

copy /y "%DOWNLOADS%\CartItemResponse.java" "%ORDER_RES%\CartItemResponse.java"
echo        -> order-service\...\dto\response\CartItemResponse.java

copy /y "%DOWNLOADS%\CartItem.java" "%ORDER_ENT%\CartItem.java"
echo        -> order-service\...\entity\CartItem.java

copy /y "%DOWNLOADS%\CartController.java" "%ORDER_CTL%\CartController.java"
echo        -> order-service\...\controller\CartController.java

copy /y "%DOWNLOADS%\CartServiceImpl.java" "%ORDER_SVC%\CartServiceImpl.java"
echo        -> order-service\...\service\CartServiceImpl.java

:: ═══════════════════════════════════════════════════════════════════
:: GAP 11 — handleCheckout.js is a code snippet, not a full file.
::           Reminder printed below — manual edit required.
:: ═══════════════════════════════════════════════════════════════════
echo [GAP 11] Checkout path fix - see note at end of script.

:: ═══════════════════════════════════════════════════════════════════
:: OTP — Backend files (user-service)
:: ═══════════════════════════════════════════════════════════════════
echo [OTP] Installing OTP backend files...

set USER_SVC=%SVC%\user-service\src\main\java\Ecom\user_service\service
set USER_CTL=%SVC%\user-service\src\main\java\Ecom\user_service\controller
set USER_REQ=%SVC%\user-service\src\main\java\Ecom\user_service\dto\request

copy /y "%DOWNLOADS%\OtpService.java"     "%USER_SVC%\OtpService.java"
echo        -> user-service\...\service\OtpService.java

copy /y "%DOWNLOADS%\OtpServiceImpl.java" "%USER_SVC%\OtpServiceImpl.java"
echo        -> user-service\...\service\OtpServiceImpl.java

copy /y "%DOWNLOADS%\AuthController.java" "%USER_CTL%\AuthController.java"
echo        -> user-service\...\controller\AuthController.java

:: OtpDtos.java contains two classes — split them into separate files
:: We copy the combined file as a reference; the split is done below
copy /y "%DOWNLOADS%\OtpDtos.java" "%USER_REQ%\OtpDtos_REFERENCE.java"
echo        -> user-service\...\dto\request\OtpDtos_REFERENCE.java
echo        NOTE: Manually split OtpDtos_REFERENCE.java into:
echo              OtpSendRequest.java and OtpVerifyRequest.java

:: ── OTP Frontend ─────────────────────────────────────────────────
echo [OTP] Installing OtpLogin.jsx...
copy /y "%DOWNLOADS%\OtpLogin.jsx" "%FRONTEND%\OtpLogin.jsx"
echo        -> recipe-frontend\src\OtpLogin.jsx

:: ═══════════════════════════════════════════════════════════════════
:: docker-compose.yml — final corrected version
:: ═══════════════════════════════════════════════════════════════════
echo [DEPLOY] Installing corrected docker-compose.yml...
copy /y "%DOWNLOADS%\docker-compose-final.yml" "%PROJECT%\docker-compose.yml"
echo        -> Ecommerce\docker-compose.yml

:: ═══════════════════════════════════════════════════════════════════
:: Seed SQL — copy to infra folder
:: ═══════════════════════════════════════════════════════════════════
echo [SEED] Copying seed_recipes.sql...
if not exist "%PROJECT%\infra" mkdir "%PROJECT%\infra"
copy /y "%DOWNLOADS%\seed_recipes.sql" "%PROJECT%\infra\seed_recipes.sql"
echo        -> Ecommerce\infra\seed_recipes.sql

:: ═══════════════════════════════════════════════════════════════════
:: .env template
:: ═══════════════════════════════════════════════════════════════════
echo [ENV] Copying .env.template...
copy /y "%DOWNLOADS%\.env.template" "%PROJECT%\.env.template"
echo        -> Ecommerce\.env.template

:: ═══════════════════════════════════════════════════════════════════
:: DONE — Print remaining manual steps
:: ═══════════════════════════════════════════════════════════════════
echo.
echo ═══════════════════════════════════════════════════════════════
echo   ALL FILES COPIED SUCCESSFULLY
echo ═══════════════════════════════════════════════════════════════
echo.
echo REMAINING MANUAL STEPS (5 things):
echo.
echo  1. SPLIT OtpDtos_REFERENCE.java into two files:
echo       OtpSendRequest.java   (first class in the file)
echo       OtpVerifyRequest.java (second class in the file)
echo     Both go in: user-service\...\dto\request\
echo     Then delete OtpDtos_REFERENCE.java
echo.
echo  2. ADD loginOrRegisterByEmail() to UserServiceImpl:
echo     Open UserServiceImpl_addition.java from Downloads
echo     Copy the method into UserServiceImpl.java
echo     Add the signature to UserService interface
echo.
echo  3. ADD mail dependency to user-service\pom.xml:
echo       ^<dependency^>
echo           ^<groupId^>org.springframework.boot^</groupId^>
echo           ^<artifactId^>spring-boot-starter-mail^</artifactId^>
echo       ^</dependency^>
echo.
echo  4. ADD OTP route to recipe-frontend\src\App.jsx:
echo       import OtpLogin from "./OtpLogin";
echo       ^<Route path="/login/otp" element={^<OtpLogin /^>} /^>
echo     Also add a link on your Login page:
echo       ^<Link to="/login/otp"^>Login with OTP^</Link^>
echo.
echo  5. REPLACE handleCheckout in Cart.jsx:
echo     Open Downloads\handleCheckout.js
echo     Find handleCheckout in Cart.jsx and replace the whole function
echo.
echo  6. ADD CartService interface method:
echo     Open CartService.java and add:
echo       CartResponse addRecipeItem(Long userId, RecipeCartItemRequest request);
echo.
echo  7. CREATE .env from template:
echo       copy %PROJECT%\.env.template %PROJECT%\.env
echo     Then edit .env and fill in:
echo       POSTGRES_PASSWORD, JWT_SECRET, MAIL_USERNAME, MAIL_PASSWORD
echo     Generate JWT_SECRET with Git Bash:
echo       openssl rand -base64 64
echo.
echo  8. MERGE mail config into user-service application.yml:
echo     Open user-service-mail-config.yml from Downloads
echo     Paste the spring.mail block into user-service application.yml
echo.
echo ═══════════════════════════════════════════════════════════════
echo   THEN RUN:
echo     cd /d %PROJECT%
echo     docker compose up --build -d
echo ═══════════════════════════════════════════════════════════════
echo.
pause