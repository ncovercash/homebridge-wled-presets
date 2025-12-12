"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HSVtoRGB = HSVtoRGB;
exports.RGBtoHSV = RGBtoHSV;
exports.HSLtoRGB = HSLtoRGB;
exports.RGBtoHSL = RGBtoHSL;
/**
 * Converts HSV (Hue, Saturation, Value) to RGB
 * @param h Hue in degrees (0-360)
 * @param s Saturation in percent (0-100)
 * @param v Optional value/brightness in percent (0-100), defaults to 100
 * @returns RGB array [R, G, B] with values 0-255
 */
function HSVtoRGB(h, s, v = 100) {
    // Normalize inputs - handle negative hue values
    let normalizedHue = h % 360;
    if (normalizedHue < 0) {
        normalizedHue += 360;
    }
    const hue = normalizedHue / 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const val = Math.max(0, Math.min(100, v)) / 100;
    // Calculate chroma
    const c = val * sat;
    const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
    const m = val - c;
    let r = 0;
    let g = 0;
    let b = 0;
    // Determine which sector of the color wheel
    const sector = Math.floor(hue * 6);
    switch (sector) {
        case 0:
            r = c;
            g = x;
            b = 0;
            break;
        case 1:
            r = x;
            g = c;
            b = 0;
            break;
        case 2:
            r = 0;
            g = c;
            b = x;
            break;
        case 3:
            r = 0;
            g = x;
            b = c;
            break;
        case 4:
            r = x;
            g = 0;
            b = c;
            break;
        case 5:
            r = c;
            g = 0;
            b = x;
            break;
        default:
            r = 0;
            g = 0;
            b = 0;
            break;
    }
    // Add m to each component and scale to 0-255
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}
/**
 * Converts RGB to HSV
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns HSV array [H, S, V] where H is 0-360, S and V are 0-100
 */
function RGBtoHSV(r, g, b) {
    // Normalize RGB values to 0-1
    const rNorm = Math.max(0, Math.min(255, r)) / 255;
    const gNorm = Math.max(0, Math.min(255, g)) / 255;
    const bNorm = Math.max(0, Math.min(255, b)) / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const v = max;
    // Calculate saturation with improved precision for low saturation values
    if (max !== 0) {
        s = delta / max;
        // Round to 2 decimal places for better precision with low saturation
        s = Math.round(s * 10000) / 10000;
    }
    // Calculate hue with improved precision
    if (delta !== 0) {
        if (max === rNorm) {
            h = ((gNorm - bNorm) / delta) % 6;
        }
        else if (max === gNorm) {
            h = (bNorm - rNorm) / delta + 2;
        }
        else {
            h = (rNorm - gNorm) / delta + 4;
        }
        h /= 6;
        if (h < 0) {
            h += 1;
        }
        // Round to 4 decimal places for better precision
        h = Math.round(h * 10000) / 10000;
    }
    // Convert to degrees and percent with better precision
    // Use Math.round for hue to get accurate values for pure colors
    const hueDegrees = Math.round(h * 360);
    const saturationPercent = Math.round(s * 100);
    const valuePercent = Math.round(v * 100);
    return [
        hueDegrees,
        saturationPercent,
        valuePercent
    ];
}
/**
 * Converts HSL to RGB
 * @param h Hue in degrees (0-360)
 * @param s Saturation in percent (0-100)
 * @param l Lightness in percent (0-100)
 * @returns RGB array [R, G, B] with values 0-255
 */
function HSLtoRGB(h, s, l) {
    const hue = (h % 360) / 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const light = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
    const m = light - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    const sector = Math.floor(hue * 6);
    switch (sector) {
        case 0:
            r = c;
            g = x;
            b = 0;
            break;
        case 1:
            r = x;
            g = c;
            b = 0;
            break;
        case 2:
            r = 0;
            g = c;
            b = x;
            break;
        case 3:
            r = 0;
            g = x;
            b = c;
            break;
        case 4:
            r = x;
            g = 0;
            b = c;
            break;
        case 5:
            r = c;
            g = 0;
            b = x;
            break;
        default:
            r = 0;
            g = 0;
            b = 0;
            break;
    }
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}
/**
 * Converts RGB to HSL
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns HSL array [H, S, L] where all values are 0-100
 */
function RGBtoHSL(r, g, b) {
    const rNorm = Math.max(0, Math.min(255, r)) / 255;
    const gNorm = Math.max(0, Math.min(255, g)) / 255;
    const bNorm = Math.max(0, Math.min(255, b)) / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        if (max === rNorm) {
            h = ((gNorm - bNorm) / delta) % 6;
        }
        else if (max === gNorm) {
            h = (bNorm - rNorm) / delta + 2;
        }
        else {
            h = (rNorm - gNorm) / delta + 4;
        }
        h /= 6;
        if (h < 0) {
            h += 1;
        }
    }
    return [
        Math.round(h * 360),
        Math.round(s * 100),
        Math.round(l * 100)
    ];
}
//# sourceMappingURL=colorUtils.js.map