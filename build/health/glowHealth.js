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
// shiny players
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const util = __importStar(require("../lib/util"));
// Configuration Start
const healthConfig_1 = require("./healthConfig");
let mode = (0, healthConfig_1.getConfig)('custom');
// Configuration End
const state = {
    tickLoop: undefined,
    started: false,
    running: false,
    glowingPlayers: [],
    nearbyPlayers: [],
    selectedPlayer: ''
};
function onTick() {
    context.releaseLock();
    try {
        if (World && World.isWorldLoaded() && state.started === true) {
            if (state.running === false) {
                logInfo('Started! Type /glowhealth help for more info.');
                state.running = true;
            }
        }
        else
            return false;
        if (mode.enabled === true) {
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
        }
        else {
            resetPlayers(false, false);
        }
        return true;
    }
    catch (e) {
        stop(e);
    }
}
function isPlayerVisible(entity) {
    if (!util.isPlayer(entity))
        return null; // only accept players
    if (mode.raytrace.depth === false)
        return true; // if depth check is off, skip everything
    if (isPlayerInRange(entity) === false)
        return false; // if player is not in range, ignore
    if (isPlayerGlowing(entity) === true)
        return true; // ignore glowing players if toggle is enabled
    const javaEntity = entity.asLiving().getRaw();
    // @ts-ignore # LivingEntity.canSee
    const result = Player.getPlayer().asLiving().getRaw().method_6057(javaEntity);
    return result;
}
function isPlayerInRange(player) {
    if (mode.raytrace.reach >= 64)
        return true; // if reach is set to 64 or higher, skip everything
    const ourPosition = Player.getPlayer().getBlockPos(); // get our position
    const playerPositiion = player.getBlockPos(); // get other player position
    const distance = Math.floor(ourPosition.toVector(playerPositiion).getMagnitude());
    if (distance > mode.raytrace.reach)
        return false;
    return true;
}
function isPlayerGlowing(player) {
    if (mode.raytrace.ignoreGlowing === false)
        return false;
    const forceGlowing = player.isGlowing();
    player.resetGlowing();
    const value = player.isGlowing();
    player.setGlowing(forceGlowing);
    return value; // true/false
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
    const players = World.getLoadedPlayers();
    if (players == null)
        return;
    // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
    for (const player of players) {
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
    if (mode.whitelist.enabled === true && mode.whitelist.players.length > 0 && mode.whitelist.players.includes(name) === false)
        return false;
    // player.getRaw().method_6067() is absorption hearts
    const health = player.getHealth(); /* + player.getRaw().method_6067() */
    const maxHealth = player.getMaxHealth(); /* + player.getRaw().method_6067() */
    const percentHealth = Number(health / maxHealth);
    const color = util.determineColor(percentHealth, mode.health);
    const decimalColor = color.color;
    player.setGlowingColor(decimalColor);
    if (color.glow)
        player.setGlowing(color.glow);
    else
        player.resetGlowing();
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
    const players = World.getLoadedPlayers();
    if (players == null)
        return;
    // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
    for (const player of players) {
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
        state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJavaAsync(onTick)); // ignore if already started
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
function logInfo(string, noChat = false) {
    util.logInfo(string, 'GlowHealth', noChat);
}
function help() {
    logInfo(`Usage:
Set a preset mode: 
/glowhealth preset <preset>
Toggle glow:
/glowhealth toggle <true/false>
Toggle the whitelist:
/glowhealth whitelist toggle <true/false>
Add or remove a player to the whitelist:
/glowhealth whitelist <add/remove> <player>
List the whitelisted players:
/glowhealth whitelist <list>
Clear the whitelist:
/glowhealth whitelist clear
Move overlay of the health hud:
/glowhealth draw move <x> <y> <align>
Toggle overlay of the health hud
/glowhealth draw toggle <true/false>
Display this help menu:
/glowhealth help`);
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
        .greedyStringArg('config').suggestMatching((0, healthConfig_1.getModes)())
        .executes(JavaWrapper.methodToJava(cmdPreset))
        .or(1)
        .literalArg('toggle')
        .executes(JavaWrapper.methodToJava(cmdToggle))
        .or(1)
        .literalArg('whitelist')
        .literalArg('add')
        .wordArg('player')
        .executes(JavaWrapper.methodToJava(cmdWhitelistAdd))
        .or(2)
        .literalArg('remove')
        .wordArg('player')
        .executes(JavaWrapper.methodToJava(cmdWhitelistRemove))
        .or(2)
        .literalArg('list')
        .executes(JavaWrapper.methodToJava(cmdWhitelistList))
        .or(2)
        .literalArg('clear')
        .executes(JavaWrapper.methodToJava(cmdWhitelistClear))
        .or(2)
        .literalArg('toggle')
        .executes(JavaWrapper.methodToJava(cmdWhitelistToggle))
        .or(1)
        .literalArg('help')
        .executes(JavaWrapper.methodToJava(help));
    command.register();
}
function cmdPreset(ctx) {
    const configOption = ctx.getArg('config');
    mode = (0, healthConfig_1.getConfig)(configOption);
    logInfo(`Running with config: '${mode.name}'`);
    return true;
}
function cmdToggle() {
    mode = (0, healthConfig_1.getConfig)();
    mode.enabled = !mode.enabled;
    logInfo(`Glow is now ${mode.enabled ? 'enabled' : 'disabled'}`);
    (0, healthConfig_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistAdd(ctx) {
    const player = ctx.getArg('player');
    mode = (0, healthConfig_1.getConfig)();
    mode.whitelist.players.push(player);
    logInfo('Added ' + player + ' to the whitelist');
    (0, healthConfig_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistRemove(ctx) {
    const player = ctx.getArg('player');
    mode = (0, healthConfig_1.getConfig)();
    mode.whitelist.players = mode.whitelist.players.filter(p => p !== player);
    logInfo('Removed ' + player + ' from the whitelist');
    (0, healthConfig_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistClear() {
    mode = (0, healthConfig_1.getConfig)();
    mode.whitelist.players = [];
    logInfo('Cleared the whitelist');
    (0, healthConfig_1.writeCustomConfig)(mode);
    return true;
}
function cmdWhitelistList() {
    mode = (0, healthConfig_1.getConfig)();
    logInfo(`Whitelisted: [${mode.whitelist.players}]`);
    return true;
}
function cmdWhitelistToggle(ctx) {
    mode = (0, healthConfig_1.getConfig)();
    mode.whitelist.enabled = !mode.whitelist.enabled;
    logInfo('Whitelist is now ' + (mode.whitelist.enabled ? 'enabled' : 'disabled'));
    (0, healthConfig_1.writeCustomConfig)(mode);
    return true;
}
start();
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate);
