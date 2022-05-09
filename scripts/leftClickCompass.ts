import { getCompass } from './util/util'
const item = Player.getPlayer().getMainHand().getItemID()
switch (item) {
  case 'minecraft:compass': {
    const coordinates = getCompass()
    Chat.log(`Compass: (${coordinates.x}, ${coordinates.y}, ${coordinates.z})`)
    break
  }
}
