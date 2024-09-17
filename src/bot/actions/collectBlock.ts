import { log } from '../utils/log'
import { goals } from 'mineflayer-pathfinder'
import { pickupNearbyItems } from './pickupNearbyItems'
import { Vec3 } from 'vec3'
import { type Bot } from 'mineflayer'
import { moveAway } from './moveAway'
const { GoalNear } = goals

export const collectBlock = async (bot: Bot, blockType: string, num = 1) => {
  try {
    const blocks = bot.findBlocks({
      matching: block => block.name === blockType,
      maxDistance: 100,
      count: num,
    })

    let triesToFindBlock = 0

    while (blocks.length === 0 && triesToFindBlock <= 4) {
      await moveAway(bot, 30, 'NORTH')
    }

    if (blocks.length === 0) {
      return log(bot, `Nie mogę znaleźć ${blockType} w pobliżu.`, true)
    }

    let collected = 0
    let prevBlockPos: Vec3 = blocks[0]
    for (const blockPos of blocks) {
      if (collected >= num) break

      await bot.pathfinder.goto(
        new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2)
      )

      const block = bot.blockAt(blockPos)

      if (block && bot.canDigBlock(block)) {
        if (!!block.harvestTools) {
          let hasTool = false

          for (const toolId in block.harvestTools) {
            const tool = bot.inventory
              .items()
              .find(item => item.type === parseInt(toolId))

            if (!!tool) {
              await bot.equip(tool, 'hand')

              hasTool = true
              break
            }
          }

          if (!hasTool) {
            return log(
              bot,
              `Nie mam odpowiedniego narzędzia do zbierania ${blockType}.`,
              true
            )
          }
        } else await bot.unequip('hand')

        let i = 0
        while (!bot.canSeeBlock(block)) {
          //If the block is not visible, we need to dig blocks between the bot and the target block
          const target = block.position.offset(0.5, 0.5, 0.5)

          await bot.lookAt(target)
          const blockToDestroy = bot.blockAtCursor()

          if (blockToDestroy && bot.canDigBlock(blockToDestroy))
            await bot.dig(blockToDestroy)

          if (i >= 10) break //failsafe
          i++
        }

        await bot.dig(block)
        await bot.pathfinder.goto(
          new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2)
        )

        collected++
      } else return log(bot, `Nie mogę zebrać ${blockType}.`, true)

      if (prevBlockPos) {
        if (blockPos.distanceTo(prevBlockPos) >= 4) {
          await pickupNearbyItems(bot, 8, false)
        }
      }
      prevBlockPos = blockPos
    }

    await pickupNearbyItems(bot, 8, false)

    return log(bot, `Zebrałem ${collected} ${blockType}.`, true)
  } catch (error) {
    console.error('Błąd podczas zbierania bloku:', error)
    const message = 'Wystąpił błąd podczas zbierania bloku.'
    bot.chat(message)

    return message
  }
}
