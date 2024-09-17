import { sleep } from '../utils/actions'
import { bot } from '../core/botConfig'

export const fire = async () => {
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!flintAndSteel) {
    bot.chat('Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.')
    return
  }

  await bot.lookAt(bot.entity.position.offset(2, 1, 2))
  console.log('fire...')
  await bot.equip(flintAndSteel, 'hand')

  const block = bot.blockAt(bot.entity.position.offset(2, 1, 2))

  if (block) {
    // Zmiana na `bot.activateItem()` zamiast `bot.useOn(block)`
    await bot.activateItem()
    await sleep(100)
    bot.deactivateItem()
  } else {
    console.error('Blok nie został znaleziony.')
  }
}
