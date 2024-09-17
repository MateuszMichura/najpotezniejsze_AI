import { bot } from '../core/botConfig'

export const eat = async (): Promise<string> => {
  try {
    const food = bot.inventory
      .items()
      .find(
        item =>
          item.name.includes('apple') ||
          item.name.includes('bread') ||
          item.name.includes('cooked')
      )

    if (!food) {
      bot.chat('Nie mam żadnego jedzenia w ekwipunku.')
      return 'Nie mam żadnego jedzenia w ekwipunku.'
    }

    await bot.equip(food, 'hand')
    await bot.consume()
    const message = `Zjadłem ${food.name}.`
    bot.chat(message)
    return message
  } catch (error) {
    console.error('Błąd podczas jedzenia:', error)
    bot.chat('Nie udało mi się zjeść.')
    return 'Nie udało mi się zjeść.'
  }
}
