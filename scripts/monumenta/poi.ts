import { isConstructorDeclaration } from 'typescript'
import poiData from './data/pois.json'
let pois = {}
let poiSuggestions = []

const map = {
  'isles': 'isles',
  'isles-2': 'isles',
  'isles-3': 'isles',
  'valley': 'valley',
  'valley-2': 'valley',
  'valley-3': 'valley'
}

function makeSearchTerms () {
  for (const [poiName, poi] of Object.entries(poiData)) {
    let modified = poi
    pois[poi.name] = poi
    pois[poi.name].search = {
      name: poi.name
    }
    poiSuggestions.push(poi.name)
  }
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