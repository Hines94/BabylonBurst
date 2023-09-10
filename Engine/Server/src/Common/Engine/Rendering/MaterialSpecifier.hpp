#pragma once
#include "Engine/Utils/MsgpackHelpers.h"
#include "Engine/Utils/StringUtils.h"
#include "msgpack.hpp"
#include <iostream>
#include <string>

//Specifies a saved Editor material to use
struct MaterialSpecifier {
    //The path to get to our zipped material archive on S3 (eg Folder/Material~8~)
    std::string FilePath;
    //If multiple files are zipped together, the file that contains our material
    int FileIndex = 0;

    bool operator==(const MaterialSpecifier& rhs) const {
        if (FilePath != rhs.FilePath) {
            return false;
        }
        return true;
    }

    bool operator!=(const MaterialSpecifier& other) const {
        return !(*this == other);
    }

    MSGPACK_PACK_FUNC(FilePath, FileIndex)

    MSGPACK_UNPACK_FUNC(FilePath, FileIndex)
};