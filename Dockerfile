FROM node:18-alpine as build
WORKDIR /source

COPY . .

RUN apk update
RUN apk add git

RUN chmod +x ./postInstall.sh
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=build /source/bin/ /app/bin/
COPY --from=build /source/node_modules/ /app/node_modules/
COPY --from=build /source/package.json /app/package.json

CMD [ "npm", "run", "start" ]