FROM node:lts-alpine AS BUILD_IMAGE

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

FROM node:lts-alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/ ./

EXPOSE 3000

CMD [ "npm", "start" ]