# Stage 1 — Build frontend
FROM node:21-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

RUN npm ci --workspace=frontend

COPY frontend/ frontend/

RUN npm run build --workspace=frontend

# Stage 2 — Production image
FROM node:21-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/

RUN npm ci --workspace=backend --omit=dev

COPY backend/ backend/
COPY --from=frontend-build /app/frontend/dist frontend/dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "backend/src/server.js"]
