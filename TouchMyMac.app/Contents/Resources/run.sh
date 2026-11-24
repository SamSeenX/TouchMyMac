#!/bin/bash
cd "$(dirname "$0")"

PYTHON_BIN="/Library/Frameworks/Python.framework/Versions/3.10/bin/python3"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="$(which python3)"
fi

echo "Starting TouchMyMac..."
exec "$PYTHON_BIN" -m src.main
