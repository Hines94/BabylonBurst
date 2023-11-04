#!/bin/bash

cd() {
    builtin cd "$@" || { echo "Failed to change directory" >&2; exit 1; }
}

base_path="$(cd "$(dirname "$0")" && pwd)"
PORT=5174

PID=$(lsof -ti tcp:${PORT})
if [ -n "$PID" ]; then
    COMMAND_NAME=$(ps -p ${PID} -o args=)
    if [[ "${COMMAND_NAME}" == *"${base_path}"* ]]; then
        echo -e "Port ${PORT} is in use by ${COMMAND_NAME}. Assuming this is the old Engine. Stopping process."
        kill -15 "$PID" && echo "Process stopped successfully."
    else
        echo -e ${RED}"Port ${PORT} is in use by ${COMMAND_NAME}. Please free this port up before running the engine."${RESET}
        exit 1
    fi
fi

cp .env Engine/Editor/.env || exit
sed -i 's/^/VITE_/' Engine/Editor/.env
cd Engine/Editor
npm run start