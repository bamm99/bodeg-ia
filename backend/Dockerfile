FROM node:22-alpine AS builder

WORKDIR /app

# Copiar paquetes e instalar dependencias
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copiar código fuente y compilar TypeScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Producción
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
