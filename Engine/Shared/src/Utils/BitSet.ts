export class BitSet {
    private bits: Uint32Array;

    constructor(size: number) {
        this.bits = new Uint32Array(Math.ceil(size / 32));
    }

    // Sets the bit at the specified index to 1
    setBit(index: number): void {
        if (index >= this.bits.length * 32) {
            this.resize(index + 1);
        }
        const wordIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        this.bits[wordIndex] |= (1 << bitIndex);
    }

    // Resizes the bitset to accommodate the specified size
    resize(newSize: number): void {
        const newBits = new Uint32Array(Math.ceil(newSize / 32));
        newBits.set(this.bits);
        this.bits = newBits;
    }

    // Checks if any bit in this bitset is set in the other bitset
    anyInCommon(other: BitSet): boolean {
        const minLength = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < minLength; i++) {
            if ((this.bits[i] & other.bits[i]) !== 0) {
                return true;
            }
        }
        return false;
    }

   // Checks if all bits set in this bitset are also set in the other bitset
   allInCommon(other: BitSet): boolean {
        const minLength = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < minLength; i++) {
            if ((this.bits[i] & other.bits[i]) !== this.bits[i]) {
                return false;
            }
        }
        // Check remaining bits in this BitSet if it's longer than the other BitSet
        for (let i = minLength; i < this.bits.length; i++) {
            if (this.bits[i] !== 0) {
                return false;
            }
        }
        return true;
    }

    // Checks if no bit in this bitset is set in the other bitset
    noneInCommon(other: BitSet): boolean {
        const minLength = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < minLength; i++) {
            if ((this.bits[i] & other.bits[i]) !== 0) {
                return false;
            }
        }
        return true;
    }

    isEqual(other: BitSet): boolean {
        const minLength = Math.min(this.bits.length, other.bits.length);
        for (let i = 0; i < minLength; i++) {
            if (this.bits[i] !== other.bits[i]) return false;
        }
        return true;
    }
}
