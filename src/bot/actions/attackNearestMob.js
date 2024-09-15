module.exports.attackNearestMob = async (bot, specificType = null) => {
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
  } catch (error) {
    console.error(error.stack)
    return {
      success: false,
      error: `Nie udało się zaatakować moba: ${error.message}`,
    }
  }
}
