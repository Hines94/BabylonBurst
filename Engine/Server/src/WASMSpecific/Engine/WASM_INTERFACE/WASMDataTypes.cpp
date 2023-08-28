#include <emscripten/bind.h>

using namespace emscripten;

void pushBackString(std::vector<std::string>& v, std::string value) {
    v.push_back(value);
}
void setElementString(std::vector<std::string>& v, size_t index, std::string value) {
    if (index < v.size()) {
        v[index] = value;
    }
}

EMSCRIPTEN_BINDINGS(WASMDataTypes) {
    register_vector<uint8_t>("VectorUint8")
        .function("size", &std::vector<uint8_t>::size)
        .function("get", select_overload<uint8_t&(size_t)>(&std::vector<uint8_t>::operator[]));
    register_vector<uint32_t>("VectorUint32")
        .function("size", &std::vector<uint32_t>::size)
        .function("get", select_overload<uint32_t&(size_t)>(&std::vector<uint32_t>::operator[]));
    register_vector<std::string>("VectorString")
        .function("size", &std::vector<std::string>::size)
        .function("get", select_overload<std::string&(size_t)>(&std::vector<std::string>::operator[]))
        .function("set", &setElementString)
        .function("push_back", &pushBackString);
}
