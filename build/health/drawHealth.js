"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTick = exports.terminate = void 0;
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const textLines_1 = require("./textLines");
let healthTable;
let h2d;
let playerMap = {};
let started = false;
function onTick() {
    if (World && World.isWorldLoaded()) {
        if (World.getTime() % 100 !== 0)
            return; // 5 seconds
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
    const currentHealth = player.getHealth();
    let maxHealth = player.getMaxHealth();
    if (maxHealth === 0)
        maxHealth = 1; // dividing by 0 is bad
    playerMap[name] = {
        hp: currentHealth,
        maxHp: maxHealth
    };
    drawHealthOverlay();
}
function drawHealthOverlay() {
    if (!healthTable)
        healthTable = drawHealthStartup();
    healthTable.lines = [
        ...Object.entries(playerMap)
            // @ts-ignore # sort by health decimal
            .sort(([, a], [, b]) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
            // @ts-ignore # map to names
            .map(([name, hp]) => `§c${Math.round(hp?.hp)}/${Math.round(hp?.maxHp)} §r${name}`)
    ];
    return true;
}
function drawHealthStartup() {
    if (h2d) {
        h2d.unregister();
        Hud.clearDraw2Ds();
        return;
    }
    if (healthTable)
        return healthTable;
    h2d = Hud.createDraw2D();
    h2d.register();
    healthTable = new textLines_1.TextLines(h2d, 425, 30);
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
}
exports.terminate = terminate;
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
