FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 