# Dockerfile para Google Cloud Run - VeloHub V3
# Multi-stage build para aplicação full-stack

# Stage 1: Build do Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Build do Backend e servidor final
FROM node:18-alpine AS production
WORKDIR /app

# Instalar dependências do backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código do backend
COPY backend/ ./

# Copiar build do frontend
COPY --from=frontend-builder /app/build ./public

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S velohub -u 1001

# Mudar propriedade dos arquivos
RUN chown -R velohub:nodejs /app
USER velohub

# Expor porta (Cloud Run usa PORT dinâmica)
EXPOSE 8080

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Comando para iniciar o servidor
CMD ["node", "server.js"]
