# Use official Node.js 20 image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy SQL files to dist folder (TypeScript compiler doesn't copy non-TS files)
RUN cp -r src/database/*.sql dist/database/ 2>/dev/null || true

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the app (migrations run separately via Cloud Run Job)
CMD npm start
