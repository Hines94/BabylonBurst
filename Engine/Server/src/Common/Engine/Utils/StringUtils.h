#pragma once
#include <string>

namespace StringUtils {
    std::string RemoveNumericPrefix(const std::string& str);
    std::string DeflateStringView(std::string_view input);
    std::string EnsureZipExtension(const std::string& filename);
    bool CanConvertToLongLong(const std::string& str);
} // namespace StringUtils