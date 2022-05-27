"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
                    const builder = Chat.createTextBuilder();
                    builder.append('§7[§aCOMPASS§7]§r ');
                    const coordinates = `(${coord.x}, ${coord.y}, ${coord.z})`;
                    builder.append(coordinates);
                    builder.withColor(0xa); // green
                    builder.append(' [COPY]');
                    builder.withColor(0xc); // red
                    builder.withClickEvent('copy_to_clipboard', coordinates);
                    builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'));
                    Chat.log(builder.build());
                    break;
                }
            }
            return true;
        }
    }
    return false;
}
Chat.log('§7[§aCOMPASS§7]§r Started. Left click a compass to begin.');
const listener = JsMacros.on('Key', JavaWrapper.methodToJava(onKeyPress));
function terminate() {
    JsMacros.off('Key', listener);
    return true;
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
