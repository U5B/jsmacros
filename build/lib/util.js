"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeEnv = exports.logInfo = exports.debugInfo = exports.trimString = exports.cleanString = exports.rayTraceEntity = exports.rgbToDecimal = exports.decimalToRGB = exports.determineColor = exports.isPlayer = exports.writeConfig = exports.readConfig = void 0;
// @ts-ignore
const nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1);
exports.nodeEnv = nodeEnv;
const config_1 = require("./config");
const config = {
    glowhealth: config_1.defaults.glowhealth
};
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
    const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), reach); // returns Java.Optional https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html
    // @ts-ignore # Check if the result is empty (isPresent() is needed for Java 8)
    if (result == null || !result?.isPresent())
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
function determineColor(healthPercent, health = config.glowhealth.health) {
    let color = health.base;
    if (healthPercent > health.good.percent)
        color = health.base;
    else if (healthPercent <= health.good.percent && healthPercent > health.low.percent)
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
        .replace(/'/g, '')
        .replace(/\n/g, '')
        .replace(/ /g, '')
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
function debugInfo(input) {
    // @ts-ignore
    if (nodeEnv) {
        // @ts-ignore
        console.log(input);
    }
    else {
        Chat.getLogger('usb').warn(input);
    }
}
exports.debugInfo = debugInfo;
function logInfo(string, prefix = 'USB', noChat = false) {
    if (!nodeEnv && noChat === false)
        Chat.log(`§7[§a${prefix}§7]§r ${string}`);
    string = string.toString().replace(/§./g, '');
    debugInfo(`[${prefix}]: ${string}`);
}
exports.logInfo = logInfo;
function writeConfig(configPath, config) {
    const configRoot = `${JsMacros.getConfig().macroFolder}\\config`;
    try {
        if (!FS.exists(configRoot))
            FS.makeDir(configRoot);
        FS.open(`${configRoot}\\${configPath}.json`).write(JSON.stringify(config, null, 2));
        return true;
    }
    catch (e) {
        logInfo(e, 'config');
        return false;
    }
}
exports.writeConfig = writeConfig;
function readConfig(configPath) {
    const configRoot = `${JsMacros.getConfig().macroFolder}\\config`;
    try {
        if (!FS.exists(configRoot))
            FS.makeDir(configRoot);
        const result = JSON.parse(FS.open(`${configRoot}\\${configPath}.json`).read());
        return result;
    }
    catch (e) {
        logInfo('Error finding config file. Disregard if running the program for the first time.', 'config');
        logInfo(e, 'config');
        return false;
    }
}
exports.readConfig = readConfig;
