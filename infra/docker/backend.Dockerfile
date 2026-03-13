FROM node:20-alpine

WORKDIR /app

COPY ../../apps/backend/package.json ./
RUN npm install

COPY ../../apps/backend .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]