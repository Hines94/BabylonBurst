// #include <msgpack.hpp>
// #include "TrackedVariable.hpp"

// namespace msgpack {
// MSGPACK_API_VERSION_NAMESPACE(MSGPACK_DEFAULT_API_NS) {
// namespace adaptor {

// // Specialization for TrackedVariable with numbers
// template <typename T>
// struct pack<TrackedVariable<T, std::enable_if_t<std::is_arithmetic_v<T>>>> {
//     template <typename Stream>
//     msgpack::packer<Stream>& operator()(msgpack::packer<Stream>& o, const TrackedVariable<T>& v) const {
//         // Serialize the internal data of the TrackedVariable for arithmetic types
//         o.pack(static_cast<T>(v));
//         return o;
//     }
// };

// template <typename T>
// struct convert<TrackedVariable<T, std::enable_if_t<std::is_arithmetic_v<T>>>> {
//     msgpack::object const& operator()(msgpack::object const& o, TrackedVariable<T>& v) const {
//         // Deserialize into the internal data of the TrackedVariable for arithmetic types
//         T temp;
//         o.convert(temp);
//         v = temp;
//         return o;
//     }
// };

// // Specialization for TrackedVariable with std::string
// template <>
// struct pack<TrackedVariable<std::string>> {
//     template <typename Stream>
//     msgpack::packer<Stream>& operator()(msgpack::packer<Stream>& o, const TrackedVariable<std::string>& v) const {
//         o.pack(v);
//         return o;
//     }
// };

// template <>
// struct convert<TrackedVariable<std::string>> {
//     msgpack::object const& operator()(msgpack::object const& o, TrackedVariable<std::string>& v) const {
//         std::string temp;
//         o.convert(temp);
//         v = temp;
//         return o;
//     }
// };

// // Specialization for TrackedVariable with std::vector<T>
// template <typename T>
// struct pack<TrackedVariable<std::vector<T>>> {
//     template <typename Stream>
//     msgpack::packer<Stream>& operator()(msgpack::packer<Stream>& o, const TrackedVariable<std::vector<T>>& v) const {
//         o.pack(v.value);
//         return o;
//     }
// };

// template <typename T>
// struct convert<TrackedVariable<std::vector<T>>> {
//     msgpack::object const& operator()(msgpack::object const& o, TrackedVariable<std::vector<T>>& v) const {
//         o.convert(v.value);
//         return o;
//     }
// };

// // Specialization for TrackedVariable with std::map<K, V>
// template <typename K, typename V>
// struct pack<TrackedVariable<std::map<K, V>>> {
//     template <typename Stream>
//     msgpack::packer<Stream>& operator()(msgpack::packer<Stream>& o, const TrackedVariable<std::map<K, V>>& v) const {
//         o.pack(v.value);
//         return o;
//     }
// };

// template <typename K, typename V>
// struct convert<TrackedVariable<std::map<K, V>>> {
//     msgpack::object const& operator()(msgpack::object const& o, TrackedVariable<std::map<K, V>>& v) const {
//         o.convert(v.value);
//         return o;
//     }
// };

// template <typename T>
// struct pack<TrackedVariable<T>> {
//     template <typename Stream>
//     msgpack::packer<Stream>& operator()(msgpack::packer<Stream>& o, const TrackedVariable<T>& v) const {
//         // Serialize the internal data of the TrackedVariable
//         o.pack(static_cast<T>(v)); // assuming that you have an implicit cast operator to T
//         return o;
//     }
// };

// template <typename T>
// struct convert<TrackedVariable<T>> {
//     msgpack::object const& operator()(msgpack::object const& o, TrackedVariable<T>& v) const {
//         // Deserialize into the internal data of the TrackedVariable
//         T temp;
//         o.convert(temp);
//         v = temp; // assuming you've overloaded the assignment operator for T
//         return o;
//     }
// };

// }  // namespace adaptor
// }  // MSGPACK_API_VERSION_NAMESPACE(MSGPACK_DEFAULT_API_NS)
// }  // namespace msgpack