FROM node:4

RUN npm install -g homie-server

RUN mkdir /data

EXPOSE 80 35589

VOLUME /data

CMD ["homie", "--dataDir", "/data"]
