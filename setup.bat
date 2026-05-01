@echo off
setlocal enabledelayedexpansion

:: ─────────────────────────────────────────────────────────────────────────────
:: Recipe Delivery Platform — Full Cleanup + Observability Setup
:: Run this from the ROOT of your cloned repo:
::   cd C:\path\to\recipe-delivery-platform
::   setup.bat
:: ─────────────────────────────────────────────────────────────────────────────

echo.
echo ============================================================
echo  Recipe Delivery Platform — Repo Cleanup + Observability
echo ============================================================
echo.

:: Confirm we are in the right folder
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found.
    echo Make sure you run this script from the ROOT of your repo.
    echo Example: cd C:\Users\Ayush\recipe-delivery-platform
    pause
    exit /b 1
)

echo [1/7] Deleting junk files and folders...
echo.

:: Delete .idea (IntelliJ IDE folder — never commit)
if exist ".idea" (
    rmdir /s /q ".idea"
    echo   Deleted: .idea\
)

:: Delete stray src folder (leftover from early dev)
if exist "src" (
    rmdir /s /q "src"
    echo   Deleted: src\
)

:: Delete saga folder (will be merged into payment-service)
if exist "saga" (
    rmdir /s /q "saga"
    echo   Deleted: saga\
)

:: Delete zip binaries (never commit compiled artifacts)
if exist "order-service.zip" (
    del /f /q "order-service.zip"
    echo   Deleted: order-service.zip
)
if exist "payment-service.zip" (
    del /f /q "payment-service.zip"
    echo   Deleted: payment-service.zip
)

:: Delete stray 'git' file (not a folder, just a loose file)
if exist "git" (
    del /f /q "git"
    echo   Deleted: git
)

:: Delete find_dbs.py from root (moving to infra\scripts)
if exist "find_dbs.py" (
    del /f /q "find_dbs.py"
    echo   Deleted: find_dbs.py (already moved to infra\scripts)
)

:: Delete committed .env (has real credentials — dangerous)
if exist ".env" (
    del /f /q ".env"
    echo   Deleted: .env  ^<-- IMPORTANT: remove from git history too! See README.
)

echo.
echo [2/7] Creating target folder structure...
echo.

:: Create services folder and move all service folders in
if not exist "services" mkdir services

:: Move each service into services\ (skip if already moved)
for %%S in (api-gateway service-registry user-service recipe-service admin-service payment-service) do (
    if exist "%%S" (
        if not exist "services\%%S" (
            move "%%S" "services\%%S" >nul
            echo   Moved: %%S  ->  services\%%S
        )
    )
)

:: inventory-service has double nesting: inventory-service\inventory-service
if exist "inventory-service\inventory-service" (
    if not exist "services\inventory-service" (
        move "inventory-service\inventory-service" "services\inventory-service" >nul
        rmdir /s /q "inventory-service"
        echo   Moved + flattened: inventory-service\inventory-service  ->  services\inventory-service
    )
) else if exist "inventory-service" (
    if not exist "services\inventory-service" (
        move "inventory-service" "services\inventory-service" >nul
        echo   Moved: inventory-service  ->  services\inventory-service
    )
)

:: order-service has double nesting: order-service\order-service
if exist "order-service\order-service" (
    if not exist "services\order-service" (
        move "order-service\order-service" "services\order-service" >nul
        rmdir /s /q "order-service"
        echo   Moved + flattened: order-service\order-service  ->  services\order-service
    )
) else if exist "order-service" (
    if not exist "services\order-service" (
        move "order-service" "services\order-service" >nul
        echo   Moved: order-service  ->  services\order-service
    )
)

:: notification-service has double nesting: notification-service\notification-service
if exist "notification-service\notification-service" (
    if not exist "services\notification-service" (
        move "notification-service\notification-service" "services\notification-service" >nul
        rmdir /s /q "notification-service"
        echo   Moved + flattened: notification-service\notification-service  ->  services\notification-service
    )
) else if exist "notification-service" (
    if not exist "services\notification-service" (
        move "notification-service" "services\notification-service" >nul
        echo   Moved: notification-service  ->  services\notification-service
    )
)

:: Create infra folder and move docker + seed_data in
if not exist "infra\docker" mkdir "infra\docker"
if not exist "infra\scripts" mkdir "infra\scripts"

if exist "docker" (
    :: Copy contents of docker\ into infra\docker\
    xcopy /e /y /q "docker\*" "infra\docker\" >nul
    rmdir /s /q "docker"
    echo   Moved: docker\  ->  infra\docker\
)

