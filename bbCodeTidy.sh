RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

base_path="$(cd "$(dirname "$0")" && pwd)"

cd ${base_path}
if grep -q "^FORMAT_ENGINE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Engine ---"${RESET}

    cd ${base_path}/Engine/Server
    find ./src -iname *.h -o -iname *.cpp -o -iname *.hpp -o -iname *.cc | while read file; do echo "Formatting: $file"; clang-format -i "$file"; done


    cd ${base_path}/Engine/Client
    npx prettier --write "src/**/*.ts"
else
     echo -e ${MAGENTA}"--- Not tidying Engine code. Set FORMAT_ENGINE=true in .env ---"${RESET}
fi

cd ${base_path}
if grep -q "^FORMAT_SOURCE=true$" .env; then
    echo -e ${MAGENTA}"--- Performing Code Tidy of Source ---"${RESET}

    cd ${base_path}/Source
    cp ${base_path}/Engine/Server/.clang-format ${base_path}/Source/.clang-format
    find ./CppSource -iname *.h -o -iname *.cpp -o -iname *.hpp -o -iname *.cc | while read file; do echo "Formatting: $file"; clang-format -i "$file"; done
    rm ${base_path}/Source/.clang-format

    cd ${base_path}/Source
    ${base_path}/Engine/Client/node_modules/.bin/prettier prettier --write "TsSource/**/*.ts" --config ${base_path}/Engine/Client/.prettierrc
else
     echo -e ${MAGENTA}"--- Not tidying Source code. Set FORMAT_SOURCE=true in .env ---"${RESET}
fi

echo -e ${MAGENTA}"--- Code Formatting Complete ---"${RESET}
