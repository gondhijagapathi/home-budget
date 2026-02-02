# Multi-stage build for React app and Node.js backend

# --- STAGE 1: REACT FRONTEND BUILD ---
FROM node:18-alpine AS frontend-build

WORKDIR /app

# 1. Copy package files and install all deps (needed for webpack/babel/postcss build)
COPY package*.json ./
RUN npm ci

# 2. Copy build config (webpack, babel, postcss – no tailwind.config.js; Tailwind v4 uses CSS)
COPY webpack.config.js babel.config.js postcss.config.js ./
COPY jsconfig.json ./

# 3. Copy frontend source
COPY public/ ./public
COPY src/ ./src

# 4. Build (output: ./build)
RUN npm run build

# --- STAGE 2: EXPRESS BACKEND & FINAL ---
FROM node:18-alpine AS final

WORKDIR /app

# 1. Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# 2. Backend source
COPY server.js ./
COPY models/ ./models/
COPY controllers/ ./controllers/
COPY routes/ ./routes/

# 3. Built frontend from stage 1 (webpack outputs to build/)
COPY --from=frontend-build /app/build ./build

EXPOSE 8083
CMD ["node", "server.js"]