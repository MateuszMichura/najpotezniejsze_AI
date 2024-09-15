import { log } from '../utils/log'

import { goals } from 'mineflayer-pathfinder'
const { GoalNear } = goals

import { pickupNearbyItems } from './pickupNearbyItems'

export const attackNearestMob = async (bot, specificType: any = null) => {
  const entity = bot.nearestEntity(e => {
    if (e.type !== 'mob' && e.type !== 'animal') return false
    if (specificType && e.name.toLowerCase() !== specificType.toLowerCase())
      return false
    return true
  })

  if (!entity) {
    bot.chat(
      specificType
        ? `Nie znaleziono moba typu ${specificType} w pobliżu.`
        : 'Nie znaleziono żadnego moba w pobliżu.'
    )
    return { success: false, error: 'Nie znaleziono moba do ataku.' }
  }

  try {
    bot.chat(
      `Znaleziono moba: ${
        entity.name
      } w odległości ${bot.entity.position.distanceTo(entity.position)} bloków.`
    )
    await approachAndAttackUntilDead(bot, entity)
    return { success: true, attackedMob: entity.name }
  } catch (error: any) {
    console.error(error.stack)
    return {
      success: false,
      error: `Nie udało się zaatakować moba: ${error.message}`,
    }
  }
}

const approachAndAttackUntilDead = async (bot, entity) => {
  while (entity.isValid) {
    if (bot.entity.position.distanceTo(entity.position) > 3) {
      await bot.pathfinder.goto(
        new GoalNear(entity.position.x, entity.position.y, entity.position.z, 2)
      )
    }
    await bot.lookAt(entity.position.offset(0, entity.height, 0))
    await bot.attack(entity)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  console.log('entity: ', entity)

  if (!entity.isValid) {
    await pickupNearbyItems(bot)

    return log(bot, `Zabiłem ${entity.name}.`, true)
  } else {
    return log(bot, `Przerwano atak na ${entity.name}.`, true)
  }
}
