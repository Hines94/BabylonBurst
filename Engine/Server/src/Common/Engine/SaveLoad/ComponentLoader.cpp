#include "ComponentLoader.h"

std::type_index ComponentLoader::GetComponentTypeFromName(const std::string& Name) {
    const auto it = TypesToNames.find(Name);
    if (TypesToNames.end() == it) {
        const Component* comp = GetComponentFromName(Name);
        if (!comp) {
            return typeid(void);
        }
        TypesToNames.insert({Name, typeid(*comp)});
        delete (comp);
        return TypesToNames.find(Name)->second;
    }
    return it->second;
}

Component* ComponentLoader::GetDefaultComponent(const std::string& Name) {
    if (DefaultComponents.find(Name) != DefaultComponents.end()) {
        return DefaultComponents.find(Name)->second;
    }
    Component* newComp = GetComponentFromName(Name);
    if (newComp == nullptr) {
        std::cerr << "Failed to get default component: " << Name << std::endl;
        return nullptr;
    }
    DefaultComponents.insert({Name, newComp});
    return newComp;
}

std::type_index ComponentLoader::GetTypeFromComponent(Component* comp) {
    return typeid(*comp);
}