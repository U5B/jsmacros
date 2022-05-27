/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
import * as util from '../lib/util'
import { TextLines } from '../lib/textLines'
let healthTable
let h2d
let playerMap = {}
let mode
let started = false

function onTick (inputMode) {
  if (World && World.isWorldLoaded()) {
    mode = inputMode
    if (World.getTime() % 100 !== 0) return // every 5 seconds, check if a player has been unloaded
    if (started === false) startListeners()
    playerMap = {}
    const players = World.getLoadedPlayers()
    // @ts-ignore
    for (const player of players) {
      parseEntity(player)
    }
  }
  return true
}

function parseHealthChange (event) {
  const entity = event.entity
  parseEntity(entity)
  return true
}

function parseEntity (entity) {
  if (entity?.getType() !== 'minecraft:player') return
  const player = entity.asPlayer()
  const name = player.getName().getString()
  // if (name === Player.getPlayer().getName().getString()) return
  const currentHealth = Math.round(player.getHealth())
  let maxHealth = Math.round(player.getMaxHealth())
  if (maxHealth === 0) maxHealth = 0.001 // dividing by 0 is bad
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
  if (!healthTable) drawHealthStartup()
  healthTable.lines = [
    ...Object.entries(playerMap)
      // @ts-ignore # sort by health decimal
      .sort(([, a], [, b]) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
      // @ts-ignore # map to names
      .map(determineHealthColor)
  ]
  return true
}

function drawHealthStartup () {
  if (h2d) {
    h2d.unregister()
    return
  }
  if (healthTable) return healthTable
  h2d = Hud.createDraw2D()
  h2d.register()
  healthTable = new TextLines(h2d, 425, 30, 0)
  healthTable.lines = []
  return healthTable
}

const eventListeners = {
  tick: null,
  heal: null,
  damage: null
}

function startListeners () {
  if (eventListeners.heal || eventListeners.damage || started) return
  started = true
  eventListeners.heal = JsMacros.on('EntityHealed', JavaWrapper.methodToJava(parseHealthChange))
  eventListeners.damage = JsMacros.on('EntityDamaged', JavaWrapper.methodToJava(parseHealthChange))
}

function terminate () {
  JsMacros.off('Tick', eventListeners.tick)
  JsMacros.off('EntityHealed', eventListeners.heal)
  JsMacros.off('EntityDamaged', eventListeners.damage)
  drawHealthStartup()
  started = false
  return true
}

// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)
export { terminate, onTick }
