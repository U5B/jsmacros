"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const util = __importStar(require("../lib/util"));
const drawHealth_1 = require("./drawHealth");
// Configuration Start
const config_1 = require("./config");
let mode = (0, config_1.getConfig)('custom');
// Configuration End
const state = {
    tickLoop: undefined,
    started: false,
    running: false,
    glowingPlayers: [],
    nearbyPlayers: [],
    selectedPlayer: ''
};
function suggestNearbyPlayers(ctx, builder) {
    builder.suggestMatching(state.nearbyPlayers);
}
function onTick() {
    if (mode.enabled === false)
        return;
    try {
        if (World && World.isWorldLoaded() && state.started === true) {
            if (state.running === false) {
                logInfo('Started!');
                state.running = true;
            }
        }
        else
            return false;
        if (mode.blatant.enabled === true) {
            state.glowingPlayers = []; // reset all players being affected by this
            // Check all loaded players
            checkPlayers();
            if (mode.raytrace.enabled === true)
                highlightPlayerCursor();
        }
        else if (mode.raytrace.enabled === true) {
            highlightPlayerCursorHealth();
        }
        if (mode.draw.enabled === true)
            (0, drawHealth_1.onTick)(mode);
        return true;
    }
    catch (e) {
        stop(e);
    }
}
function isPlayerVisible(entity) {
    if (!util.isPlayer(entity))
        return null;
    if (mode.raytrace.depth === false)
        return true;
    if (isPlayerGlowing(entity) === true)
        return true;
    const javaEntity = entity.asLiving().getRaw();
    // @ts-ignore # LivingEntity.canSee
    const result = Player.getPlayer().asLiving().getRaw().method_6057(javaEntity);
    return result;
}
function isPlayerGlowing(player) {
    if (mode.raytrace.ignoreGlowing === false)
        return false;
    const forceGlowing = player.isGlowing();
    player.resetGlowing();
    const value = player.isGlowing();
    player.setGlowing(forceGlowing);
    return value;
}
function highlightPlayerCursor() {
    const player = util.rayTraceEntity(mode.raytrace.reach);
    if (!isPlayerVisible(player)) { // check needed since we don't use checkPlayer() here
        state.selectedPlayer = '';
        resetPlayers(true, false); // we want to ignore glowing players
        return false;
    }
    const color = mode.raytrace.color;
    player.setGlowing(true);
    player.setGlowingColor(color);
    state.selectedPlayer = player.getName()?.getString();
    resetPlayers(true, true);
    return true;
}
function highlightPlayerCursorHealth() {
    const player = util.rayTraceEntity(mode.raytrace.reach);
    const valid = checkPlayer(player);
    if (!valid) {
        if (mode.raytrace.persist === true) {
            checkPlayers();
            return true;
        }
        else if (mode.raytrace.persist === false) {
            state.selectedPlayer = '';
            resetPlayers(false, false);
            return false;
        }
    }
    else {
        state.selectedPlayer = player.getName()?.getString();
        resetPlayers(false, true);
        return true;
    }
}
function checkPlayers() {
    state.nearbyPlayers = [];
    // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
    for (const player of World.getLoadedPlayers()) {
        let valid = false;
        const name = player.getName()?.getString();
        state.nearbyPlayers.push(player.getName()?.getString());
        if (mode.blatant.enabled === true || (mode.raytrace.enabled === true && mode.raytrace.persist === true && state.selectedPlayer === name))
            valid = checkPlayer(player);
        if (!valid)
            resetPlayer(player);
    }
}
// Check if a player has lost health and update their glowing status and color
function checkPlayer(player) {
    if (!isPlayerVisible(player))
        return false; // only accept players
    const name = player.getName()?.getString();
    if (mode.whitelist.enabled === true && mode.whitelist.players.includes(name) === false)
        return false;
    // player.getRaw().method_6067() is absorption hearts
    const health = player.getHealth(); /* + player.getRaw().method_6067() */
    const maxHealth = player.getMaxHealth(); /* + player.getRaw().method_6067() */
    const percentHealth = Number(health / maxHealth);
    const color = util.determineColor(percentHealth, mode.health);
    const decimalColor = color.color;
    player.setGlowingColor(decimalColor);
    player.setGlowing(true);
    state.glowingPlayers.push(name);
    return true;
}
// Reset player to their previous glowing state
function resetPlayer(player) {
    if (!util.isPlayer(player))
        return false; // only accept players
    player.resetGlowing(); // no more G L O W
    player.resetGlowingColor();
    return true;
}
// This function should set all players to their previous glowing state
function resetPlayers(ignoreGlowing = false, ignoreSelected = false) {
    // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
    for (const player of World.getLoadedPlayers()) {
        if ((ignoreGlowing || ignoreSelected) === true) { // run check only if ignore is true
            const name = player.getName().getString();
            if (ignoreSelected && state.selectedPlayer === name)
                continue;
            if (ignoreGlowing && state.glowingPlayers.includes(name) === true)
                continue;
        }
        resetPlayer(player);
    }
    return true;
}
function start() {
    commander(false);
    state.started = true;
    if (!state.tickLoop)
        state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(onTick)); // ignore if already started
    return true;
}
function stop(error) {
    if (state.started === false)
        return;
    Chat.getLogger('usb').fatal(error);
    terminate();
    throw error;
}
function terminate() {
    logInfo('Stopped!');
    commander(true);
    (0, drawHealth_1.terminate)();
    state.started = false;
    state.running = false;
    state.glowingPlayers = [];
    state.selectedPlayer = '';
    if (state.tickLoop)
        JsMacros.off('Tick', state.tickLoop);
    if (World && World.isWorldLoaded())
        resetPlayers();
    state.tickLoop = null;
    return true;
}
function logInfo(string) {
    Chat.log(`§7[§aGlowHealth§7]§r ${string}`);
}
let command;
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('glowhealth');
    command
        .literalArg('preset')
        .greedyStringArg('config').suggestMatching((0, config_1.getModes)())
        .executes(JavaWrapper.methodToJava(cmdPreset))
        .or(1)
        .literalArg('toggle')
        .booleanArg('enabled')
        .executes(JavaWrapper.methodToJava(cmdToggle))
        .or(1)
        .literalArg('whitelist')
        .literalArg('add')
        .wordArg('player').suggest(suggestNearbyPlayers)
        .executes(JavaWrapper.methodToJava(cmdWhitelistAdd))
        .or(2)
        .literalArg('remove')
        .wordArg('player').suggest(suggestNearbyPlayers)
        .executes(JavaWrapper.methodToJava(cmdWhitelistRemove))
        .or(2)
        .literalArg('list')
        .executes(JavaWrapper.methodToJava(cmdWhitelistList))
        .or(2)
        .literalArg('clear')
        .executes(JavaWrapper.methodToJava(cmdWhitelistClear))
        .or(2)
        .literalArg('toggle')
        .booleanArg('enabled')
        .executes(JavaWrapper.methodToJava(cmdWhitelistToggle))
        .or(1)
        .literalArg('draw')
        .literalArg('move')
        .intArg('x')
        .intArg('y')
        .wordArg('align').suggestMatching(['left', 'center', 'right'])
        .executes(JavaWrapper.methodToJava(cmdDrawMove));
    command.register();
}
function cmdPreset(ctx) {
    const configOption = ctx.getArg('config');
    mode = (0, config_1.getConfig)(configOption);
    logInfo(`Running with config: '${mode.name}'`);
    return true;
}
function cmdToggle(ctx) {
    const enabled = ctx.getArg('enabled');
    mode = (0, config_1.getConfig)();
    mode.enabled = enabled;
    logInfo(`Glow is now ${enabled ? 'enabled' : 'disabled'}`);
    (0, config_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistAdd(ctx) {
    const player = ctx.getArg('player');
    mode = (0, config_1.getConfig)();
    mode.whitelist.players.push(player);
    (0, config_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistRemove(ctx) {
    const player = ctx.getArg('player');
    mode = (0, config_1.getConfig)();
    mode.whitelist.players = mode.whitelist.players.filter(p => p !== player);
    (0, config_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistClear() {
    mode = (0, config_1.getConfig)();
    mode.whitelist.players = [];
    (0, config_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistList() {
    mode = (0, config_1.getConfig)();
    logInfo(`Whitelisted: [${mode.whitelist.players}]`);
    return true;
}
function cmdWhitelistToggle(ctx) {
    const boolean = ctx.getArg('enabled');
    mode = (0, config_1.getConfig)();
    mode.whitelist.enabled = boolean;
    (0, config_1.writeCustomConfig)(mode);
    return true;
}
function cmdDrawMove(ctx) {
    const x = ctx.getArg('x');
    const y = ctx.getArg('y');
    let align = ctx.getArg('align');
    switch (align) {
        case 'left':
            align = 0;
            break;
        case 'center':
            align = 0.5;
            break;
        case 'right':
            align = 1;
            break;
        default:
            align = 0;
            break;
    }
    mode = (0, config_1.getConfig)();
    mode.draw.x = x;
    mode.draw.y = y;
    mode.draw.align = align;
    (0, config_1.writeCustomConfig)(mode);
}
start();
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate);
