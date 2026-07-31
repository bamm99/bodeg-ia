# 🚀 Bodeg-IA — Plataforma Web & API de Gestión de Bodegas y Tarifario Inteligente

**Bodeg-IA** es una plataforma SaaS enterprise diseñada para la gestión logística de bodegas multi-empresa (3PL) y cálculo de tarifas de almacenaje dinámicas evaluadas mediante expresiones matemáticas AST en sandbox. Permite la visualización espacial en 2D, trazabilidad Kardex auditorable y está optimizada para ser consultada en terreno mediante un **Bot de Telegram con IA**.

---

## 🏗️ Arquitectura del Sistema

```
bodeg-ia/
├── backend/            # API REST v1 (Node.js 22 + TypeScript + Express + Prisma ORM)
├── frontend/           # Aplicación Web SPA (React + Vite + TypeScript + CSS Glassmorphism)
├── seeder/             # Subproyecto Python Seeder para poblado masivo de datos de prueba
├── db/                 # Scripts DDL de base de datos (PostgreSQL 17 + RLS + Triggers)
├── docker-compose.homelab.yml # Orquestación para despliegue en Homelab / Servidor
└── README.md
```

---

## 📌 Cuentas de Acceso para Pruebas Demo (Clave: `admin123`)

- **Super Admin Global:** `admin@bodegia.cl` (Visibilidad de todas las empresas)
- **Ejecutivo Plataforma:** `ejecutivo@bodegia.cl` (Cartola de clientes asignados)
- **Admin Empresa Single-Tenant:** `admin.agrosur@bodegia.cl` (AgroSur Logística & Frío)
- **Admin Empresa Electrónica:** `admin.electro@bodegia.cl` (ElectroChile Tech)

---

## 🚀 Despliegue en Homelab con Docker Compose

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/bodeg-ia.git
cd bodeg-ia
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

### 3. Levantar los Servicios en Homelab
```bash
docker compose -f docker-compose.homelab.yml up -d --build
```

- **Frontend App:** `http://TU_IP_HOMELAB:8080` (o `http://localhost:8080`)
- **Backend API:** `http://TU_IP_HOMELAB:4000/api/v1`

---

## 🐍 Poblado Masivo de Datos (Python Seeder)

Si deseas limpiar y repoblar la base de datos de pruebas:
```bash
cd seeder
python3 main.py
```

---

## 🧪 Pruebas Unitarias & Cobertura
```bash
cd backend
npm run test     # Ejecuta la suite Vitest (22 unit tests)
npm run build    # Verifica compilación TypeScript
```
