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
const textLines_1 = require("../lib/textLines");
let healthTable;
let h2d;
let playerMap = {};
let started = false;
let doReload = false;
let enabled = true;
let command = null;
const config = {
    x: 0,
    y: 0,
    align: 0,
    health: {
        critical: {
            color: 0xFF0000,
            rgb: [255, 255, 255],
            percent: 0.4,
            glow: true // if false, uses glowing effect from server
        },
        low: {
            color: 0xFFFF00,
            rgb: [255, 255, 255],
            percent: 0.7,
            glow: true, // if false, uses glowing effect from server
        },
        good: {
            color: 0x00FF00,
            rgb: [255, 255, 255],
            percent: 1.0,
            glow: true // if false, uses glowing effect from server
        },
        base: {
            color: 0xFFFFFF,
            rgb: [255, 255, 255],
            percent: 1.0,
            glow: false // if false, uses glowing effect from server
        }
    }
};
function onTick() {
    context.releaseLock();
    if (enabled === false)
        return false;
    if (!World || !World.isWorldLoaded())
        return;
    if (doReload === true)
        drawHealthStartup();
    if (World.getTime() % 3 !== 0)
        return; // every 0.5 seconds
    checkAllPlayers();
    return true;
}
function checkAllPlayers() {
    playerMap = {};
    const players = World.getLoadedPlayers();
    if (players == null) {
        drawHealthOverlay();
        return false;
    }
    // @ts-ignore
    for (const player of players) {
        parseEntity(player);
    }
    drawHealthOverlay();
    return true;
}
/*
function parseHealthChange (event: Events.EntityDamaged | Events.EntityHealed) {
  const entity = event.entity
  const valid = parseEntity(entity)
  if (valid === false) return
  drawHealthOverlay()
  return true
}

function parseEntityChange (event: Events.EntityLoad | Events.EntityUnload) {
  const entity = event.entity
  const valid = parseEntity(entity)
  if (valid === false) return
  drawHealthOverlay()
  return true
}
*/
function parseEntity(entity) {
    if (!util.isPlayer(entity))
        return false;
    const player = entity.asPlayer();
    const name = player.getName().getString();
    const currentHealth = Math.max(1, Math.round(player.getHealth()));
    const maxHealth = Math.max(1, Math.round(player.getMaxHealth()));
    playerMap[name] = {
        hp: currentHealth,
        maxHp: maxHealth
    };
    return true;
}
function determineHealthColor([name, player]) {
    const colorObject = util.determineColor(player.hp / player.maxHp);
    if (colorObject.glow === false)
        return '';
    const [r, g, b] = colorObject.rgb;
    const builder = Chat.createTextBuilder();
    builder.append(`${player.hp}/${player.maxHp} ${name}`);
    builder.withColor(r, g, b);
    const message = builder.build();
    return message;
}
function drawHealthOverlay() {
    healthTable.lines = [];
    if (playerMap == null) {
        return true;
    }
    healthTable.lines = [
        ...Object.entries(playerMap)
            // @ts-ignore # sort by health decimal
            .sort(([, a], [, b]) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
            // @ts-ignore # map to names
            .map(determineHealthColor)
    ];
    return true;
}
function drawHealthStartup(stop = false) {
    if (h2d)
        h2d.unregister();
    if (stop === true)
        return;
    h2d = Hud.createDraw2D();
    h2d.register();
    healthTable = new textLines_1.TextLines(h2d, config.x, config.y, config.align);
    healthTable.lines = [];
    doReload = false;
    return healthTable;
}
function loadConfig() {
    let mode = util.readConfig('drawHealth');
    if (!mode)
        mode = config;
    else {
        config.x = mode.x;
        config.y = mode.y;
        config.align = mode.align;
        config.health = mode.health;
    }
    util.writeConfig('drawHealth', config);
    doReload = true;
    return true;
}
function writeConfig() {
    util.writeConfig('drawHealth', config);
    doReload = true;
    return true;
}
const eventListeners = {
    tick: null,
    heal: null,
    damage: null,
    load: null,
    unload: null
};
function start() {
    loadConfig();
    drawHealthStartup();
    commander(false);
    started = true;
    eventListeners.tick = JsMacros.on('Tick', JavaWrapper.methodToJavaAsync(onTick));
    // eventListeners.heal = JsMacros.on('EntityHealed', JavaWrapper.methodToJavaAsync(parseHealthChange))
    // eventListeners.damage = JsMacros.on('EntityDamaged', JavaWrapper.methodToJavaAsync(parseHealthChange))
    // eventListeners.load = JsMacros.on('EntityLoad', JavaWrapper.methodToJavaAsync(parseEntityChange))
    // eventListeners.unload = JsMacros.on('EntityUnload', JavaWrapper.methodToJavaAsync(parseEntityChange))
    return true;
}
start();
function terminate() {
    if (started === false)
        return;
    healthTable.lines = [];
    // JsMacros.off('EntityHealed', eventListeners.heal)
    // JsMacros.off('EntityDamaged', eventListeners.damage)
    // JsMacros.off('EntityLoad', eventListeners.load)
    // JsMacros.off('EntityUnload', eventListeners.unload)
    JsMacros.off('onTick', eventListeners.tick);
    eventListeners.heal = null;
    eventListeners.damage = null;
    eventListeners.tick = null;
    eventListeners.load = null;
    eventListeners.unload = null;
    commander(true);
    drawHealthStartup(true);
    started = false;
    return true;
}
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('drawhealth');
    command
        .literalArg('move')
        .intArg('x')
        .intArg('y')
        .wordArg('align').suggestMatching(['left', 'center', 'right'])
        .executes(JavaWrapper.methodToJava(cmdDrawMove))
        .or(1)
        .literalArg('toggle')
        .booleanArg('enabled')
        .executes(JavaWrapper.methodToJava(cmdDrawToggle))
        .or(1)
        .literalArg('reload')
        .executes(JavaWrapper.methodToJavaAsync(loadConfig));
    command.register();
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
    config.x = x;
    config.y = y;
    config.align = align;
    writeConfig();
    return true;
}
function cmdDrawToggle(ctx) {
    const boolean = ctx.getArg('enabled');
    enabled = boolean;
    logInfo('DrawHealth is now ' + (enabled ? 'enabled' : 'disabled'));
    return true;
}
function logInfo(string, noChat = false) {
    util.logInfo(string, 'DrawHealth', noChat);
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
