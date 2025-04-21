FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies including 'production only' dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Set NODE_ENV
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 