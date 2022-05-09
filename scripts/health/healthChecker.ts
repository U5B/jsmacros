const red = { r: 255, g: 0, b: 0 }
const green = { r: 0, g: 255, b: 0 }
const white = { r: 255, g: 255, b: 255 }
const yellow = { r: 255, g: 255, b: 0 }

const healPercentage = 0.7
const lowHpPercentage = 0.4

let tickLoop
let players = {}
let loadedPlayers = []

function rgbToDecimal (rgb) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  try {
    loadedPlayers = [] // reset all loaded players
    // @ts-ignore
    for (const player of World.getLoadedPlayers()) {
      // updateProperties(player)
      checkPlayer(player)
    }
    for (const player of Object.values(players)) {
      Chat.log(player)
      // @ts-ignore
      if (loadedPlayers.includes(player.name)) continue
      // @ts-ignore
      delete players[player.name]
    }
  }
  catch (e) {} // ignore errors from World being undefined
  return true
}

function updateProperties (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  const name = player.getName().getString()
  const glowing = player.isGlowing()
  if (!players[name]) players[name] = { name: name, glowing: glowing }
  loadedPlayers.push(name)
}

function checkPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!player.isAlive()) return null
  //const name = player.getName().getString()
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  if (color.glow === false) {
    // if the player was already glowing when checking, don't set it to false
    player.setGlowingColor(rgbToDecimal(color.color))
    if (!player.isGlowing()) player.setGlowing(false)
    return
  }
  const decimalColor = rgbToDecimal(color)
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
}

function purgePlayers () {

}

function determineColor (decimalHealth) {
  let color = { glow: true, color: white }
  if (decimalHealth > healPercentage) {
    color.glow = false
    color.color = white
  } else if (decimalHealth <= healPercentage && decimalHealth > lowHpPercentage) {
    color.color = yellow
  } else if (decimalHealth <= lowHpPercentage) {
    color.color = red
  }
  return color
}

JsMacros.on('EntityDamaged', JavaWrapper.methodToJava(() => {
  if (!tickLoop) tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick))
  return true
}))

function terminate () {
  JsMacros.off('Tick', tickLoop)
  tickLoop = undefined
  return true
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)