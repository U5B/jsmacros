/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java, FS, Hud */
import * as util from "../lib/util"
import { terminate as drawHealthStop, onTick as drawHealthTick } from "./drawHealth"


// Configuration Start
import { getConfig, getModes, writeCustomConfig } from "./config"
let mode = getConfig('custom')
// Configuration End

const state = {
  tickLoop: undefined,
  started: false,
  running: false,
  glowingPlayers: [],
  nearbyPlayers: [],
  selectedPlayer: ''
}

function currentNearbyPlayers () {
  return state.nearbyPlayers
}

function currentGlowingPlayers () {
  return state.glowingPlayers
}

function onTick () {
  if (mode.enabled === false) return
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
    if (mode.draw.enabled === true) drawHealthTick(mode)
  return true
  } catch (e) {
    stop(e)
  }
}

function isPlayerVisible (entity:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!isPlayer(entity)) return null
  if (mode.raytrace.depth === false) return true
  if (isPlayerGlowing(entity) === true) return true
  const javaEntity = entity.asLiving().getRaw()
  // @ts-ignore # LivingEntity.canSee
  const result = Player.getPlayer().asLiving().getRaw().method_6057(javaEntity)
  return result
}

function isPlayerGlowing (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (mode.raytrace.ignoreGlowing === false) return false
  const forceGlowing = player.isGlowing()
  player.resetGlowing()
  const value = player.isGlowing()
  player.setGlowing(forceGlowing)
  return value
}

function highlightPlayerCursor () {
  const player = util.rayTraceEntity(mode.raytrace.reach)
  if (!isPlayerVisible(player)) { // check needed since we don't use checkPlayer() here
    state.selectedPlayer = ''
    resetPlayers(true, false) // we want to ignore glowing players
    return false
  }
  const color = mode.raytrace.color
  player.setGlowing(true)
  player.setGlowingColor(color)
  state.selectedPlayer = player.getName()?.getString()
  resetPlayers(true, true)
  return true
}

function highlightPlayerCursorHealth () {
  const player = util.rayTraceEntity(mode.raytrace.reach)
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
  state.nearbyPlayers = []
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    let valid = false
    const name = player.getName()?.getString()
    state.nearbyPlayers.push(player.getName()?.getString())
    if (mode.blatant.enabled === true || (mode.raytrace.enabled === true && mode.raytrace.persist === true && state.selectedPlayer === name)) valid = checkPlayer(player)
    if (!valid) resetPlayer(player)
  }
}

// Check if a player has lost health and update their glowing status and color
function checkPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!isPlayerVisible(player)) return false // only accept players
  const name = player.getName()?.getString()
  if (mode.whitelist.enabled === true && mode.whitelist.players.includes(name) === false) return false
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  const decimalColor = color.color
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
  state.glowingPlayers.push(name)
  return true
}

// Reset player to their previous glowing state
function resetPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
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
function determineColor (decimalHealth:Number) {
  const color = { glow: false, color: mode.health.color.base }
  if (decimalHealth > mode.health.low) color.color = mode.health.color.good // good
  else if (decimalHealth <= mode.health.low && decimalHealth > mode.health.critical) color.color = mode.health.color.low // needs healing
  else if (decimalHealth <= mode.health.critical) color.color = mode.health.color.critical // needs healing now
  return color
}

function isPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!player) return false
  if (player.getType() === 'minecraft:player') {
    if (player.getName().getString() === Player.getPlayer().getName().getString()) return false // ignore self
    return true
  }
  return false
}

function start () {
  Chat.getLogger('usb').warn('[GlowHealth] Starting service...')
  commander(false)
  state.started = true
  if (!state.tickLoop) state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(onTick)) // ignore if already started
  return true
}

function stop (error) {
  if (state.started === false) return
  Chat.getLogger('usb').fatal(error)
  terminate()
  throw error
}

function terminate () {
  logInfo('Stopped!')
  Chat.getLogger('usb').fatal('[GlowHealth] Stopping service...')
  commander(true)
  drawHealthStop()
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
  Chat.log(`§7[§aGlowHealth§7]§r ${string}`)
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('glowhealth')
  command
    .literalArg('preset')
    .greedyStringArg('config').suggestMatching(getModes())
    .executes(JavaWrapper.methodToJava(cmdPreset))
  .or(1)
    .literalArg('toggle')
    .booleanArg('enabled')
    .executes(JavaWrapper.methodToJava(cmdToggle))
  .or(1)
    .literalArg('whitelist')
      .literalArg('add')
      .wordArg('player')
      .executes(JavaWrapper.methodToJava(cmdWhitelistAdd))
    .or(2)
      .literalArg('remove')
      .wordArg('player')
      .executes(JavaWrapper.methodToJava(cmdWhitelistRemove))
    .or(2)
      .literalArg('list')
      .executes(JavaWrapper.methodToJava(cmdWhitelistList))
    .or(2)
      .literalArg('clear')
      .executes(JavaWrapper.methodToJava(cmdWhitelistClear))
    .or(2)
      .literalArg('toggle')
      .booleanArg('enabled')
      .executes(JavaWrapper.methodToJava(cmdWhitelistToggle))


  command.register()
}

function cmdPreset (ctx) {
  const configOption = ctx.getArg('config')
  mode = getConfig(configOption)
  logInfo(`Running with config: '${mode.name}'`)
  return true
}

function cmdToggle (ctx) {
  const enabled = ctx.getArg('enabled')
  mode = getConfig()
  mode.enabled = enabled
  logInfo(`Glow is now ${enabled ? 'enabled' : 'disabled'}`)
  writeCustomConfig(mode)
  return true
}

function cmdWhitelistAdd (ctx) {
  const player = ctx.getArg('player')
  mode = getConfig()
  mode.whitelist.players.push(player)
  writeCustomConfig(mode)
  return true
}

function cmdWhitelistRemove (ctx) {
  const player = ctx.getArg('player')
  mode = getConfig()
  mode.whitelist.players = mode.whitelist.players.filter(p => p !== player)
  writeCustomConfig(mode)
  return true
}

function cmdWhitelistClear () {
  mode = getConfig()
  mode.whitelist.players = []
  writeCustomConfig(mode)
  return true
}

function cmdWhitelistList () {
  mode = getConfig()
  logInfo(`Whitelisted: [${mode.whitelist.players}]`)
  return true
}

function cmdWhitelistToggle (ctx) {
  const boolean = ctx.getArg('enabled')
  mode = getConfig()
  mode.whitelist.enabled = boolean
  writeCustomConfig(mode)
  return true
}

start()
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate)
export {}
