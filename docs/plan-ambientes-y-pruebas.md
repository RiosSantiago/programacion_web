# 🌾 Plan de Ambientes y Estrategia de Pruebas — AgroUp

**Documento Operativo de Ingeniería**  
**Equipo:** Santi, Arcila, Daniel  
**Stack:** Astro (SSR / Node Adapter) + PostgreSQL + Wompi API  
**Versión:** 1.0 (MVP)  
**Fecha de Implementación:** Inmediata (1–2 días)

---

## 🎯 1. Resumen Ejecutivo y Objetivos

Este documento establece la **arquitectura de ambientes**, el **estándar de desarrollo local**, el **flujo de trabajo en Git** y la **estrategia de validación manual** para el equipo de desarrollo de AgroUp.

### Metas Principales
1. **Eliminar el "en mi máquina funciona":** Estandarizar Docker, puertos, schemas y seeds de PostgreSQL para los 3 desarrolladores.
2. **Ambientes Aislados y Seguros:** Separar estrictamente el trabajo en desarrollo local, pruebas en Staging/QA con sandbox de Wompi, y Producción con credenciales reales.
3. **Flujo de Entrega Simple y Rápido:** Deploy sin fricciones ni pipelines sobredimensionados, manteniendo la estabilidad de los módulos críticos (Autenticación, Marketplace, Carrito, Pagos Wompi).

---

## 🏗️ 2. Definición de Ambientes

AgroUp opera con **3 ambientes oficiales**. Cada ambiente tiene un propósito claro, configuración propia y aislamiento total de datos:

```mermaid
flowchart LR
    subgraph LOCAL["1. Local Dev (Santi / Arcila / Daniel)"]
        L_Astro["Astro Dev (localhost:4321)"]
        L_PG["Postgres Docker (:5432)"]
        L_Wompi["Wompi Sandbox (Keys Test)"]
    end

    subgraph STAGING["2. Staging / QA (Compartido)"]
        S_Astro["Astro Node (staging.agroup.com ó IP:Port)"]
        S_PG["Postgres Staging (BD compartida)"]
        S_Wompi["Wompi Sandbox (Keys Test)"]
    end

    subgraph PROD["3. Producción (Clientes Reales)"]
        P_Astro["Astro Node (agroup.com)"]
        P_PG["Postgres Producción (Managed / Cloud)"]
        P_Wompi["Wompi Producción (Keys Live)"]
    end

    LOCAL -->|"PR Merge a staging/develop"| STAGING
    STAGING -->|"Release Tag / Merge a main"| PROD
```

### Tabla Comparativa de Ambientes

| Parámetro | 1. Local (Desarrollo) | 2. Staging / QA (Pruebas) | 3. Producción (Live) |
| :--- | :--- | :--- | :--- |
| **Audiencia** | Santi, Arcila, Daniel (cada uno en su PC) | Equipo + Stakeholders para validar | Productores, compradores y clientes finales |
| **URL Acceso** | `http://localhost:4321` | `https://staging.agroup.co` (o subdominio/IP) | `https://agroup.co` (o dominio oficial) |
| **Base de Datos** | Docker local (`localhost:5432/agroup`) | Instancia Postgres compartida (Supabase / Render / VPS) | Postgres Cloud con backups automáticos diarios |
| **Datos / Seed** | Datos dummy de prueba (frutas, cafés, usuarios mock) | Datos realistas de prueba (sin PII real) | Datos reales de producción (¡Nunca usar para tests!) |
| **Wompi Gateway** | `WOMPI_ENV=sandbox` (Tarjetas de prueba) | `WOMPI_ENV=sandbox` (Tarjetas de prueba) | `WOMPI_ENV=production` (Transacciones reales) |
| **Tokens / JWT** | Clave genérica de desarrollo | Secreto seguro de Staging | Secreto criptográfico de 64 bytes exclusivo |
| **Propósito** | Crear nuevas pantallas, endpoints y refactors | Integrar cambios de los 3 devs y validar flujos antes de release | Operación del negocio 24/7 |

---

## 🐳 3. Estandarización del Ambiente Local

> **Problema Actual:** Un dev usaba puerto `5432`, otro `5433`, otro `4322`, desincronizando strings de conexión y schemas.  
> **Solución:** **Estandarización obligatoria en puerto `5432`** mediante Docker Compose unificado.

### 3.1. `docker-compose.yml` Oficial Unificado

Todos los miembros del equipo deben tener exactamente este archivo en la raíz del proyecto:

```yaml
name: agroup

services:
  postgres:
    image: postgres:16-alpine
    container_name: agroup-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-agroup}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgrespassword}
    ports:
      - "5432:5432"
    volumes:
      - agroup_pgdata:/var/lib/postgresql/data

volumes:
  agroup_pgdata:
```

