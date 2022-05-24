"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModes = exports.writeCustomConfig = exports.getConfig = void 0;
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
// default config
const config = {
    name: 'default',
    blatant: {
        enabled: true
    },
    draw: {
        enabled: false
    },
    whitelist: {
        // only allow specific players to glow
        // useful if you have specific people that you want to heal that  are extremely good at dying
        // Example: ['T0OFU', 'Beatq']
        enabled: false,
        players: [] // list of players in string format (['Player1', 'Player2']) to whitelist
    },
    raytrace: {
        // if blatant mode is true: this highights the selected player with raytrace.color
        // if blatant mode is false: this highlights the selected player with their health
        enabled: false,
        reach: 30,
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
        color: 0xFFA500
    },
    // Max health is usually 20hp. 1 heart = 2hp
    // Hallowed Beam is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
    // Hand of Light is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
    health: {
        critical: 0.5,
        low: 0.7,
        // glowing colors in RGB format
        color: {
            critical: 0xFF0000,
            low: 0xFFFF00,
            good: 0x00FF00,
            base: 0xFFFFFF // white
        }
    }
};
function getModes() {
    const modes = ['espGlowing', 'espLegit', 'persistGlowing', 'persistLegit', 'raytraceGlowing', 'raytraceLegit', 'custom', 'default'];
    return modes;
}
exports.getModes = getModes;
function getConfig(mode = 'custom', options = { whitelist: false, whitelistedPlayers: [] }) {
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
        case 'whitelist': { // modify whitelist
            if (options.whitelistedPlayers && options.whitelistedPlayers.length > 0) {
                modifiedConfig.whitelist.players = options.whitelistedPlayers;
            }
            else {
                modifiedConfig.whitelist.enabled = options.whitelist;
            }
            break;
        }
        case 'custom': {
            if (FS.exists('./config.json')) {
                try {
                    const file = FS.open('./config.json');
                    const customConfig = file.read();
                    modifiedConfig = JSON.parse(customConfig);
                }
                catch (e) {
                    modifiedConfig = config;
                }
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
    try {
        FS.open('./config.json').write(JSON.stringify(config, null, 2));
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.writeCustomConfig = writeCustomConfig;
