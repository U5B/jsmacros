import { TextLines } from "../lib/textLines"

const fakePlayerRegex = /~BTLP[0-9a-z]{8} (\d+)/
const fakePlayerNumbers = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
let table
let h2d
let tickLoop
let effectList = []
let config = {
  x: 0, 
  y: 0,
  align: 0 // left shift
}

function onTick () {
  if (!World || !World.isWorldLoaded() || World.getTime() % 2 != 0) return
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
  table = new TextLines(h2d, config.x, config.y, config.align)
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
  command.wordArg('select')
    .literalArg('move')
      .intArg('x') // x pos
      .intArg('y') // y pos
      .wordArg('align').suggestMatching(['left', 'center', 'right']) // align
      .executes(JavaWrapper.methodToJava(runCommand))
  command.register()
}

function runCommand (ctx) {
  switch (ctx.getArg('select')){
    case 'config':
      configure(ctx)
      break
    default:
      configure(ctx)
      break
  }
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
  start(true)
  return true
}

const configPath = '../../config/effects.json'
function getConfig () {
  let modifiedConfig = config
  if (FS.exists(configPath)) {
    try {
      const file = FS.open(configPath)
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
    FS.open(configPath).write(JSON.stringify(config, null, 2))
    return true
  } catch (e) {
    return false
  }
}

function terminate () {
  JsMacros.off('Tick', tickLoop)
  commander(true)
  h2d.unregister()
}



start(true)
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
export {}