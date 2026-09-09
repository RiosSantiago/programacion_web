# 🌾 AGROUP — Entorno Staging (Ambiente B · Pruebas Oficiales)

**Fuente normativa:** `informe-proyecto-agroup.pdf` — sección **3. Entorno de pruebas**
(fuente editable del informe: `docs/informe-proyecto-agroup.md`).

Este repositorio contiene el setup **exacto** que define el informe para el entorno de
pruebas oficiales (Staging, Ambiente B). Estefanía (seguridad) y el resto del equipo
deben poder levantar el entorno completo con **un solo comando**.

---

## 1. Arranque en un comando

```bash
docker compose up
```

| Recurso | URL / Dato |
| :--- | :--- |
| **App (Staging)** | http://localhost:4321 |
| **PostgreSQL (desde el host)** | `127.0.0.1:4322` — usuario `postgres` / `postgrespassword` |
| **Base de datos** | `agroup_staging` |

> ⚠️ El informe §3.3 es explícito: **Docker expone PostgreSQL en el puerto host `4322:5432` (no `5432`)**.
> Si ya tienes un PostgreSQL local usando `5432`, no interfiere con este entorno.

---

## 2. Usuarios de prueba (datos iniciales del seed)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Admin** | `admin@test.local` | `Test1234` |
| **Vendedor (productor)** | `vendedor@test.local` | `Test1234` |
| **Comprador** | `comprador@test.local` | `Test1234` |

Productos sembrados: **Vacas Holstein** (bovinos), **Cerdos Pietrain** (porcinos),
**Frutas Orgánicas** (agricultura), con imágenes locales (`/seed/*.svg`).

Los datos se cargan automáticamente la primera vez que se crea el volumen
(`init-db.sql`), y las tablas se crean al arrancar (informe §3.3: inicialización en
`src/lib/db.ts` + migraciones en transacción; esquema base `database/schema.pg.sql`
+ `database/migrations/`).

---

## 3. Staging = mismo build de producción (regla de oro)

Informe §3.1 y §3.2: el artefacto de Staging **debe ser idéntico al de Producción**.

| Ambiente | Cómo se levanta | Qué se prueba ahí |
| :--- | :--- | :--- |
| **A — Local (dev)** | `npm run dev` + `docker compose up -d` | Desarrollo diario, funcionalidad |
| **B — Staging (este entorno)** | `npm run build` → `node ./dist/server/entry.mjs` + BD de staging | Todo antes de publicar: flujo completo, pagos Wompi Sandbox, checklists |
| **C — Producción** | Deploy real | Solo monitoreo + smoke test post-deploy |

El `Dockerfile` de este repo hace exactamente eso: **`astro build`** y luego
**`node ./dist/server/entry.mjs`** (server standalone de `@astrojs/node`). Solo cambian
los valores entre ambientes: Wompi Sandbox vs. real y la BD aislada.

---

## 4. Pagos Wompi en Sandbox (informe §3.4)

`WOMPI_ENV=sandbox` → la app usará `https://sandbox.wompi.co/v1` (pruebas, sin dinero
real). **No cambiar a `production`** en este entorno.

### Tarjetas de prueba oficiales de Wompi

| Tarjeta | Resultado esperado |
| :--- | :--- |
| `4242 4242 4242 4242` (Visa) | Pago **aprobado** |
| `5555 5555 5555 4444` (Mastercard) | Pago **aprobado** |
| `4000 0000 0000 0002` | Pago **rechazado** → la app debe mostrar error |

### Qué comprobar en pagos

- [ ] El pedido pasa a estado **PAGADO**.
- [ ] El webhook de Wompi (`src/pages/api/wompi/webhook.ts`) se recibe y procesa (validación HMAC/checksum).
- [ ] Para probar el webhook en local/Staging → **simulador de webhooks de Wompi + ngrok** (exponer el endpoint).

