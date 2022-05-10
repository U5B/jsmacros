function rgbToDecimal (rgb) {
  return (rgb.r << 16) + (rgb.g << 8) + (rgb.b)
}

function checkEntityType (entity) {
  const type = entity.getType()
  switch (type) {
    case 'minecraft:item': {
      const color = rgbToDecimal({ r: 255, g: 255, b: 255 })
      entity.setGlowingColor(color)
      entity.setGlowing(true)
      break
    }
    case 'minecraft:player': {
      const color = rgbToDecimal({ r: 255, g: 0, b: 0 })
      entity.setGlowingColor(color)
      entity.setGlowing(true)
      break
    }
  }
}

function getCompass () {
  // @ts-ignore
  const position = World.getRespawnPos()
  const pos = { x: position.getX(), y: position.getY(), z: position.getZ() }
  return pos
}

export { rgbToDecimal, checkEntityType, getCompass }
