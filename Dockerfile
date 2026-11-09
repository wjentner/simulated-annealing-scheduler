FROM node:24@sha256:8fa96264f302f58bbb13aa7339c541547b56975766ce956c875da149452a3e40

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.15.0-slim@sha256:f5b92f2a669a4c347044f29367f31983280b648250ca94dea66f98c53bc87e58

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]