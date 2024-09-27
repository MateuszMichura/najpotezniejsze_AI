import { log } from '../utils/log'
import { goals } from 'mineflayer-pathfinder'
// import { Vec3 } from 'vec3'
// import { collectBlock } from './collectBlock'
import { type Bot } from 'mineflayer'
import { type Block } from 'prismarine-block'
import { bot as botConfig } from '../core/botConfig'
const Item = require('prismarine-item')(botConfig.version)

const { GoalNear } = goals

export const craftRecipe = async (bot: Bot, itemName: string, num = 1) => {
  let craftingTable: Block | undefined

  if (itemName.endsWith('plank')) itemName += 's'

  // get recipes that don't require a crafting table
  let recipes = bot.recipesFor(
    bot.registry.itemsByName[itemName].id,
    null,
    num,
    null
  )

  if (!recipes || recipes.length === 0) {
    const craftingTableRange = 32

    recipes = bot.recipesFor(
      bot.registry.itemsByName[itemName].id,
      null,
      num,
      true
    )
    if (!recipes || recipes.length === 0) {
      //print what bot is missing
      const allRecipies = bot.recipesAll(
        bot.registry.itemsByName[itemName].id,
        null,
        true
      )

      let missingItems = ''

      allRecipies[0].delta.forEach(ingredient => {
        const name = new Item(ingredient.id).name
        const count = ingredient.count

        if (name === itemName) return

        missingItems += `${name}*${count * -1} , `
      })

      return log(
        bot,
        `You do not have enough resources to craft ${itemName}. Missing: ${missingItems}`,
        true
      )
    }

    craftingTable =
      bot.findBlock({
        matching: block => block.name === 'crafting_table',
        maxDistance: craftingTableRange,
      }) || undefined

    if (!craftingTable)
      return log(bot, `It requires a crafting table to craft ${itemName}`, true)

    await bot.pathfinder.goto(
      new GoalNear(
        craftingTable.position.x,
        craftingTable.position.y,
        craftingTable.position.z,
        2
      )
    )
  }

  num = Math.floor(num / recipes[0].result.count)

  await bot.craft(recipes[0], num, craftingTable)

  let craftedItemCount = 0

  bot.inventory.items().forEach(item => {
    if (item.name === itemName) {
      craftedItemCount += item.count
    }
  })

  return log(
    bot,
    `Successfully crafted ${itemName}, you now have ${craftedItemCount} ${itemName}.`,
    true
  )
}
