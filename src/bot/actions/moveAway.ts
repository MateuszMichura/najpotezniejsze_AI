import { type Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { log } from '../utils/log'
import { goals } from 'mineflayer-pathfinder'
const { GoalNear } = goals

export const Directions = {
  NORTH: new Vec3(0, 0, -1),
  EAST: new Vec3(1, 0, 0),
  SOUTH: new Vec3(0, 0, 1),
  WEST: new Vec3(-1, 0, 0),
} as const

export const moveAway = async (
  bot: Bot,
  distance = 5,
  direction?: keyof typeof Directions
): Promise<string> => {
  const currentPos = bot.entity.position

  if (direction) {
    const newPos = currentPos.plus(Directions[direction].scaled(distance))

    try {
      await bot.pathfinder.goto(new GoalNear(newPos.x, newPos.y, newPos.z, 2))

      return log(bot, `Oddaliłem się o ${distance} bloków.`, true)
    } catch (error) {
      console.log('Nie mogę się ruszyć w tym kierunku, próbuję innego.')
    }
  }

  let i = 0

  for (const [_, direction] of Object.entries(Directions)) {
    const newPos = currentPos.plus(direction.scaled(distance))
    if (i > 4)
      return log(
        bot,
        'Nie udało się znaleźć miejsca do oddalenia, po 4 razach przestaje szukać',
        true
      )

    try {
      await bot.pathfinder.goto(new GoalNear(newPos.x, newPos.y, newPos.z, 1))
      i++

      return log(bot, `Oddaliłem się o ${distance} bloków.`, true)
    } catch (error) {
      console.log('Nie mogę się ruszyć w tym kierunku, próbuję innego.')
    }
  }

  const errorMessage = 'Nie mogę się oddalić w żadnym kierunku.'
  bot.chat(errorMessage)
  return errorMessage
}
