FROM node:18-alpine as build
WORKDIR /source

COPY . .
RUN npm install
RUN npm run build
RUN npm install ytdl-core@4.11.2

FROM node:18-alpine
WORKDIR /app

COPY --from=build /source/bin/ /app/bin/
COPY --from=build /source/node_modules/ /app/node_modules/
COPY --from=build /source/package.json /app/package.json

CMD [ "npm", "run", "start" ]