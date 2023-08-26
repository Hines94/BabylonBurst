RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

base_path="$(cd "$(dirname "$0")" && pwd)"

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
bash ${base_path}/Engine/Server/BuildDev.sh -t || exit

#--- Start client ---
mkdir ${base_path}/Engine/tmp
PIDFILE="${base_path}/Engine/tmp/editor_launch_info.pid"
CLIENTLOGS="${base_path}/Engine/tmp/viteClientLogs.log"

# Function to check if a process with the given PID is running
is_process_running() {
    local pid=$1
    kill -0 $pid 2>/dev/null
    return $?
}

# Check if the old process is running and kill it
if [ -f $PIDFILE ]; then
    OLD_PID=$(cat $PIDFILE)
    if is_process_running $OLD_PID; then
        echo "Stopping old vite process with PID $OLD_PID..."
        kill $OLD_PID
        # Wait for the process to terminate
        wait $OLD_PID 2>/dev/null
    fi
    rm -f $PIDFILE
fi

# Start client process in the background
if arg_exists "-ns" "$@"; then
    echo "Not starting client or server as part of build"
else
    cd Engine/Client
    nohup npm run start:dev > ${CLIENTLOGS} 2>&1 &
    cd ${base_path}

    echo -e ${GREEN=}"Client running on ${MAGENTA}http://localhost:5173/.${GREEN} Logs are in Engine/tmp."${RESET}

    # Save the PID of the new process
    echo $! > $PIDFILE
fi

#--- Start Server ---
if arg_exists "-ns" "$@"; then
    exit 0
else
    ./Engine/Server/build/server_build/babylonboostserver
fi