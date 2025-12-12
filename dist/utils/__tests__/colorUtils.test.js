"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colorUtils_1 = require("../colorUtils");
describe('Color Utils', () => {
    describe('HSVtoRGB', () => {
        it('should convert pure red (HSV: 0, 100, 100) to RGB (255, 0, 0)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 100, 100);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should convert pure green (HSV: 120, 100, 100) to RGB (0, 255, 0)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(120, 100, 100);
            expect(result).toEqual([0, 255, 0]);
        });
        it('should convert pure blue (HSV: 240, 100, 100) to RGB (0, 0, 255)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(240, 100, 100);
            expect(result).toEqual([0, 0, 255]);
        });
        it('should convert white (HSV: 0, 0, 100) to RGB (255, 255, 255)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 0, 100);
            expect(result).toEqual([255, 255, 255]);
        });
        it('should convert black (HSV: 0, 0, 0) to RGB (0, 0, 0)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 0, 0);
            expect(result).toEqual([0, 0, 0]);
        });
        it('should convert yellow (HSV: 60, 100, 100) to RGB (255, 255, 0)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(60, 100, 100);
            expect(result).toEqual([255, 255, 0]);
        });
        it('should convert cyan (HSV: 180, 100, 100) to RGB (0, 255, 255)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(180, 100, 100);
            expect(result).toEqual([0, 255, 255]);
        });
        it('should convert magenta (HSV: 300, 100, 100) to RGB (255, 0, 255)', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(300, 100, 100);
            expect(result).toEqual([255, 0, 255]);
        });
        it('should handle hue values > 360 by wrapping', () => {
            const result1 = (0, colorUtils_1.HSVtoRGB)(360, 100, 100);
            const result2 = (0, colorUtils_1.HSVtoRGB)(0, 100, 100);
            expect(result1).toEqual(result2);
            expect(result1).toEqual([255, 0, 0]);
        });
        it('should handle hue values < 0 by wrapping', () => {
            const result1 = (0, colorUtils_1.HSVtoRGB)(-60, 100, 100);
            const result2 = (0, colorUtils_1.HSVtoRGB)(300, 100, 100);
            expect(result1).toEqual(result2);
        });
        it('should clamp saturation values > 100', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 150, 100);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should clamp saturation values < 0', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, -50, 100);
            expect(result).toEqual([255, 255, 255]);
        });
        it('should clamp value/brightness values > 100', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 100, 150);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should clamp value/brightness values < 0', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 100, -50);
            expect(result).toEqual([0, 0, 0]);
        });
        it('should use default value of 100 when not provided', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 100);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should handle mid-brightness colors correctly', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 100, 50);
            expect(result).toEqual([128, 0, 0]);
        });
        it('should handle low saturation colors correctly', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(0, 50, 100);
            expect(result).toEqual([255, 128, 128]);
        });
        it('should handle all color wheel sectors', () => {
            // Sector 0 (0-60 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(30, 100, 100)).toEqual([255, 128, 0]);
            // Sector 1 (60-120 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(90, 100, 100)).toEqual([128, 255, 0]);
            // Sector 2 (120-180 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(150, 100, 100)).toEqual([0, 255, 128]);
            // Sector 3 (180-240 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(210, 100, 100)).toEqual([0, 128, 255]);
            // Sector 4 (240-300 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(270, 100, 100)).toEqual([128, 0, 255]);
            // Sector 5 (300-360 degrees)
            expect((0, colorUtils_1.HSVtoRGB)(330, 100, 100)).toEqual([255, 0, 128]);
        });
    });
    describe('RGBtoHSV', () => {
        it('should convert pure red RGB (255, 0, 0) to HSV (0, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(255, 0, 0);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should convert pure green RGB (0, 255, 0) to HSV (120, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(0, 255, 0);
            expect(result[0]).toBe(120);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should convert pure blue RGB (0, 0, 255) to HSV (240, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(0, 0, 255);
            expect(result[0]).toBe(240);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should convert white RGB (255, 255, 255) to HSV (0, 0, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(255, 255, 255);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(0);
            expect(result[2]).toBe(100);
        });
        it('should convert black RGB (0, 0, 0) to HSV (0, 0, 0)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(0, 0, 0);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(0);
            expect(result[2]).toBe(0);
        });
        it('should convert yellow RGB (255, 255, 0) to HSV (60, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(255, 255, 0);
            expect(result[0]).toBe(60);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should convert cyan RGB (0, 255, 255) to HSV (180, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(0, 255, 255);
            expect(result[0]).toBe(180);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should convert magenta RGB (255, 0, 255) to HSV (300, 100, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(255, 0, 255);
            expect(result[0]).toBe(300);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(100);
        });
        it('should clamp RGB values > 255', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(300, 300, 300);
            expect(result).toEqual([0, 0, 100]);
        });
        it('should clamp RGB values < 0', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(-50, -50, -50);
            expect(result).toEqual([0, 0, 0]);
        });
        it('should handle gray colors correctly', () => {
            const result = (0, colorUtils_1.RGBtoHSV)(128, 128, 128);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(0);
            expect(result[2]).toBe(50);
        });
        it('should handle colors with different max components', () => {
            // Red is max
            const result1 = (0, colorUtils_1.RGBtoHSV)(200, 100, 50);
            expect(result1[0]).toBeGreaterThanOrEqual(0);
            expect(result1[0]).toBeLessThan(60);
            // Green is max
            const result2 = (0, colorUtils_1.RGBtoHSV)(100, 200, 50);
            expect(result2[0]).toBeGreaterThanOrEqual(60);
            expect(result2[0]).toBeLessThan(180);
            // Blue is max
            const result3 = (0, colorUtils_1.RGBtoHSV)(50, 100, 200);
            expect(result3[0]).toBeGreaterThanOrEqual(180);
            expect(result3[0]).toBeLessThan(300);
        });
    });
    describe('HSV to RGB round-trip conversion', () => {
        it('should convert HSV to RGB and back with acceptable tolerance', () => {
            const testCases = [
                { h: 0, s: 100, v: 100 },
                { h: 60, s: 100, v: 100 },
                { h: 120, s: 100, v: 100 },
                { h: 180, s: 100, v: 100 },
                { h: 240, s: 100, v: 100 },
                { h: 300, s: 100, v: 100 },
                { h: 45, s: 75, v: 85 },
                { h: 200, s: 50, v: 60 },
                { h: 330, s: 25, v: 90 }
            ];
            testCases.forEach(({ h, s, v }) => {
                const rgb = (0, colorUtils_1.HSVtoRGB)(h, s, v);
                const hsv = (0, colorUtils_1.RGBtoHSV)(rgb[0], rgb[1], rgb[2]);
                // Allow 2 degree tolerance for hue (due to rounding)
                expect(Math.abs(hsv[0] - h)).toBeLessThanOrEqual(2);
                // Allow 2% tolerance for saturation and value
                expect(Math.abs(hsv[1] - s)).toBeLessThanOrEqual(2);
                expect(Math.abs(hsv[2] - v)).toBeLessThanOrEqual(2);
            });
        });
    });
    describe('HSLtoRGB', () => {
        it('should convert pure red (HSL: 0, 100, 50) to RGB (255, 0, 0)', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(0, 100, 50);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should convert pure green (HSL: 120, 100, 50) to RGB (0, 255, 0)', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(120, 100, 50);
            expect(result).toEqual([0, 255, 0]);
        });
        it('should convert pure blue (HSL: 240, 100, 50) to RGB (0, 0, 255)', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(240, 100, 50);
            expect(result).toEqual([0, 0, 255]);
        });
        it('should convert white (HSL: 0, 0, 100) to RGB (255, 255, 255)', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(0, 0, 100);
            expect(result).toEqual([255, 255, 255]);
        });
        it('should convert black (HSL: 0, 0, 0) to RGB (0, 0, 0)', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(0, 0, 0);
            expect(result).toEqual([0, 0, 0]);
        });
        it('should handle hue values > 360 by wrapping', () => {
            const result1 = (0, colorUtils_1.HSLtoRGB)(360, 100, 50);
            const result2 = (0, colorUtils_1.HSLtoRGB)(0, 100, 50);
            expect(result1).toEqual(result2);
        });
        it('should clamp saturation and lightness values', () => {
            expect((0, colorUtils_1.HSLtoRGB)(0, 150, 50)).toEqual([255, 0, 0]);
            expect((0, colorUtils_1.HSLtoRGB)(0, -50, 50)).toEqual([128, 128, 128]);
            expect((0, colorUtils_1.HSLtoRGB)(0, 100, 150)).toEqual([255, 255, 255]);
            expect((0, colorUtils_1.HSLtoRGB)(0, 100, -50)).toEqual([0, 0, 0]);
        });
        it('should handle mid-lightness colors correctly', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(0, 100, 50);
            expect(result).toEqual([255, 0, 0]);
        });
        it('should handle low saturation colors correctly', () => {
            const result = (0, colorUtils_1.HSLtoRGB)(0, 50, 50);
            expect(result[0]).toBeGreaterThan(result[1]);
            expect(result[1]).toBeGreaterThan(0);
        });
    });
    describe('RGBtoHSL', () => {
        it('should convert pure red RGB (255, 0, 0) to HSL (0, 100, 50)', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(255, 0, 0);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(50);
        });
        it('should convert pure green RGB (0, 255, 0) to HSL (120, 100, 50)', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(0, 255, 0);
            expect(result[0]).toBe(120);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(50);
        });
        it('should convert pure blue RGB (0, 0, 255) to HSL (240, 100, 50)', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(0, 0, 255);
            expect(result[0]).toBe(240);
            expect(result[1]).toBe(100);
            expect(result[2]).toBe(50);
        });
        it('should convert white RGB (255, 255, 255) to HSL (0, 0, 100)', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(255, 255, 255);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(0);
            expect(result[2]).toBe(100);
        });
        it('should convert black RGB (0, 0, 0) to HSL (0, 0, 0)', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(0, 0, 0);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(0);
            expect(result[2]).toBe(0);
        });
        it('should clamp RGB values > 255', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(300, 300, 300);
            expect(result).toEqual([0, 0, 100]);
        });
        it('should clamp RGB values < 0', () => {
            const result = (0, colorUtils_1.RGBtoHSL)(-50, -50, -50);
            expect(result).toEqual([0, 0, 0]);
        });
    });
    describe('HSL to RGB round-trip conversion', () => {
        it('should convert HSL to RGB and back with acceptable tolerance', () => {
            const testCases = [
                { h: 0, s: 100, l: 50 },
                { h: 60, s: 100, l: 50 },
                { h: 120, s: 100, l: 50 },
                { h: 180, s: 100, l: 50 },
                { h: 240, s: 100, l: 50 },
                { h: 300, s: 100, l: 50 },
                { h: 45, s: 75, l: 60 },
                { h: 200, s: 50, l: 40 },
                { h: 330, s: 25, l: 70 }
            ];
            testCases.forEach(({ h, s, l }) => {
                const rgb = (0, colorUtils_1.HSLtoRGB)(h, s, l);
                const hsl = (0, colorUtils_1.RGBtoHSL)(rgb[0], rgb[1], rgb[2]);
                // Allow 2 degree tolerance for hue
                expect(Math.abs(hsl[0] - h)).toBeLessThanOrEqual(2);
                // Allow 2% tolerance for saturation and lightness
                expect(Math.abs(hsl[1] - s)).toBeLessThanOrEqual(2);
                expect(Math.abs(hsl[2] - l)).toBeLessThanOrEqual(2);
            });
        });
    });
    describe('Edge cases and boundary conditions', () => {
        it('should handle all zero values', () => {
            expect((0, colorUtils_1.HSVtoRGB)(0, 0, 0)).toEqual([0, 0, 0]);
            expect((0, colorUtils_1.RGBtoHSV)(0, 0, 0)).toEqual([0, 0, 0]);
            expect((0, colorUtils_1.HSLtoRGB)(0, 0, 0)).toEqual([0, 0, 0]);
            expect((0, colorUtils_1.RGBtoHSL)(0, 0, 0)).toEqual([0, 0, 0]);
        });
        it('should handle all maximum values', () => {
            expect((0, colorUtils_1.HSVtoRGB)(359, 100, 100)).toEqual([255, 0, 4]);
            expect((0, colorUtils_1.RGBtoHSV)(255, 255, 255)).toEqual([0, 0, 100]);
            expect((0, colorUtils_1.HSLtoRGB)(359, 100, 50)).toEqual([255, 0, 4]);
            expect((0, colorUtils_1.RGBtoHSL)(255, 255, 255)).toEqual([0, 0, 100]);
        });
        it('should handle very small values', () => {
            const rgb1 = (0, colorUtils_1.HSVtoRGB)(0.1, 0.1, 0.1);
            expect(rgb1[0]).toBeGreaterThanOrEqual(0);
            expect(rgb1[0]).toBeLessThanOrEqual(255);
            const hsv1 = (0, colorUtils_1.RGBtoHSV)(1, 1, 1);
            expect(hsv1[0]).toBeGreaterThanOrEqual(0);
            expect(hsv1[0]).toBeLessThanOrEqual(360);
        });
        it('should handle decimal input values correctly', () => {
            const result = (0, colorUtils_1.HSVtoRGB)(180.5, 50.5, 75.5);
            expect(result[0]).toBeGreaterThanOrEqual(0);
            expect(result[0]).toBeLessThanOrEqual(255);
            expect(result[1]).toBeGreaterThanOrEqual(0);
            expect(result[1]).toBeLessThanOrEqual(255);
            expect(result[2]).toBeGreaterThanOrEqual(0);
            expect(result[2]).toBeLessThanOrEqual(255);
        });
    });
});
//# sourceMappingURL=colorUtils.test.js.map