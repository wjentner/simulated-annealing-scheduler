FROM node:22

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.2-slim@sha256:1f741aef81d09464251f4c52c83a02f93ece0a636db125d411bd827bf381a763

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static/browser /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]