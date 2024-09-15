export async function collectBlock(bot, blockType, num = 1) {
  try {
    const blocks = bot.findBlocks({
      matching: (block) => block.name === blockType,
      maxDistance: 32,
      count: num,
    });

    if (blocks.length === 0) {
      bot.chat(`Nie mogę znaleźć ${blockType} w pobliżu.`);
      return;
    }

    let collected = 0;
    for (const blockPos of blocks) {
      if (collected >= num) break;

      await bot.pathfinder.goto(
        new GoalNear(blockPos.x, blockPos.y, blockPos.z, 1)
      );
      await bot.dig(bot.blockAt(blockPos));
      collected++;
    }

    bot.chat(`Zebrałem ${collected} ${blockType}.`);
  } catch (error) {
    console.error("Błąd podczas zbierania bloku:", error);
    bot.chat("Wystąpił błąd podczas zbierania bloku.");
  }
}
