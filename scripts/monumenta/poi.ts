/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */
import poiData from './data/pois.json'
const poiSuggestions = []
// @ts-ignore
let nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)

function makeSearchTerms () {
  for (const [poiName, poi] of Object.entries(poiData)) {
    poiSuggestions.push(poi.name)
  }
}

function searchPoi (input) {
  const response = []
  for (const [name, content] of Object.entries(poiData)) { // exact match 'Air Shrine'
    if (name === input) return content
  }
  for (const [name, content] of Object.entries(poiData)) { // tag match ['air', 'shrine']
    const tags = trimString(name).split(' ')
    if (tags.includes(trimString(input))) response.push(content)
  }
  if (response.length === 0) { // if there is already a response, ignore it
    for (const [name, content] of Object.entries(poiData)) { // fuzzy match 'airshrine'
      if (cleanString(name).includes(cleanString(input))) response.push(content)
    }
  }
  return response
}

function runCommand (ctx) {
  const poiInput = ctx.getArg('poi')
  return validatePoi(poiInput)
}

function validatePoi (input) {
  if (!input || input.trim().length <= 3) {
    debug(`'${input}': Invalid input.`)
    return false
  }
  const response = searchPoi(input)
  let value = true
  debug(response)
  if (Array.isArray(response) && response.length > 0) {
    for (const rep of response) {
      responsePoi(rep)
    }
  } else if (response && !Array.isArray(response)) {
    value = responsePoi(response)
  }
  if (value === false || !response || (Array.isArray(response) && response.length === 0)) {
    debug(`'${input}': No POI found.`)
  }
}

function responsePoi (response) {
  if (response.coordinates) {
    debug(`'${response.name}': (${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})`)
  } else if (response && !response.coordinates) {
    debug(`'${response.name}': POI is missing coordinates...`)
    return false
  } else {
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
function commander (destroy = false) {
  if (nodeEnv) return false
  if (command) {
    command.unregister()
    command = null
    if (destroy === true) return true
  }
  command = Chat.createCommandBuilder('poi')
  command.greedyStringArg('poi').suggestMatching(poiSuggestions)
  command.executes(JavaWrapper.methodToJava(runCommand))
  command.register()
}

function cleanString (str) {
  return str
    .replaceAll(/'/g, '')
    .replaceAll(/\n/g, '')
    .replaceAll(/ /g, '')
    .trim()
    .toLowerCase()
}

function trimString (str) {
  return str
    .trim()
    .toLowerCase()
}

start()
if (nodeEnv) {
  // @ts-ignore
  const args = process.argv.slice(2)
  const poi = args.join(' ')
  debug(poi)
  validatePoi(poi)
}
// @ts-ignore
if (!nodeEnv) event.stopListener = JavaWrapper.methodToJava(terminate)

function logInfo (string) {
  if (!nodeEnv) {
    Chat.getLogger('usb').warn(`[POI] ${string}`)
    Chat.log(`§7[§aPOI§7] §e${string}`)
  } else {
    debug(`[POI]: ${string}`)
  }
}

function debug (input) { // node debug
  // @ts-ignore
  if (nodeEnv) {
    // @ts-ignore
    console.log(input)
  } else {
    Chat.log(input)
  }
}
