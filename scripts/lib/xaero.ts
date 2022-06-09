const xaeroColorMap = {
  'color1': 0,
  'color2': 1,
  'color3': 2,
  'color4': 3,
  'color5': 4,
  'color6': 5,
  'color7': 6,
  'color8': 7,
  'color9': 8,
  'color10': 9,
}

function createCoordinateBuilder (coordinates: { x: number, y: number, z: number}, prefix: string, name: string = 'Compass') {
  let builder = Chat.createTextBuilder()
  builder.append(`§7[§a${prefix}§7]§r '${name}':`)
  const formattedCoordinates = `${coordinates.x}, ${coordinates.y}, ${coordinates.z}`

  builder = addCoordinates(builder, `(${formattedCoordinates})`) // bracket these coordinates to look fancy
  builder = addCopyClick(builder, formattedCoordinates) // but not these so you can paste them into Xaero
  builder = addXaeroClick(builder, coordinates, name) // or just add an Xaero waypoint with a clickEvent
  return builder
}

// coordinates: '(x, y, z)'
// color: 0xa (green) | must be a hexadecimal
function addCoordinates (builder: Java.xyz.wagyourtail.jsmacros.client.api.classes.TextBuilder, coordinates: string, color: number = 0xa) {
  builder.append(` ${coordinates}`)
  builder.withColor(color)
  return builder
}

// coordinates: '(x, y, z)'
// color: 0xc (red) | must be a hexadecimal
function addCopyClick (builder: Java.xyz.wagyourtail.jsmacros.client.api.classes.TextBuilder, coordinates: string, color: number = 0xc) {
  builder.append(' [COPY]')
  builder.withColor(color)
  builder.withClickEvent('copy_to_clipboard', coordinates)
  builder.withShowTextHover(Chat.createTextHelperFromString('Click to copy coordinates to clipboard.'))
  return builder
}


function addXaeroClick (builder: Java.xyz.wagyourtail.jsmacros.client.api.classes.TextBuilder, coordinates: { x: number, y: number, z: number }, name: string = null, world: string = null) {
  const wayPointCommand = xaeroClickEvent(coordinates, false, name, world)
  if (wayPointCommand === false) return builder
  builder.append(' [XAERO]')
  builder.withColor(0x9) // hardcoded to blue because I am a terrible person
  builder.withClickEvent('run_command', wayPointCommand)
  builder.withShowTextHover(Chat.createTextHelperFromString('Create a new Xaero Minimap Waypoint.'))
  return builder
}
// coordinates: { x: number, y: number, z: number } | coordinates
// share: true/false | For Xaero's share format (sending to other people) or internal (creating a waypoint for yourself)
// name: string/null | Name of the Waypoint | Defaults to 'Compass'
// world: string/null | World of the Waypoint | Defaults to null and uses current world | 'minecraft:overworld'
function xaeroClickEvent ({ x, y, z }: { x: number, y: number, z: number }, share: boolean, name: string = 'Compass', world: string = null) {
  // just try accessing this class (if it fails, Xaero doesn't exist)
  // auto xaero detection system: no need for user configuration
  try {
    Java.type('xaero.common.XaeroMinimapSession')
  } catch {
    return false
  }
  // get current world (only if it isn't specified)
  let currentWorld = world || World.getDimension()
  currentWorld = currentWorld.replace(':', '$')
  // use current position if no coordinates are specified
  const currentPosition = Player.getPlayer().getBlockPos()
  let newX = x ?? currentPosition.getX()
  let newY = y ?? currentPosition.getY()
  let newZ = z ?? currentPosition.getZ()
  /*
  example: xaero-waypoint:Mistport:T:-763:84:1321:2:false:0:Internal-dim%monumenta$isles-waypoints
  name: string = 'Name'
  label: string = 'N'
  x: number (-integer -> integer) = 0
  y: number (-integer -> integer) = 0 || '~'
  z: number (-integer -> integer) = 0
  color: number (0-16) (4: dark red)
  global: boolean (true/false) = true
  yaw: number (?) = 0
  world: string: (minecraft$overworld, monumenta$isles) 'minecraft$overworld'
  xaero-waypoint:name:label:x:y:z:color:global:yaw:Internal-dim%world-waypoints
  */
  // this needs to be run in a 'run_command' clickEvent: only works in there for some odd reason
  const alternativeWaypoint = `xaero_waypoint_add:${name}:${name[0].toUpperCase()}:${newX}:${newY}:${newZ}:4:false:0:Internal_dim%${currentWorld}_waypoints`
  // other method is sending it to yourself >w<
  const xaeroWaypoint = `xaero-waypoint:${name}:${name[0].toUpperCase()}:${x}:${y}:${z}:4:false:0:Internal-dim%${world}-waypoints`
  // Chat.say(`/msg ${Player.getPlayer().getName().getStringStripFormatting()} ${xaeroWaypoint}`)
  if (share === true) return xaeroWaypoint
  return alternativeWaypoint
}

export { createCoordinateBuilder, addCoordinates, addXaeroClick, xaeroClickEvent }