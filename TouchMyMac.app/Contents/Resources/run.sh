#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Find Python 3 binary
PYTHON_BIN="$(which python3)"
if [ -z "$PYTHON_BIN" ] || [ ! -x "$PYTHON_BIN" ]; then
    if [ -x "/Library/Frameworks/Python.framework/Versions/3.10/bin/python3" ]; then
        PYTHON_BIN="/Library/Frameworks/Python.framework/Versions/3.10/bin/python3"
    elif [ -x "/opt/homebrew/bin/python3" ]; then
        PYTHON_BIN="/opt/homebrew/bin/python3"
    fi
fi

exec "$PYTHON_BIN" -m src.main
