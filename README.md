# 🍱 RasoiKit — Recipe Kit Delivery Platform

A production-grade, cloud-native **recipe kit delivery platform** built with a Java Spring Boot microservices backend and React/Vite frontend. Features end-to-end order flows, OTP-based authentication, real-time Kafka event streaming, and full observability via Prometheus + Grafana.

---

## 📐 Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │           React Frontend             │
                        │         (Nginx · Port 3000)         │
                        └──────────────┬──────────────────────┘
                                       │ HTTP
                        ┌──────────────▼──────────────────────┐
                        │           API Gateway                │
                        │     (Spring Cloud · Port 8080)      │
                        │   JWT Validation · Rate Limiting     │
                        └──┬────┬────┬────┬────┬────┬─────────┘
                           │    │    │    │    │    │
          ┌────────────────┘    │    │    │    │    └────────────────┐
          │               ┌─────┘    │    │    └─────┐              │
          ▼               ▼          ▼    ▼          ▼              ▼
   ┌────────────┐  ┌────────────┐  ┌──┴─────────┐  ┌──────────┐  ┌──────────────┐
   │  User Svc  │  │ Recipe Svc │  │ Inventory  │  │ Payment  │  │ Notification │
   │  :8084     │  │  :8081     │  │    :8082   │  │  :8085   │  │    :8086     │
   └─────┬──────┘  └─────┬──────┘  └──────┬─────┘  └────┬─────┘  └──────┬───────┘
         │               │                │              │               │
         └───────────────┴────────────────┴──────────────┘               │
                                    │ Kafka Events                        │
                         ┌──────────▼──────────┐                         │
                         │     Order Service    │─────────────────────────┘
                         │       :8083          │  order.placed / payment.confirmed
                         └──────────────────────┘

   ┌──────────────────┐   ┌───────────────┐   ┌──────────────────┐
   │  Service Registry│   │  Admin Service│   │   Observability  │
   │  Eureka · :8761  │   │    :8087      │   │ Prometheus :9090 │
   └──────────────────┘   └───────────────┘   │  Grafana  :3001  │
                                               └──────────────────┘
```

---

## 🧩 Microservices

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | Routing, JWT validation, rate limiting |
| `service-registry` | 8761 | Eureka service discovery |
| `user-service` | 8084 | Auth (JWT + OTP), user profiles, saved recipes |
| `recipe-service` | 8081 | Recipe catalog, ingredient management |
| `inventory-service` | 8082 | Stock tracking, reservation via Kafka |
| `order-service` | 8083 | Order lifecycle, Choreography-based Saga |
| `payment-service` | 8085 | Payment processing, Kafka event emission |
| `notification-service` | 8086 | Email notifications via Spring Mail |
| `admin-service` | 8087 | Admin dashboard, platform analytics |
| `frontend` | 3000 | React UI served via Nginx |

---

## ⚙️ Tech Stack

**Backend**
- Java 17 · Spring Boot 3 · Spring Cloud (Eureka, Gateway)
- Spring Security · JWT · OTP via Redis + Spring Mail
- Apache Kafka (event-driven Saga pattern)
- PostgreSQL (per-service databases) · Redis (caching + OTP TTL)
- Docker · Docker Compose

**Frontend**
- React · Vite · Nginx

**Observability**
- Prometheus · Grafana · Spring Boot Actuator

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Docker Desktop 4.x+
- Java 17+ (for local builds outside Docker)
- Node 20+ (for frontend local dev)

### 1. Clone & configure environment

```bash
git clone https://github.com/<your-username>/rasoikit.git
cd rasoikit
cp .env.example .env
```

Edit `.env`:

```env
POSTGRES_USER=ecom
POSTGRES_PASSWORD=yourpassword
JWT_SECRET=your-256-bit-secret-here

MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your@gmail.com

