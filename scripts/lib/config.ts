const glowHealth = { // configuration is located in /config/glowHealth.json
  name: 'default',
  enabled: true,
  blatant: { // esp mode
    enabled: true
  },
  draw: {
    /// draw a hud with nearby player health
    // if you just want this without glow, then turn off raytrace and blatant
    enabled: false,
    x: 0, // x pos
    y: 0, // y pos
    align: 0 // 0 = left, center = 0.5, right = 1
  },
  whitelist: {
    // only allow specific players to glow
    // useful if you have specific people that you want to heal that are extremely good at dying
    // Example: ['T0OFU', 'Beatq']
    enabled: false,
    players: [] // list of players in string format (['Player1', 'Player2']) to whitelist
  },
  raytrace: {
    // if blatant mode is true: this highights the selected player with raytrace.color
    // if blatant mode is false: this highlights the selected player with their health
    enabled: false,
    reach: 65, // Hallowed Beam range is 30 (cannot be decimal)
    // set to true to contiune highlighting the player even if crosshair is not on the player
    // set to false to only highlights the person you are looking at
    persist: false,
    // set to true to not display players (that you can't already see) through walls
    // applies to blatant mode
    depth: true,
    // ignores already glowing players in depth check
    // set to false to not ignore glowing players
    ignoreGlowing: true,
    // used for blatant mode to highlight the player you have selected
    color: 0xFFA500 // orange
  },
  // Max health is usually 20hp. 1 heart = 2hp
  // Hallowed Beam 2 is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
  // Hand of Light 2 is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
  health: {
    critical: {
      color: 0xFF0000, // red
      rgb: [255, 255, 255], // ignored but needed
      percent: 0.4, // health is 40%
      glow: true // if false, uses glowing effect from server
    },
    low: {
      color: 0xFFFF00, // yellow
      rgb: [255, 255, 255], // ignored but needed
      percent: 0.7, // health is 70%
      glow: true // if false, uses glowing effect from server
    },
    good: {
      color: 0x00FF00, // green
      rgb: [255, 255, 255], // ignored but needed
      percent: 1.0, // health is 100% (set to 0.9 to prevent glow from showing until poise is gone)
      glow: true // if false, uses glowing effect from server
    },
    base: {
      color: 0xFFFFFF, // white
      rgb: [255, 255, 255], // ignored but needed
      percent: 1.0, // this needs to be 1.0 do not change
      glow: false // if false, uses glowing effect from server
    }
  }
}

const mEffects = {
  x: 0,
  y: 0,
  align: 1
}

const defaults = {
  meffects: mEffects,
  glowhealth: glowHealth
}

export { defaults }
