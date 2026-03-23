FROM node:24@sha256:5a593d74b632d1c6f816457477b6819760e13624455d587eef0fa418c8d0777b

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.3-slim@sha256:fb83750094b46fd6b8adaa80f66e2302ecbe45d513f6cece637a841e1025b4ca

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]