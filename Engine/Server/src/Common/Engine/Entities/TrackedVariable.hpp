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
        if (onChange) {
            onChange();
        }
        value = newValue;
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
        if (onChange) {
            onChange();
        }
        std::string::operator=(newValue);
        return *this;
    }

    inline TrackedVariable& operator+=(const std::string& addValue) {
        if (onChange) {
            onChange();
        }
        std::string::operator+=(addValue);
        return *this;
    }

    inline char& operator[](std::size_t idx) {
        if (onChange) {
            onChange();
        }
        return std::string::operator[](idx);
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
        if (onChange) {
            onChange();
        }
        value = newValue;
        return *this;
    }

    inline TrackedVariable& operator+=(T addValue) {
        if (onChange) {
            onChange();
        }
        value += addValue;
        return *this;
    }

    inline TrackedVariable& operator-=(T subValue) {
        if (onChange) {
            onChange();
        }
        value -= subValue;
        return *this;
    }

    inline TrackedVariable& operator*=(T mulValue) {
        if (onChange) {
            onChange();
        }
        value *= mulValue;
        return *this;
    }

    inline TrackedVariable& operator/=(T divValue) {
        if (onChange) {
            onChange();
        }
        if (divValue != 0) { // Check to prevent division by zero
            value /= divValue;
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
            data.push_back(TrackedVariable<T>(val));
        }
    }

private:
    std::vector<TrackedVariable<T>> data;
    std::function<void()> onChange;

public:
    inline TrackedVariable<std::vector<T>, void>& operator=(const std::vector<T>& newValues) {
        if (onChange) {
            onChange();
        }
        data.clear();
        for (const auto& val : newValues) {
            TrackedVariable<T> tracked(val);
            data.push_back(tracked);
        }
        return *this;
    }

    inline bool operator==(const TrackedVariable<std::vector<T>>& other) const {
        return data == other.data;
    }

    inline bool operator!=(const TrackedVariable<std::vector<T>>& other) const {
        return !(*this == other);
    }

    inline bool operator==(const std::vector<T>& other) const {
        return data == other;
    }

    inline bool operator!=(const std::vector<T>& other) const {
        return !(*this == other);
    }

    inline operator T() const {
        return data;
    }

    void setCallback(std::function<void()> callback) {
        onChange = callback;
        //TODO: Set in all childs!
    }

    inline void push_back(const T& value) {
        if (onChange) {
            onChange();
        }
        TrackedVariable<T> tracked(value);
        tracked.setCallback(onChange);
        data.push_back(tracked);
    }

    inline void push_back(const TrackedVariable<T>& value) {
        if (onChange) {
            onChange();
        }
        TrackedVariable<T> tracked = value;
        data.push_back(tracked);
    }

    inline void pop_back() {
        if (onChange) {
            onChange();
        }
        data.pop_back();
    }

    inline TrackedVariable<T>& operator[](size_t index) {
        return data[index];
    }

    inline size_t size() const {
        return data.size();
    }

    inline void clear() {
        if (onChange) {
            onChange();
        }
        data.clear();
    }

    auto begin() -> decltype(data.begin()) {
        return data.begin();
    }

    inline auto end() -> decltype(data.end()) {
        return data.end();
    }

    inline auto begin() const -> decltype(data.begin()) const {
        return data.begin();
    }

    inline auto end() const -> decltype(data.end()) const {
        return data.end();
    }

    inline void erase(typename std::vector<TrackedVariable<T>>::iterator first, typename std::vector<TrackedVariable<T>>::iterator last) {
        if (onChange) {
            onChange();
        }
        data.erase(first, last);
    }

    inline void resize(size_t newSize) {
        if (onChange) {
            onChange();
        }
        data.resize(newSize);
    }

    inline bool empty() const {
        return data.empty();
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::vector<T> plainData;
        for (const auto& item : data) {
            plainData.push_back(static_cast<T>(item));
        }
        pk.pack(plainData);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::vector<T> plainData;
        o.convert(plainData);
        data.clear();
        for (const auto& item : plainData) {
            data.push_back(TrackedVariable<T>(item));
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
        if (onChange) {
            onChange();
        }
        data.insert({value.first, TrackedVariable<V>(value.second)});
    }

    inline void erase(const K& key) {
        if (onChange) {
            onChange();
        }
        data.erase(key);
    }

    inline void clear() {
        if (onChange) {
            onChange();
        }
        data.clear();
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
            data[key] = TrackedVariable<V>(value);
        }
    }
};