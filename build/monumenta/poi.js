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
// am lost, need direction to the POI
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
const util = __importStar(require("../lib/util"));
const xaero = __importStar(require("../lib/xaero"));
const pois_json_1 = __importDefault(require("./data/pois.json"));
const poiSuggestions = ['spoof']; // command options that isn't a POI
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
function responsePoi(input, poi) {
    if (!poi) {
        logInfo(`'${input}': No POI found.`);
        return false;
    }
    else if (poi && poi.coordinates && poi.coordinates.x && poi.coordinates.y && poi.coordinates.z) {
        if (!util.nodeEnv) {
            const builder = xaero.createCoordinateBuilder(poi.coordinates, 'POI', poi.name);
            Chat.log(builder.build());
        }
        logInfo(`'${poi.name}': §a(${poi.coordinates.x}, ${poi.coordinates.y}, ${poi.coordinates.z})§r`, true);
    }
    else if (poi && poi.coordinates && !poi.coordinates.x && !poi.coordinates.y && !poi.coordinates.z) {
        logInfo(`'${poi.name}': POI is missing coordinates...`);
        return false;
    }
    else {
        logInfo(`'${input}': No POI found.`);
        return false;
    }
    return true;
}
function start() {
    makeSearchTerms();
    commander();
    logInfo('Started!');
    return true;
}
function terminate() {
    commander(true);
    logInfo('Stopped!');
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
    validatePoi(poiInput);
    return true;
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
