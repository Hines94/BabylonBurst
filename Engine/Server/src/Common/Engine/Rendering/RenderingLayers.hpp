#pragma once
#include <cmath>
#include <vector>

namespace Rendering {
    // Helper function
    int getUniqueLayer(int num) {
        return static_cast<int>(std::pow(2, num));
    }

    // Initialize global variables
    int defaultLayerMask = getUniqueLayer(0);
    int vfxLayer = getUniqueLayer(1);
    int damageIndicatorMask = getUniqueLayer(2);
    int uiLayerMask = getUniqueLayer(3);
    int workshopLayer = getUniqueLayer(4);

    // Function to combine layer masks
    int CombineLayerMasks(const std::vector<int>& layerMasks) {
        int combinedMask = 0;
        for (const auto& mask : layerMasks) {
            combinedMask |= mask;
        }
        return combinedMask;
    }
} // namespace Rendering