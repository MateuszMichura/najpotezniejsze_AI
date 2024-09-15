module.exports.findNearestPlayer = () => {
  let nearestPlayer = null
  let nearestDistance = Infinity

  for (const playerName in bot.players) {
    const player = bot.players[playerName]
    if (player.entity && player.entity !== bot.entity) {
      const distance = bot.entity.position.distanceTo(player.entity.position)
      if (distance < nearestDistance) {
        nearestPlayer = player
        nearestDistance = distance
      }
    }
  }

  return nearestPlayer
}
