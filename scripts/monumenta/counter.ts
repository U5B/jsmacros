import * as util from '../lib/util'
import { TextLines } from '../lib/textLines'

const chestPrefix = '# of Chests: '
const spawnerPrefix = '# of Spawners: '

const regex = {
  addChest: /^\+1 Chest added to lootroom\.$/,
  bmSpawnerCount: /^Spawners broken: (\d+)\/(\d+)$/,
  addSpawner: /^\+6 seconds!$/
}

let config = {
  x: 0,
  y: 0,
  align: 0,
}
const counter = {
  chest: 0,
  spawner: 0
}

let h2d
let table
const eventListeners = {
  title: null,
  dimension: null,
}

function onTitle (event: Events.Title) {
  context.releaseLock()
  if (event.type === 'ACTIONBAR') {
    const message = event.message.getStringStripFormatting().trim()
    switch (true) {
      case regex.addChest.test(message): {
        counter.chest++
        break
      }
      case regex.addSpawner.test(message): {
        counter.spawner++
        break
      }
      case regex.bmSpawnerCount.test(message): {
        const [broken, total] = regex.bmSpawnerCount.exec(message)
        counter.spawner = parseInt(broken)
        break
      }
    }
    table.lines = [
      `${chestPrefix}${counter.chest}`,
      `${spawnerPrefix}${counter.spawner}`
    ]
  }
  return true
}

function resetCounter () {
  counter.chest = 0
  counter.spawner = 0
  table.lines = [
    `${chestPrefix}${counter.chest}`,
    `${spawnerPrefix}${counter.spawner}`
  ]
  return true
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
  table.lines = [
    `${chestPrefix}${counter.chest}`,
    `${spawnerPrefix}${counter.spawner}`
  ]
  eventListeners.title = JsMacros.on('Title', JavaWrapper.methodToJavaAsync(onTitle))
  eventListeners.dimension = JsMacros.on('JoinedServer', JavaWrapper.methodToJavaAsync(resetCounter))
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('lootrun')
  command
    .literalArg('move')
    .intArg('x') // x pos
    .intArg('y') // y pos
    .wordArg('align').suggestMatching(['left', 'center', 'right']) // align
    .executes(JavaWrapper.methodToJava(configure))
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
  const success = util.readConfig('lootrun')
  if (!success) return modifiedConfig
  modifiedConfig = success
  return success
}

function writeConfig (config) {
  util.writeConfig('lootrun', config)
}

function terminate (restart = false) {
  commander(true)
  h2d.unregister()
  if (restart === false) {
    logInfo('Stopped!')
  }
  JsMacros.off('Title', eventListeners.title)
  JsMacros.off('DimensionChange', eventListeners.dimension)
  eventListeners.title = null
}

function logInfo (string, noChat = false) {
  util.logInfo(string, 'Lootrun', noChat)
}

start(false)
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)