#pragma once
#include "TrackedVariableForwardDeclare.hpp"
#include <functional>
#include <iostream>
#include <map>
#include <msgpack.hpp>
#include <type_traits>
#include <vector>
//This is autogenerated so we can use specializations for autogenerated data structures
#include "Engine/CommonTrackedDatastructures_autogenerated.h"
//This is autogenerated so we can use specializations for autogenerated data structures
#include "Engine/SpecificTrackedDatastructures_autogenerated.h"

//We have specialised versions for vector, map etc and also for specific struct versions (to wrap members too)
// Base case for is_specialized trait
template <typename T>
struct is_specialized : std::false_type {};

// Specializations
template <>
struct is_specialized<std::string> : std::true_type {};

template <typename T>
struct is_specialized<std::vector<T>> : std::true_type {};

template <typename K, typename V>
struct is_specialized<std::map<K, V>> : std::true_type {};

// Helper struct to handle the arithmetic case
template <typename T, typename = void>
struct is_specialized_arithmetic : std::false_type {};

template <typename T>
struct is_specialized_arithmetic<T, std::enable_if_t<std::is_arithmetic_v<T>>> : std::true_type {};

// Overload is_specialized to also consider the arithmetic case
template <typename T>
inline constexpr bool is_specialized_v = is_specialized<T>::value || is_specialized_arithmetic<T>::value;

/**Catch-all template for most types. 
 * Slightly hacky in that we inherit from T - so we may miss memeber changes,
 * BUT we must make sure to add specific wrapped variants via autogeneration for our data types */
template <typename T>
class TrackedVariable<T, std::enable_if_t<!is_specialized_v<T> && !std::is_pointer<T>::value>> : public T {
public:
    using T::T; // Inherit constructors

    explicit TrackedVariable(const T& initialValue) {
        T::operator=(initialValue);
    }

    std::function<void()> onChange;

    void setCallback(std::function<void()> callback) {
        onChange = callback;
    }

    TrackedVariable& operator=(const T& newValue) {
        if (onChange) {
            onChange();
        }
        T::operator=(newValue);
        return *this;
    }

    operator T() const {
        return static_cast<T>(*this);
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        pk.pack(static_cast<T>(*this));
    }

    void msgpack_unpack(msgpack::object const& o) {
        T temp;
        o.convert(temp);
        *this = temp;
    }
};

// Pointer General
template <typename T>
class TrackedVariable<T, std::enable_if_t<!is_specialized_v<T> && std::is_pointer<T>::value>> {
public:
    TrackedVariable() = default;
    explicit TrackedVariable(T initialValue) : value(initialValue) {}

    T value;
    std::function<void()> onChange;

public:
    void setCallback(std::function<void()> callback) {
        onChange = callback;
    }

    TrackedVariable& operator=(T newValue) {
        value = newValue;
        if (onChange) {
            onChange();
        }
        return *this;
    }

    // Dereference operator for ease of use
    auto& operator*() {
        return *value;
    }

    const auto& operator*() const {
        return *value;
    }

    // Arrow operator for ease of use
    T operator->() {
        return value;
    }

    const T operator->() const {
        return value;
    }

    operator T() const {
        return value;
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        pk.pack(value);
    }

    void msgpack_unpack(msgpack::object const& o) {
        o.convert(value);
    }
};

// Specialization for std::string
template <>
class TrackedVariable<std::string> : public std::string {
public:
    TrackedVariable() = default;

    explicit TrackedVariable(const std::string& initialValue)
        : std::string(initialValue) {}

private:
    std::function<void()> onChange;

public:
    void setCallback(std::function<void()> callback) {
        onChange = callback;
    }

