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
// custom drugs from Monumenta are my favorite
const textLines_1 = require("../lib/textLines");
const util = __importStar(require("../lib/util"));
let started = false;
const fakePlayerRegex = /~BTLP[0-9a-z]{8} (\d+)/;
const fakePlayerNumbers = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
let table;
let h2d;
let tickLoop;
let effectList = [];
let config = {
    x: 0,
    y: 0,
    align: 0 // left shift
};
function onTick() {
    if (!World || !World.isWorldLoaded() || World.getTime() % 5 != 0)
        return;
    effectList = [];
    const players = World.getPlayers();
    // @ts-ignore
    for (const player of players) {
        parseLine(player);
    }
    table.lines = effectList;
    return true;
}
function parseLine(player) {
    if (!player || !World.isWorldLoaded())
        return;
    const playerName = player?.getName();
    if (!fakePlayerRegex.test(playerName))
        return;
    const [, number] = fakePlayerRegex.exec(playerName);
    if (!number || !fakePlayerNumbers.includes(number))
        return;
    let playerDisplayName;
    try {
        playerDisplayName = player?.getDisplayText().getString();
    }
    catch {
        return;
    }
    if (playerDisplayName == '')
        return;
    effectList.push(playerDisplayName);
}
function start(start = true) {
    if (h2d && start === false) {
        terminate();
        return;
    }
    else if (h2d && start === true) {
        terminate();
    }
    config = getConfig();
    commander(false);
    if (started === false)
        logInfo(`Started MEffects! Type /meffects help for more info.`);
    h2d = Hud.createDraw2D();
    h2d.register();
    table = new textLines_1.TextLines(h2d, config.x, config.y, config.align);
    table.lines = [];
    tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJavaAsync(onTick));
    started = true;
}
function help() {
    logInfo(`Usage:
Move the effects overlay:
/meffects move <x> <y> <align>
Display this help menu:
/meffects help`);
    return true;
}
let command;
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('meffects');
    command
        .literalArg('move')
        .intArg('x') // x pos
        .intArg('y') // y pos
        .wordArg('align').suggestMatching(['left', 'center', 'right']) // align
        .executes(JavaWrapper.methodToJava(configure))
        .or(1)
        .literalArg('help')
        .executes(JavaWrapper.methodToJava(help));
    command.register();
}
function configure(ctx) {
    config.x = ctx.getArg('x');
    config.y = ctx.getArg('y');
    let align = ctx.getArg('align');
    switch (align) {
        case 'left':
            config.align = 0;
            break;
        case 'center':
            config.align = 0.5;
            break;
        case 'right':
            config.align = 1;
            break;
        default:
            config.align = 0;
            break;
    }
    writeConfig(config);
    logInfo(`Effects configured: x: ${config.x}, y: ${config.y}, align: ${config.align}`);
    start(true);
    return true;
}
function getConfig() {
    let modifiedConfig = config;
    const success = util.readConfig('effects');
    if (!success)
        return modifiedConfig;
    modifiedConfig = success;
    return success;
}
function writeConfig(config) {
    util.writeConfig('effects', config);
}
function terminate() {
    JsMacros.off('Tick', tickLoop);
    commander(true);
    h2d.unregister();
    started = false;
}
function logInfo(string, noChat = false) {
    util.logInfo(string, 'MEffects', noChat);
}
start(true);
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
