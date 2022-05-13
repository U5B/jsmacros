const config = {
  blatant: {
    enabled: false
  },
  whitelist: {
    // only allow specific players to glow
    // useful if you have specific people that you want to heal that  are extremely good at dying
    // Example: ['T0OFU', 'Beatq']
    enabled: false,
    players: [] // list of players in string format (['Player1', 'Player2']) to whitelist
  },
  raytrace: {
    // if blatant mode is true: this highights the selected player with raytrace.color
    // if blatant mode is false: this highlights the selected player with their health
    enabled: false,
    reach: 30, // Hallowed Beam range (cannot be decimal)
    // set to true to contiune highlighting the player even if crosshair is not on the player
    // set to false to only highlights the person you are looking at
    persist: false,
    // set to true to not display players (that you can't already see) through walls
    // applies to blatant mode
    // ignores already glowing players
    depth: false,
    // used for blatant mode to highlight the player you have selected
    color: { r: 255, g: 165, b: 0 }
  },
  // Max health is usually 20hp. 1 heart = 2hp
  // Hallowed Beam is 30% of max health (6hp).        Total Healing: 6hp (3 hearts)
  // Hand of Light is 20% of max health (4hp) + 8hp.  Total Healing: 12hp (6 hearts)
  health: {
    critical: 0.5, // health is 50%
    low: 0.7, // health is 70%
    // glowing colors in RGB format
    color: {
      critical: { r: 255, g: 0, b: 0 },   // red
      low: { r: 255, g: 255, b: 0 },      // yellow
      good: { r: 0, g: 255, b: 0 },       // green
      base: { r: 255, g: 255, b: 255 }    // white
    }
  }
}

function getConfig (mode = '') {
  let modifiedConfig = config
  switch (mode) {
    case 'espBlatant': { // esp for all
      modifiedConfig.blatant.enabled = true
      modifiedConfig.raytrace.depth = false
      break
    }
    case 'espLegit': { // esp meets wall
      modifiedConfig.blatant.enabled = true
      modifiedConfig.raytrace.depth = false
      break
    }
    case 'persistBlatant': { // esp for one person
      modifiedConfig.blatant.enabled = false
      modifiedConfig.raytrace.enabled = true
      modifiedConfig.raytrace.persist = true
      break
    }
    case 'persistLegit': { // esp for one person meets a wall
      modifiedConfig.blatant.enabled = false
      modifiedConfig.raytrace.enabled = true
      modifiedConfig.raytrace.persist = true
      modifiedConfig.raytrace.depth = true
      break
    }
    case 'raytraceBlatant': { // aim is required
      modifiedConfig.blatant.enabled = false
      modifiedConfig.raytrace.enabled = true
      break
    }
    case 'raytraceLegit': { // aim is required meets a wall
      modifiedConfig.blatant.enabled = false
      modifiedConfig.raytrace.enabled = true
      modifiedConfig.raytrace.depth = true
      break
    }
  }
  return modifiedConfig
}
export { getConfig }