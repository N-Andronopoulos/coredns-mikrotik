FROM coredns/coredns as coredns
#################################################
FROM node as builder
COPY . /app
WORKDIR /app
RUN npm ci
RUN npm run build
#################################################
FROM node as production
WORKDIR /app
ENV NODE_ENV="production"

COPY --from=builder /app/dist /app/server
COPY --from=builder /app/package.json /app/server
COPY --from=builder /app/package-lock.json /app/server
WORKDIR /app/server
RUN npm ci

COPY --from=coredns /coredns /app/coredns
ADD ./docker/run-api-dns.sh /app/

WORKDIR /app
EXPOSE 53 53/udp 3000
ENV ZONE_DIR="/etc/coredns"
VOLUME ["/etc/coredns"]
ENTRYPOINT ["sh", "/app/run-api-dns.sh"]
