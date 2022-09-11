"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// sponsered by StonkCo
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud, JsMacros, Events */
let barrels = {};
const defaultArguments = 'r:8 t:26h a:container';
const delayInMs = 1000;
// 43.22/m ago - Weslaifu removed x59 dragon_breath
// $1 - username, $2 - added/removed, $3 - amount added/removed, $4 - item name
// [\d\.]{1,5} matches a 4 digt number including decimal
// ([0-9a-zA-Z_]{3,16}) matches a valid Minecraft username which can range from 3 to 16 characters and includes '_'
// (added|removed) matches 'added' or 'removed'
// (\d+) matches any number (could be capped at 64)
// ([a-zA-Z_]{1,16}) matches any item name
const logRegex = /^[\d\.]{1,5}\/(?:m|h|d) ago - ([0-9a-zA-Z_]{3,16}) (added|removed) x(\d+) ([0-9a-zA-Z_]+)\.$/;
// (-?\d+) matches any positive or negative integer
const coordinateRegex = /^\^ \(x(-?\d+)\/y(-?\d+)\/z(-?\d+)\/Project_Epic-plots\)$/;
const pageRegex = /^(?:◀ )?Page (\d+)\/(\d+) (?:▶ )?\| To view a page, type "\/co l <page>"\.$/;
const noRegex = /^CoreProtect - No results found\.$/;
const dataBaseRegex = /^CoreProtect - Database busy\. Please try again later\.$/;
const waitingForResponseRegex = /^CoreProtect - Lookup searching\. Please wait\.\.\.$/;
let tradeData = { time: 0, username: '', action: '', amount: 0, item: '' };
/*
barrel format: { x/y/z: [{tradeData}, {tradeData}] }
x/y/z - coordinate
tradeData format: { time: 0, username: '', action: '', amount: 0, item: '' }
time - unix timestamp
username - minecraft username
action - 'added' or 'removed'
amount - number of items added or removed
item - item name
*/
function awaitPageResponse(event) {
    context.releaseLock();
    if (!event.text)
        return false;
    const message = event.text.getStringStripFormatting().trim();
    if (pageRegex.test(message)) {
        phaseTwo();
        return;
    }
    else if (noRegex.test(message) || dataBaseRegex.test(message)) {
        phaseWrong();
    }
    return false;
}
function parseLog(event) {
    if (!event.text)
        return; // check if event was canceled
    const message = event.text.getStringStripFormatting().trim();
    if (logRegex.test(message)) {
        let time;
        const jsonData = JSON.parse(event.text.getJson());
        // @ts-ignore
        for (const [key, value] of Object.entries(jsonData.extra)) {
            if (value['hoverEvent']) {
                time = value['hoverEvent'].contents.text;
            }
        }
        const unixTime = Math.round((new Date(time).getTime()) / 1000);
        const [, username, action, amount, item] = logRegex.exec(message);
        tradeData.time = unixTime;
        tradeData.username = username;
        tradeData.action = action;
        tradeData.amount = Number(amount);
        tradeData.item = item;
    }
    else if (coordinateRegex.test(message)) {
        const [, x, y, z] = coordinateRegex.exec(message);
        if (!barrels[`${x}/${y}/${z}`])
            barrels[`${x}/${y}/${z}`] = []; // if barrel doesn't exist, create it
        barrels[`${x}/${y}/${z}`].push(tradeData); // add tradeData to array of trades
        tradeData = { time: 0, username: '', action: '', amount: 0, item: '' }; // reset it after it was added
    }
    else if (pageRegex.test(message)) {
        const [, currentPage, totalPages] = pageRegex.exec(message);
        const currentPageNumber = Number(currentPage);
        const totalPagesNumber = Number(totalPages);
        if (currentPageNumber < totalPagesNumber) {
            Time.sleep(delayInMs); // 1 second delay
            Chat.say(`/co l ${currentPageNumber + 1}`, true);
        }
        else if (currentPageNumber === totalPagesNumber)
            phaseThree();
    }
    else if (noRegex.test(message) || dataBaseRegex.test(message)) {
        phaseWrong();
    }
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
    command = Chat.createCommandBuilder('stonks') // change this to whatever you like to save your data
        .literalArg('default')
        .executes(JavaWrapper.methodToJava(runCommand))
        .or(1)
        .literalArg('custom')
        .greedyStringArg('co-arguments')
        .executes(JavaWrapper.methodToJava(runCommandCustom))
        .or(1)
        .literalArg('stop')
        .executes(JavaWrapper.methodToJava(phaseWrong))
        .or(1)
        .literalArg('help')
        .executes(JavaWrapper.methodToJava(help));
    command.register();
}
function help() {
    Chat.log(`Usage:
/stonks default - runs default CoreProtect arguments (${defaultArguments})
/stonks custom - specify custom CoreProtect arguments
/stonks help - print this help menu`);
    return true;
}
function runCommandCustom(ctx) {
    let coArguments = ctx.getArg('co-arguments');
    if (!coArguments)
        coArguments = defaultArguments;
    phaseOne(coArguments);
    return true;
}
let recvEvent;
function runCommand() {
    phaseOne(defaultArguments);
    return true;
}
function phaseOne(coArguments) {
    Chat.log('[STONK] Starting...');
    recvEvent = JsMacros.on('RecvMessage', JavaWrapper.methodToJavaAsync(awaitPageResponse));
    Chat.say(`/co l ${coArguments}`, true);
}
function phaseTwo() {
    JsMacros.off('RecvMessage', recvEvent);
    Chat.log('[STONK] Phase two starting...');
    recvEvent = JsMacros.on('RecvMessage', JavaWrapper.methodToJavaAsync(parseLog)); // start listening for coreprotect logs
    Chat.say('/co l 1:100', true); // list 1:100 of the page logs
}
function phaseThree() {
    Chat.log('[STONK] Writing data...');
    JsMacros.off('RecvMessage', recvEvent);
    const success = write(barrels);
    if (success)
        Chat.log('[STONK] Done! Check output.json for the data.');
    else
        Chat.log('[STONK] Failed to write data.');
}
function phaseWrong() {
    Chat.log('[STONK] An error has occured. Please rerun the command.');
    JsMacros.off('RecvMessage', recvEvent);
    return true;
}
function write(output) {
    try {
        FS.open('./output.json').write(JSON.stringify(output, null, 2));
        return true;
    }
    catch (e) {
        return false;
    }
}
commander(false);
function terminate() {
    commander(true);
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
