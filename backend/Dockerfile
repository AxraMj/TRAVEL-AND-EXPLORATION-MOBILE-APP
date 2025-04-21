FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"] 