export function sendWelcomeMessage(bot) {
  bot.chat(
    "Cześć! Jestem GroqBot, asystent Minecraft. Możesz komunikować się ze mną naturalnym językiem."
  );
  bot.chat(
    "Przykłady: 'Co mogę skraftować?', 'Przetop 5 żelaza', 'Zaatakuj najbliższego zombie', 'Zbierz pobliskie przedmioty'"
  );
}

export function findNearestPlayer(bot) {
  let nearestPlayer = null;
  let nearestDistance = Infinity;

  for (const playerName in bot.players) {
    const player = bot.players[playerName];
    if (player.entity && player.entity !== bot.entity) {
      const distance = bot.entity.position.distanceTo(player.entity.position);
      if (distance < nearestDistance) {
        nearestPlayer = player;
        nearestDistance = distance;
      }
    }
  }

  return nearestPlayer;
}

export function moveToPlayer(player) {
  const { x, y, z } = player.entity.position;
  bot.pathfinder.setGoal(new GoalNear(x, y, z, RANGE_GOAL));
}
