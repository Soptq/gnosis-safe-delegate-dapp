FROM node:12.22.4-alpine
WORKDIR /app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

ENV PATH /app/node_modules/.bin:$PATH
COPY . ./
RUN yarn --silent

CMD ["yarn", "start"]
