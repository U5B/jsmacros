/* global World, Player, JsMacros, JavaWrapper, event */
// Configuration Start
let blatant = false // eslint-disable-line prefer-const

// Glowing colors based on health
const criticalHealthColor = { r: 255, g: 0, b: 0 } // red
const lowHealthColor = { r: 255, g: 255, b: 0 } // yellow
const goodHealthColor = { r: 0, g: 255, b: 0 } // green
const resetColor = { r: 255, g: 255, b: 255 } // white

// Max health is usually 20hp. 1 heart = 2hp
// Hallowed Beam is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
// Hand of Light is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
const goodHealthPercentage = 0.7 // health is 70%
const lowHealthPercentage = 0.4 // health is 40%
// Configuration End

let tickLoop
let affectedPlayers = []

function rgbToDecimal (rgb = { r: 0, g: 0, b: 0 }) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  if (blatant === true) {
    // Check all loaded players
    affectedPlayers = [] // reset all players being affected by this
    // @ts-ignore # World.getLoadedPlayers() works still, despite what Typescript says
    for (const player of World.getLoadedPlayers()) {
      checkPlayer(player)
    }
  } else {
    const entity = Player.rayTraceEntity() // infinite range possible?
    checkEntity(entity)
  }
  return true
}

/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper<any>} entity
 */
function checkEntity (entity) {
  if (!entity) return false
  if (entity.getType() !== 'minecraft:player') return false // only accept players
  affectedPlayers = []
  const player = entity.asPlayer() // Typescript please stop screaming at me
  const newPlayer = checkPlayer(player)
  if (newPlayer === true) { // we only reset it if raytrace switched to a different player
    resetPlayers(true)
    return true
  }
  return false
}

// Check if a player has lost health and update their glowing status and color
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>} player
 */
function checkPlayer (player) {
  if (!player) return false
  if (player.getType() !== 'minecraft:player') return false // only accept players
  const name = player.getName().getString()
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
  if (!player) return false
  if (player.getType() !== 'minecraft:player') return false // only accept players
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

// start the loop when an entity is damaged
const startEvent = JsMacros.on('EntityLoad', JavaWrapper.methodToJava(() => {
  if (!tickLoop) tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick)) // ignore if already started
  return true
}))

function terminate () {
  if (tickLoop) JsMacros.off('Tick', tickLoop)
  if (startEvent) JsMacros.off('EntityDamaged', startEvent)
  tick()
  resetPlayers(false)
  tickLoop = undefined
  return true
}

// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent but I am using this as a service.
event.stopListener = JavaWrapper.methodToJava(terminate)
