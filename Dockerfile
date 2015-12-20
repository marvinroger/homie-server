FROM node:4

RUN npm install -g homie-server

RUN mkdir /data

EXPOSE 3000

VOLUME /data

CMD ["homie", "--dataDir", "/data"]
