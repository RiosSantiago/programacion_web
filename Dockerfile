# =============================================================================
# AGROUP — AMBIENTE B: STAGING / PRUEBAS OFICIALES
# -----------------------------------------------------------------------------
# Alineado con el informe oficial (informe-proyecto-agroup.pdf):
#   • 3.1 Staging (B) usa el MISMO artefacto de producción:
#         astro build  ->  node ./dist/server/entry.mjs
#   • Astro 6 requiere Node >= 22.12 (verificado en package.json / engines).
# =============================================================================
FROM node:22-alpine

WORKDIR /app

# Dependencias primero para aprovechar la caché de capas de Docker.
# npm ci  => instalación reproducible desde package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

# Código fuente (node_modules, .env, dist, etc. excluidos vía .dockerignore)
COPY . .

# Directorio para archivos subidos en runtime (fotos, videos, certificados PDF)
RUN mkdir -p public/uploads

# Build server standalone (same artifact as producción) — informe 3.1
RUN npm run build

EXPOSE 4321

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

# Servidor standalone de @astrojs/node (informe 3.1: node ./dist/server/entry.mjs)
CMD ["node", "dist/server/entry.mjs"]