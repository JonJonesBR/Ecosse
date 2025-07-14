// Basic Simplex Noise implementation for demonstration purposes
// This is a simplified version and might not be as robust as a dedicated library.
// For production, consider using a well-tested library like 'simplex-noise' from npm.

export class SimplexNoise {
    constructor(randomSeed = Math.random()) {
        this.p = new Array(512);
        this.perm = new Array(256);
        this.permMod12 = new Array(256);

        const seed = randomSeed;
        const source = new Array(256);
        for (let i = 0; i < 256; i++) {
            source[i] = i;
        }

        // Shuffle the source array
        for (let i = 255; i >= 0; i--) {
            const r = Math.floor(seed * (i + 1)); // Use seed for consistent shuffling
            const temp = source[i];
            source[i] = source[r];
            source[r] = temp;
        }

        for (let i = 0; i < 256; i++) {
            this.perm[i] = source[i];
            this.p[i] = source[i];
            this.p[i + 256] = source[i];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    grad2d(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
    }

    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);

        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        const ii = i & 255;
        const jj = j & 255;

        let n0, n1, n2;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.grad2d(this.perm[ii + this.perm[jj]], x0, y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.grad2d(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.grad2d(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
        }

        return 70.0 * (n0 + n1 + n2); // Scale to roughly -1 to 1
    }
}
