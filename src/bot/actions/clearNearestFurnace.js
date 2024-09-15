module.exports.clearNearestFurnace = async bot => {
  let furnaceBlock = bot.findBlock({
    matching: block => block.name === 'furnace',
    maxDistance: 6,
  })
  if (!furnaceBlock) {
    return log(bot, `There is no furnace nearby.`, true)
  }

  console.log('clearing furnace...')
  const furnace = await bot.openFurnace(furnaceBlock)
  console.log('opened furnace...')
  let smelted_item, input_item, fuel_item
  if (furnace.outputItem()) smelted_item = await furnace.takeOutput()
  if (furnace.inputItem()) input_item = await furnace.takeInput()
  if (furnace.fuelItem()) fuel_item = await furnace.takeFuel()
  console.log(smelted_item, input_item, fuel_item)
  let smelted_name = smelted_item
    ? `${smelted_item.count} ${smelted_item.name}`
    : `0 smelted items`
  let input_name = input_item
    ? `${input_item.count} ${input_item.name}`
    : `0 input items`
  let fuel_name = fuel_item
    ? `${fuel_item.count} ${fuel_item.name}`
    : `0 fuel items`

  return log(
    bot,
    `Cleared furnace, received ${smelted_name}, ${input_name}, and ${fuel_name}.`,
    true
  )
}
