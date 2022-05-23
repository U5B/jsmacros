function getCompass () {
  // @ts-ignore
  const position = World.getRespawnPos()
  const pos = { x: position.getX(), y: position.getY(), z: position.getZ() }
  return pos
}

function onKeyPress (event) {
  if (World && World.isWorldLoaded()) {
    if (event.key == 'key.attack' && event.action == 0) { // trigger on attack
      const item = Player.getPlayer().getMainHand().getItemID() // get id of currently held item
      switch (item) {
        case 'minecraft:compass': { // if it is a compass, make a special string
          const coord = getCompass()
          const builder = Chat.createTextBuilder()
          builder.append(`§7[§aCOMPASS§7]§r `)
          const coordinates = `(${coord.x}, ${coord.y}, ${coord.z})`
          builder.append(coordinates)
          builder.withColor(0xa)
          builder.append(' [COPY]')
          builder.withColor(0xc)
          builder.withClickEvent('copy_to_clipboard', coordinates)
          builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'))
          Chat.log(builder.build())
          break
        }
      }
      return true
    }
  }
  return false
}

let listener = JsMacros.on('eventKey', JavaWrapper.methodToJava(onKeyPress))
function terminate () {
  if (listener) JsMacros.off('eventKey', listener)
}
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate)