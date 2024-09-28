const { log } = require('../utils/log')
import { type Bot } from 'mineflayer'
import { goals, Movements } from 'mineflayer-pathfinder'
const { GoalNear } = goals

/**
 * Pickup all items within 8 blocks of the bot.
 * @param {Bot} bot - Reference to the bot.
 * @param {number} distance - The distance to search for items.
 * @param {boolean} verbose - Whether to log the action.
 */
export const pickupNearbyItems = async (
  bot: Bot,
  distance: number = 10,
  verbose: boolean = true
) => {
  const getNearestItem = (bot: Bot) =>
    bot.nearestEntity(
      entity =>
        entity.name === 'item' &&
        bot.entity.position.distanceTo(entity.position) <= distance
    )
  let nearestItem = getNearestItem(bot)
  let pickedUp = 0

  let entities: any[] = []
  for (const [_, entity] of Object.entries(bot.entities)) {
    if (bot.entity.position.distanceTo(entity.position) <= distance) {
      entities.push(entity)
    }
  }

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

  return log(bot, `Picked up ${pickedUp} items.`, verbose)
}
