const { log } = require('../utils/log')
const Vec3 = require('vec3')

module.exports.placeBlock = async (bot, blockType) => {
  const block = bot.inventory
    .items()
    .find(item => item.name.includes(blockType))

  if (!block) {
    return log(bot, `No ${blockType} found in inventory`, true)
  }

  bot.equip(block, 'hand')
  const pos = bot.entity.position.offset(0, 0, 2)

  await bot.lookAt(pos)
  const blockAtTargetPostiion = bot.blockAt(pos)
  if (blockAtTargetPostiion && blockAtTargetPostiion.name !== 'air') {
    if (bot.canDigBlock(blockAtTargetPostiion)) {
      await bot.dig(blockAtTargetPostiion)
    } else
      return log(
        bot,
        `Nie moge postawic bloku na kordach ${pos}, poniewaz jest juz tam inny blok`,
        true
      )
  }

  await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0))
}
