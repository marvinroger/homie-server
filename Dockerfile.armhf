FROM armhf/node:5.3

RUN npm install -g homie-server

RUN mkdir /data

EXPOSE 80 35590

VOLUME /data

CMD ["homie", "--dataDir", "/data"]
