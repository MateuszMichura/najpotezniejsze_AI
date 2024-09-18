import { type Bot } from 'mineflayer'
import { log } from '../utils/actions'

export const toss = async (bot: Bot, itemName: string, num = 1) => {
  const item = bot.inventory.items().find(item => item.name === itemName)
  if (!item) {
    return log(bot, `Nie masz ${itemName} w swoim ekwipunku.`, true)
  }

  if (item.count < num) {
    return log(
      bot,
      `Nie masz wystarczającej ilości ${itemName} w swoim ekwipunku.`,
      true
    )
  }

  await bot.toss(item.type, null, num)
  return log(bot, `Wyrzuciłeś ${num} ${itemName}.`, true)
}
