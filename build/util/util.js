"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompass = exports.checkEntityType = exports.rgbToDecimal = void 0;
function rgbToDecimal(rgb) {
    return (rgb.r << 16) + (rgb.g << 8) + (rgb.b);
}
exports.rgbToDecimal = rgbToDecimal;
function checkEntityType(entity) {
    const type = entity.getType();
    switch (type) {
        case 'minecraft:item': {
            const color = rgbToDecimal({ r: 255, g: 255, b: 255 });
            entity.setGlowingColor(color);
            entity.setGlowing(true);
            break;
        }
        case 'minecraft:player': {
            const color = rgbToDecimal({ r: 255, g: 0, b: 0 });
            entity.setGlowingColor(color);
            entity.setGlowing(true);
            break;
        }
    }
}
exports.checkEntityType = checkEntityType;
function getCompass() {
    // @ts-ignore
    const position = World.getRespawnPos();
    const pos = { x: position.getX(), y: position.getY(), z: position.getZ() };
    return pos;
}
exports.getCompass = getCompass;
