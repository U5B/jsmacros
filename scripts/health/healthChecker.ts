/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */
// Configuration Start
const config = { // one of these should be on
  blatant: false,
  whitelist: false,
  whitelisted: [],
  raytrace: true,
  raytraceRange: 30 // Hallowed Beam reach
} // eslint-disable-line prefer-const

// Glowing colors based on health
const criticalHealthColor = { r: 255, g: 0, b: 0 } // red
const lowHealthColor = { r: 255, g: 255, b: 0 } // yellow
const goodHealthColor = { r: 0, g: 255, b: 0 } // green
const resetColor = { r: 255, g: 255, b: 255 } // white
const highlightColor = { r: 255, g: 165, b: 0 } // orange

// Max health is usually 20hp. 1 heart = 2hp
// Hallowed Beam is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
// Hand of Light is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
const goodHealthPercentage = 0.7 // health is 70%
const lowHealthPercentage = 0.45 // health is 40%
// Configuration End

let tickLoop
let affectedPlayers = []
let highlightedPlayer = ''

function rgbToDecimal (rgb = { r: 0, g: 0, b: 0 }) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  try {
    // reset all players being affected by this
    if (config.blatant === true) {
      affectedPlayers = []
      // Check all loaded players
      checkPlayers()
      if (config.raytrace === true) highlightPlayerCursor()
    } else if (config.raytrace === true) {
      // const entity = Player.rayTraceEntity() // infinite range possible?
      highlightPlayerCursorHealth()
    } else {
      Chat.log('Mode is not set. Please set one of the following modes: blatant or raytrace')
      stop()
    }
  } catch (e) {
    Chat.getLogger('usb').error(e)
    stop()
  }
  return true
}

function rayTraceEntity () {
  // @ts-ignore # DebugRenderer.getTargetedEntity()
  const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), config.raytraceRange)
  // @ts-ignore # Check if the result is empty
  if (result.isEmpty()) return false
  // @ts-ignore
  const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get())
  return entity
}

function highlightPlayerCursor () {
  const player = rayTraceEntity()
  if (!isPlayer(player)) {
    highlightedPlayer = ''
    resetPlayers(true)
    return false // only accept players
  }
  const color = rgbToDecimal(highlightColor)
  player.setGlowing(true)
  player.setGlowingColor(color)
  highlightedPlayer = player.getName()?.getString()
  resetPlayers(true)
  return true
}
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper<any>} entity
 */
function highlightPlayerCursorHealth () {
  const entity = rayTraceEntity()
  if (!isPlayer(entity)) return checkPlayers() // only accept players
  affectedPlayers = []
  const player = entity.asPlayer() // Typescript please stop screaming at me
  const newPlayer = checkPlayer(entity)
  if (newPlayer === true) { // we only reset it if raytrace switched to a different player
    resetPlayers(true)
    return true
  }
  return false
}

function checkPlayers () {
  // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
  for (const player of World.getLoadedPlayers()) {
    const name = player.getName()?.getString()
    if (!name) continue
    if (config.blatant === true) {
      checkPlayer(player)
    } else if (config.raytrace === true && affectedPlayers.includes(name) === true) {
      checkPlayer(player)
    }
  }
}

// Check if a player has lost health and update their glowing status and color
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>} player
 */
function checkPlayer (player) {
  if (!isPlayer(player)) return false // only accept players
  const name = player.getName()?.getString()
  if (!name) return false
  if (config.whitelist === true && config.whitelisted.includes(name) === false) return false
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  const decimalColor = rgbToDecimal(color.color)
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
  affectedPlayers.push(name) // player is now infected with G L O W
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
      if (affectedPlayers.includes(name) === true) continue
      if (highlightedPlayer === name) continue
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
  const color = { glow: false, color: resetColor }
  if (decimalHealth > goodHealthPercentage) color.color = goodHealthColor // good
  else if (decimalHealth <= goodHealthPercentage && decimalHealth > lowHealthPercentage) color.color = lowHealthColor // needs healing
  else if (decimalHealth <= lowHealthPercentage) color.color = criticalHealthColor // needs healing now
  return color
}

function isPlayer (player) {
  if (!player) return false
  if (player.getType() === 'minecraft:player') return true
}

// start the loop once message is sent
JsMacros.once('SendMessage', JavaWrapper.methodToJava(() => {
  if (!tickLoop) tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick)) // ignore if already started
  return true
}))

function stop () {
  // @ts-ignore # Typescript screams at me since event.serviceName doesn't exist on Events.BaseEvent
  JsMacros.getServiceManager().stopService(event.serviceName)
}

function terminate () {
  // if (startEvent) JsMacros.off('SendMessage', startEvent)
  if (tickLoop) JsMacros.off('Tick', tickLoop)
  // tick()
  resetPlayers(false)
  tickLoop = undefined
  return true
}

// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate)
