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
// which way is north?
const xaero = __importStar(require("../lib/xaero"));
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
function getCompass() {
    // @ts-ignore
    const position = World.getRespawnPos();
    const pos = { x: position.getX(), y: position.getY(), z: position.getZ() };
    return pos;
}
function onKeyPress(event) {
    if (World && World.isWorldLoaded()) {
        if (event.key === 'key.mouse.left' && event.action === 1) { // trigger on attack press
            const item = Player.getPlayer().getMainHand().getItemID(); // get id of currently held item
            switch (item) {
                case 'minecraft:compass': { // if it is a compass, make a special string
                    const coord = getCompass();
                    createCompass(coord.x, coord.y, coord.z);
                    break;
                }
            }
            return true;
        }
    }
    return false;
}
function runCommand(ctx) {
    const x = ctx.getArg('x');
    const y = ctx.getArg('y');
    const z = ctx.getArg('z');
    if (x && y && z)
        createCompass(x, y, z);
    else
        Chat.log('§7[§aCompass§7]§r Not enough arguments. Try /compass <x> <y> <z>§r');
    return true;
}
function createCompass(x, y, z) {
    const builder = xaero.createCoordinateBuilder({ x, y, z }, 'Compass', 'Compass');
    Chat.log(builder.build());
}
let command;
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('compass');
    command.intArg('x');
    command.intArg('y');
    command.intArg('z');
    command.executes(JavaWrapper.methodToJavaAsync(runCommand));
    command.register();
}
commander(false);
Chat.log('§7[§aCompass§7]§r Started. Left click with a compass to begin.');
const listener = JsMacros.on('Key', JavaWrapper.methodToJavaAsync(onKeyPress));
function terminate() {
    JsMacros.off('Key', listener);
    commander(true);
    return true;
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
