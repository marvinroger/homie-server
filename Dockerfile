FROM node:5

RUN npm install -g homie-server

RUN mkdir /data

EXPOSE 80 35590

VOLUME /data

CMD ["homie", "--dataDir", "/data"]
