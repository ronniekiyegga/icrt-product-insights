FROM node:22.22.2-alpine AS build
WORKDIR /app
RUN npm install -g npm@11.5.2
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
