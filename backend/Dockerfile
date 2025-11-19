# Use official Node.js 20 image
FROM node:20-slim

# Install GitHub CLI
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