if exist "seed_data.py" (
    move "seed_data.py" "infra\scripts\seed_data.py" >nul
    echo   Moved: seed_data.py  ->  infra\scripts\seed_data.py
)

:: Create observability folder structure
if not exist "observability\prometheus" mkdir "observability\prometheus"
if not exist "observability\grafana\provisioning\datasources" mkdir "observability\grafana\provisioning\datasources"
if not exist "observability\grafana\provisioning\dashboards" mkdir "observability\grafana\provisioning\dashboards"
if not exist "observability\grafana\dashboards" mkdir "observability\grafana\dashboards"

echo   Created: observability\ structure
echo.

echo [3/7] Writing docker-compose.yml...
echo.

:: Write docker-compose.yml using PowerShell to avoid BOM/encoding issues
powershell -Command "$content = @'
networks:
  ecom-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  zookeeper-data:
  kafka-data:
  grafana-data:

services:

  # INFRASTRUCTURE

  postgres:
    image: postgres:16-alpine
    container_name: ecom-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_MULTIPLE_DATABASES: userDB,orderServiceDB,inventoryDB,paymentDB,recipeDB,adminDB
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infra/docker/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh:ro
    ports:
      - ""5432:5432""
    networks:
      - ecom-net
    healthcheck:
      test: [""CMD-SHELL"", ""pg_isready -U postgres""]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ecom-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    ports:
      - ""6379:6379""
    networks:
      - ecom-net
    healthcheck:
      test: [""CMD"", ""redis-cli"", ""ping""]
      interval: 10s
      timeout: 5s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    container_name: ecom-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
    ports:
      - ""2181:2181""
    networks:
      - ecom-net

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: ecom-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: ""true""
    volumes:
      - kafka-data:/var/lib/kafka/data
    ports:
      - ""9092:9092""
    networks:
      - ecom-net

  # OBSERVABILITY

  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: ecom-prometheus
    restart: unless-stopped
    volumes:
      - ./observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - ""9090:9090""
    networks:
      - ecom-net
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=7d'

  grafana:
    image: grafana/grafana:10.4.0
    container_name: ecom-grafana
    restart: unless-stopped
    depends_on:
      - prometheus
    ports:
      - ""3000:3000""
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./observability/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./observability/grafana/dashboards:/var/lib/grafana/dashboards:ro
    networks:
      - ecom-net

  # MICROSERVICES

  service-registry:
    build:
      context: ./services/service-registry
      dockerfile: Dockerfile
    container_name: ecom-service-registry
    restart: unless-stopped
    ports:
      - ""8761:8761""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8761

  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    container_name: ecom-api-gateway
    restart: unless-stopped
    depends_on:
      service-registry:
        condition: service_started
    ports:
      - ""8080:8080""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8080
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true
      - JWT_SECRET=${JWT_SECRET}

  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    container_name: ecom-user-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      service-registry:
        condition: service_started
    ports:
      - ""8084:8084""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8084
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/userDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_DATA_REDIS_HOST=redis
      - SPRING_DATA_REDIS_PORT=6379
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true

  recipe-service:
    build:
      context: ./services/recipe-service
      dockerfile: Dockerfile
    container_name: ecom-recipe-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_started
    ports:
      - ""8081:8081""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8081
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/recipeDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true

  inventory-service:
    build:
      context: ./services/inventory-service
      dockerfile: Dockerfile
    container_name: ecom-inventory-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_started
      kafka:
        condition: service_started
    ports:
      - ""8082:8082""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8082
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/inventoryDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true
      - EUREKA_INSTANCE_HOSTNAME=ecom-inventory-service

  order-service:
    build:
      context: ./services/order-service
      dockerfile: Dockerfile
    container_name: ecom-order-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_started
      kafka:
        condition: service_started
    ports:
      - ""8083:8083""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8083
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/orderServiceDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true

  payment-service:
    build:
      context: ./services/payment-service
      dockerfile: Dockerfile
    container_name: ecom-payment-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_started
      kafka:
        condition: service_started
    ports:
      - ""8085:8085""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8085
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/paymentDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true

  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    container_name: ecom-notification-service
    restart: unless-stopped
    depends_on:
      service-registry:
        condition: service_started
      kafka:
        condition: service_started
    ports:
      - ""8086:8086""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8086
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true
      - SPRING_MAIL_USERNAME=${MAIL_USERNAME}
      - SPRING_MAIL_PASSWORD=${MAIL_PASSWORD}
      - NOTIFICATION_MAIL_FROM=${MAIL_FROM}

  admin-service:
    build:
      context: ./services/admin-service
      dockerfile: Dockerfile
    container_name: ecom-admin-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_started
    ports:
      - ""8087:8087""
    networks:
      - ecom-net
    environment:
      - SERVER_PORT=8087
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/adminDB
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://service-registry:8761/eureka
      - EUREKA_INSTANCE_PREFER_IP_ADDRESS=true
