module.exports.collectBlock = async (blockType, num = 1) => {
  try {
    const blocks = bot.findBlocks({
      matching: block => block.name === blockType,
      maxDistance: 320,
      count: num,
    })

    if (blocks.length === 0) {
      return log(bot, `Nie mogę znaleźć ${blockType} w pobliżu.`, true)
    }

    let collected = 0
    for (const blockPos of blocks) {
      if (collected >= num) break

      await bot.pathfinder.goto(
        new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2)
      )

      if (bot.canDigBlock(bot.blockAt(blockPos))) {
        await bot.dig(bot.blockAt(blockPos))
        collected++
      } else return log(bot, `Nie mogę zebrać ${blockType}.`, true)
    }

    return log(bot, `Zebrałem ${collected} ${blockType}.`, true)
  } catch (error) {
    console.error('Błąd podczas zbierania bloku:', error)
    const message = 'Wystąpił błąd podczas zbierania bloku.'
    bot.chat(message)

    return message
  }
}
