#Build Steps
FROM node:19-alpine3.15 as build-step

RUN mkdir /app
WORKDIR /app
RUN npm install -g @angular/cli
COPY package.json /app
RUN npm install
COPY . /app

RUN npm run build

#Run Steps
FROM nginxinc/nginx-unprivileged  
RUN rm -rf /etc/nginx/nginx.conf.default && rm -rf /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/nginx.conf
###RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-step /app/dist/LigaCampeones /usr/share/nginx/html

EXPOSE 8082:8082
CMD ["nginx", "-g", "daemon off;"]
