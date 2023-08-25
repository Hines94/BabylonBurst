#pragma once
#include "tbb/concurrent_unordered_map.h"
#include "tbb/concurrent_vector.h"
#include <tbb/concurrent_unordered_set.h>

//We can use TBB for server as built to Linux for multithreading power

using uint = unsigned int;

template <typename T>
using EntityUnorderedSet = tbb::concurrent_unordered_set<T>;

template <typename T>
using EntityVector = tbb::concurrent_vector<T>;

template <typename K, typename V>
using EntityUnorderedMap = tbb::concurrent_unordered_map<K, V>;