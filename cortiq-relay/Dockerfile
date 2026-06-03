FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

# Run as non-root for security
RUN addgroup -S relay && adduser -S relay -G relay
USER relay

EXPOSE 3478

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3478/health || exit 1

CMD ["node", "server.js"]
