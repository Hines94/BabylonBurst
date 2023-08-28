#pragma once
#include <unordered_map>
#include <unordered_set>
#include <vector>

//Storage types for WASM. Can't use TBB so we use standard versions

using uint = unsigned int;

template <typename T>
using EntityUnorderedSet = std::unordered_set<T>;

template <typename T>
using EntityVector = std::vector<T>;

template <typename K, typename V>
using EntityUnorderedMap = std::unordered_map<K, V>;