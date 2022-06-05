// @ts-ignore
const nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)
import { config } from "../health/config"

const decimalToRGB = (color: number): [number, number, number] => [
  (color >> 16) & 0xFF,
  (color >> 8) & 0xFF,
  color & 0xFF
]

const rgbToDecimal = (rgb: [number, number, number]): number => (
  (rgb[0] << 16) + (rgb[1] << 8) + (rgb[2])
)

function rayTraceEntity (reach: number) {
  // function only likes integers / whole numbers
  if (!Number.isInteger(reach)) reach = Math.round(reach)
  // @ts-ignore # DebugRenderer.getTargetedEntity()
  const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), reach) // returns Java.Optional https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html
  // @ts-ignore # Check if the result is empty (isPresent() is needed for Java 8)
  if (result == null || !result?.isPresent()) return false
  // @ts-ignore
  const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get())
  return entity
}

function isPlayer (player:Java.xyz.wagyourtail.jsmacros.client.api.helpers.PlayerEntityHelper<any>) {
  if (!player) return false
  if (player.getType() === 'minecraft:player') {
    if (player.getName().getString() === Player.getPlayer().getName().getString()) return false // ignore self
    return true
  }
  return false
}

// health = { color: { base, good, low, critical }}
function determineColor (healthPercent: number, health = config.health) {
  let color = health.base
  if (healthPercent <= health.good.percent && healthPercent > health.low.percent) color = health.good
  else if (healthPercent <= health.low.percent && healthPercent > health.critical.percent) color = health.low // needs healing
  else if (healthPercent <= health.critical.percent) color = health.critical // needs healing now
  color.rgb = decimalToRGB(color.color)
  return color
}

function cleanString (str) {
  return str
    .replaceAll(/'/g, '')
    .replaceAll(/\n/g, '')
    .replaceAll(/ /g, '')
    .trim()
    .toLowerCase()
}

function trimString (str) {
  return str
    .trim()
    .toLowerCase()
}

function debugInfo (input) { // node debug
  // @ts-ignore
  if (nodeEnv) {
    // @ts-ignore
    console.log(input)
  } else {
    Chat.getLogger('usb').warn(input)
  }
}

function logInfo (string, prefix = 'USB', noChat = false) {
  if (!nodeEnv && noChat === false) Chat.log(`§7[§a${prefix}§7]§r ${string}`)
  string = string.replaceAll(/§./g, '')
  debugInfo(`[${prefix}]: ${string}`)
}

function writeConfig (configPath, config) {
  const configRoot = `${JsMacros.getConfig().macroFolder}\\config`
  if (!FS.exists(configRoot)) FS.makeDir(configRoot)
  try {
    FS.open(`${configRoot}\\${configPath}.json`).write(JSON.stringify(config, null, 2))
    return true
  } catch (e) {
    return false
  }
}

function readConfig (configPath) {
  const configRoot = `${JsMacros.getConfig().macroFolder}\\config`
  if (!FS.exists(configRoot)) FS.makeDir(configRoot)
  try {
    const result = JSON.parse(FS.open(`${configRoot}\\${configPath}.json`).read())
    return result
  } catch (e) {
    return false
  }
}

export { readConfig, writeConfig, isPlayer, determineColor, decimalToRGB, rgbToDecimal, rayTraceEntity, cleanString, trimString, debugInfo, logInfo, nodeEnv }