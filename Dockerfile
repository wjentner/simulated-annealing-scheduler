FROM node:24@sha256:da4221677e02b54ef6335adfa447578d512ad14f251024fb92ea433c2c102760

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.6-slim@sha256:cea0e6040540fb2b965b6e7fb5ffa00871e632eef63719f0ea54bca189ce14a6

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]