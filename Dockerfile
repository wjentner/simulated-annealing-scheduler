FROM node:22

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.2-slim@sha256:38b6cc0b45b13563b14615a9b51dd07ac519b9d3cbd945df114477fe0cc988f1

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static/browser /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]