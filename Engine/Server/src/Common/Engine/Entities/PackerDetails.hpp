#pragma once
#include "Engine/StorageTypes.hpp"
#include <iostream>
#include <msgpack.hpp>
#include <string>
#include <vector>

//Type of data to
enum ComponentDataType {
    Network,
    Saving
};
//The type of a specific property - eg should it be saved etc
enum PackType {
    SaveAndNetwork,
    NetworkOnly,
    SaveOnly,
};

//Contains details on what items to pack and how they can be packed
struct PackerDetails {
    //Number of properties in the component
    uint compPropertyNum = 0;
    //Pack size of this specific message
    uint packSize = 0;
    std::vector<std::string> names;
    EntityUnorderedSet<std::string> propsToPack;
    msgpack::packer<msgpack::sbuffer>* packer;
    ComponentDataType dt;
    //So we can pre-determine num of vars and create map upfront
    bool isSizingPass = false;
    //Useful for creating type indexes
    bool isNamingPass = false;

    bool Include(const std::string& propName, PackType pt, bool EqualToDefault) {
        //Any issues with type?
        if (dt == ComponentDataType::Saving && pt == PackType::NetworkOnly) {
            return false;
        }
        if (dt == ComponentDataType::Network && pt == PackType::SaveOnly) {
            return false;
        }
        compPropertyNum++; //Increment so we know what id we are in the map
        if (propsToPack.size() > 0 && propsToPack.find(propName) == propsToPack.end()) {
            return false;
        }
        //Naming pass to get typings?
        if (isNamingPass) {
            names.push_back(propName);
            return false;
            //Is full pass?
        }

        //If equal then will be set anyway so no need to add
        if (EqualToDefault) {
            return false;
        }

        //Is part of addition
        packSize++;
        if (isSizingPass) {
            return false;
        } else {
            //Pack with parameter index for smaller sizes
            packer->pack(compPropertyNum - 1);

            //Return true so we can pack with value
            return true;
        }
    }
};
