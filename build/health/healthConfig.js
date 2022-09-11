"use strict";
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.getModes = exports.getConfig = exports.writeCustomConfig = void 0;
const util_1 = require("../lib/util");
const config_1 = require("../lib/config");
// default config
const config = config_1.defaults.glowhealth;
exports.config = config;
function getModes() {
    const modes = ['espGlowing', 'espLegit', 'persistGlowing', 'persistLegit', 'raytraceGlowing', 'raytraceLegit', 'custom', 'default'];
    return modes;
}
exports.getModes = getModes;
function getConfig(mode = 'custom') {
    let modifiedConfig = config;
    switch (mode) {
        case 'espGlowing': { // esp meets wall except for glowing players
            modifiedConfig.name = 'espGlowing';
            modifiedConfig.blatant.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'espLegit': { // esp meets wall
            modifiedConfig.name = 'espLegit';
            modifiedConfig.blatant.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = false;
            break;
        }
        case 'persistGlowing': { // esp for one person meets a wall
            modifiedConfig.name = 'persistGlowing';
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.persist = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'persistLegit': { // esp for one person meets a wall
            modifiedConfig.name = 'persistLegit';
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.persist = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = false;
            break;
        }
        case 'raytraceGlowing': { // aim is required meets a wall
            modifiedConfig.name = 'raytraceGlowing';
            modifiedConfig.blatant.enabled = false;
            modifiedConfig.raytrace.enabled = true;
            modifiedConfig.raytrace.depth = true;
            modifiedConfig.raytrace.ignoreGlowing = true;
            break;
        }
        case 'raytraceLegit': { // aim is required meets a wall
            modifiedConfig.name = 'raytraceLegit';
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
            modifiedConfig.name = 'custom';
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
