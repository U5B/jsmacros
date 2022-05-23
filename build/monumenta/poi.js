"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS */
const pois_json_1 = __importDefault(require("./data/pois.json"));
const poiSuggestions = [];
// @ts-ignore # figure out if it is a node env
const nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1);
function makeSearchTerms() {
    for (const [, poi] of Object.entries(pois_json_1.default)) {
        poiSuggestions.push(poi.name);
    }
}
function searchPoi(input) {
    const response = [];
    for (const [name, content] of Object.entries(pois_json_1.default)) { // exact match 'Air Shrine'
        if (name === input)
            return content;
    }
    for (const [name, content] of Object.entries(pois_json_1.default)) { // tag match ['air', 'shrine']
        const tags = trimString(name).split(' ');
        if (tags.includes(trimString(input)))
            response.push(content);
    }
    if (response.length === 0) { // if there is already a response, ignore it
        for (const [name, content] of Object.entries(pois_json_1.default)) { // fuzzy match 'airshrine'
            if (cleanString(name).includes(cleanString(input)))
                response.push(content);
        }
    }
    if (response)
        return response;
    return null;
}
function runCommand(ctx) {
    const poiInput = ctx.getArg('poi');
    return validatePoi(poiInput);
}
function validatePoi(input) {
    if (!input || input.trim().length <= 3) {
        logInfo(`'${input}': Invalid input.`);
        return false;
    }
    const response = searchPoi(input);
    if (Array.isArray(response) && response.length > 0) {
        for (const rep of response) {
            responsePoi(input, rep);
        }
    }
    else if (response && !Array.isArray(response)) {
        responsePoi(input, response);
    }
    else {
        responsePoi(input, null);
        return false;
    }
    return true;
}
function responsePoi(input, response) {
    if (!response) {
        logInfo(`'${input}': No POI found.`);
        return false;
    }
    else if (response && response.coordinates && response.coordinates.x && response.coordinates.y && response.coordinates.z) {
        if (!nodeEnv) {
            const builder = Chat.createTextBuilder();
            builder.append(`§7[§aPOI§7]§r '${response.name}': `);
            const coordinates = `(${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})`;
            builder.append(coordinates);
            builder.withColor(0xa);
            builder.append(' [COPY]');
            builder.withColor(0xc);
            builder.withClickEvent('copy_to_clipboard', coordinates);
            builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'));
            Chat.log(builder.build());
        }
        logInfo(`'${response.name}': §a(${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})§r`, true);
    }
    else if (response && response.coordinates && !response.coordinates.x && !response.coordinates.y && !response.coordinates.z) {
        logInfo(`'${response.name}': POI is missing coordinates...`);
        return false;
    }
    else {
        logInfo(`'${input}': No POI found.`);
        return false;
    }
    return true;
}
function start() {
    logInfo('Starting service...');
    makeSearchTerms();
    commander();
    return true;
}
function terminate() {
    logInfo('Stopping service...');
    commander(true);
    return true;
}
let command;
function commander(destroy = false) {
    if (nodeEnv)
        return false;
    if (command) {
        command.unregister();
        command = null;
        if (destroy === true)
            return true;
    }
    command = Chat.createCommandBuilder('poi');
    command.greedyStringArg('poi').suggestMatching(poiSuggestions);
    command.executes(JavaWrapper.methodToJava(runCommand));
    command.register();
}
function cleanString(str) {
    return str
        .replaceAll(/'/g, '')
        .replaceAll(/\n/g, '')
        .replaceAll(/ /g, '')
        .trim()
        .toLowerCase();
}
function trimString(str) {
    return str
        .trim()
        .toLowerCase();
}
start();
if (nodeEnv) {
    // @ts-ignore
    const args = process.argv.slice(2);
    const poi = args.join(' ');
    validatePoi(poi);
}
// @ts-ignore
if (!nodeEnv)
    event.stopListener = JavaWrapper.methodToJava(terminate);
function logInfo(string, noChat = false) {
    if (!nodeEnv && noChat === false) {
        Chat.log(`§7[§aPOI§7]§r ${string}`);
    }
    string = string.replaceAll(/§./g, '');
    debug(`[POI]: ${string}`);
}
function debug(input) {
    // @ts-ignore
    if (nodeEnv) {
        // @ts-ignore
        console.log(input);
    }
    else {
        Chat.getLogger('usb').warn(input);
    }
}