REACT_APP_API_URL=http://localhost:8080
```

### 2. Start everything

```bash
docker compose up --build -d
```

Services spin up in dependency order. Allow ~3–4 minutes for all health checks to pass.

### 3. Verify

| URL | What you see |
|---|---|
| http://localhost:3000 | React frontend |
| http://localhost:8080/actuator/health | API Gateway health |
| http://localhost:8761 | Eureka dashboard |
| http://localhost:9090 | Prometheus |
| http://localhost:3001 | Grafana (admin / admin) |

---

## 🏭 Production Deployment

Uses a Docker Compose override that swaps local builds for pre-built Docker Hub images.

### 1. Build and push images

```bash
export DOCKERHUB_USERNAME=yourusername
export IMAGE_TAG=v1.0.0

# Build all services
docker compose build

# Push to Docker Hub
docker compose push
```

### 2. On the production server

```bash
# Copy only the compose files and .env — no source code needed
scp docker-compose.yml docker-compose.prod.yml .env user@server:~/rasoikit/

# SSH in and deploy
ssh user@server
cd rasoikit
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Add to `.env` on the server:

```env
DOCKERHUB_USERNAME=yourusername
IMAGE_TAG=v1.0.0
REACT_APP_API_URL=http://your-server-ip:8080
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=strongpassword
```

---

## 🔐 Authentication

Two auth flows are supported:

**Password-based (standard)**
```
POST /api/auth/register   — register with name, email, password
POST /api/auth/login      — returns accessToken + refreshToken
POST /api/auth/refresh    — rotate tokens
```

**OTP-based (passwordless)**
```
POST /api/auth/otp/send   — sends 6-digit OTP to email (TTL: 5 min via Redis)
POST /api/auth/otp/verify — verifies OTP, auto-registers on first login
```

All protected routes require `Authorization: Bearer <accessToken>`.

---

## 📨 Event Flow (Kafka)

```
User places order
      │
      ▼
 order-service  ──── order.placed ────►  inventory-service
                                                │
                                     stock reserved / failed
                                                │
                                                ▼
                                        payment-service
                                                │
                                     payment.confirmed / failed
                                                │
                               ┌────────────────┴──────────────────┐
                               ▼                                   ▼
                        order-service                   notification-service
                     (mark CONFIRMED)                  (send confirmation email)
```

---

## 🗄️ Database Layout

Each service owns its own PostgreSQL database (no shared schema):

| Service | Database |
|---|---|
| user-service | `userDB` |
| recipe-service | `recipeDB` |
| inventory-service | `inventoryDB` |
| order-service | `orderServiceDB` |
| payment-service | `paymentDB` |
| admin-service | `adminDB` |

Schema management is handled by Spring's `ddl-auto: update` in dev and Flyway-ready in prod.

---

## 📁 Project Structure

```
rasoikit/
├── services/
│   ├── api-gateway/
│   ├── service-registry/
│   ├── user-service/
│   ├── recipe-service/
│   ├── inventory-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── admin-service/
├── recipe-frontend/
├── docker/
│   ├── init-databases.sh        # Creates all PostgreSQL DBs on first run
│   ├── prometheus.yml
│   └── grafana/
│       └── provisioning/
├── docker-compose.yml           # Base compose (dev + CI)
├── docker-compose.prod.yml      # Production override (pre-built images)
└── .env.example
```

---

## 🔭 Observability

- **Prometheus** scrapes `/actuator/prometheus` on all services every 15s
- **Grafana** ships with pre-provisioned dashboards for JVM heap, HTTP request rates, Kafka consumer lag, and PostgreSQL connections
- **Spring Boot Actuator** exposes `/actuator/health`, `/actuator/info`, and `/actuator/metrics` on every service

---

## 🛠️ Development Tips

**Rebuild a single service without restarting everything:**
```bash
docker compose up --build user-service -d
```

**Tail logs for a specific service:**
```bash
docker compose logs -f order-service
```

**Connect to PostgreSQL directly:**
```bash
docker exec -it ecom-postgres psql -U ecom -d userDB
```

**Inspect Kafka topics:**
```bash
docker exec -it ecom-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
