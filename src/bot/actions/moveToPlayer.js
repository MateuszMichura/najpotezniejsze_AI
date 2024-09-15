module.exports.moveToPlayer = player => {
  const { x, y, z } = player.entity.position
  bot.pathfinder.setGoal(new GoalNear(x, y, z, RANGE_GOAL))
}
