FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean install
RUN npm install --production --frozen-lockfile && \
    npm cache clean --force

# Copy app source
COPY . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the app
CMD ["node", "server.js"] 