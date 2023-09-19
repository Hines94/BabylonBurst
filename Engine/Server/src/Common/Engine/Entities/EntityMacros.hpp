#include "Engine/Utils/MacroHelpers.h"
#include "TrackedVariable.hpp"

// ----------------------- CPROPERTY -----------------------
// Decide not to pass a default parameter in
#define NO_DEFAULT

#define CONCATENATE_DETAIL(x, y) x##y
#define CONCATENATE(x, y) CONCATENATE_DETAIL(x, y)
#define MAKE_CHOOSER(x) CONCATENATE(CPROPERTY_CHOOSER_, x)

#define CPROPERTY_CHOOSER_0(type, varName, ...) \
    TrackedVariable<type> varName;
#define CPROPERTY_CHOOSER_1(type, varName, defaultValue) \
    TrackedVariable<type> varName = TrackedVariable<type>(defaultValue);

#define CPROPERTY(type, varName, defaultValue, ...) \
    MAKE_CHOOSER(COUNT_ARGS(defaultValue))          \
    (type, varName, defaultValue)
//Custom property flags to be used with CPROPERTY
namespace PropertyFlags {
    enum Flags {
        //Network this property
        NET = 1 << 0,
        //Save this property
        SAVE = 1 << 1,
        //Do not type this property for client
        NOTYPINGS = 1 << 2,
        //Read only in Editor
        EDREAD = 1 << 3,
        //Not counted when checking if components are equal
        NOEQUALITY = 1 << 4
    };
}

// ------------------- COMPONENT METHODS ----------------------

//Base methods for a component. Allows networking, saving and loading of data
#define DECLARE_COMPONENT_METHODS(TypeName)                                                                                                                  \
    void LoadFromComponentData(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) override;          \
    void LoadFromComponentDataIfDefault(const std::map<Entity, EntityData*>& OldNewEntMap, const std::map<std::string, msgpack::object>& compData) override; \
    void GetComponentData(PackerDetails& p, bool ignoreDefaultValues, Component* childComponent = nullptr) override;                                         \
    bool operator==(const TypeName& other) const;                                                                                                            \
    bool isEqual(const Component* other) const override;                                                                                                     \
    void SetupTrackedVariables(EntityData* Owner) override;

// ------------------------ CCOMPONENT --------------------------

//Use this macro to define a custom component for autogeneration system
#define CCOMPONENT(...) // CCOMPONENT(__VA_ARGS__)
//Custom property flags to be used with CCOMPONENT
namespace ComponentFlags {
    enum Flags {
        //Do not type this property for client
        NOTYPINGS = 1 << 0,
        NOSAVE = 1 << 1,
        NONETWORK = 1 << 2,
    };
} // namespace ComponentFlags

// --------------------- REQUIRE OTHER COMP ------------------------

//In editor we require another component to be present?
#define REQUIRE_OTHER_COMPONENTS(...) // REQUIRE_OTHER_COMPONENTS(__VA_ARGS__)
