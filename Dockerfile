# Use the official Node.js image
FROM node:20.17.0-alpine

# Install necessary dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    udev \
    bash

# Add a non-root user
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /usr/src/app \
    && chown -R pptruser:pptruser /home/pptruser /usr/src/app

# Set user to non-root
USER pptruser

# Set the Puppeteer executable path for Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the application code to the container
COPY . .

# Build the application (if using TypeScript)
RUN npm run build

# Expose the port your app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
