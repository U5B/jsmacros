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
exports.onTick = exports.terminate = void 0;
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const util = __importStar(require("../lib/util"));
const textLines_1 = require("../lib/textLines");
let healthTable;
let h2d;
let playerMap = {};
let mode;
let started = false;
function onTick(inputMode) {
    if (World && World.isWorldLoaded()) {
        mode = inputMode;
        if (World.getTime() % 100 !== 0)
            return; // every 5 seconds, check if a player has been unloaded
        if (started === false)
            startListeners();
        playerMap = {};
        const players = World.getLoadedPlayers();
        // @ts-ignore
        for (const player of players) {
            parseEntity(player);
        }
    }
    return true;
}
exports.onTick = onTick;
function parseHealthChange(event) {
    const entity = event.entity;
    parseEntity(entity);
    return true;
}
function parseEntity(entity) {
    if (entity?.getType() !== 'minecraft:player')
        return;
    const player = entity.asPlayer();
    const name = player.getName().getString();
    // if (name === Player.getPlayer().getName().getString()) return
    const currentHealth = Math.round(player.getHealth());
    let maxHealth = Math.round(player.getMaxHealth());
    if (maxHealth === 0)
        maxHealth = 0.001; // dividing by 0 is bad
    playerMap[name] = {
        hp: currentHealth,
        maxHp: maxHealth
    };
    drawHealthOverlay();
}
// hardcoded colors because uh, json is a pain
function determineColor(decimalHealth) {
    let color = util.decimalToRGB(mode.health.color.base);
    if (decimalHealth > mode.health.low)
        color = util.decimalToRGB(mode.health.color.good); // good
    else if (decimalHealth <= mode.health.low && decimalHealth > mode.health.critical)
        color = util.decimalToRGB(mode.health.color.low); // needs healing
    else if (decimalHealth <= mode.health.critical)
        color = util.decimalToRGB(mode.health.color.critical); // needs healing now
    return color;
}
function determineHealthColor([name, player]) {
    const [r, g, b] = determineColor(player.hp / player.maxHp);
    const builder = Chat.createTextBuilder();
    builder.append(`${player.hp}/${player.maxHp} ${name}`);
    builder.withColor(r, g, b);
    const message = builder.build();
    return message;
}
function drawHealthOverlay() {
    if (!healthTable)
        drawHealthStartup();
    healthTable.lines = [
        ...Object.entries(playerMap)
            // @ts-ignore # sort by health decimal
            .sort(([, a], [, b]) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
            // @ts-ignore # map to names
            .map(determineHealthColor)
    ];
    return true;
}
function drawHealthStartup() {
    if (h2d) {
        h2d.unregister();
        return;
    }
    if (healthTable)
        return healthTable;
    h2d = Hud.createDraw2D();
    h2d.register();
    healthTable = new textLines_1.TextLines(h2d, 425, 30, 0);
    healthTable.lines = [];
    return healthTable;
}
const eventListeners = {
    tick: null,
    heal: null,
    damage: null
};
function startListeners() {
    if (eventListeners.heal || eventListeners.damage || started)
        return;
    started = true;
    eventListeners.heal = JsMacros.on('EntityHealed', JavaWrapper.methodToJava(parseHealthChange));
    eventListeners.damage = JsMacros.on('EntityDamaged', JavaWrapper.methodToJava(parseHealthChange));
}
function terminate() {
    JsMacros.off('Tick', eventListeners.tick);
    JsMacros.off('EntityHealed', eventListeners.heal);
    JsMacros.off('EntityDamaged', eventListeners.damage);
    drawHealthStartup();
    started = false;
    return true;
}
exports.terminate = terminate;
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
