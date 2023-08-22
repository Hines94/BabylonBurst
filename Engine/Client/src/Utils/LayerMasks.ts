export var defaultLayerMask = getUniqueLayer(0);
export var vfxLayer = getUniqueLayer(1);
export var damageIndicatorMask = getUniqueLayer(2);
export var uiLayerMask = getUniqueLayer(3);
export var workshopLayer = getUniqueLayer(4);

// Use powers of two for additional layers:
// 0x00000001 - 2^0
// 0x00000002 - 2^1
// 0x00000004 - 2^2
// 0x00000008 - 2^3
// 0x00000010 - 2^4
// 0x00000020 - 2^5
// 0x00000040 - 2^6
// 0x00000080 - 2^7

function getUniqueLayer(num: number) {
    return Math.pow(2, num);
}

/** Combine multiple layer masks (eg for a camera that renders two) */
export function combineLayerMasks(layerMasks: number[]) {
    let combinedMask = 0;
    layerMasks.forEach(mask => {
        combinedMask |= mask;
    });
    return combinedMask;
}
