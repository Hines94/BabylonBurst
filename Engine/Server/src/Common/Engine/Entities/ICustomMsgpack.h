#include "PackerDetails.hpp"
#include <map>
#include <string>

class EntityData;

//Custom interface for msgpack serialization. Item can be stored as different type and then retrieved.
class ICustomMsgpack {
public:
    virtual ~ICustomMsgpack() {}

    //These methods need to be included in the derived class for autogeneration
    //static void PackSerializeData(PackerDetails& p, YOURCLASS* Data) = 0;
    //static YOURCLASS* LoadFromSerializeData(const std::map<Entity, EntityData*>& OldNewEntMap, const msgpack::object* data) = 0;
};