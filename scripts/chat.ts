import { fetchPoi } from "./poi/poi.js"

/* on event RecvMessage */
const chat = (<Events.RecvMessage>event).text
const string = chat.getStringStripFormatting()

const regex = {
  poi: /Your bounty for today is ([a-zA-Z' ]+)!/
}
switch (true) {
  case regex.poi.test(string): {
    const [, poi] = regex.poi.exec(string)
    const coordinates = fetchPoi(poi)
    // @ts-ignore
    if (coordinates?.x && coordinates?.y && coordinates?.z) Chat.log(`POI: (${coordinates.x}, ${coordinates.y}, ${coordinates.z})`)
  }
}