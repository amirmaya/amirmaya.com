#!/bin/zsh
# Stamp asset URLs in v3.html/index.html with a timestamp so browsers never serve stale js/css.
cd "$(dirname "$0")"; V=$(date +%Y%m%d%H%M)
for f in v3.html index.html legacy.html; do [ -f "$f" ] && sed -i '' -E "s#((styles|v3)\.css|(content|brain|v3|counter|app|graph|neural)\.js)(\?v=[0-9]+)?#\1?v=$V#g" "$f"; done; echo "stamped $V"
