"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// I keep missing __Deen__'s parties uwu
const regex = {
    base: /^<[a-z\-]{2,16}> (?:\[[A-Z]{2,8}\] )?([0-9a-zA-Z_]{3,16}) » (.*)$/,
    lfg: {
        base: /^<lfg> (?:\[[A-Z]{2,8}\] )?([0-9a-zA-Z_]{3,16}) » (.*)$/,
    }
};
function onMessage(event) {
    if (!event.text)
        return;
    const message = event.text.getString();
    if (regex.lfg.base.test(message))
        lfg(message);
    return true;
}
const lfgBlacklist = ['omw', 'full'];
const lfgWhitelist = ['i1', 'i2', 'i3', 'v1', 'v2', 'v3', 'ccs', 'free'];
function lfg(message) {
    const [, username, text] = regex.lfg.base.exec(message);
    if (username === Player.getPlayer().getName().getStringStripFormatting())
        return;
    if (lfgBlacklist.includes(text))
        return;
    World.playSound('entity.player.levelup', 1, 1);
}
let messageListener = JsMacros.on('RecvMessage', JavaWrapper.methodToJavaAsync(onMessage));
function terminate() {
    JsMacros.off('RecvMessage', messageListener);
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
