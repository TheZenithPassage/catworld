#!/bin/sh
set -eu

phone=${CATWORLD_WHATSAPP_PHONE:-}
case "$phone" in
  +*)
    digits=${phone#+}
    case "$digits" in
      ''|0*|*[!0-9]*) phone='' ;;
    esac
    if [ "${#digits}" -lt 8 ] || [ "${#digits}" -gt 15 ]; then
      phone=''
    fi
    ;;
  *) phone='' ;;
esac

printf '{"whatsappPhone":"%s"}\n' "$phone" > /usr/share/nginx/public-site/public-config.json
