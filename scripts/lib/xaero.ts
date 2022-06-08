function xaeroChatBuilder (builder: Java.xyz.wagyourtail.jsmacros.client.api.classes.TextBuilder, coordinates: { x: number, y: number, z: number }, name: string = null, world: string = null) {
  const wayPointCommand = xaeroClickEvent(coordinates, false, name, world)
  if (wayPointCommand === false) return builder
  builder.append(' [XAERO]')
  builder.withColor(0xb)
  builder.withClickEvent('run_command', wayPointCommand)
  builder.withShowTextHover(Chat.createTextHelperFromString('Create Xaero Waypoint.'))
  return builder
}

function xaeroClickEvent ({ x, y, z }: { x: number, y: number, z: number }, share: boolean, name: string = 'Compass', world: string = null) {
  try {
    Java.type('xaero.common.XaeroMinimapSession') // just try accessing this class (if it fails, Xaero doesn't exist)
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
  /* xaero-waypoint:Mistport:T:-763:84:1321:2:false:0:Internal-dim%monumenta$isles-waypoints
  name: string = 'Name'
  label: string = 'N'
  x: number (-integer -> integer) = 0
  y: number (-integer -> integer) = 0 || '~'
  z: number (-integer -> integer) = 0
  color: number (0-16) (4: dark red) = 4 (red) 
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

export { xaeroChatBuilder, xaeroClickEvent }