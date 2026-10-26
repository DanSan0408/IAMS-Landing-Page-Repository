FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Ensure data directory exists and has correct permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Use a non-root user for security
USER node

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
