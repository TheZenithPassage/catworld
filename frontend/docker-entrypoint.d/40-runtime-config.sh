#!/bin/sh
set -eu

business_time_zone=${BUSINESS_TIME_ZONE:-America/Argentina/Buenos_Aires}
build_id=$(sha256sum /usr/share/nginx/html/index.html)
build_id=${build_id%% *}
demo_mode=${CATWORLD_DEMO_MODE:-false}

case "$demo_mode" in
  true)
    demo_basic=${CATWORLD_DEMO_BASIC:-}
    case "$demo_basic" in
      ''|*[!A-Za-z0-9+/=]*)
        echo 'CATWORLD_DEMO_BASIC must contain a Base64 credential in demo mode.' >&2
        exit 1
        ;;
    esac
    (
      umask 077
      printf 'default "";\n~^Demo$ "Basic %s";\n~*^Basic[[:space:]] $http_authorization;\n' "$demo_basic" > /etc/nginx/catworld-authorization.conf
    )
    cp /etc/nginx/nginx-demo.conf /etc/nginx/conf.d/default.conf
    cp /etc/nginx/nginx-demo-api.conf /etc/nginx/catworld-api-settings.conf
    printf 'client_max_body_size 8m;\ninclude /etc/nginx/nginx-demo-real-ip.conf;\n' > /etc/nginx/catworld-intake-settings.conf
    cp /etc/nginx/nginx-demo-api.conf /etc/nginx/catworld-intake-api.conf
    : > /etc/nginx/catworld-intake-preview.conf
    sed -i 's/id="demo-data-notice" hidden>/id="demo-data-notice">/' /usr/share/nginx/intake-site/index.html
    ;;
  false)
    printf 'default $http_authorization;\n' > /etc/nginx/catworld-authorization.conf
    : > /etc/nginx/catworld-api-settings.conf
    printf 'client_max_body_size 33m;\n' > /etc/nginx/catworld-intake-settings.conf
    printf 'client_max_body_size 9m;\n' > /etc/nginx/catworld-intake-preview.conf
    : > /etc/nginx/catworld-intake-api.conf
    ;;
  *)
    echo 'CATWORLD_DEMO_MODE must be true or false.' >&2
    exit 1
    ;;
esac

cat > /usr/share/nginx/html/runtime-config.json <<EOF
{
  "businessTimeZone": "${business_time_zone}",
  "buildId": "${build_id}",
  "demoMode": ${demo_mode}
}
EOF
