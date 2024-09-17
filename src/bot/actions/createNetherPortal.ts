import { bot } from '../core/botConfig'
import { Vec3 } from 'vec3'
import { sleep } from '../utils/actions'

export const createNetherPortal = async (): Promise<string> => {
  const obsidian = bot.inventory.items().find(item => item.name === 'obsidian')
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!obsidian || obsidian.count < 10) {
    const message =
      'Nie mam wystarczająco dużo obsydianu, aby stworzyć portal Nether.'
    bot.chat(message)
    return message
  }
  if (!flintAndSteel) {
    const message = 'Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.'
    bot.chat(message)
    return message
  }

  await bot.equip(obsidian, 'hand')

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
    { x: 2, y: 4, z: 3 },
  ]

  for (const blockPos of portalBlocks) {
    try {
      const pos = bot.entity.position.offset(blockPos.x, blockPos.y, blockPos.z)
      await bot.lookAt(pos)

      const block = bot.blockAt(pos)
      if (block) {
        await bot.placeBlock(block, new Vec3(0, 1, 0))
      } else {
        console.error('Blok nie został znaleziony w pozycji:', pos)
      }
    } catch (error) {
      console.error('Błąd podczas stawiania bloku:', error)
    }
  }

  await bot.lookAt(
    bot.entity.position.offset(
      portalBlocks[1].x,
      portalBlocks[1].y,
      portalBlocks[1].z
    )
  )
  await bot.equip(flintAndSteel, 'hand')
  bot.activateItem()
  await sleep(100)
  bot.deactivateItem()

  const successMessage = 'Stworzyłem portal Nether.'
  bot.chat(successMessage)
  return successMessage
}
