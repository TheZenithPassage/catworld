#!/bin/sh
set -eu

business_time_zone=${BUSINESS_TIME_ZONE:-America/Argentina/Buenos_Aires}
build_id=$(sha256sum /usr/share/nginx/html/index.html)
build_id=${build_id%% *}

cat > /usr/share/nginx/html/runtime-config.json <<EOF
{
  "businessTimeZone": "${business_time_zone}",
  "buildId": "${build_id}"
}
EOF
