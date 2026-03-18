FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Patch MB Bank endpoints (may need updating when MB changes API)
COPY scripts/ scripts/
RUN node scripts/patch-mbbank.js

COPY src/ src/

EXPOSE 3456

CMD ["node", "src/server.js"]
