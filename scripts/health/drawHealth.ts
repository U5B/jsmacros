/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
import * as util from '../lib/util'
import { TextLines } from '../lib/textLines'
let healthTable
let h2d
let playerMap = {}
let mode
let started = false

function onTick (inputMode) {
  mode = inputMode
  if (World.getTime() % 20 !== 0) return // every second, check if a player has been unloaded
  if (started === false) {
    startListeners()
    drawHealthStartup()
  } else if (state.x !== mode.draw.x || state.y !== mode.draw.y || state.align !== mode.draw.align) {
    drawHealthStartup()
  }
  healthTable.lines = []
  playerMap = {}
  const players = World.getLoadedPlayers()
  // @ts-ignore
  for (const player of players) {
    parseEntity(player)
  }
  return true
}

function parseHealthChange (event) {
  const entity = event.entity
  parseEntity(entity)
  return true
}

function parseEntity (entity) {
  if (!util.isPlayer(entity)) return
  const player = entity.asPlayer()
  const name = player.getName().getString()
  // if (name === Player.getPlayer().getName().getString()) return
  const currentHealth = Math.round(player.getHealth())
  let maxHealth = Math.round(player.getMaxHealth())
  if (maxHealth === 0) maxHealth = 1 // dividing by 0 is bad
  playerMap[name] = {
    hp: currentHealth,
    maxHp: maxHealth
  }
  drawHealthOverlay()
}

function determineHealthColor ([name, player]) {
  const colorObject = util.determineColor(player.hp / player.maxHp, mode.health)
  const [r, g ,b] = colorObject.rgb
  const builder = Chat.createTextBuilder()
  builder.append(`${player.hp}/${player.maxHp} ${name}`)
  builder.withColor(r, g, b)
  const message = builder.build()
  return message
}

function drawHealthOverlay () {
  healthTable.lines = [
    ...Object.entries(playerMap)
      // @ts-ignore # sort by health decimal
      .sort(([, a], [, b]) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
      // @ts-ignore # map to names
      .map(determineHealthColor)
  ]
  return true
}
const state = {
  x: 0,
  y: 0,
  align: 0
}
function drawHealthStartup (stop = false) {
  if (h2d) h2d.unregister()
  if (stop === true) return
  h2d = Hud.createDraw2D()
  h2d.register()
  healthTable = new TextLines(h2d, mode.draw.x, mode.draw.y, mode.draw.align) // hardcoded is bad
  state.x = mode.draw.x
  state.y = mode.draw.y
  state.align = mode.draw.align
  healthTable.lines = []
  return healthTable
}

const eventListeners = {
  heal: null,
  damage: null
}

function startListeners () {
  if (eventListeners.heal || eventListeners.damage || started) return
  started = true
  eventListeners.heal = JsMacros.on('EntityHealed', JavaWrapper.methodToJavaAsync(parseHealthChange))
  eventListeners.damage = JsMacros.on('EntityDamaged', JavaWrapper.methodToJavaAsync(parseHealthChange))
}

function terminate () {
  if (started === false) return
  healthTable.lines = []
  JsMacros.off('EntityHealed', eventListeners.heal)
  JsMacros.off('EntityDamaged', eventListeners.damage)
  eventListeners.heal = null
  eventListeners.damage = null
  drawHealthStartup(true)
  started = false
  return true
}

// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
export { terminate, onTick, drawHealthStartup }
