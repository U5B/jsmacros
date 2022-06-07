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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const util = __importStar(require("../lib/util"));
const pois_json_1 = __importDefault(require("./data/pois.json"));
const poiSuggestions = [];
const shardMap = {
    'King\'s Valley': 'valley',
    'Celsian Isles': 'isles',
};
let config = util.readConfig('poi');
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
        const tags = util.trimString(name).split(' ');
        if (tags.includes(util.trimString(input)))
            response.push(content);
    }
    if (response.length === 0) { // if there is already a response, ignore it
        for (const [name, content] of Object.entries(pois_json_1.default)) { // fuzzy match 'airshrine'
            if (util.cleanString(name).includes(util.cleanString(input)))
                response.push(content);
        }
    }
    if (response)
        return response;
    return null;
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
        if (!util.nodeEnv) {
            const builder = Chat.createTextBuilder();
            builder.append(`§7[§aPOI§7]§r '${response.name}': `);
            const coordinates = `${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z}`;
            builder.append(`(${coordinates})`); // send brackets here
            builder.withColor(0xa);
            builder.append(' [COPY]');
            builder.withColor(0xc);
            builder.withClickEvent('copy_to_clipboard', coordinates); // but not here
            builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'));
            Chat.log(builder.build());
            if (config.xaero)
                parseXaero(response);
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
function parseXaero(response) {
    let world = `monumenta\$${shardMap[response.shard]}`;
    if (config.spoof)
        world = `minecraft$overworld`; // don't know if this works
    logXaeroWaypoint(response.name, response.coordinates.x, response.coordinates.y, response.coordinates.z, world);
}
function logXaeroWaypoint(name = 'Compass', x = 0, y = 0, z = 0, world = 'minecraft$overworld') {
    // xaero-waypoint:asd:A:-1280:213:-1284:11:false:0:Internal-dim%monumenta$isles-waypoints
    // name: string = 'Name'
    // label: string = 'N'
    // x: number (-integer -> integer) = 0
    // y: number (-integer -> integer) = 0
    // z: number (-integer -> integer) = 0
    // color: number (0-16) (4: dark red) = 4 (red) 
    // global: boolean (true/false) = true
    // yaw: number (?) = 0
    // world: string: (minecraft$overworld, monumenta$isles) 'minecraft$overworld'
    // xaero-waypoint:name:label:x:y:z:color:global:yaw:Internal-dim$world-waypoints
    const xaeroWaypoint = `xaero-waypoint:${name}:${name[0].toUpperCase()}:${x}:${y}:${z}:4:true:0:Internal-dim%${world}-waypoints`;
    const alternativeWaypoint = `xaero_waypoint_add:${name}:${name[0].toUpperCase()}:${x}:${y}:${z}:4:true:0:Internal-dim%${world}-waypoints`;
    reflectionTime(alternativeWaypoint);
    // only way for this to work is to send it to yourself >w<
    Chat.say(`/msg ${Player.getPlayer().getName().getStringStripFormatting()} ${xaeroWaypoint}`);
}
// this probably doesn't work at all
// this uses whatever the [X+] button does internally which sends a string called 'xaero_waypoint_add' as a command
// thanks Etheradon for helping me
function reflectionTime(waypointString) {
    const args = waypointString.split(':');
    try {
        // ForgeEventHandler.java L157-L160
        // @ts-ignore # get the waypoint session
        const session = Java.type('xaero.common.XaeroMinimapSession').getCurrentSession();
        // @ts-ignore # add waypoint
        session.getWaypointSharing().onWaypointAdd(args);
        return true;
    }
    catch {
        return false;
    }
}
function start() {
    logInfo('Starting service...');
    generateConfig();
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
function commander(stop = false) {
    if (util.nodeEnv)
        return false;
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('poi');
    command.greedyStringArg('arg1').suggestMatching(poiSuggestions);
    command.executes(JavaWrapper.methodToJavaAsync(runCommand));
    command.register();
}
function runCommand(ctx) {
    context.releaseLock();
    const poiInput = ctx.getArg('arg1');
    if (poiInput === 'xaero') {
        config.xaero = !config.xaero;
        logInfo(`Xaero Integration: ${config.xaero}`);
        generateConfig();
        return;
    }
    else if (poiInput === 'spoof') {
        config.spoof = !config.spoof;
        logInfo(`Dimension Spoof: ${config.spoof}`);
        generateConfig();
    }
    validatePoi(poiInput);
    return true;
}
const defaultConfig = { xaero: false, spoof: false };
function generateConfig() {
    if (!config)
        config = defaultConfig;
    util.writeConfig('poi', config);
}
start();
if (util.nodeEnv) {
    // @ts-ignore
    const args = process.argv.slice(2);
    const poi = args.join(' ');
    validatePoi(poi);
}
// @ts-ignore
if (!util.nodeEnv)
    event.stopListener = JavaWrapper.methodToJava(terminate);
function logInfo(string, noChat = false) {
    util.logInfo(string, 'POI', noChat);
}
