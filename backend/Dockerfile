FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files individually to debug the issue
COPY ["package.json", "./"]
COPY ["package-lock.json", "./"]

# Install production dependencies only
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 