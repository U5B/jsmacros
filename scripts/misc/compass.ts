// which way is north?
import * as xaero from '../lib/xaero'
/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
function getCompass () {
  // @ts-ignore
  const position = World.getRespawnPos()
  const pos = { x: position.getX(), y: position.getY(), z: position.getZ() }
  return pos
}

function onKeyPress (event: Events.Key) {
  if (World && World.isWorldLoaded()) {
    if (event.key === 'key.mouse.left' && event.action === 1) { // trigger on attack press
      const item = Player.getPlayer().getMainHand().getItemID() // get id of currently held item
      switch (item) {
        case 'minecraft:compass': { // if it is a compass, make a special string
          const coord = getCompass()
          createCompass(coord.x, coord.y, coord.z)
          break
        }
      }
      return true
    }
  }
  return false
}
function runCommand (ctx) {
  const x = ctx.getArg('x')
  const y = ctx.getArg('y')
  const z = ctx.getArg('z')
  if (x && y && z) createCompass(x, y, z)
  else Chat.log('§7[§aCompass§7]§r Not enough arguments. Try /compass <x> <y> <z>§r')
  return true
}

function createCompass (x: number, y: number, z: number) {
  const builder = xaero.createCoordinateBuilder({x, y, z}, 'Compass', 'Compass')
  Chat.log(builder.build())
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('compass')
  command.intArg('x')
  command.intArg('y')
  command.intArg('z')
  command.executes(JavaWrapper.methodToJavaAsync(runCommand))
  command.register()
}

commander(false)
Chat.log('§7[§aCompass§7]§r Started. Left click with a compass to begin.')
const listener = JsMacros.on('Key', JavaWrapper.methodToJavaAsync(onKeyPress))

function terminate () {
  JsMacros.off('Key', listener)
  commander(true)
  return true
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
export {}
