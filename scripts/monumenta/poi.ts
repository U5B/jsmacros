/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */

import * as util from '../lib/util'
import * as xaero from '../lib/xaero'
import poiData from './data/pois.json'
const poiSuggestions = []

const shardMap = {
  'King\'s Valley': 'valley',
  'Celsian Isles': 'isles',
}

let config = util.readConfig('poi')

function makeSearchTerms () {
  for (const [, poi] of Object.entries(poiData)) {
    poiSuggestions.push(poi.name)
  }
}

function searchPoi (input) {
  const response = []
  for (const [name, content] of Object.entries(poiData)) { // exact match 'Air Shrine'
    if (name === input) return content
  }
  for (const [name, content] of Object.entries(poiData)) { // tag match ['air', 'shrine']
    const tags = util.trimString(name).split(' ')
    if (tags.includes(util.trimString(input))) response.push(content)
  }
  if (response.length === 0) { // if there is already a response, ignore it
    for (const [name, content] of Object.entries(poiData)) { // fuzzy match 'airshrine'
      if (util.cleanString(name).includes(util.cleanString(input))) response.push(content)
    }
  }
  if (response) return response
  return null
}

function validatePoi (input) {
  if (!input || input.trim().length <= 3) {
    logInfo(`'${input}': Invalid input.`)
    return false
  }
  const response = searchPoi(input)
  if (Array.isArray(response) && response.length > 0) {
    for (const rep of response) {
      responsePoi(input, rep)
    }
  } else if (response && !Array.isArray(response)) {
    responsePoi(input, response)
  } else {
    responsePoi(input, null)
    return false
  }
  return true
}

function responsePoi (input, poi) {
  if (!poi) {
    logInfo(`'${input}': No POI found.`)
    return false
  } else if (poi && poi.coordinates && poi.coordinates.x && poi.coordinates.y && poi.coordinates.z) {
    if (!util.nodeEnv) {
      let builder = Chat.createTextBuilder()
      builder.append(`§7[§aPOI§7]§r '${poi.name}': `)
      const coordinates = `${poi.coordinates.x}, ${poi.coordinates.y}, ${poi.coordinates.z}`
      builder.append(`(${coordinates})`) // send brackets here
      builder.withColor(0xa)
      builder.append(' [COPY]')
      builder.withColor(0xc)
      builder.withClickEvent('copy_to_clipboard', coordinates) // but not here
      builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'))
      if (config.xaero) builder = parseXaero(poi, builder)
      Chat.log(builder.build())
    }
    logInfo(`'${poi.name}': §a(${poi.coordinates.x}, ${poi.coordinates.y}, ${poi.coordinates.z})§r`, true)
  } else if (poi && poi.coordinates && !poi.coordinates.x && !poi.coordinates.y && !poi.coordinates.z) {
    logInfo(`'${poi.name}': POI is missing coordinates...`)
    return false
  } else {
    logInfo(`'${input}': No POI found.`)
    return false
  }
  return true
}

function parseXaero (poi, builder) {
  const world = `monumenta:${shardMap[poi.shard]}`
  if (!config.spoof) builder = xaero.xaeroChatBuilder(builder, poi.coordinates, poi.name)
  else builder = xaero.xaeroChatBuilder(builder, poi.coordinates, poi.name, world)
  return builder
}

function start () {
  logInfo('Starting service...')
  generateConfig()
  makeSearchTerms()
  commander()
  return true
}

function terminate () {
  logInfo('Stopping service...')
  commander(true)
  return true
}

let command
function commander (stop = false) {
  if (util.nodeEnv) return false
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('poi')
  command.greedyStringArg('arg1').suggestMatching(poiSuggestions)
  command.executes(JavaWrapper.methodToJavaAsync(runCommand))
  command.register()
}

function runCommand (ctx) {
  context.releaseLock()
  const poiInput = ctx.getArg('arg1')
  if (poiInput === 'xaero') { // last minute commands: couldn't be bothered to make a proper command system
    config.xaero = !config.xaero
    logInfo(`Xaero Integration: ${config.xaero}`)
    generateConfig()
    return
  } else if (poiInput === 'spoof') {
    config.spoof = !config.spoof
    logInfo(`Dimension Spoof: ${config.spoof}`)
    generateConfig()
    return
  }
  validatePoi(poiInput)
  return true
}

const defaultConfig = { xaero: false, spoof: false}
function generateConfig () {
  if (!config) config = defaultConfig
  util.writeConfig('poi', config)
}

start()
if (util.nodeEnv) {
  // @ts-ignore
  const args = process.argv.slice(2)
  const poi = args.join(' ')
  validatePoi(poi)
}
// @ts-ignore
if (!util.nodeEnv) event.stopListener = JavaWrapper.methodToJava(terminate)

function logInfo (string, noChat = false) {
  util.logInfo(string, 'POI', noChat)
}

export {}