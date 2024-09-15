import { goals } from 'mineflayer-pathfinder'
const { GoalNear } = goals

export const moveToPlayer = (bot, player, rangeGoal = 1) => {
  const { x, y, z } = player.entity.position
  bot.pathfinder.setGoal(new GoalNear(x, y, z, rangeGoal))
}
