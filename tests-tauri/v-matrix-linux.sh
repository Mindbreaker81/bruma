#!/bin/sh
# Matriz V1-V9 del plan de portapapeles en Linux X11 (harness manual, no CI).
# Uso: xvfb-run -a dbus-run-session -- sh tests-tauri/v-matrix-linux.sh
# Requiere: xdotool, xclip, python3-pyatspi, at-spi2-core, xvfb y el binario
# debug en src-tauri/target/debug (lo genera pnpm test:e2e:tauri).
cd "$(dirname "$0")/.." || exit 1
rm -f "$HOME"/.local/share/com.mindbreaker81.bruma/localstorage/*
src-tauri/target/debug/bruma &
APP_PID=$!
python3 tests-tauri/v-matrix-linux.py
RC=$?
kill $APP_PID 2>/dev/null
exit $RC
