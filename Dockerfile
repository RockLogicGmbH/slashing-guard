FROM node:16.13.0-alpine

WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build

## Stage 2
FROM node:16.13.0-alpine
WORKDIR /usr
COPY package.json ./
RUN npm install --only=production
COPY --from=0 /usr/dist .
RUN npm install pm2 -g
EXPOSE 80
CMD ["pm2-runtime","index.js"]