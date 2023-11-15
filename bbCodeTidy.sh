RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

base_path="$(cd "$(dirname "$0")" && pwd)"
# Helper for checking args
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

cd ${base_path}
if grep -q "^FORMAT_ENGINE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Engine ---"${RESET}

    ${base_path}/node_modules/.bin/prettier --write "${base_path}/Engine/Client/src/**/*.ts" --config ${base_path}/Engine/Tools/.prettierrc

    ${base_path}/node_modules/.bin/prettier --write "${base_path}/Engine/Editor/src/**/*.ts" --config ${base_path}/Engine/Tools/.prettierrc
else
     echo -e ${MAGENTA}"--- Not tidying Engine code. Set FORMAT_ENGINE=true in .env ---"${RESET}
fi

cd ${base_path}
if grep -q "^FORMAT_SOURCE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Source ---"${RESET}

    ${base_path}/node_modules/.bin/prettier --write "Source/**/*.ts" --config ${base_path}/Engine/Tools/.prettierrc
else
     echo -e ${MAGENTA}"--- Not tidying Source code. Set FORMAT_SOURCE=true in .env ---"${RESET}
fi

echo -e ${MAGENTA}"--- Code Formatting Complete ---"${RESET}

#Auto add any changed files
if arg_exists "-gitadd" "$@"; then
    git diff --name-only --diff-filter=AM | xargs -I {} git add "${base_path}/{}"
fi