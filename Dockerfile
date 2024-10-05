# Use the official Node.js image
FROM node:20.17.0-alpine

RUN apk add --no-cache chromium ;

# Add a non-root user
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the project dependencies at the root level
RUN npm install

# Copy the application code to the container
COPY ./server ./server

# Give ownership of the application and server directories to the non-root user
RUN chown -R pptruser:pptruser /usr/src/app /usr/src/app/server

# Switch to the non-root user
USER pptruser

# Install server dependencies and build the application
RUN cd server && npm install && npm run build

# Expose the port your app will run on
EXPOSE 3000
# Start the app
CMD  ["npm", "start"]
