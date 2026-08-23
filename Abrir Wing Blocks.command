#!/bin/zsh

set -e
cd -- "$(dirname -- "$0")"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display dialog "O Node.js precisa estar instalado para abrir Wing Blocks." buttons {"OK"} default button "OK" with icon caution'
  exit 1
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

npm start
