FROM node:22

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.13.7-slim@sha256:60df8d213797a669b8c4899424acca844f1e476295d4a2d058713dc3deeb504c

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static/browser /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]