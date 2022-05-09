const legitMode = false

const criticalHealthColor = { r: 255, g: 0, b: 0 }
const lowHealthColor = { r: 255, g: 255, b: 0 }
const goodHealthColor = { r: 0, g: 255, b: 0 }
const resetColor = { r: 255, g: 255, b: 255 }

const goodHealthPercentage = 0.7
const lowHealthPercentage = 0.4

let tickLoop
let affectedPlayers = []

function rgbToDecimal (rgb) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  if (legitMode === false) {
    try {
      affectedPlayers = [] // reset all players being affected by this
      // @ts-ignore
      for (const player of World.getLoadedPlayers()) {
        checkPlayer(player)
      }
    }
    catch (e) {} // ignore errors from World being undefined
  } else {
    const entity = Player.rayTraceEntity()
    // @ts-ignore
    checkEntity(entity)
  }
  return true
}
function checkEntity (entity:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) { // technically this could be an entity but I don't care
  if (!entity) return false
  if (entity.getType() !== 'minecraft:player') return false
  affectedPlayers = []
  const newPlayer = checkPlayer(entity)
  if (newPlayer === true) { // we only reset it if raytrace switched to a different player
    const name = entity.getName().getString()
    affectedPlayers = [name]
    resetPlayers(true)
    return true
  }
  return false
}

// Check if a player has lost health and update their glowing status and color
function checkPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!player) return false
  const name = player.getName().getString()
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  const decimalColor = rgbToDecimal(color)
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
  affectedPlayers.push(name)
  return true
}

// update properties of the player (add to affectedPlayers and playerData)
function resetPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!player) return false
  player.resetGlowing()
  player.resetGlowingColor()
  return true
}

// This function should set every player to their previous state (glowing or not glowing)
function resetPlayers (ignore = false) { // players = playerData
  // @ts-ignore
  for (const player of World.getLoadedPlayers()) {
    const name = player.getName().getString()
    if (ignore && !affectedPlayers.includes(name)) resetPlayer(player)
    continue
  }
}

function determineColor (decimalHealth:Number) {
  let color = { glow: false, color: resetColor }
  if (decimalHealth > goodHealthPercentage) color.color = goodHealthColor // good
  else if (decimalHealth <= goodHealthPercentage && decimalHealth > lowHealthPercentage) color.color = lowHealthColor // needs healing
  else if (decimalHealth <= lowHealthPercentage) color.color = criticalHealthColor // needs healing now
  return color
}

const entityDamagedEvent = JsMacros.on('EntityDamaged', JavaWrapper.methodToJava(() => {
  if (!tickLoop) tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick))
  return true
}))

function terminate () {
  JsMacros.off('Tick', tickLoop)
  JsMacros.off('EntityDamaged', entityDamagedEvent)
  tick()
  resetPlayers(false)
  tickLoop = undefined
  return true
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)