#include <map>

namespace CodeHelpers {
    template <typename K, typename V>
    V* find_value(std::map<K, V>& m, const K& key) {
        auto it = m.find(key);
        if (it != m.end()) {
            return &(it->second);
        }
        return nullptr;
    }
} // namespace CodeHelpers
