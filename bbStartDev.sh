RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

base_path="$(cd "$(dirname "$0")" && pwd)"
PORT=5173

arg_exists() {
    target_arg="$1"
    shift
    for arg in "$@"; do
        if [ "$arg" = "$target_arg" ]; then
            return 0  # True in shell terms, meaning the argument exists
        fi
    done
    return 1  # False in shell terms, meaning the argument does not exist
}

#Copy env
cp ./.env Engine/Client/.env
cp ./.env Engine/Server/.env
if [ $? -ne 0 ]; then
    printf "${RED}BUILD FAIL: Please create a .env file in ${base_path}${RESET}\n"
    exit 1
fi
sed -i 's/^/VITE_/' Engine/Client/.env

#--- Build Server ---
echo -e ${MAGENTA}Building Server${RESET}
echo "TODO: start up local server once fixed"

#--- Start client ---
mkdir -p ${base_path}/Engine/tmp
CLIENTLOGS="${base_path}/Engine/tmp/viteClientLogs.log"

# Function to check if a process with the given PID is running
is_process_running() {
    local pid=$1
    kill -0 $pid 2>/dev/null
    return $?
}

# KIll old process using our port
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

# Start client process in the background
if arg_exists "-ns" "$@"; then
    echo "Not starting client or server as part of build"
else
    cd Engine/Client
    #Editor version of game?
    if arg_exists "-edit" "$@"; then
        cd ${base_path}/Engine/Editor
        nohup npm run start:game > ${CLIENTLOGS} 2>&1 &
        echo "Running editor version"
    #Regular version of game
    else
        nohup npm run start:dev > ${CLIENTLOGS} 2>&1 &
    fi
    cd ${base_path}

    echo -e ${GREEN}"Client running on ${MAGENTA}http://localhost:5173/.${GREEN} Logs are in Engine/tmp."${RESET}
fi

#--- Start Server ---
#TODO: Start server