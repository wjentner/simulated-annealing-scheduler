FROM node:22

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.13.5-slim@sha256:f2fdaec50160418e0c2867ba3e254755edd067171725886d5d303fd7057bbf81

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static/browser /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]