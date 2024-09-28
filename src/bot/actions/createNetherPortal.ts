import { bot } from '../core/botConfig'
import { Vec3 } from 'vec3'
import { log, sleep } from '../utils/actions'
import { goals } from 'mineflayer-pathfinder'

const { GoalNear } = goals

export const createNetherPortal = async (): Promise<string> => {
  const scaffoldingItems = [
    'dirt',
    'oak_planks',
    'cobblestone',
    'netherrack',
  ] as const

  const obsidian = bot.inventory.items().find(item => item.name === 'obsidian')
  const scaffolding = bot.inventory
    .items()
    .find(item => scaffoldingItems.includes(item.name as any))
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!obsidian || obsidian.count < 10)
    return log(
      bot,
      `Nie mam wystarczającej ilości obsydianu, aby stworzyć portal Nether.`,
      true
    )

  if (!flintAndSteel)
    return log(
      bot,
      `Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.`,
      true
    )
  if (!scaffolding)
    return log(
      bot,
      `Nie mam wystarczającej ilości bloków, aby stworzyć portal Nether.`,
      true
    )

  const portalBlocks = [
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 0, z: 1 },
    { x: 2, y: 0, z: 2 },
    { x: 2, y: 0, z: 3 },
    { x: 2, y: 1, z: 0 },
    { x: 2, y: 1, z: 3 },
    { x: 2, y: 2, z: 0 },
    { x: 2, y: 2, z: 3 },
    { x: 2, y: 3, z: 0 },
    { x: 2, y: 3, z: 3 },
    { x: 2, y: 4, z: 0 },
    { x: 2, y: 4, z: 1 },
    { x: 2, y: 4, z: 2 },
  ]

  for (let i = 0; i < portalBlocks.length; i++) {
    {
      try {
        const blockPos = portalBlocks[i]
        const blockToPlace = [0, 3, 10].includes(i) ? scaffolding : obsidian

        await bot.equip(blockToPlace, 'hand')
        const pos = bot.entity.position.offset(
          blockPos.x,
          blockPos.y,
          blockPos.z
        )
        await bot.lookAt(pos)

        const block = bot.blockAt(pos)
        if (block) {
          bot.placeBlock(block, new Vec3(0, 1, 0)).catch(_ => {}) //jakby się crashowało, to zwiększ czas lub zmień na await - blad mineflayer
          await sleep(500)
        } else {
          console.error('Blok nie został znaleziony w pozycji:', pos)
        }
      } catch (error) {
        console.error('Błąd podczas stawiania bloku:', error)
      }
    }
  }

  const blockToIgnite = bot.blockAt(
    bot.entity.position.offset(
      portalBlocks[1].x,
      portalBlocks[1].y,
      portalBlocks[1].z
    )
  )

  if (!blockToIgnite)
    return log(bot, `Nie mogę znaleźć bloku do zapalenia.`, true)

  await bot.equip(flintAndSteel, 'hand')
  await bot.activateBlock(blockToIgnite)
  await bot.pathfinder.goto(
    new GoalNear(
      blockToIgnite.position.x,
      blockToIgnite.position.y + 1,
      blockToIgnite.position.z,
      1
    )
  )

  return log(bot, `Stworzyłem portal Nether.`, true)
}
