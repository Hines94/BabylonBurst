#pragma once
#include "Engine/Utils/MsgpackHelpers.h"
#include "Engine/Utils/StringUtils.h"
#include "msgpack.hpp"
#include <iostream>
#include <string>

//Can be used to specify a model we want to use. Editor integration so we can easily choose from models
struct ModelSpecifier {
    //The path to get to our zipped models archive on S3 (eg Folder/Mesh~7~)
    std::string FilePath;
    //The name of the mesh (eg Cube1)
    std::string MeshName;
    //If multiple files are zipped together, the file that contains our model
    int FileIndex = 0;

    bool operator==(const ModelSpecifier& rhs) const {
        if (FilePath != rhs.FilePath) {
            return false;
        }
        if (MeshName != rhs.MeshName) {
            return false;
        }
        return true;
    }

    bool operator!=(const ModelSpecifier& other) const {
        return !(*this == other);
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        pk.pack_map(3);

        pk.pack("FilePath");
        pk.pack(FilePath);

        pk.pack("MeshName");
        pk.pack(MeshName);

        pk.pack("FileIndex");
        pk.pack(FileIndex);
    }

    void msgpack_unpack(msgpack::object const& o) {
        // Ensure o is a map before proceeding.
        if (o.type != msgpack::type::MAP) {
            return;
        }
        std::map<std::string, msgpack::object> data;
        o.convert(data);

        if (data.find("FilePath") != data.end()) {
            FilePath = data.at("FilePath").as<std::string>();
        }
        if (data.find("MeshName") != data.end()) {
            MeshName = data.at("MeshName").as<std::string>();
        }
        if (data.find("FileIndex") != data.end()) {
            FileIndex = data.at("FileIndex").as<int>();
        }
    }
};