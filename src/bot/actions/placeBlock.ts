import { Vec3 } from 'vec3'
import { log } from '../utils/log'
import { type Bot } from 'mineflayer'
import { type Block } from 'prismarine-block'

export const placeBlock = async (bot: Bot, blockType: string) => {
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

  try {
    await bot.placeBlock(bot.blockAt(pos) as Block, new Vec3(0, 1, 0))
  } catch (e) {
    console.error(e)
    //tutaj nie ma returna, bo niektore serwery nie wysylaja response czy udalo sie postawic blok
  }

  return log(bot, `Postawiono blok ${blockType} na kordach ${pos}`)
}
