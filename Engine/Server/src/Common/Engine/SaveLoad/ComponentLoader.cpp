#include "ComponentLoader.h"

std::type_index ComponentLoader::GetComponentTypeFromName(const std::string& Name) {
    const auto it = TypesToNames.find(Name);
    if (TypesToNames.end() == it) {
        const Component* comp = GetComponentFromName(Name);
        if (!comp) {
            return typeid(void);
        }
        TypesToNames.insert(std::pair<std::string, std::type_index>(Name, typeid(*comp)));
        delete (comp);
        return TypesToNames.find(Name)->second;
    }
    return it->second;
}
