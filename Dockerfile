FROM node:16.3.0

RUN apt update -y

WORKDIR /server

COPY . /server
RUN npm install -g npm
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]
