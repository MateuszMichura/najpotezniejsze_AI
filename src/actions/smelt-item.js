exports.smeltItem = async (bot, itemName, num = 1) => {
  //temp
  function log(bot, message, chat = false) {
    console.log(message);
    if (chat) bot.chat(message);
  }

  const foods = [
    "beef",
    "chicken",
    "cod",
    "mutton",
    "porkchop",
    "rabbit",
    "salmon",
    "tropical_fish",
  ];
  if (!itemName.includes("raw") && !foods.includes(itemName)) {
    log(
      bot,
      `Cannot smelt ${itemName}, must be a "raw" item, like "raw_iron".`,
      true
    );
    return false;
  }

  let placedFurnace = false;
  let furnaceBlock = undefined;
  const furnaceRange = 32;
  furnaceBlock = bot.findBlock({
    matching: (block) => block.name === "furnace",
    maxDistance: furnaceRange,
  });
  if (!furnaceBlock) {
    let hasFurnace = bot.inventory
      .items()
      .some((item) => item.name === "furnace");
    if (hasFurnace) {
      let pos = bot.entity.position.offset(1, 0, 0);
      await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0));
      furnaceBlock = bot.findBlock({
        matching: (block) => block.name === "furnace",
        maxDistance: furnaceRange,
      });
      placedFurnace = true;
    }
  }
  if (!furnaceBlock) {
    log(bot, `There is no furnace nearby and you have no furnace.`, true);
    return false;
  }
  if (bot.entity.position.distanceTo(furnaceBlock.position) > 4) {
    await bot.pathfinder.goto(
      new GoalNear(
        furnaceBlock.position.x,
        furnaceBlock.position.y,
        furnaceBlock.position.z,
        1
      )
    );
  }
  await bot.lookAt(furnaceBlock.position);

  console.log("smelting...");
  const furnace = await bot.openFurnace(furnaceBlock);
  let input_item = furnace.inputItem();

  if (input_item && input_item.name !== itemName && input_item.count > 0) {
    log(bot, `The furnace is currently smelting ${input_item.name}.`, true);
    if (placedFurnace) await collectBlock("furnace", 1);
    return false;
  }
  let inv_counts = bot.inventory.items().reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.count;
    return acc;
  }, {});
  if (!inv_counts[itemName] || inv_counts[itemName] < num) {
    log(bot, `You do not have enough ${itemName} to smelt.`, true);
    if (placedFurnace) await collectBlock("furnace", 1);
    return false;
  }

  if (!furnace.fuelItem()) {
    let fuel = bot.inventory
      .items()
      .find((item) => item.name === "coal" || item.name === "charcoal");
    let put_fuel = Math.ceil(num / 8);
    if (!fuel || fuel.count < put_fuel) {
      log(
        bot,
        `You do not have enough coal or charcoal to smelt ${num} ${itemName}, you need ${put_fuel} coal or charcoal`,
        true
      );
      if (placedFurnace) await collectBlock("furnace", 1);
      return false;
    }
    await furnace.putFuel(fuel.type, null, put_fuel);
    log(bot, `Added ${put_fuel} ${fuel.name} to furnace fuel.`, true);
    console.log(`Added ${put_fuel} ${fuel.name} to furnace fuel.`);
  }
  await furnace.putInput(bot.registry.itemsByName[itemName].id, null, num);
  let total = 0;
  let collected_last = true;
  let smelted_item = null;
  await new Promise((resolve) => setTimeout(resolve, 200));
  while (total < num) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log("checking...");
    let collected = false;
    if (furnace.outputItem()) {
      smelted_item = await furnace.takeOutput();
      if (smelted_item) {
        total += smelted_item.count;
        collected = true;
      }
    }
    if (!collected && !collected_last) {
      break;
    }
    collected_last = collected;
  }

  if (placedFurnace) {
    await collectBlock("furnace", 1);
  }
  if (total === 0) {
    log(bot, `Failed to smelt ${itemName}.`, true);
    return false;
  }
  if (total < num) {
    log(bot, `Only smelted ${total} ${smelted_item.name}.`, true);
    return false;
  }
  log(
    bot,
    `Successfully smelted ${itemName}, got ${total} ${smelted_item.name}.`,
    true
  );
  return true;
};
