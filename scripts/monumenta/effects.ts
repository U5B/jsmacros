// custom drugs from Monumenta are my favorite
import { TextLines } from "../lib/textLines"
import { defaults } from "../lib/config"
import * as util from "../lib/util"

let started = false
const fakePlayerRegex = /~BTLP[0-9a-z]{8} (\d+)/
const fakePlayerNumbers = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
let table
let h2d
let listener
let effectList = []
let config = defaults.meffects

function onTick () {
  context.releaseLock()
  if (!World || !World.isWorldLoaded() || World.getTime() % 10 != 0) return
  else if (started === false) {
    logInfo(`Started! Type /meffects help for more info.`)
    started = true
  } 
  effectList = []
  const players = World.getPlayers()
  if (players == null) return
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
  let [r, g, b] = [255, 255, 255]
  if (playerDisplayName.startsWith('+')) [r, g, b] = [0, 255, 0] // green
  else if (playerDisplayName.startsWith('-')) [r, g, b] = [255, 0, 0] // red
  else [r, g, b] = [255, 255, 0] // yellow
  const builder = Chat.createTextBuilder()
  builder.append(playerDisplayName)
  builder.withColor(r, g, b)
  effectList.push(builder.build())
}

function start (start: boolean = true) {
  if (h2d && start === false) {
    terminate(true)
    return
  } else if (h2d && start === true) {
    terminate(true)
  }
  config = getConfig()
  writeConfig(config)
  commander(false)
  h2d = Hud.createDraw2D()
  h2d.register()
  table = new TextLines(h2d, config.x, config.y, config.align)
  table.lines = []
  listener = JsMacros.on('Tick', JavaWrapper.methodToJavaAsync(onTick))
}

function help () {
  logInfo(`Usage:
Move the effects overlay:
/meffects move <x> <y> <align>
Display this help menu:
/meffects help`)
  return true
}
let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('meffects')
  command
    .literalArg('move')
    .intArg('x') // x pos
    .intArg('y') // y pos
    .wordArg('align').suggestMatching(['left', 'center', 'right']) // align
    .executes(JavaWrapper.methodToJava(configure))
  .or(1)
    .literalArg('help')
    .executes(JavaWrapper.methodToJava(help))
  command.register()
}

function configure (ctx) {
  config.x = ctx.getArg('x')
  config.y = ctx.getArg('y')
  let align = ctx.getArg('align')
  switch (align) {
    case 'left':
      config.align = 0
      break
    case 'center':
      config.align = 0.5
      break
    case 'right':
      config.align = 1
      break
    default:
      config.align = 0
      break
  }
  writeConfig(config)
  logInfo(`Effects configured: x: ${config.x}, y: ${config.y}, align: ${config.align}`)
  start(true)
  return true
}

function getConfig () {
  let modifiedConfig = config
  const success = util.readConfig('effects')
  if (!success) return modifiedConfig
  modifiedConfig = success
  return success
}

function writeConfig (config) {
  util.writeConfig('effects', config)
}

function terminate (restart = false) {
  JsMacros.off('Tick', listener)
  commander(true)
  h2d.unregister()
  if (restart === false) {
    started = false
    logInfo('Stopped!')
  }
}

function logInfo (string, noChat = false) {
  util.logInfo(string, 'MEffects', noChat)
}

start(true)
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
export {}