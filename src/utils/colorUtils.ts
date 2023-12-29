export function HSVtoRGB(h: number, s: number): number[] {
    const hue = h / 360;
    const sat = s / 100;

    let r = 0;
    let g = 0;
    let b = 0;
    const i = Math.floor(hue * 6);
    const f = hue * 6 - i;
    const p = 1 - sat;
    const q = 1 - f * sat;
    const t = 1 - (1 - f) * sat;

    switch (i % 6) {
    case 0:
        r = 1;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = 1;
        b = p;
        break;
    case 2:
        r = p;
        g = 1;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = 1;
        break;
    case 4:
        r = t;
        g = p;
        b = 1;
        break;
    case 5:
        r = 1;
        g = p;
        b = q;
        break;
    default:
        r = 1;
        g = 1;
        b = 1;
        break;
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

export function RGBtoHSV(r: number, g: number, b: number): number[] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h, s;

    if (max === 0) {
        s = 0;
    } else {
        s = d / max;
    }

    const v = max / 255;

    switch (max) {
    case min:
        h = 0;
        break;
    case r:
        h = (g - b) + d * (g < b ? 6 : 0);
        h /= 6 * d;
        break;
    case g:
        h = (b - r) + d * 2;
        h /= 6 * d;
        break;
    case b:
        h = (r - g) + d * 4;
        h /= 6 * d;
        break;
    default:
        h = 0;
        break;
    }

    return [
        h,
        s,
        v
    ];
}