> Las llaves `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` / `WOMPI_INTEGRITY_SECRET` /
> `WOMPI_EVENTS_SECRET` actuales son placeholders sandbox. Reemplázalas por las llaves
> de **prueba** reales en `docker-compose.yml` para probar pagos de verdad.

---

## 5. Checklist de seguridad (informe §3.5 — regresión Fase 2)

- [ ] Headers de seguridad (CSP, nosniff, frame-options, HSTS) presentes en respuestas
- [ ] `api/wompi/verificar` es **solo lectura** (no cambia estado del pedido)
- [ ] Rate limiting activo en verificación (respuesta **429** ante uso excesivo)
- [ ] `api/pedidos/crear` valida rol contra BD y recalcula total en servidor
- [ ] Valores con HTML/`<script>` en campos de usuario se escapan (sin XSS) en todo el panel
- [ ] `.env` ausente del repositorio; `.env.example` con placeholders

---

## 6. Checklist funcional de pruebas (informe §3.6 — obligatorio en Staging)

- [ ] `npm run typecheck` — TypeScript sin errores
- [ ] `npm run build` — compilación sin errores
- [ ] Registro de usuario **Comprador**
- [ ] Registro de usuario **Productor**
- [ ] Login exitoso + persistencia de sesión
- [ ] Logout funciona
- [ ] Listado de productos en Marketplace
- [ ] Filtros por categoría
- [ ] Búsqueda de productos
- [ ] Vista detalle de producto (`/marketplace/[slug]`)
- [ ] Imágenes del producto cargan correctamente
- [ ] Stock correcto
- [ ] Agregar al carrito
- [ ] Modificar cantidad en carrito
- [ ] Eliminar del carrito
- [ ] Cálculo de subtotal y total correctos
- [ ] Pago **Visa `4242...`** — aprobada
- [ ] Pago **Mastercard `5555...`** — aprobada
- [ ] Pago **rechazado `4000...`** — muestra error
- [ ] Estado del pedido cambia a **PAGADO**
- [ ] Webhook Wompi procesado
- [ ] Vendedor ve sus pedidos y puede marcar **Entregado**
- [ ] Panel admin: usuarios, productos, categorías, transporte
- [ ] Mensajes de envío (AgroUp no se hace cargo del transporte) visibles en checkout, pedido-exito, detalle, términos y formularios

Notas / bugs encontrados: **\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**.

---

## 7. Herramientas de test por capa (informe §3.7)

| Capa | Herramienta | Para qué |
| :--- | :--- | :--- |
| Tipos | `astro check` (ya existe) | Errores TypeScript |
| Compilación | `astro build` (ya existe) | Compilar server standalone |
| Unitarios | Vitest (a instalar) | auth, rbac, rate-limit, `buildQuery`, helpers |
| API | Vitest + Supertest (a instalar) | endpoints contra BD `agroup_test` |
| E2E (UI) | Playwright (a instalar) | flujo de compra, textos de envío, admin |
| Pagos | Wompi Sandbox + webhook | sin dinero real |
| Emails | Mailpit | capturar correos de recuperación sin enviarlos reales |

---

## 8. Archivos de este setup

| Archivo | Qué es | Referencia informe |
| :--- | :--- | :--- |
| `docker-compose.yml` | PostgreSQL host `4322:5432` + app en build de producción | §3.1, §3.3 |
| `Dockerfile` | `astro build` → `node ./dist/server/entry.mjs` | §3.1 |
| `init-db.sql` | Datos de prueba (usuarios + productos) precargados | §3.3 |
| `README-STAGING.md` | Este documento (checklists §3.5–§3.7) | §3.5, §3.6, §3.7 |

---

## 9. Comandos rápidos

```bash
# Levantar Staging completo
docker compose up

# Recompilar la imagen (tras cambios de código)
docker compose up --build

# Detener (los datos de BD persisten)
docker compose down

# Reset total (borra BD y vuelve a sembrar los datos de prueba)
docker compose down -v && docker compose up --build

# Verificación de tipos antes de PR (informe §3.6)
npm run typecheck
npm run build
```