import { Bot } from 'mineflayer'
import { log } from '../utils/log'
import { bot as botConfig } from '../core/botConfig'
const Item = require('prismarine-item')(botConfig.version)

export const getRecipe = async (
  bot: Bot,
  itemName: string
): Promise<string> => {
  if (itemName.endsWith('plank')) itemName += 's'

  let recipes = bot.recipesAll(
    bot.registry.itemsByName[itemName].id,
    null,
    false
  )

  const extractRecipe = () =>
    recipes[0].delta
      .filter(item => new Item(item.id).name !== itemName)
      .map(item => `${new Item(item.id).name}*${Math.abs(item.count)}`)
      .join(', ')
      .replace(/,([^,]*)$/, '.')

  if (recipes.length !== 0)
    return log(
      bot,
      `Recipe for ${itemName} is: ${extractRecipe()}. It doesn't require crafting table.`,
      true
    )

  // get recipes that require a crafting table
  recipes = bot.recipesAll(bot.registry.itemsByName[itemName].id, null, true)

  if (!recipes || recipes.length === 0)
    return log(bot, `No recipe found for ${itemName}.`, true)

  return log(
    bot,
    `Recipe for ${itemName} is: ${extractRecipe()}. It requires crafting table.`,
    true
  )
}
