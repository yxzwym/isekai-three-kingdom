#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")/.."
printf '\n异梦三国\n\n浏览器打开：http://127.0.0.1:8765/\n按 Ctrl+C 关闭服务。\n\n'
exec python3 -m http.server 8765 --bind 127.0.0.1
