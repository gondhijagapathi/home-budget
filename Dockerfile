# Multi-stage build for React app and Node.js backend

# --- STAGE 1: REACT FRONTEND BUILD ---
    FROM node:18-alpine AS frontend-build

    # The work directory is the root of the app, since React files are here.
    WORKDIR /app
    
    # 1. Copy package.json (contains React/build dependencies) and install
    COPY package*.json ./
    RUN npm install
    
    # 2. Copy the source code needed for the React build
    # The 'public' and 'src' folders are at the root level of your project.
    COPY public/ ./public
    COPY src/ ./src
    
    # Run the React build script
    RUN npm run build
    
    
    # -------------------------------------
    # --- STAGE 2: EXPRESS BACKEND & FINAL ---
    FROM node:18-alpine AS final
    
    # Set the application root
    WORKDIR /app
    
    # 1. Copy package.json (needed for installing production dependencies if any)
    COPY package*.json ./ 
    RUN npm install --only=production
    # OR, if you need all dev dependencies for some reason:
    # RUN npm install 
    
    # 2. Copy backend source files
    COPY server.js ./
    COPY models/ ./models/
    COPY controllers/ ./controllers/
    COPY routes/ ./routes/
    
    # 3. Copy the built React app from the frontend stage
    # The built files are at /app/build in the previous stage
    COPY --from=frontend-build /app/build ./build 
    
    # The port Express listens on
    EXPOSE 8083
    
    # Command to start the application
    CMD ["node", "server.js"]