/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */
import poiData from './data/pois.json'
const pois = {}
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
    pois[poi.name] = poi
    pois[poi.name].search = {
      name: poi.name
    }
    poiSuggestions.push(poi.name)
  }
}

function handleSuggest (ctx) {
  Chat.log(ctx)
  return true
}

function runCommand (ctx) {
  Chat.log(ctx)
  return true
}

makeSearchTerms()
debug(poiSuggestions)

function debug (input) { // node debug
  // @ts-ignore
  if ((typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)) {
    // @ts-ignore
    console.log(input)
  }
}
command.executes(JavaWrapper.methodToJava(runCommand))
command.suggest(JavaWrapper.methodToJava(handleSuggest))
command.register()
