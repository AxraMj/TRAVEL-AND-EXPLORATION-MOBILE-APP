FROM node:18-alpine

WORKDIR /usr/src/app

# First copy only files needed to install dependencies
COPY ["./package.json", "./"]
COPY ["./package-lock.json", "./"]

# Install app dependencies
RUN npm install --omit=dev

# Then copy the rest of the app
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"] 