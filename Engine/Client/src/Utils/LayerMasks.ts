var existingLayers: number[] = [];

/** Default layer that meshes will be loaded into. Create extra layers with getUniqueLayer(2) etc */
export var defaultLayerMask = getUniqueLayer(0);
export var uiLayerMask = getUniqueLayer(1);

// Use powers of two for additional layers:
// 0x00000001 - 2^0
// 0x00000002 - 2^1
// 0x00000004 - 2^2
// 0x00000008 - 2^3
// 0x00000010 - 2^4
// 0x00000020 - 2^5
// 0x00000040 - 2^6
// 0x00000080 - 2^7

export function getUniqueLayer(num: number) {
    if (existingLayers.includes(num)) {
        console.error("Requested two render layers of the same: " + num);
    }
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
