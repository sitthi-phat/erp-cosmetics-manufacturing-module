# ESSENCE Hub — Documents Site (static HTML review site) for Cloud Run + IAP
#
# Build context MUST be the REPO ROOT (so paths below resolve), e.g.:
#   docker build -f deploy/docs-site/Dockerfile -t docs-site .
#
# The image mirrors the repo layout under nginx's web root so that all the
# existing RELATIVE links keep working unchanged:
#   /docs/design/erp-v2-ui-first/functional-spec/...   (Document Hub, default)
#   /docs/design/erp-v2-ui-first/architecture/...
#   /docs/design/erp-v2-ui-first/mockups/...
#   /dashboard/  and  /dashboard.html                   (pipeline dashboard)
#   /pipeline/status.json                               (snapshot, see note)
FROM nginx:1.27-alpine

# Replace the default server block.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/docs-site/nginx.conf /etc/nginx/conf.d/default.conf

# Static content — keep the repo path structure intact.
COPY docs/design/erp-v2-ui-first/ /usr/share/nginx/html/docs/design/erp-v2-ui-first/

# Pipeline dashboard (fetches ../pipeline/status.json -> /pipeline/status.json).
COPY dashboard/       /usr/share/nginx/html/dashboard/
COPY dashboard.html   /usr/share/nginx/html/dashboard.html

# status.json is a BUILD-TIME SNAPSHOT. It is refreshed on every redeploy.
COPY pipeline/status.json /usr/share/nginx/html/pipeline/status.json

EXPOSE 8080

# nginx:alpine already runs `nginx -g 'daemon off;'` as the default CMD.
