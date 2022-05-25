import { TextLines } from "../lib/textLines"

const fakePlayerRegex = /~BTLP[0-9a-z]{8} (\d+)/
const fakePlayerNumbers = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
let table
let h2d
let tickLoop
let effectList = []
let config = {
  x: 0, 
  y: 0
}

function onTick () {
  if (!World || !World.isWorldLoaded() || World.getTime() % 5 != 0) return
  effectList = []
  const players = World.getPlayers()
  // @ts-ignore
  for (const player of players) {
    parseLine(player)
  }
  table.lines = effectList
  return true
}

function parseLine (player: Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerListEntryHelper<any>) {
  if (!player || !World.isWorldLoaded()) return
  const playerName = player?.getName()
  if (!fakePlayerRegex.test(playerName)) return
  const [, number] = fakePlayerRegex.exec(playerName)
  if (!number || !fakePlayerNumbers.includes(number)) return
  let playerDisplayName
  try {
    playerDisplayName = player?.getDisplayText().getString()
  } catch {
    return
  }
  if (playerDisplayName == '') return
  playerDisplayName = playerDisplayName.trim()
  effectList.push(playerDisplayName)
}

function start (start: boolean = true) {
  if (h2d && start === false) {
    terminate()
    return
  } else if (h2d && start === true) {
    terminate()
  }
  config = getConfig()
  commander(false)
  h2d = Hud.createDraw2D()
  h2d.register()
  table = new TextLines(h2d, config.x, config.y, 1)
  table.lines = []
  tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(onTick))
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('drawEffects')
  command.intArg('x')
  command.intArg('y')
  command.executes(JavaWrapper.methodToJava(runCommand))
  command.register()
}

function runCommand (ctx) {
  config.x = ctx.getArg('x')
  config.y = ctx.getArg('y')
  writeConfig(config)
  start(true)
  return true
}

function getConfig () {
  let modifiedConfig = config
  if (FS.exists('./effectsConfig.json')) {
    try {
      const file = FS.open('./effectsConfig.json')
      const customConfig = file.read()
      modifiedConfig = JSON.parse(customConfig)
    } catch (e) {
      modifiedConfig = config
    }
  }
  return modifiedConfig
}

function writeConfig (config) {
  try {
    FS.open('./effectsConfig.json').write(JSON.stringify(config, null, 2))
    return true
  } catch (e) {
    return false
  }
}

function terminate () {
  JsMacros.off('Tick', tickLoop)
  commander(true)
  h2d.unregister()
  Hud.clearDraw2Ds()
}



start(true)
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)