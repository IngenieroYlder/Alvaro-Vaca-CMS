FROM node:20-bookworm-slim

# Install system dependencies for build (if any are needed by native modules)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production=false

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
