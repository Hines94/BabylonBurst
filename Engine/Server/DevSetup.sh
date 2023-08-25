echo Starting setup for BabylonBoost Server Side

cd() {
    builtin cd "$@" || { echo "Failed to change directory" >&2; exit 1; }
}

# echo Setting up Git Hooks
mkdir .git/hooks
cp SetupFiles/hooks/pre-commit .git/hooks/pre-commit
cd .git/hooks || exit
chmod +x pre-commit
cd ../../

#TODO: Setup this stuff!
# echo Setting up VSCode Launch
# cp SetupFiles/vscode/c_cpp_properties.json .vscode/c_cpp_properties.json
# cp SetupFiles/vscode/launch.json .vscode/launch.json
# cp SetupFiles/vscode/tasks.json .vscode/tasks.json

echo Installing Required Software
cd SetupFiles  || exit
bash ubuntuInstalls.sh
echo Install packages
bash vcpkgInstalls.sh x64-linux
bash vcpkgInstalls.sh wasm32-emscripten
cd ../

echo Installing Tools
cd Tools || exit
wget https://github.com/prometheus/prometheus/releases/download/v2.44.0/prometheus-2.44.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
rm prometheus-2.44.0.linux-amd64.tar.gz
cp ../SetupFiles/prometheus/prometheus.yml prometheus-2.44.0.linux-amd64/prometheus.yml