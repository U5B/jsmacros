/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */

// Configuration Start
import { getConfig } from './config'
// modes:
// 'espBlatant': esp for all
// 'espLegit': esp for all meets a wall
// 'persistBlatant': esp for one person
// 'persistLegit':  esp for one meets a wall and a reach limit
// 'raytraceBlatant': aim is required
// 'raytraceLegit': aim is required meets a wall and a reach limit
// 'custom': use default options in config.ts
// '': invalid
const mode = getConfig('espLegit')
// Configuration End

const state = {
  tickLoop: undefined,
  started: false,
  running: false,
  glowingPlayers: [],
  selectedPlayer: ''
}

function rgbToDecimal (rgb = { r: 0, g: 0, b: 0 }) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  try {
    if (World && World.isWorldLoaded() && state.started === true) {
      if (state.running === false) {
        logInfo('Started!')
        Chat.getLogger('usb').warn('[GlowHealth] Service is now running...')
        state.running = true
      }
    } else return false
    if (mode.blatant.enabled === true) {
      state.glowingPlayers = [] // reset all players being affected by this
      // Check all loaded players
      checkPlayers()
      if (mode.raytrace.enabled === true) highlightPlayerCursor()
    } else if (mode.raytrace.enabled === true) {
      highlightPlayerCursorHealth()
    }
    return true
  } catch (e) {
    stop(e)
    return false
  }
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
  if (isPlayerGlowing(entity) === true) return true
  const javaEntity = entity.asLiving().getRaw()
  // @ts-ignore
  const result = Player.getPlayer().asLiving().getRaw().method_6057(javaEntity)
  return result
}

function isPlayerGlowing (player) {
  if (mode.raytrace.ignoreGlowing === false) return false
  const forceGlowing = player.isGlowing()
  player.resetGlowing()
  const value = player.isGlowing()
  player.setGlowing(forceGlowing)
  return value
}

function highlightPlayerCursor () {
  const player = rayTraceEntity()
  if (!isPlayerVisible(player)) { // check needed since we don't use checkPlayer() here
    state.selectedPlayer = ''
    resetPlayers(true, false) // we want to ignore glowing players
    return false
  }
  const color = rgbToDecimal(mode.raytrace.color)
  player.setGlowing(true)
  player.setGlowingColor(color)
  state.selectedPlayer = player.getName()?.getString()
  resetPlayers(true, true)
  return true
}

function highlightPlayerCursorHealth () {
  const player = rayTraceEntity()
  const valid = checkPlayer(player)
  if (!valid) {
    if (mode.raytrace.persist === true) {
      checkPlayers()
      return true
    } else if (mode.raytrace.persist === false) {
      state.selectedPlayer = ''
      resetPlayers(false, false)
      return false
    }
  } else {
    state.selectedPlayer = player.getName()?.getString()
    resetPlayers(false, true)
    return true
  }
}

function checkPlayers () {
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    let valid = false
    if (mode.blatant.enabled === true || (mode.raytrace.enabled === true && mode.raytrace.persist === true && state.selectedPlayer === player.getName()?.getString())) valid = checkPlayer(player)
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
function resetPlayers (ignoreGlowing = false, ignoreSelected = false) {
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    if ((ignoreGlowing || ignoreSelected) === true) { // run check only if ignore is true
      const name = player.getName().getString()
      if (ignoreSelected && state.selectedPlayer === name) continue
      if (ignoreGlowing && state.glowingPlayers.includes(name) === true) continue
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
  Chat.getLogger('usb').warn('[GlowHealth] Starting service...')
  state.started = true
  if (!state.tickLoop) state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick)) // ignore if already started
  return true
}

function stop (error) {
  if (state.started === false) return
  Chat.getLogger('usb').fatal('[GlowHealth] Error:', error)
  terminate()
}

function terminate () {
  logInfo('Stopped!')
  Chat.getLogger('usb').fatal('[GlowHealth] Stopping service...')
  // cmd1.unregister()
  state.started = false
  state.running = false
  state.glowingPlayers = []
  state.selectedPlayer = ''
  if (state.tickLoop) JsMacros.off('Tick', state.tickLoop)
  if (World && World.isWorldLoaded()) resetPlayers()
  state.tickLoop = null
  return true
}

function logInfo (string) {
  Chat.log(`§7[§aGlowHealth§7] §e${string}`)
}

start()
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate)
