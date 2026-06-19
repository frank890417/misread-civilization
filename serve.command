#!/bin/bash
# 誤讀文明 — 互動參考預覽 啟動器（double-click 即可）
cd "$(dirname "$0")"
PORT=8123
echo "🗿 誤讀文明 互動參考預覽"
echo "→ http://127.0.0.1:$PORT"
echo "（關閉：在此視窗按 Ctrl+C）"
# 開瀏覽器（稍等 server 起來）
( sleep 1 && open "http://127.0.0.1:$PORT" ) &
python3 -m http.server $PORT --bind 127.0.0.1
