# Use the official Node.js image
FROM node:20.17.0-alpine
RUN apk add --no-cache chromium

WORKDIR /usr/src/app/server
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install
COPY ./server ./
RUN npm run build
RUN ls -la
EXPOSE 3000
RUN npx prisma generate
CMD echo "DATABASE_URL=$DATABASE_URL" && npx prisma migrate deploy && npm run prod
