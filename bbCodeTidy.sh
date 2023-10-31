RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

base_path="$(cd "$(dirname "$0")" && pwd)"

cd ${base_path}
if grep -q "^FORMAT_ENGINE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Engine ---"${RESET}

    cd ${base_path}/Engine/Client
    npx prettier --write "src/**/*.ts"
    cd ${base_path}/Engine/Editor
    npx prettier --write "src/**/*.ts" --config ${base_path}/Engine/Client/.prettierrc
else
     echo -e ${MAGENTA}"--- Not tidying Engine code. Set FORMAT_ENGINE=true in .env ---"${RESET}
fi

cd ${base_path}
if grep -q "^FORMAT_SOURCE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Source ---"${RESET}

    cd ${base_path}/Source
    ${base_path}/Engine/Client/node_modules/.bin/prettier prettier --write "Source/**/*.ts" --config ${base_path}/Engine/Client/.prettierrc
else
     echo -e ${MAGENTA}"--- Not tidying Source code. Set FORMAT_SOURCE=true in .env ---"${RESET}
fi

echo -e ${MAGENTA}"--- Code Formatting Complete ---"${RESET}

# Check if it's a git repo
if [ -d .git ]; then
    # Check for any changes
    if [ -n "$(git status --porcelain)" ]; then
        git add .
        git commit -m "Formatted code with Prettier"
        echo -e ${GREEN}"Prettier changes comitted."${RESET}
    else
        echo -e ${GREEN}"No changes detected by prettier."${RESET}
    fi
fi