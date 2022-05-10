/* global World, Player, JsMacros, JavaWrapper, event, Chat, Java */
// Configuration Start
const set = { // static variables
  blatant: {
    enabled: false
  },
  whitelist: {
    enabled: false,
    players: [] // list of players in string format to whitelist
  },
  raytrace: {
    enabled: false,
    reach: 30, // Hallowed Beam range (cannot be decimal)
    persist: false, // if true, persist if crosshair moves away from entity
    depth: false, // run depth checks on entities to not show them through walls [NOT YET DONE]
    color: { r: 255, g: 165, b: 0 } // used for when selecting an entity in blatant mode
  },
  // Max health is usually 20hp. 1 heart = 2hp
  // Hallowed Beam is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
  // Hand of Light is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
  health: {
    critical: 0.5, // health is 50%
    low: 0.7, // health is 70%
    color: { // glowing colors in RGB format
      critical: { r: 255, g: 0, b: 0 },
      low: { r: 255, g: 255, b: 0 },
      good: { r: 0, g: 255, b: 0 },
      base: { r: 255, g: 255, b: 255 },
    }
  },
  state: { // not static variables that change in the code
    tickLoop: undefined,
    started: false,
    glowingPlayers: [], // currently glowing players
    selectedPlayer: '' // currently raytraced/highlighted player
  }
}

// Configuration End

function rgbToDecimal (rgb = { r: 0, g: 0, b: 0 }) {
  return Number((rgb.r << 16) + (rgb.g << 8) + (rgb.b))
}

function tick () {
  try {
    // reset all players being affected by this
    if (set.blatant.enabled === true) {
      set.state.glowingPlayers = []
      // Check all loaded players
      checkPlayers()
      if (set.raytrace.enabled === true) highlightPlayerCursor()
    } else if (set.raytrace.enabled === true) {
      // const entity = Player.rayTraceEntity() // infinite range possible?
      highlightPlayerCursorHealth()
    } else {
      Chat.log('Mode is not set. Please set one of the following modes: blatant or raytrace')
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
  const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), set.raytrace.reach)
  // @ts-ignore # Check if the result is empty
  if (result.isEmpty()) return false
  // @ts-ignore
  const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get())
  return entity
}

function highlightPlayerCursor () {
  const player = rayTraceEntity()
  if (!isPlayer(player)) {
    set.state.selectedPlayer = ''
    resetPlayers(true)
    return false // only accept players
  }
  const color = rgbToDecimal(set.raytrace.color)
  player.setGlowing(true)
  player.setGlowingColor(color)
  set.state.selectedPlayer = player.getName()?.getString()
  resetPlayers(true)
  return true
}
/**
 * @param {Java.xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper<any>} entity
 */
function highlightPlayerCursorHealth () {
  const entity = rayTraceEntity()
  if (!isPlayer(entity)) { // only accept players
    if (set.raytrace.persist === false) {
      set.state.glowingPlayers = []
      resetPlayers(true)
      return false
    }
    checkPlayers()
    return false
  }
  set.state.glowingPlayers = []
  const player = entity.asPlayer() // Typescript please stop screaming at me
  const newPlayer = checkPlayer(player)
  if (newPlayer === true || set.raytrace.persist === false) { // we only reset it if raytrace switched to a different player or if persist is set to false
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
    if (set.blatant.enabled === true) {
      checkPlayer(player)
    } else if (set.raytrace.enabled === true && set.state.glowingPlayers.includes(name) === true) {
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
  if (set.whitelist.enabled === true && set.whitelist.players.includes(name) === false) return false
  // player.getRaw().method_6067() is absorption hearts
  const health = player.getHealth() /* + player.getRaw().method_6067() */
  const maxHealth = player.getMaxHealth() /* + player.getRaw().method_6067() */
  const decimalHealth = Number(health / maxHealth)
  const color = determineColor(decimalHealth)
  const decimalColor = rgbToDecimal(color.color)
  player.setGlowingColor(decimalColor)
  player.setGlowing(true)
  set.state.glowingPlayers.push(name) // player is now infected with G L O W
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
      if (set.state.glowingPlayers.includes(name) === true) continue
      if (set.state.selectedPlayer === name) continue
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
  const color = { glow: false, color: set.health.color.base }
  if (decimalHealth > set.health.low) color.color = set.health.color.good // good
  else if (decimalHealth <= set.health.low && decimalHealth > set.health.critical) color.color = set.health.color.low // needs healing
  else if (decimalHealth <= set.health.critical) color.color = set.health.color.critical // needs healing now
  return color
}

function isPlayer (player) {
  if (!player) return false
  if (player.getType() === 'minecraft:player') return true
}

function start () {
  if (!set.state.tickLoop) set.state.tickLoop = JsMacros.on('Tick', JavaWrapper.methodToJava(tick)) // ignore if already started
  return true
}

function stop () {
  if (!set.state.started) return
  try {
    // @ts-ignore # Typescript screams at me since event.serviceName doesn't exist on Events.BaseEvent
    JsMacros.getServiceManager().stopService(event.serviceName)
  } catch (e) {
    Chat.getLogger('usb').error(e)
  }
}

function terminate () {
  // cmd1.unregister()
  set.state.started = false
  if (set.state.tickLoop) JsMacros.off('Tick', set.state.tickLoop)
  resetPlayers(false)
  set.state.tickLoop = undefined
  return true
}
/*
const cmd1 = Chat.createCommandBuilder('usb:hp')
cmd1.executes(JavaWrapper.methodToJava((context) => {
  if (config.state.started === false) {
    Chat.log('[usb] Health service started')
    Chat.getLogger('usb').info('HP Service started.')
    config.state.started = true
    start()
  } else {
    Chat.getLogger('usb').fatal('HP Service stopped.')
    Chat.log('[usb] Health service stopped.')
    stop()
  }
  return true
}))
cmd1.register()
*/
start()
// @ts-ignore # Typescript screams at me since event.stopListener doesn't exist on Events.BaseEvent
event.stopListener = JavaWrapper.methodToJava(terminate)