'@
[System.IO.File]::WriteAllLines('docker-compose.yml', $content, [System.Text.UTF8Encoding]::new($false))"

echo   Written: docker-compose.yml
echo.

echo [4/7] Writing observability\prometheus\prometheus.yml...
powershell -Command "$content = @'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: recipe-delivery-platform

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: [localhost:9090]

  - job_name: api-gateway
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [api-gateway:8080]

  - job_name: service-registry
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [service-registry:8761]

  - job_name: user-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [user-service:8084]

  - job_name: recipe-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [recipe-service:8081]

  - job_name: inventory-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [inventory-service:8082]

  - job_name: order-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [order-service:8083]

  - job_name: payment-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [payment-service:8085]

  - job_name: notification-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [notification-service:8086]

  - job_name: admin-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: [admin-service:8087]
'@
[System.IO.File]::WriteAllLines('observability\prometheus\prometheus.yml', $content, [System.Text.UTF8Encoding]::new($false))"

echo   Written: observability\prometheus\prometheus.yml
echo.

echo [5/7] Writing Grafana provisioning files...

powershell -Command "$content = @'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      timeInterval: 15s
      httpMethod: POST
'@
[System.IO.File]::WriteAllLines('observability\grafana\provisioning\datasources\datasource.yml', $content, [System.Text.UTF8Encoding]::new($false))"

powershell -Command "$content = @'
apiVersion: 1

providers:
  - name: Recipe Delivery Platform
    orgId: 1
    folder: Microservices
    type: file
    disableDeletion: false
    editable: true
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
'@
[System.IO.File]::WriteAllLines('observability\grafana\provisioning\dashboards\dashboards.yml', $content, [System.Text.UTF8Encoding]::new($false))"

echo   Written: observability\grafana\provisioning\datasources\datasource.yml
echo   Written: observability\grafana\provisioning\dashboards\dashboards.yml
echo.

echo [6/7] Writing .env.example and .gitignore...

powershell -Command "$content = @'
# ─────────────────────────────────────────────────────────────────────────────
# Recipe Delivery Platform - Environment Variables Template
# 1. Copy this file:  copy .env.example .env
# 2. Fill in your real values in .env
# 3. NEVER commit .env to git
# ─────────────────────────────────────────────────────────────────────────────

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password_here

# Notification Service (Gmail SMTP)
# Generate an App Password: Google Account > Security > App Passwords
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password_here
MAIL_FROM=RecipeEcom <your_email@gmail.com>

# API Gateway JWT (must be 64 hex characters / 256 bits)
JWT_SECRET=your_256bit_hex_secret_here

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=choose_a_secure_password
'@
[System.IO.File]::WriteAllLines('.env.example', $content, [System.Text.UTF8Encoding]::new($false))"

powershell -Command "$content = @'
# Secrets - NEVER commit
.env

# IntelliJ IDE
.idea/
*.iml

# VS Code
.vscode/

# Java / Maven build output
target/
*.class
*.jar
*.war
*.log

# OS files
.DS_Store
Thumbs.db

# Archives (never commit binaries)
*.zip
*.tar.gz

# Docker local volumes
postgres-data/
grafana-data/

# Python
__pycache__/
*.pyc
'@
[System.IO.File]::WriteAllLines('.gitignore', $content, [System.Text.UTF8Encoding]::new($false))"

echo   Written: .env.example
echo   Written: .gitignore
echo.

echo [7/7] Staging all changes in git...
echo.

git add -A
git status

echo.
echo ============================================================
echo  DONE! Review the git status above, then run:
echo.
echo    git commit -m "refactor: clean repo structure + add observability"
echo    git push
echo.
echo  IMPORTANT - Do these manually:
echo  1. Remove .env from git history (it has your real password):
echo       git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
echo       git push --force
echo  2. Copy microservices-overview.json dashboard from the
echo     files Claude generated into observability\grafana\dashboards\
echo  3. Add actuator + micrometer deps to each service pom.xml
echo  4. Add management: block to each service application.yml
echo  5. Revoke your Gmail App Password at myaccount.google.com
echo ============================================================
echo.
pause
