FROM node:24@sha256:9c1d881a5b3354362cd134d15b6eee789313833caa720c3cb6ea8862925d6eb8

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.5-slim@sha256:c845af9399020c7e562969a13689e929074a10fd057acd1b1fad06a2fb068e97

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]