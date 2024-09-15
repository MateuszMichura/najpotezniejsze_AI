module.exports.craftRecipe = (bot, itemName, num = 1) => {
  let placedTable = false

  if (itemName.endsWith('plank')) itemName += 's'

  let recipes = bot.recipesFor(
    bot.registry.itemsByName[itemName].id,
    null,
    1,
    null
  )
  let craftingTable = null
  const craftingTableRange = 32
  if (!recipes || recipes.length === 0) {
    craftingTable = bot.findBlock({
      matching: block => block.name === 'crafting_table',
      maxDistance: craftingTableRange,
    })
    if (craftingTable === null) {
      let hasTable = bot.inventory
        .items()
        .some(item => item.name === 'crafting_table')
      if (hasTable) {
        let pos = bot.entity.position.offset(1, 0, 0)
        await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0))
        craftingTable = bot.findBlock({
          matching: block => block.name === 'crafting_table',
          maxDistance: craftingTableRange,
        })
        if (craftingTable) {
          recipes = bot.recipesFor(
            bot.registry.itemsByName[itemName].id,
            null,
            1,
            craftingTable
          )
          placedTable = true
        }
      } else {
        return log(
          bot,
          `You either do not have enough resources to craft ${itemName} or it requires a crafting table.`,
          true
        )
      }
    } else {
      recipes = bot.recipesFor(
        bot.registry.itemsByName[itemName].id,
        null,
        1,
        craftingTable
      )
    }
  }
  if (!recipes || recipes.length === 0) {
    if (placedTable) {
      await collectBlock('crafting_table', 1)
    }
    return log(
      bot,
      `You either do not have enough resources to craft ${itemName} or it requires a crafting table.`,
      true
    )
  }

  if (
    craftingTable &&
    bot.entity.position.distanceTo(craftingTable.position) > 4
  ) {
    await bot.pathfinder.goto(
      new GoalNear(
        craftingTable.position.x,
        craftingTable.position.y,
        craftingTable.position.z,
        1
      )
    )
  }
    const recipe = recipes[0]
  console.log('crafting...')
  await bot.craft(recipe, num, craftingTable)

  if (placedTable) {
    await collectBlock('crafting_table', 1)
  }

  const craftedItemMessage = `Successfully crafted ${itemName}, you now have ${bot.inventory.count(
    itemName
  )} ${itemName}.`
  return log(bot, craftedItemMessage, true)
}