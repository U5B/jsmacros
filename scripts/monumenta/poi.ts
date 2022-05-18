/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */
import poiData from './data/pois.json'
const poiSuggestions = []

const map = {
  isles: 'isles',
  'isles-2': 'isles',
  'isles-3': 'isles',
  valley: 'valley',
  'valley-2': 'valley',
  'valley-3': 'valley'
}

const command = Chat.createCommandBuilder('poi')

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
  for (const [name, content] of Object.entries(poiData)) { // fuzzy match 'airshrine'
    if (cleanString(name) === cleanString(input)) return content
  }
  for (const [name, content] of Object.entries(poiData)) { // tag match ['air', 'shrine']
    const tags = trimString(name).split(' ')
    if (tags.includes(trimString(input))) response.push(content)
  }
  return response
}

function runCommand (ctx) {
  const poiInput = ctx.getArg('poi')
  const response = searchPoi(poiInput)
  Chat.log(response)
  if (Array.isArray(response)) {
    for (const rep of response) {
      if (rep.coordinates) {
        Chat.log(`${rep.name} in ${rep.shard}: (${rep.coordinates.x}, ${rep.coordinates.y}, ${rep.coordinates.z})`)
      } else if (rep && !rep.coordinates) {
        Chat.log(`${rep.name}: POI is missing coordinates...`)
      } else {
        continue
      }
    }
  } else if (response.coordinates) {
    // @ts-ignore
    Chat.log(`${response.name} in ${response.shard}: (${response.coordinates.x}, ${response.coordinates.y}, ${response.coordinates.z})`)
  } else if (response && !response.coordinates) {
    Chat.log(`${response.name}: POI is missing coordinates...`)
    return false
  } else {
    Chat.log(`${poiInput}: No POI found.`)
    return false
  }
  return true
}

function start () {
  logInfo('Starting service...')
  Chat.getLogger('usb').warn('[POI] Starting service...')
  makeSearchTerms()
  command.greedyStringArg('poi').suggestMatching(poiSuggestions)
  command.executes(JavaWrapper.methodToJava(runCommand))
  command.register()
  return true
}

function terminate () {
  logInfo('Stopping service...')
  Chat.getLogger('usb').fatal('[POI] Stopping service...')
  command.unregister()
  return true
}

function logInfo (string) {
  Chat.log(`§7[§aPOI§7] §e${string}`)
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
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
function debug (input) { // node debug
  // @ts-ignore
  if ((typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)) {
    // @ts-ignore
    console.log(input)
  }
}
