"use strict";
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.getModes = exports.getConfig = exports.writeCustomConfig = void 0;
const util_1 = require("../lib/util");
// default config
const configPath = '../../config/glowHealth.json';
const config = {
    name: 'default',
    enabled: true,
    blatant: {
        enabled: true
    },
    draw: {
        /// draw a hud with nearby player health
        // if you just want this without glow, then turn off raytrace and blatant
        enabled: false,
        x: 0,
        y: 0,
        align: 0 // 0 = left, center = 0.5, right = 1
    },
    whitelist: {
        // only allow specific players to glow
        // useful if you have specific people that you want to heal that are extremely good at dying
        // Example: ['T0OFU', 'Beatq']
        enabled: false,
        players: [] // list of players in string format (['Player1', 'Player2']) to whitelist
    },
    raytrace: {
        // if blatant mode is true: this highights the selected player with raytrace.color
        // if blatant mode is false: this highlights the selected player with their health
        enabled: false,
        reach: 65,
        // set to true to contiune highlighting the player even if crosshair is not on the player
        // set to false to only highlights the person you are looking at
        persist: false,
        // set to true to not display players (that you can't already see) through walls
        // applies to blatant mode
        depth: true,
        // ignores already glowing players in depth check
        // set to false to not ignore glowing players
        ignoreGlowing: true,
        // used for blatant mode to highlight the player you have selected
        color: 0xFFA500 // orange
    },
    // Max health is usually 20hp. 1 heart = 2hp
    // Hallowed Beam 2 is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
    // Hand of Light 2 is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
    health: {
        critical: {
            color: 0xFF0000,
            rgb: [255, 255, 255],
            percent: 0.5,
            glow: true
        },
        low: {
            color: 0xFFFF00,
            rgb: [255, 255, 255],
            percent: 0.7,
            glow: true,
        },
        good: {
            color: 0x00FF00,
            rgb: [255, 255, 255],
            percent: 1.0,
            glow: true
        },
        base: {
            color: 0xFFFFFF,
            rgb: [255, 255, 255],
            percent: 1.0,
            glow: false
        }
    }
};
exports.config = config;
function getModes() {
    const modes = ['espGlowing', 'espLegit', 'persistGlowing', 'persistLegit', 'raytraceGlowing', 'raytraceLegit', 'custom', 'default'];
    return modes;
}
exports.getModes = getModes;
function getConfig(mode = 'custom') {
    let modifiedConfig = config;
    modifiedConfig.name = mode;
    switch (mode) {
        case 'espGlowing': { // esp meets wall except for glowingg players
            modifiedConfig.blatant.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'espLegit': { // esp meets wall
            modifiedConfig.blatant.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = false;
            break;
        }
        case 'persistGlowing': { // esp for one person meets a wall
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.persist = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'persistLegit': { // esp for one person meets a wall
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.persist = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = false;
            break;
        }
        case 'raytraceGlowing': { // aim is required meets a wall
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'raytraceLegit': { // aim is required meets a wall
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = false;
            break;
        }
        case 'custom': {
            const success = (0, util_1.readConfig)('glowHealth');
            if (!success) {
                modifiedConfig = config;
                (0, util_1.readConfig)(modifiedConfig);
            }
            else {
                modifiedConfig = success;
            }
            break;
        }
        case 'default': {
            modifiedConfig = config;
        }
    }
    writeCustomConfig(modifiedConfig);
    return modifiedConfig;
}
exports.getConfig = getConfig;
function writeCustomConfig(config) {
    const success = (0, util_1.writeConfig)('glowHealth', config);
    return success;
}
exports.writeCustomConfig = writeCustomConfig;
