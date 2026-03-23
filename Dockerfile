# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies like typescript)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to dist/
RUN npm run build

# Stage 2: Final Image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the WebSocket port
EXPOSE 8080

CMD ["node", "dist/persistentServer.js"]
