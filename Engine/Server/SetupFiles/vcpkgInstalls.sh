#!/bin/bash

cd() {
    RED='\033[0;31m'
    RESET='\033[0m'
    builtin cd "$@" || { echo -e "${RED}Failed to change directory${RESET}" >&2; exit 1; }
}


# --- Package Selection --- #

common_packages=(
    "msgpack"
    "nlohmann-json"
    "gtest"
    "tbb"
    "bullet3"
    "rapidcsv"
    "zlib"
)

linux_packages=(
    "uwebsockets"
    "prometheus-cpp"
    "aws-sdk-cpp"
    "tinygltf"
    "draco"
)

wasm_packages=(

)

# --- End Package Selection --- #

echo "Installing Required Packages"
export VCPKG_TARGET_TRIPLET=$1
cd ../Tools

tools_path="$(cd "$(dirname "$0")" && pwd)"

cd vcpkg

# In case we are using emscripten
export PATH=$PATH:${tools_path}/Emscripten/emsdk/upstream/emscripten
source ${tools_path}/Emscripten/emsdk/upstream/emscripten
export EMSCRIPTEN=${tools_path}/Emscripten/emsdk/upstream/emscripten

#Common
for package in ${common_packages[@]}; do
    ./vcpkg install $package:$VCPKG_TARGET_TRIPLET
done
#linux
if [ "$VCPKG_TARGET_TRIPLET" == "x64-linux" ]; then
    for package in ${linux_packages[@]}; do
        ./vcpkg install $package:$VCPKG_TARGET_TRIPLET || exit 1
    done
fi
#wasm
if [ "$VCPKG_TARGET_TRIPLET" == "wasm32-emscripten" ]; then
    for package in ${wasm_packages[@]}; do
        ./vcpkg install $package:$VCPKG_TARGET_TRIPLET || exit 1
    done
fi