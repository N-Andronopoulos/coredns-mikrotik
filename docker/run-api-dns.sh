#!/bin/bash

echo "Running CoreDNS and NestAPI..."

nodejs /app/server/main.js &
/app/coredns "$@"
