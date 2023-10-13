#include "Engine/Utils/CallstackPrinter.h"
#include <emscripten.h>
#include <iostream>

void CallstackPrinter::PrintCallstack() {
    char stack[4096 * 2];
    emscripten_get_callstack(EM_LOG_C_STACK, stack, sizeof(stack));
    std::cerr << "--- CALLSTACK ---" << std::endl;
    std::cout << stack << std::endl;
    std::cerr << "--- CALLSTACK END ---" << std::endl;
}