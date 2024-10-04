# Use the official Node.js v20.17.0 image as the base image
FROM node:20.17.0-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the TypeScript code (if applicable, adjust if not using TypeScript)
RUN npm run build

# Expose the port the app runs on (adjust if your app uses a different port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
