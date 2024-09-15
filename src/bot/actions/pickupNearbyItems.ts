const { log } = require('../utils/log')
import { goals, Movements } from 'mineflayer-pathfinder'
const { GoalNear } = goals

export const pickupNearbyItems = async bot => {
  const distance = 8
  const getNearestItem = bot =>
    bot.nearestEntity(
      entity =>
        entity.name === 'item' &&
        bot.entity.position.distanceTo(entity.position) < distance
    )
  let nearestItem = getNearestItem(bot)
  let pickedUp = 0
  while (nearestItem) {
    bot.pathfinder.setMovements(new Movements(bot))
    await bot.pathfinder.goto(
      new GoalNear(
        nearestItem.position.x,
        nearestItem.position.y,
        nearestItem.position.z,
        1
      )
    )
    await new Promise(resolve => setTimeout(resolve, 200))
    let prev = nearestItem
    nearestItem = getNearestItem(bot)
    if (prev === nearestItem) {
      break
    }
    pickedUp++
  }

  return log(bot, `Picked up ${pickedUp} items.`, true)
}
