import { log } from '../utils/actions'
import { goals } from 'mineflayer-pathfinder'
const { GoalNear } = goals

export const defendSelf = async (bot, range = 9) => {
  let attacked = false
  let enemy = bot.nearestEntity(
    entity =>
      entity.type === 'mob' &&
      bot.entity.position.distanceTo(entity.position) < range &&
      entity.name !== 'Armor Stand'
  )
  while (enemy) {
    if (bot.entity.position.distanceTo(enemy.position) > 3) {
      try {
        await bot.pathfinder.goto(
          new GoalNear(enemy.position.x, enemy.position.y, enemy.position.z, 2)
        )
      } catch (err) {
        console.error('Błąd podczas podchodzenia do przeciwnika:', err)
      }
    }
    try {
      await bot.attack(enemy)
      attacked = true
    } catch (err) {
      console.error('Błąd podczas atakowania przeciwnika:', err)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    enemy = bot.nearestEntity(
      entity =>
        entity.type === 'mob' &&
        bot.entity.position.distanceTo(entity.position) < range &&
        entity.name !== 'Armor Stand'
    )
  }
  if (attacked) {
    return log(bot, `Obroniłem się przed atakiem.`, true)
  } else {
    return log(bot, `Nie znalazłem żadnych wrogów w pobliżu.`, true)
  }
}
