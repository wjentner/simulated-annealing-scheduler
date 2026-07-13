FROM node:24@sha256:392e1e23f34da768d8d1f4e502b64f200d3be3465934d4b7930f57d7e2fc1989

ADD . /tmp/code

WORKDIR /tmp/code/client-code

RUN yarn

RUN yarn build -c production --no-progress


FROM python:3.14.6-slim@sha256:b877e50bd90de10af8d82c57a022fc2e0dc731c5320d762a27986facfc3355c1

WORKDIR /app

ADD ./server-code /app

COPY --from=0 /tmp/code/server-code/static /app/static

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]