> 💡 **Nota de resolución de conflictos:** Si algún dev tiene un servicio de PostgreSQL local corriendo nativamente en Windows que bloquee el puerto `5432`, debe detener el servicio de Windows (`services.msc` -> detener `postgresql-x64`) o usar Docker como único gestor.

### 3.2. Scripts npm para Gestión de BD Local

Agregaremos estos scripts en `package.json` para que cualquiera de los 3 pueda resetear y sembrar la base de datos con un solo comando:

```json
"scripts": {
  "db:up": "docker compose up -d",
  "db:down": "docker compose down",
  "db:reset": "docker compose down -v && docker compose up -d && node scripts/init-db.js",
  "db:seed": "node scripts/seed-dev.js"
}
```

### 3.3. Protocolo de Nuevo Desarrollador / Nueva Máquina (3 Pasos)

1. Clonar el repositorio y copiar variables de entorno:
   ```bash
   cp .env.example .env
   npm install
   ```
2. Levantar la base de datos con Docker:
   ```bash
   docker compose up -d
   ```
3. Aplicar schema e insertar datos de prueba:
   ```bash
   npm run db:reset
   npm run dev
   ```

---

## 🧪 4. Estrategia de Pruebas Manuales (Mínima y Efectiva)

Sin necesidad de suites de pruebas automatizadas complejas en esta fase, aplicaremos un **Protocolo de Validación de Flujos Críticos (PVFC)** antes de subir cambios.

### 4.1. Checklist Pre-Pull Request (Responsable: Desarrollador)
Antes de pedir revisión o hacer merge hacia `staging`, el desarrollador debe verificar localmente:

- [ ] **Typecheck / Build:** Ejecutar `npm run build` sin errores de compilación TypeScript/Astro.
- [ ] **Autenticación:**
  - Registro de nuevo usuario (Comprador y Productor).
  - Login exitoso y persistencia de sesión por JWT / Cookie.
  - Cierre de sesión.
- [ ] **Marketplace & Búsqueda:**
  - Carga de listado de productos, filtros por categoría y barra de búsqueda.
  - Vista individual de producto (`/marketplace/[slug]`) con imágenes y stock correcto.
- [ ] **Carrito y Checkout:**
  - Agregar productos al carrito, modificar cantidades y eliminar.
  - Cálculo de subtotal y total correcto.
- [ ] **Pasarela de Pagos (Wompi Sandbox):**
  - Probar flujo de pago con widget/redirección usando tarjetas de prueba sandbox.
  - Verificar que el webhook o confirmación cambie el estado del pedido a `PAGADO` / `APROBADO`.

### 4.2. Tarjetas de Prueba Oficiales para Wompi Sandbox

Para validar pagos en Local y Staging sin dinero real:

| Tipo de Tarjeta | Número de Tarjeta | Fecha Exp. | CVC | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **Visa (Aprobada)** | `4242 4242 4242 4242` | `12/28` | `123` | Transacción **APROBADA** (Pedido se crea y pasa a procesado) |
| **Mastercard (Aprobada)**| `5555 5555 5555 4444` | `10/27` | `456` | Transacción **APROBADA** |
| **Tarjeta Declinada** | `4000 0000 0000 0002` | `05/26` | `789` | Transacción **RECHAZADA** (UI muestra mensaje de error claro) |

---

## 🚀 5. Flujo de Git y Deploy (Mínimo Viable)

Adoptamos una versión ágil de **GitHub Flow adaptada a 3 ramas / tags**:

```mermaid
gitGraph
    commit id: "Init v0.1"
    branch staging
    checkout staging
    commit id: "Staging Ready"
    branch feature/nueva-vista-pagos
    checkout feature/nueva-vista-pagos
    commit id: "dev: Daniel cambio Wompi"
    commit id: "dev: Daniel ajuste UI"
    checkout staging
    merge feature/nueva-vista-pagos id: "PR #12 -> Staging"
    commit id: "Validación QA en Staging OK"
    checkout main
    merge staging id: "Release Prod v0.2"
    commit id: "Tag v0.2.0"
```

### 5.1. Reglas de Ramas
1. **`main` (Producción):**
   - Siempre debe estar 100% estable y lista para producción.
   - **Prohibido hacer `git push` directo a `main`**. Solo entra código mediante PR aprobado o merge desde `staging`.
2. **`staging` (Ambiente de Integración / QA):**
   - Aquí se unen las ramas de Santi, Arcila y Daniel para probar en conjunto.
   - Se despliega automáticamente o manualmente al servidor de Staging.
3. **`feature/<nombre-tarea>` (Ramas de trabajo individual):**
   - Creadas a partir de `staging` o `main`. Ejemplos: `feature/checkout-wompi`, `fix/login-recuperar-clave`.

### 5.2. Paso a Paso del Despliegue

