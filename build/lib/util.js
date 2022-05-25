"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimString = exports.cleanString = exports.rayTraceEntity = exports.rgbToDecimal = exports.decimalToRGB = void 0;
const decimalToRGB = (color) => [
    (color >> 16) & 0xFF,
    (color >> 8) & 0xFF,
    color & 0xFF
];
exports.decimalToRGB = decimalToRGB;
const rgbToDecimal = (rgb) => ((rgb[0] << 16) + (rgb[1] << 8) + (rgb[2]));
exports.rgbToDecimal = rgbToDecimal;
function rayTraceEntity(reach) {
    // @ts-ignore # DebugRenderer.getTargetedEntity()
    const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), reach);
    // @ts-ignore # Check if the result is empty
    if (result.isEmpty())
        return false;
    // @ts-ignore
    const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get());
    return entity;
}
exports.rayTraceEntity = rayTraceEntity;
function cleanString(str) {
    return str
        .replaceAll(/'/g, '')
        .replaceAll(/\n/g, '')
        .replaceAll(/ /g, '')
        .trim()
        .toLowerCase();
}
exports.cleanString = cleanString;
function trimString(str) {
    return str
        .trim()
        .toLowerCase();
}
exports.trimString = trimString;
