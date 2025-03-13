FROM node:19-alpine

WORKDIR /usr
# Note that package-lock.json is only used if exists
# https://stackoverflow.com/a/46801962
COPY package.json package-lock.jso[n] ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build

## Stage 2
FROM node:19-alpine
WORKDIR /usr
COPY package.json package-lock.jso[n] ./
RUN npm install --only=production
COPY --from=0 /usr/dist .
RUN npm install pm2 -g
EXPOSE 80
ENV __DOCKERIZED__ dockerized
CMD ["pm2-runtime","index.js"]