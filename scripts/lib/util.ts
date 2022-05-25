const decimalToRGB = (color: number): [number, number, number] => [
  (color >> 16) & 0xFF,
  (color >> 8) & 0xFF,
  color & 0xFF
]

const rgbToDecimal = (rgb: [number, number, number]): number => (
  (rgb[0] << 16) + (rgb[1] << 8) + (rgb[2])
)

function rayTraceEntity (reach: number) {
  // @ts-ignore # DebugRenderer.getTargetedEntity()
  const result = Java.type('net.minecraft.class_863').method_23101(Player.getPlayer().asLiving().getRaw(), reach)
  // @ts-ignore # Check if the result is empty
  if (result.isEmpty()) return false
  // @ts-ignore
  const entity = Java.type('xyz.wagyourtail.jsmacros.client.api.helpers.EntityHelper').create(result.get())
  return entity
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

export { decimalToRGB, rgbToDecimal, rayTraceEntity, cleanString, trimString }