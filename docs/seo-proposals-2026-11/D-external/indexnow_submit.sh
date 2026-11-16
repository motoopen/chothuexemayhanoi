#!/usr/bin/env bash
# IndexNow (Bing, Yandex, Seznam...; Google does not use it). Usage after each deploy:
#   ./indexnow_submit.sh <32-hex-key> https://motoopen.github.io/chothuexemayhanoi/banggia.html [more URLs...]
# One-time setup: create the key with `openssl rand -hex 16`, save it as <key>.txt (content = the key only)
# at the REPO ROOT, push, and check https://motoopen.github.io/chothuexemayhanoi/<key>.txt returns the key.
# A key file in /chothuexemayhanoi/ authorises URLs under that folder only (= this site).
# HTTP 200/202 = accepted, NOT indexed. Send only URLs whose content really changed.
set -euo pipefail
KEY="${1:?key}"; shift
[ "$#" -ge 1 ] || { echo "give at least one URL"; exit 1; }
URLS=$(printf '"%s",' "$@"); URLS="[${URLS%,}]"
curl -sS -o /dev/null -w 'IndexNow HTTP %{http_code}\n' -X POST 'https://api.indexnow.org/indexnow' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"motoopen.github.io\",\"key\":\"$KEY\",\"keyLocation\":\"https://motoopen.github.io/chothuexemayhanoi/$KEY.txt\",\"urlList\":$URLS}"
