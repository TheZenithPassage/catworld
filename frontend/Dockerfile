FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /tmp/frontend-build \
    && if [ -f dist/catworld-frontend/browser/index.html ]; then \
         cp -r dist/catworld-frontend/browser/* /tmp/frontend-build/; \
       else \
         cp -r dist/catworld-frontend/* /tmp/frontend-build/; \
       fi

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /tmp/frontend-build /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80
