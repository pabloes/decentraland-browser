# Use the official Node.js image
FROM node:20.17.0-alpine
RUN apk add --no-cache chromium
WORKDIR /usr/src/app/analytics-frontend

COPY ./analytics-frontend ./
RUN npm install
RUN npm run build

WORKDIR /usr/src/app/server
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install
COPY ./server ./
RUN npx prisma generate
RUN npm run build
RUN ls -la
EXPOSE 3000
RUN npx prisma generate
CMD npx prisma migrate deploy && npx prisma db pull && npx prisma generate && npm run prod