#### Paso A: Desarrollo Local -> Staging
1. El dev termina su feature y corre `npm run build` local para verificar que compile.
2. Abre un **Pull Request** hacia la rama `staging`.
3. Otro compañero (Santi, Arcila o Daniel) revisa el PR y da el "Approve".
4. Se hace merge a `staging` y se actualiza el servidor de pruebas.

#### Paso B: Staging -> Producción
1. Los 3 prueban el flujo completo en `staging` con el checklist manual.
2. Si no hay bugs, se crea un PR de `staging` a `main`.
3. Se hace merge a `main` y se aplica el despliegue a Producción (ej. mediante webhook de host, script de deploy o reinicio del contenedor).
4. Si hubo cambios en `database/schema.pg.sql` o migraciones, se ejecutan en la BD de producción previo respaldo.

---

## 🔐 6. Manejo de Secretos y Variables de Entorno

### 6.1. Regla de Oro
**NUNCA subir archivos `.env`, `.env.local` ni credenciales reales a GitHub.**  
El archivo `.gitignore` debe contener siempre:
```gitignore
.env
.env.*
!.env.example
```

### 6.2. Estructura Documentada de Variables (`.env.example`)

Cada ambiente configurará sus variables de la siguiente forma:

```bash
# =============================================================================
# AgroUp — Matriz de Variables de Entorno
# =============================================================================

# 1. BASE DE DATOS
# Local: postgresql://postgres:postgrespassword@127.0.0.1:5432/agroup
# Staging / Prod: postgresql://<user>:<pass>@<host-cloud>:5432/<db_name>?sslmode=require
DATABASE_URL=postgresql://postgres:postgrespassword@127.0.0.1:5432/agroup
POSTGRES_DB=agroup
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432

# 2. SEGURIDAD & JWT
# Local: clave_desarrollo_insegura_123456789
# Staging/Prod: Generar con crypto.randomBytes(64).toString('hex')
JWT_SECRET=tu_clave_secreta_jwt_minimo_32_caracteres_cambiar_en_produccion
ADMIN_SECRET=tu_clave_secreta_admin
ROOT_ADMIN_KEY=tu_clave_secreta_root_admin

# 3. PASARELA DE PAGOS WOMPI
# Local & Staging: WOMPI_ENV=sandbox con llaves pub_test_ y prv_test_
# Producción: WOMPI_ENV=production con llaves pub_prod_ y prv_prod_
WOMPI_ENV=sandbox
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxxxxxxxxxxxxxxxxxxxxxxx
WOMPI_EVENTS_SECRET=test_events_xxxxxxxxxxxxxxxxxxxxxxxx

# 4. CONFIGURACIÓN DEL SERVIDOR
PORT=4321
HOST=0.0.0.0
NODE_ENV=development # 'production' en Staging y Prod
```

### 6.3. Distribución Segura entre el Equipo
- Las llaves de **Staging y Producción** se comparten una sola vez por un canal seguro (gestor de contraseñas tipo Bitwarden/1Password o mensaje cifrado), nunca en texto plano en WhatsApp/Discord/Slack.
- En el servidor de producción, las variables se inyectan a nivel de panel de hosting (ej. variables de entorno de Render, Railway, VPS systemd o Docker secrets).

---

## 📅 7. Plan de Adopción (24 - 48 Horas)

| Fase | Tarea | Responsable | Estado |
| :--- | :--- | :--- | :--- |
| **Día 1 - Mañana** | Unificar `docker-compose.yml` en puerto `5432` y sincronizar `.env.example`. | Santi | 🟢 Listo en repo |
| **Día 1 - Tarde** | Daniel y Arcila actualizan su Docker local, ejecutan `npm run db:reset` y confirman conexión en `5432`. | Daniel / Arcila | 🟡 En progreso |
| **Día 2 - Mañana** | Crear la rama `staging` en GitHub y configurar el ambiente compartido de pruebas. | Santi / Equipo | ⚪ Pendiente |
| **Día 2 - Tarde** | Probar el primer ciclo: crear feature branch -> PR a `staging` -> prueba manual con Wompi Sandbox. | Los 3 devs | ⚪ Pendiente |

---

## 📌 8. Resumen de Comandos Rápidos para el Equipo

```bash
# 1. Levantar ambiente local
npm run db:up         # Inicia PostgreSQL en Docker (puerto 5432)
npm run dev           # Inicia Astro en http://localhost:4321

# 2. Resetear datos si algo se descuadra
npm run db:reset      # Limpia BD y vuelve a crear el schema limpio

# 3. Validar antes de hacer Pull Request
npm run typecheck     # Verifica tipos de TypeScript
npm run build         # Verifica que el proyecto compila sin errores

# 4. Flujo Git diario
git checkout staging
git pull origin staging
git checkout -b feature/mi-nueva-funcionalidad
# ... hacer cambios ...
git push origin feature/mi-nueva-funcionalidad
# Abrir PR en GitHub hacia 'staging'
```
