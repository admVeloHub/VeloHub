# Dockerfile para Google Cloud Run - VeloHub V3
# VERSION: v1.1.0 | DATE: 2025-01-30 | AUTHOR: Lucas Gravina - VeloHub Development Team
# Multi-stage build para React + Node.js
# Updated: 2025-01-30 - Fixed REACT_APP_ environment variables for build

# Stage 1: Build do frontend React
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copiar package.json do frontend
COPY package*.json ./
RUN npm ci

# Copiar código do frontend
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build do frontend com variáveis de ambiente
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_AUTHORIZED_DOMAIN
ARG REACT_APP_API_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_AUTHORIZED_DOMAIN=$REACT_APP_AUTHORIZED_DOMAIN
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Backend + Frontend build
FROM node:18-alpine AS production
WORKDIR /app

# Instalar dependências do backend
COPY backend/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copiar código do backend
COPY backend/ ./

# Copiar build do frontend
COPY --from=frontend-builder /app/build ./public

# Verificar estrutura de diretórios
RUN echo "=== ESTRUTURA DE DIRETÓRIOS ===" && ls -la && echo "=== CONTEÚDO DO PUBLIC ===" && ls -la public/

# Expor porta (Cloud Run usa PORT dinâmica)
EXPOSE 8080

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Comando para iniciar o servidor
CMD ["node", "server.js"]
