FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    pkgconfig

WORKDIR /app

COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]