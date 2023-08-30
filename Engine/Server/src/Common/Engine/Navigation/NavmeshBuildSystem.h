#pragma once

class NavmeshBuildSystem {
public:
    NavmeshBuildSystem();

    static NavmeshBuildSystem& getInstance() {
        static NavmeshBuildSystem instance; // Guaranteed to be destroyed, instantiated on first use.
        return instance;
    }

    static void RunSystem(bool Init, double dt);

    NavmeshBuildSystem(NavmeshBuildSystem const&) = delete;
    void operator=(NavmeshBuildSystem const&) = delete;
};