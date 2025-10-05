# Multi-stage build for React app and Node.js backend

# --- STAGE 1: REACT FRONTEND BUILD ---
    FROM node:18-alpine AS frontend-build

    # Set work directory for the frontend (assuming it's in a 'client' or 'frontend' folder)
    WORKDIR /app/client 
    
    # Copy and install frontend dependencies
    # NOTE: Adjust 'client' to your actual frontend folder name (e.g., 'frontend')
    COPY client/package*.json ./
    RUN npm install
    
    # Copy source code and build
    COPY client/ . /app/client/
    RUN npm run build
    
    
    # -------------------------------------
    # --- STAGE 2: EXPRESS BACKEND & FINAL ---
    FROM node:18-alpine AS final
    
    WORKDIR /app
    
    # Copy and install backend dependencies 
    # NOTE: This assumes a single package.json for backend in the project root.
    COPY package*.json ./ 
    RUN npm install 
    
    # Copy backend source files
    COPY server.js ./
    COPY models/ ./models/
    COPY controllers/ ./controllers/
    COPY routes/ ./routes/
    
    # Copy the built React app from the frontend stage
    # NOTE: Adjust the path if your frontend build output is not 'build'
    COPY --from=frontend-build /app/client/build ./build 
    
    # The port Express listens on
    EXPOSE 8083
    
    # Command to start the application
    CMD ["node", "server.js"]