echo "Installing Compiling Tools"

cd() {
    RED='\033[0;31m'
    RESET='\033[0m'
    builtin cd "$@" || { echo -e "${RED}Failed to change directory${RESET}" >&2; exit 1; }
}


#Packages for essential C++
sudo apt update
sudo apt install build-essential
sudo apt install cmake
sudo apt install g++
sudo apt-get install pkg-config
sudo apt-get install gdb
sudo apt-get install clang-format
sudo apt-get install libzip-dev
sudo apt-get install valgrind
sudo apt-get install libssl-dev

#Node for autogenerator
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g typescript
cd ../Tools/Autogeneration
npm install
cd ../../

#Git for vcpkg and emscripten
cd Tools
if [ ! -d "./vcpkg" ]; then
    if ! command -v git &> /dev/null; then
        echo "Git not installed - Installing"
        sudo apt update
        sudo apt install git -y
    fi
    sudo apt-get install curl zip unzip tar
    echo "Installing vcpkg"
    currentDir=$(pwd)
    echo "Current directory: $currentDir"
    git clone https://github.com/microsoft/vcpkg.git
    cd ./vcpkg
    ./bootstrap-vcpkg.sh
    cd ../
fi

# Python for emscripten
python --version 2> /dev/null
PYTHON_IS_INSTALLED=$?

if [ $PYTHON_IS_INSTALLED -eq 0 ]; then
    echo "Python is installed."
else
    echo "Python is not installed."
    echo "Attempting to install Python."

    # Check if script is running on Ubuntu or Debian
    if [ -f /etc/debian_version ]; then
        sudo apt-get update
        sudo apt-get install python3 -y
    else
        echo "The script is not running on a Debian-based system. Please install Python manually."
    fi
fi

mkdir Emscripten
cd Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
cd ../../../SetupFiles