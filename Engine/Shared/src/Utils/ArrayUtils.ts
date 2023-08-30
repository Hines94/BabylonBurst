

export function ArraysContainEqualItems<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;

    // Sort arrays to compare elements
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();

    for (let i = 0; i < arr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) return false;
    }

    return true;
}