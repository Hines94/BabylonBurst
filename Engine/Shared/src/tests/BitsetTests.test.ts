import { BitSet } from "../Utils/BitSet";





// Function to generate random BitSet instance
function generateRandomBitSet(size: number): {bs:BitSet,arr:number[]} {
    const bitSet = new BitSet(size);
    const checkArr = Array.from({length:size}, () => 0);
    const numBits = Math.ceil(size * Math.random());
    for (let i = 0; i < numBits; i++) {
        const bitIndex = Math.floor(Math.random() * size);
        bitSet.setBit(bitIndex);
        checkArr[bitIndex] = 1;
    }
    return {bs:bitSet,arr:checkArr};
}

// Function to check all bits in common using arrays (for verification)
function arraysAllInCommon(bitSet1: number[], bitSet2: number[]): boolean {
    for(var i = 0; i <bitSet1.length;i++){
        if(bitSet1[i] == 1 && bitSet2[i] == 0) return false;
    }
    return true;
}

function arraysNoneInCommon(bitSet1: number[], bitSet2: number[]): boolean {
    for(var i = 0; i <bitSet1.length;i++){
        if(bitSet1[i] == 1 && bitSet2[i] == 1) return false;
    }
    return true;
}

// Test case
function runBitSetTests(numTests: number, size: number): void {
    for (let i = 0; i < numTests; i++) {
        // Generate random bitsets
        const bitSet1 = generateRandomBitSet(size);
        const bitSet2 = generateRandomBitSet(size);

        // Check with BitSet method - all in common
        const allInCommonResult = bitSet1.bs.allInCommon(bitSet2.bs);

        // Check with BitSet method - none in common
        const noneInCommonResult = bitSet1.bs.noneInCommon(bitSet2.bs);

        // Check with arrays method (for verification) - none in common
        const arraysAllInCommonResult = arraysAllInCommon(bitSet1.arr, bitSet2.arr);
        const arraysNoneInCommonResult = arraysNoneInCommon(bitSet1.arr, bitSet2.arr);

        // Compare results for all in common
        if (allInCommonResult !== arraysAllInCommonResult) {
            console.log(`Test ${i + 1} (All in Common): FAILED` + ' Arrays check: ' 
            + arraysAllInCommonResult + ' Bitset check: ' 
            + allInCommonResult + ' arr1: ' 
            + bitSet1.arr.join(', ') + ' arr2: ' 
            + bitSet2.arr.join(', '));
        }
        // Compare results for none in common
        if (noneInCommonResult !== arraysNoneInCommonResult) {
           console.log(`Test ${i + 1} (None in Common): FAILED` + ' Arrays check: ' 
            + arraysNoneInCommonResult + ' Bitset check: ' 
            + noneInCommonResult + ' arr1: ' 
            + bitSet1.arr.join(', ') + ' arr2: ' 
            + bitSet2.arr.join(', '));
        }
        expect(allInCommonResult !== arraysAllInCommonResult).toBe(false)
        expect(noneInCommonResult !== arraysNoneInCommonResult).toBe(false)
    }
}

test("BitsetTests",()=>{ 
    const numTests = 500;
    const bitSetSize = 256;
    runBitSetTests(numTests, bitSetSize);
})