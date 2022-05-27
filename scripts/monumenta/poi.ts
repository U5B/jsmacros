/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
import * as util from '../lib/util'
import poiData from './data/pois.json'
const poiSuggestions = []

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

function responsePoi (input, response) {
  if (!response) {
    logInfo(`'${input}': No POI found.`)
    return false
  } else if (response && response.coordinates && response.coordinates.x && response.coordinates.y && response.coordinates.z) {
    if (!util.nodeEnv) {
      const builder = Chat.createTextBuilder()
      builder.append(`§7[§aPOI§7]§r '${response.name}': `)
      const coordinates = `(${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})`
      builder.append(coordinates)
      builder.withColor(0xa)
      builder.append(' [COPY]')
      builder.withColor(0xc)
      builder.withClickEvent('copy_to_clipboard', coordinates)
      builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'))
      Chat.log(builder.build())
    }
    logInfo(`'${response.name}': §a(${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})§r`, true)
  } else if (response && response.coordinates && !response.coordinates.x && !response.coordinates.y && !response.coordinates.z) {
    logInfo(`'${response.name}': POI is missing coordinates...`)
    return false
  } else {
    logInfo(`'${input}': No POI found.`)
    return false
  }
  return true
}

function start () {
  logInfo('Starting service...')
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
  command.executes(JavaWrapper.methodToJava(runCommand))
  command.register()
}

function runCommand (ctx) {
  const poiInput = ctx.getArg('arg1')
  return validatePoi(poiInput)
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