    inline TrackedVariable& operator=(const std::string& newValue) {
        std::string::operator=(newValue);
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline TrackedVariable& operator+=(const std::string& addValue) {
        std::string::operator+=(addValue);
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline char& operator[](std::size_t idx) {
        char& ref = std::string::operator[](idx);
        if (onChange) {
            onChange();
        }
        return ref;
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        pk.pack(static_cast<std::string>(*this));
    }

    void msgpack_unpack(msgpack::object const& o) {
        o.convert<std::string>(*this);
    }
};

//Number spec
template <typename T>
class TrackedVariable<T, std::enable_if_t<std::is_arithmetic_v<T>>> {
public:
    TrackedVariable() = default;
    explicit TrackedVariable(T initialValue) : value(initialValue) {}

    T value;
    std::function<void()> onChange;

public:
    void setCallback(std::function<void()> callback) {
        onChange = callback;
    }

    inline TrackedVariable& operator=(T newValue) {
        value = newValue;
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline TrackedVariable& operator+=(T addValue) {
        value += addValue;
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline TrackedVariable& operator-=(T subValue) {
        value -= subValue;
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline TrackedVariable& operator*=(T mulValue) {
        value *= mulValue;
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline TrackedVariable& operator/=(T divValue) {
        if (divValue != 0) { // Check to prevent division by zero
            value /= divValue;
        }
        if (onChange) {
            onChange();
        }
        return *this;
    }

    operator T() const {
        return value;
    }

    template <typename U>
    explicit operator U() const {
        return static_cast<U>(static_cast<T>(*this));
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        pk.pack(value);
    }

    void msgpack_unpack(msgpack::object const& o) {
        o.convert(value);
    }
};

// Specialization for std::vector
template <typename T>
class TrackedVariable<std::vector<T>, void> {
public:
    TrackedVariable() = default;

    explicit TrackedVariable(const std::vector<T>& initialValues) {
        for (const auto& val : initialValues) {
            innerData.push_back(TrackedVariable<T>(val));
        }
    }

private:
    std::vector<TrackedVariable<T>> innerData;
    std::function<void()> onChange;
    mutable std::vector<T> cache;

    void updateCache() const {
        if (cache.size() != innerData.size()) {
            cache.resize(innerData.size());
        }

        for (size_t i = 0; i < innerData.size(); ++i) {
            cache[i] = static_cast<T>(innerData[i]); // using the implicit conversion operator
        }
    }

public:
    inline TrackedVariable<std::vector<T>, void>& operator=(const std::vector<T>& newValues) {
        innerData.clear();
        for (const auto& val : newValues) {
            TrackedVariable<T> tracked;
            tracked = val;
            innerData.push_back(tracked);
        }
        if (onChange) {
            onChange();
        }
        return *this;
    }

    inline T* data() {
        updateCache();
        return cache.data();
    }

    inline bool operator==(const TrackedVariable<std::vector<T>>& other) const {
        return innerData == other.innerData;
    }

    inline bool operator!=(const TrackedVariable<std::vector<T>>& other) const {
        return innerData != other.innerData;
    }

    inline bool operator==(const std::vector<T>& other) const {
        return innerData == other;
    }

    inline bool operator!=(const std::vector<T>& other) const {
        return innerData != other;
    }

    inline operator T() const {
        return innerData;
    }

    void setCallback(std::function<void()> callback) {
        onChange = callback;
        //TODO: Set in all childs!
    }

    inline void push_back(const T& value) {
        TrackedVariable<T> tracked{value};
        tracked.setCallback(onChange);
        innerData.push_back(tracked);
        if (onChange) {
            onChange();
        }
    }

    inline void push_back(const TrackedVariable<T>& value) {
        innerData.push_back(value);
        if (onChange) {
            onChange();
        }
    }

    inline void pop_back() {
        innerData.pop_back();
        if (onChange) {
            onChange();
        }
    }

    inline TrackedVariable<T>& operator[](size_t index) {
        return innerData[index];
    }

    inline size_t size() const {
        return innerData.size();
    }

    inline void clear() {
        innerData.clear();
        if (onChange) {
            onChange();
        }
    }

    auto begin() -> decltype(innerData.begin()) {
        return innerData.begin();
    }

    inline auto end() -> decltype(innerData.end()) {
        return innerData.end();
    }

    inline auto begin() const -> decltype(innerData.begin()) const {
        return innerData.begin();
    }

    inline auto end() const -> decltype(innerData.end()) const {
        return innerData.end();
    }

    inline void erase(typename std::vector<TrackedVariable<T>>::iterator first, typename std::vector<TrackedVariable<T>>::iterator last) {
        innerData.erase(first, last);
        if (onChange) {
            onChange();
        }
    }

    inline void resize(size_t newSize) {
        innerData.resize(newSize);
        if (onChange) {
            onChange();
        }
    }

    inline bool empty() const {
        return innerData.empty();
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::vector<T> plainData;
        for (const auto& item : innerData) {
            plainData.push_back(static_cast<T>(item));
        }
        pk.pack(plainData);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::vector<T> plainData;
        o.convert(plainData);
        innerData.clear();
        for (const auto& item : plainData) {
            innerData.push_back(TrackedVariable<T>(item));
        }
    }
};

// Specialization for std::map
template <typename K, typename V>
class TrackedVariable<std::map<K, V>, void> {
public:
    TrackedVariable() = default;

    explicit TrackedVariable(const std::map<K, V>& initialValues) {
        for (const auto& [key, val] : initialValues) {
            data[key] = TrackedVariable<V>(val);
        }
    }

private:
    std::map<K, TrackedVariable<V>> data;
    std::function<void()> onChange;

public:
    void setCallback(std::function<void()> callback) {
        onChange = callback;
    }

    bool operator==(const TrackedVariable<std::map<K, V>, void>& other) {
        return data == other.data;
    }

    bool operator!=(const TrackedVariable<std::map<K, V>, void>& other) {
        return !(data == other.data);
    }

    inline TrackedVariable<V>& operator[](const K& key) {
        return data[key];
    }

    inline void insert(const std::pair<K, V>& value) {
        data.insert({value.first, TrackedVariable<V>(value.second)});
        if (onChange) {
            onChange();
        }
    }

    inline void erase(const K& key) {
        data.erase(key);
        if (onChange) {
            onChange();
        }
    }

    inline void clear() {
        data.clear();
        if (onChange) {
            onChange();
        }
    }

    using iterator = typename std::map<K, TrackedVariable<V>>::iterator;
    using const_iterator = typename std::map<K, TrackedVariable<V>>::const_iterator;

    inline iterator begin() {
        return data.begin();
    }

    inline iterator end() {
        return data.end();
    }

    inline const_iterator begin() const {
        return data.begin();
    }

    inline const_iterator end() const {
        return data.end();
    }

    inline size_t size() const {
        return data.size();
    }

    inline bool empty() const {
        return data.empty();
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::map<K, V> plainData;
        for (const auto& [key, item] : data) {
            plainData[key] = static_cast<V>(item);
        }
        pk.pack(plainData);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::map<K, V> plainData;
        o.convert(plainData);
        data.clear();
        for (const auto& [key, value] : plainData) {
            TrackedVariable<V> newval;
            newval = value;
            data[key] = newval;
        }
    }
};