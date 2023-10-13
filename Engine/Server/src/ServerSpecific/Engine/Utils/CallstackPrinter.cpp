#include "Engine/Utils/CallstackPrinter.h"
#include <execinfo.h>
#include <iostream>

void CallstackPrinter::PrintCallstack() {
    void* array[50];
    size_t size;
    char** strings;

    size = backtrace(array, 50);
    strings = backtrace_symbols(array, size);

    std::cerr << "--- CALLSTACK ---" << std::endl;

    for (size_t i = 0; i < size; i++) {
        std::cerr << strings[i] << std::endl;
    }

    std::cerr << "--- CALLSTACK END ---" << std::endl;

    free(strings);
}