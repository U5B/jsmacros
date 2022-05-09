import advancementFile from './advancement.json'
let started = false
const coordinateRegex = /^x=(-?\d{1,5})y=(-?\d{1,5})z=(-?\d{1,5})$/
const poiTitleRegex = /discoverthe(.+)/
const dungeonTitleRegex = /found(.+)/
const dungeonFriendlyTitleRegex = /Found (.+)/
const pois = {}

function generatePois () {
  for (const advancement of Object.values(advancementFile)) {
    // @ts-ignore
    if (advancement.id.startsWith('monumenta:pois')) parseAdvancement(advancement, { type: 'poi' })
    // @ts-ignore
    if (advancement.id.startsWith('monumenta:dungeons')) parseAdvancement(advancement, { type: 'dungeon' })
  }
  started = true
}

function fetchPoi (input) {
  const string = cleanString(input)
  for (const [name, content] of Object.entries(pois)) {
    if (name.includes(string)) return content
  }
  return null
}

function printPoi (input) {
  const poi = fetchPoi(input)
  if (!poi) return Chat.log(`${input}: No POI found.`)
  // @ts-ignore
  return Chat.log(`${poi.friendlyName}: (${poi.x}, ${poi.y}, ${poi.z})`)
}

function parseAdvancement (advancement, options) {
  const data = advancement?.display
  if (!data) return
  const title = data.title.text
  let description = data.description
  if (!description) return null
  if (!Array.isArray(description)) description = [description]
  switch (options.type) {
    case 'poi': {
      parsePoi(title, description)
      break
    }
    case 'dungeon': {
      parseDungeon(title, description)
      break
    }
  }
}

function parsePoi (title, description) {
  const poiData = { friendlyName: '', name: '', x: '0', y: '0', z: '0' }
  poiData.friendlyName = title
  poiData.name = cleanString(title)
  for (const line of description) {
    const text = cleanString(line.text)
    if (coordinateRegex.test(text)) {
      const coord = parseCoordinates(text)
      poiData.x = coord.x
      poiData.y = coord.y
      poiData.z = coord.z
    }
  }
  if (!((poiData.x && poiData.y && poiData.z) === '0')) pois[poiData.name] = poiData
}

function parseDungeon (title, description) {
  const dungeonData = { friendlyName: '', name: '', x: '0', y: '0', z: '0' }
  if (dungeonFriendlyTitleRegex.test(title)) dungeonData.friendlyName = parseFriendlyDungeonTitle(title)
  title = cleanString(title)
  if (dungeonTitleRegex.test(title)) dungeonData.name = parseDungeonTitle(title)
  for (const line of description) {
    const text = cleanString(line.text)
    if (coordinateRegex.test(text)) {
      const coord = parseCoordinates(text)
      dungeonData.x = coord.x
      dungeonData.y = coord.y
      dungeonData.z = coord.z
    }
  }
  if (!((dungeonData.x && dungeonData.y && dungeonData.z) === '0')) pois[dungeonData.name] = dungeonData
}

function parsePoiTitle (text) {
  const [, title] = poiTitleRegex.exec(text)
  return title
}

function parseDungeonTitle (text) {
  const [, title] = dungeonTitleRegex.exec(text)
  return title
}

function parseFriendlyDungeonTitle (text) {
  const [, title] = dungeonFriendlyTitleRegex.exec(text)
  return title
}

function parseCoordinates (text) {
  const [, x, y, z] = coordinateRegex.exec(text)
  return { x, y, z }
}

function cleanString (str) {
  return str
    .replaceAll(/'/g, '')
    .replaceAll(/\n/g, '')
    .replaceAll(/ /g, '')
    .trim()
    .toLowerCase()
}

const command = Chat.createCommandBuilder('poi')
command
  .greedyStringArg('poi')
  // @ts-ignore
  .executes(JavaWrapper.methodToJava((ctx) => {
    printPoi(ctx.getArg('poi'))
    return true
  }))
  .register()

export { fetchPoi, printPoi }
