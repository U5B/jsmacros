/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */

// Configuration Start
import { getConfig } from "./config"
// modes:
// 'espBlatant': esp for all
// 'espLegit': esp for all meets a wall
// 'persistBlatant': esp for one person
// 'persistLegit':  esp for one meets a wall and a reach limit
// 'raytraceBlatant': aim is required
// 'raytraceLegit': aim is required meets a wall and a reach limit
// 'custom': use default options in config.ts
// '': invalid
const mode = getConfig('persistLegit')
// Configuration End

const state = {
  tickLoop: undefined,
  started: false,
  glowingPlayers: [],
  selectedPlayer: ''
}

function rgbToDecimal (rgb = { r: 0, g: 0, b: 0 }) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  if (!World || !World.isWorldLoaded() || state.started === false) return
  try {
    // reset all players being affected by this
    if (mode.blatant.enabled === true) {
      state.glowingPlayers = []
      // Check all loaded players
      checkPlayers()
      if (mode.raytrace.enabled === true) highlightPlayerCursor()
    } else if (mode.raytrace.enabled === true) {
      highlightPlayerCursorHealth()
    } else {
      Chat.log('Mode is not mode. Please set one of the following modes: blatant or raytrace')
      stop()
    }
  } catch (e) {
    Chat.getLogger('usb').fatal(e)
    stop()
  }
  return true
}

function rayTraceEntity () {
  // @ts-ignore # DebugRenderer.getTargetedEntity()
  const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), mode.raytrace.reach)
  // @ts-ignore # Check if the result is empty
  if (result.isEmpty()) return false
  // @ts-ignore
  const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get())
  return entity
}

/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper<any>} entity
 */
function isPlayerVisible (entity) {
  if (!isPlayer(entity)) return null
  if (mode.raytrace.depth === false) return true
  if (entity.asLiving().isGlowing() === true) return true
  const javaEntity = entity.asLiving().getRaw()
  // @ts-ignore
  const result = Player.getPlayer().asLiving().getRaw().method_6057(javaEntity)
  return result
}

function highlightPlayerCursor () {
  const player = rayTraceEntity()
  if (!isPlayerVisible(player)) { // check needed since we don't use checkPlayer() here
    state.selectedPlayer = ''
    resetPlayers(true) // we want to ignore glowing players
    return false
  }
  const color = rgbToDecimal(mode.raytrace.color)
  player.setGlowing(true)
  player.setGlowingColor(color)
  state.selectedPlayer = player.getName()?.getString()
  resetPlayers(true)
  return true
}

function highlightPlayerCursorHealth () {
  const player = rayTraceEntity()
  const valid = checkPlayer(player)
  if (!valid) {
    if (mode.raytrace.persist === false) {
      state.selectedPlayer = ''
      resetPlayers(false)
      return false
    } else {
      checkPlayers()
      return true
    }
  } else {
    state.selectedPlayer = player.getName()?.getString()
    resetPlayers(true)
    return true
  }
}

function checkPlayers () {
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    const valid = checkPlayer(player)
    if (!valid) resetPlayer(player)
  }
}

// Check if a player has lost health and update their glowing status and color
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>} player
 */
function checkPlayer (player) {
  if (!isPlayerVisible(player)) return false // only accept players
  const name = player.getName()?.getString()
  if (mode.whitelist.enabled === true && mode.whitelist.players.includes(name) === false) return false
  if (mode.raytrace.enabled === true && state.selectedPlayer !== name) return false
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  const decimalColor = rgbToDecimal(color.color)
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
  state.glowingPlayers.push(name)
  return true
}

// Reset player to their previous glowing state
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>} player
 */
function resetPlayer (player) {
  if (!isPlayer(player)) return false // only accept players
  player.resetGlowing() // no more G L O W
  player.resetGlowingColor()
  return true
}

// This function should set all players to their previous glowing state
function resetPlayers (ignore = false) {
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    if (ignore === true) { // run check only if ignore is true
      const name = player.getName().getString()
      if (state.glowingPlayers.includes(name) === true) continue
      if (state.selectedPlayer === name) continue
    }
    resetPlayer(player)
  }
  return true
}

// determine the health color based on health decimal
// maybe in the future I multiply by 100 so I can Math.floor/Math.round values
/**
 * @param {Number} decimalHealth
 */
function determineColor (decimalHealth) {
  const color = { glow: false, color: mode.health.color.base }
  if (decimalHealth > mode.health.low) color.color = mode.health.color.good // good
  else if (decimalHealth <= mode.health.low && decimalHealth > mode.health.critical) color.color = mode.health.color.low // needs healing
  else if (decimalHealth <= mode.health.critical) color.color = mode.health.color.critical // needs healing now
  return color
}

function isPlayer (player) {
  if (!player) return false
  if (player.getType() === 'minecraft:player') {
    if (player.getName().getString() === Player.getPlayer().getName().getString()) return false // ignore self
    return true
  }
  return false
}

function start () {
  state.started = true
  if (!state.tickLoop) state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick)) // ignore if already started
  return true
}

function stop () {
  if (state.started === false) return
  try {
    // @ts-ignore # Typescript screams at me since event.serviceName doesn't exist on Events.BaseEvent
    JsMacros.getServiceManager().stopService(event.serviceName)
  } catch (e) {
    Chat.getLogger('usb').error(e)
  }
}

function terminate () {
  // cmd1.unregister()
  state.started = false
  if (state.tickLoop) JsMacros.off('Tick', state.tickLoop)
  resetPlayers(false)
  state.tickLoop = null
  return true
}

start()
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate)
