"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const textLines_1 = require("./lib/textLines");
const fakePlayerRegex = /~BTLP[0-9a-z]{8} (\d+)/;
const fakePlayerNumbers = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
let table;
let h2d;
let tickLoop;
let effectList = [];
let x = 0; // 775
let y = 0; // 150
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
    commander(false);
    h2d = Hud.createDraw2D();
    h2d.register();
    table = new textLines_1.TextLines(h2d, x, y);
    table.lines = [];
    tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(onTick));
}
let command;
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('drawEffects');
    command.intArg('arg1');
    command.intArg('arg2');
    command.executes(JavaWrapper.methodToJava(runCommand));
    command.register();
}
function runCommand(ctx) {
    x = ctx.getArg('arg1');
    y = ctx.getArg('arg2');
    start(true);
    return true;
}
function terminate() {
    JsMacros.off('Tick', tickLoop);
    commander(true);
    h2d.unregister();
    Hud.clearDraw2Ds();
}
start(true);
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
