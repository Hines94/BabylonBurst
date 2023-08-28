#pragma once
#include <string>

namespace StringUtils {
    std::string RemoveNumericPrefix(const std::string& str);
    std::string DeflateStringView(std::string_view input);
} // namespace StringUtils