FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV TZ=Asia/Kolkata

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p images invoices notepad tmp logs

EXPOSE 5000

CMD ["node", "server.js"]
