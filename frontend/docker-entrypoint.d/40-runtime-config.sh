#!/bin/sh
set -eu

business_time_zone=${BUSINESS_TIME_ZONE:-America/Argentina/Buenos_Aires}

cat > /usr/share/nginx/html/runtime-config.json <<EOF
{
  "businessTimeZone": "${business_time_zone}"
}
EOF
