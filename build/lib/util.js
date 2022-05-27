"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimString = exports.cleanString = exports.rayTraceEntity = exports.rgbToDecimal = exports.decimalToRGB = exports.determineColor = exports.isPlayer = void 0;
const config_1 = require("../health/config");
const decimalToRGB = (color) => [
    (color >> 16) & 0xFF,
    (color >> 8) & 0xFF,
    color & 0xFF
];
exports.decimalToRGB = decimalToRGB;
const rgbToDecimal = (rgb) => ((rgb[0] << 16) + (rgb[1] << 8) + (rgb[2]));
exports.rgbToDecimal = rgbToDecimal;
function rayTraceEntity(reach) {
    // function only likes integers / whole numbers
    if (!Number.isInteger(reach))
        reach = Math.round(reach);
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
function isPlayer(player) {
    if (!player)
        return false;
    if (player.getType() === 'minecraft:player') {
        if (player.getName().getString() === Player.getPlayer().getName().getString())
            return false; // ignore self
        return true;
    }
    return false;
}
exports.isPlayer = isPlayer;
// health = { color: { base, good, low, critical }}
function determineColor(healthPercent, health = config_1.config.health) {
    let color = health.base;
    if (healthPercent > health.low.percent)
        color = health.good;
    else if (healthPercent <= health.low.percent && healthPercent > health.critical.percent)
        color = health.low; // needs healing
    else if (healthPercent <= health.critical.percent)
        color = health.critical; // needs healing now
    color.rgb = decimalToRGB(color.color);
    return color;
}
exports.determineColor = determineColor;
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
