
FROM node:7-alpine
ENV PROJECT_DIR=/app 

WORKDIR $PROJECT_DIR 

COPY ["package*.json","$PROJECT_DIR"]
RUN npm install 
COPY . $PROJECT_DIR

ENV MEDIA_DIR=/media \ 
	NODE_ENV=production \ 
	APP_PORT=3000 

VOLUME $MEDIA_DIR 
EXPOSE $APP_PORT 

ENTRYPOINT ["./entrypoint.sh"] 
CMD ["start"]

