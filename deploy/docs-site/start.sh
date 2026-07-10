#!/bin/sh
# Container entrypoint: run nginx (upstream, :8081) + oauth2-proxy (front, :8080).
set -e

# Start nginx in the background (default alpine CMD runs it in foreground with
# 'daemon off;'; calling `nginx` plainly makes it daemonize).
nginx

# Hand the foreground to oauth2-proxy. Secrets arrive via OAUTH2_PROXY_* env vars
# (CLIENT_ID / CLIENT_SECRET / COOKIE_SECRET) set by Cloud Run — never baked in.
exec oauth2-proxy --config=/etc/oauth2-proxy/oauth2-proxy.cfg
