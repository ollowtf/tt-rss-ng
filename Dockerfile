FROM nginx:1.22-alpine

COPY nginx-default.conf.template /etc/nginx/conf.d/default.conf.template

COPY . /usr/share/nginx/html/tt-rss-ng/

COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]