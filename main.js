const mineflayer = require("mineflayer");
const axios = require("axios");

require("dotenv").config();

const {
  pathfinder,
  Movements,
  goals: { GoalNear },
} = require("mineflayer-pathfinder");
const Vec3 = require("vec3");

const BOT_USERNAME = process.env.BOT_USERNAME;
const BOT_HOST = process.env.BOT_HOST;
const BOT_PORT = process.env.BOT_PORT;
const GROQ_API_ENDPOINT = process.env.GROQ_API_ENDPOINT;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const RANGE_GOAL = process.env.RANGE_GOAL;

const bot = mineflayer.createBot({
  username: BOT_USERNAME,
  host: BOT_HOST,
  port: BOT_PORT,
  version: "1.20.4",
});

bot.loadPlugin(pathfinder);

function log(bot, message, chat = false) {
  console.log(message);
  if (chat) bot.chat(message);
}

bot.once("spawn", () => {
  console.log("Bot pojawił się w grze");
  const defaultMove = new Movements(bot);
  bot.pathfinder.setMovements(defaultMove);
  sendWelcomeMessage();

  bot.on("entityHurt", (entity) => {
    if (entity === bot.entity) {
      defendSelf(bot);
    }
  });
});

function sendWelcomeMessage() {
  bot.chat(
    "Cześć! Jestem GroqBot, asystent Minecraft. Możesz komunikować się ze mną naturalnym językiem."
  );
  bot.chat(
    "Przykłady: 'Co mogę skraftować?', 'Przetop 5 żelaza', 'Zaatakuj najbliższego zombie', 'Zbierz pobliskie przedmioty'"
  );
}

function findNearestPlayer() {
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

function moveToPlayer(player) {
  const { x, y, z } = player.entity.position;
  bot.pathfinder.setGoal(new GoalNear(x, y, z, RANGE_GOAL));
}

async function collectBlock(blockType, num = 1) {
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

async function craftRecipe(bot, itemName, num = 1) {
  let placedTable = false;

  if (itemName.endsWith("plank")) itemName += "s";

  let recipes = bot.recipesFor(
    bot.registry.itemsByName[itemName].id,
    null,
    1,
    null
  );
  let craftingTable = null;
  const craftingTableRange = 32;
  if (!recipes || recipes.length === 0) {
    craftingTable = bot.findBlock({
      matching: (block) => block.name === "crafting_table",
      maxDistance: craftingTableRange,
    });
    if (craftingTable === null) {
      let hasTable = bot.inventory
        .items()
        .some((item) => item.name === "crafting_table");
      if (hasTable) {
        let pos = bot.entity.position.offset(1, 0, 0);
        await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0));
        craftingTable = bot.findBlock({
          matching: (block) => block.name === "crafting_table",
          maxDistance: craftingTableRange,
        });
        if (craftingTable) {
          recipes = bot.recipesFor(
            bot.registry.itemsByName[itemName].id,
            null,
            1,
            craftingTable
          );
          placedTable = true;
        }
      } else {
        log(
          bot,
          `You either do not have enough resources to craft ${itemName} or it requires a crafting table.`,
          true
        );
        return false;
      }
    } else {
      recipes = bot.recipesFor(
        bot.registry.itemsByName[itemName].id,
        null,
        1,
        craftingTable
      );
    }
  }
  if (!recipes || recipes.length === 0) {
    log(bot, `You do not have the resources to craft a ${itemName}.`, true);
    if (placedTable) {
      await collectBlock("crafting_table", 1);
    }
    return false;
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
    );
  }

  const recipe = recipes[0];
  console.log("crafting...");
  await bot.craft(recipe, num, craftingTable);
  log(
    bot,
    `Successfully crafted ${itemName}, you now have ${bot.inventory.count(
      itemName
    )} ${itemName}.`,
    true
  );
  if (placedTable) {
    await collectBlock("crafting_table", 1);
  }
  return true;
}

async function smeltItem(bot, itemName, num = 1) {
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
}

async function clearNearestFurnace(bot) {
  let furnaceBlock = bot.findBlock({
    matching: (block) => block.name === "furnace",
    maxDistance: 6,
  });
  if (!furnaceBlock) {
    log(bot, `There is no furnace nearby.`, true);
    return false;
  }

  console.log("clearing furnace...");
  const furnace = await bot.openFurnace(furnaceBlock);
  console.log("opened furnace...");
  let smelted_item, input_item, fuel_item;
  if (furnace.outputItem()) smelted_item = await furnace.takeOutput();
  if (furnace.inputItem()) input_item = await furnace.takeInput();
  if (furnace.fuelItem()) fuel_item = await furnace.takeFuel();
  console.log(smelted_item, input_item, fuel_item);
  let smelted_name = smelted_item
    ? `${smelted_item.count} ${smelted_item.name}`
    : `0 smelted items`;
  let input_name = input_item
    ? `${input_item.count} ${input_item.name}`
    : `0 input items`;
  let fuel_name = fuel_item
    ? `${fuel_item.count} ${fuel_item.name}`
    : `0 fuel items`;
  log(
    bot,
    `Cleared furnace, received ${smelted_name}, ${input_name}, and ${fuel_name}.`,
    true
  );
  return true;
}

async function attackNearestMob(bot) {
  const entity = bot.nearestEntity(
    (e) => e.type === "mob" || e.type === "animal" || e.type === "monster"
  );
  if (!entity) {
    bot.chat("Nie znaleziono żadnego moba w pobliżu.");
    return { success: false, error: "Nie znaleziono moba do ataku." };
  }

  try {
    bot.chat(
      `Znaleziono moba: ${
        entity.name
      } w odległości ${bot.entity.position.distanceTo(entity.position)} bloków.`
    );
    await bot.pathfinder.goto(
      new GoalNear(entity.position.x, entity.position.y, entity.position.z, 2)
    );
    await bot.lookAt(entity.position.offset(0, entity.height, 0));
    await bot.attack(entity);
    return { success: true, attackedMob: entity.name };
  } catch (error) {
    console.error(error.stack);
    return {
      success: false,
      error: `Nie udało się zaatakować moba: ${error.message}`,
    };
  }
}

async function attackEntity(bot, entity, kill = true) {
  let pos = entity.position;

  if (bot.entity.position.distanceTo(pos) > 5) {
    console.log("Podchodzenie do moba...");
    await bot.pathfinder.goto(new GoalNear(pos.x, pos.y, pos.z, 2));
  }

  if (!kill) {
    console.log("Atakowanie moba tylko raz...");
    await bot.attack(entity);
  } else {
    console.log("Atakowanie moba aż do jego śmierci...");
    while (entity.isValid && bot.entity.health > 0) {
      if (bot.entity.position.distanceTo(entity.position) > 3) {
        await bot.pathfinder.goto(
          new GoalNear(
            entity.position.x,
            entity.position.y,
            entity.position.z,
            2
          )
        );
      }
      await bot.attack(entity);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    log(bot, `Zabiłem ${entity.name}.`, true);
    await pickupNearbyItems(bot);
  }
  return true;
}

async function defendSelf(bot, range = 9) {
  let attacked = false;
  let enemy = bot.nearestEntity(
    (entity) =>
      entity.type === "mob" &&
      bot.entity.position.distanceTo(entity.position) < range &&
      entity.name !== "Armor Stand"
  );
  while (enemy) {
    if (bot.entity.position.distanceTo(enemy.position) > 3) {
      try {
        await bot.pathfinder.goto(
          new GoalNear(enemy.position.x, enemy.position.y, enemy.position.z, 2)
        );
      } catch (err) {
        console.error("Błąd podczas podchodzenia do przeciwnika:", err);
      }
    }
    try {
      await bot.attack(enemy);
      attacked = true;
    } catch (err) {
      console.error("Błąd podczas atakowania przeciwnika:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    enemy = bot.nearestEntity(
      (entity) =>
        entity.type === "mob" &&
        bot.entity.position.distanceTo(entity.position) < range &&
        entity.name !== "Armor Stand"
    );
  }
  if (attacked) {
    log(bot, `Obroniłem się przed atakiem.`, true);
  } else {
    log(bot, `Nie znalazłem żadnych wrogów w pobliżu.`, true);
  }
  return attacked;
}

async function pickupNearbyItems(bot) {
  const distance = 8;
  const getNearestItem = (bot) =>
    bot.nearestEntity(
      (entity) =>
        entity.name === "item" &&
        bot.entity.position.distanceTo(entity.position) < distance
    );
  let nearestItem = getNearestItem(bot);
  let pickedUp = 0;
  while (nearestItem) {
    bot.pathfinder.setMovements(new Movements(bot));
    await bot.pathfinder.goto(
      new GoalNear(
        nearestItem.position.x,
        nearestItem.position.y,
        nearestItem.position.z,
        1
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    let prev = nearestItem;
    nearestItem = getNearestItem(bot);
    if (prev === nearestItem) {
      break;
    }
    pickedUp++;
  }
  log(bot, `Picked up ${pickedUp} items.`, true);
  return true;
}

bot.on("chat", async (username, message) => {
  if (username === bot.username) return;

  console.log(`[${username}]: ${message}`);

  try {
    const availableRecipes = await bot.recipesAll(null, null, null);

    const response = await axios.post(
      GROQ_API_ENDPOINT,
      {
        messages: [
          {
            role: "system",
            content: `Jesteś pomocnym asystentem Minecraft. Odpowiadaj krótko i zwięźle. Interpretuj polecenia gracza i odpowiadaj odpowiednimi komendami:
                    - Gdy gracz prosi o zaatakowanie moba: '!atakuj_moba [typ_moba]', np. '!atakuj_moba zombie'
                    - Gdy gracz prosi o podejście do pasywnego moba: '!podejdź_do_moba [typ_moba]', np. '!podejdź_do_moba sheep'
                    - Gdy gracz pyta o możliwości kraftowania: '!lista_kraftowania'
                    - Gdy gracz prosi o skraftowanie przedmiotu: '!kraftuj [przedmiot] [liczba]', np. '!kraftuj wooden_shovel 1'
                    - Gdy gracz prosi o zebranie bloków: '!zbierz [liczba] [typ_bloku]', np. '!zbierz 10 oak_log'
                    - Gdy gracz prosi o podejście: '!idź'
                    - Gdy gracz prosi o jedzenie: '!jedz'
                    - Gdy gracz prosi o pójście spać: '!śpij'
                    - Gdy gracz prosi o przetopienie przedmiotu: '!przetop [przedmiot] [liczba]', np. '!przetop iron_ore 5'
                    - Gdy gracz prosi o wyczyszczenie pieca: '!wyczyść_piec'
                    - Gdy gracz prosi o zaatakowanie najbliższego moba: '!atakuj_moba', np. '!atakuj_moba'
                    - Gdy gracz prosi o zaatakowanie jednostki: '!atakuj_jednostkę [id]', np. '!atakuj_jednostkę 12345'
                    - Gdy gracz prosi o zebranie pobliskich przedmiotów: '!zbierz_przedmioty'
                    - Gdy gracz prosi o umieszczenie bloku: '!umieść_blok [typ_bloku]', np. '!umieść_blok stone'
                    - Gdy gracz prosi o wyposażenie się: '!wyposażenie [przedmiot] [slot]', np. '!wyposażenie diamond_sword hand'
                    - Gdy gracz prosi o wyrzucenie przedmiotu: '!wyrzuć [przedmiot] [liczba]', np. '!wyrzuć dirt 64'
                    - Gdy gracz prosi o oddalenie się: '!oddal [dystans]', np. '!oddal 10'
                    
                    Dostępne do skraftowania przedmioty: ${availableRecipes
                      .map((r) => r.result.name)
                      .join(", ")}
                    
                    Przykłady:
                    - Gracz: "Co mogę skraftować?"
                      Ty: "!lista_kraftowania"
                    - Gracz: "Zrób mi drewnianą łopatę"
                      Ty: "!kraftuj wooden_shovel 1"
                    - Gracz: "Zbierz dla mnie 5 bloków dębu"
                      Ty: "!zbierz 5 oak_log"
                    - Gracz: "Podejdź do mnie"
                      Ty: "!idź"
                    - Gracz: "Jestem głodny"
                      Ty: "!jedz"
                    - Gracz: "Czas spać"
                      Ty: "!śpij"
                    - Gracz: "Przetop 3 sztuki żelaznej rudy"
                      Ty: "!przetop iron_ore 3"
                    - Gracz: "Wyczyść piec"
                      Ty: "!wyczyść_piec"
                    - Gracz: "Zaatakuj najbliższego szkieleta"
                      Ty: "!atakuj_moba"
                    - Gracz: "Zbierz przedmioty leżące dookoła"
                      Ty: "!zbierz_przedmioty"
                    - Gracz: "Postaw blok kamienia obok mnie"
                      Ty: "!umieść_blok stone"
                    - Gracz: "Załóż diamentowy miecz"
                      Ty: "!wyposażenie diamond_sword hand"
                    - Gracz: "Wyrzuć 64 bloki ziemi"
                      Ty: "!wyrzuć dirt 64"
                    - Gracz: "Oddal się o 10 bloków"
                      Ty: "!oddal 10"
                    `,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "llama-3.1-70b-versatile",
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const botResponse = response.data.choices[0]?.message?.content || "";
    console.log(`[Bot]: ${botResponse}`);
    bot.chat(botResponse);

    if (botResponse.startsWith("!")) {
      const [command, ...args] = botResponse.slice(1).split(" ");
      switch (command) {
        case "idź":
          const nearestPlayer = findNearestPlayer();
          if (nearestPlayer) {
            moveToPlayer(nearestPlayer);
            bot.chat(`Idę do ${nearestPlayer.username}!`);
          } else {
            bot.chat("Nie mogę znaleźć żadnego gracza w pobliżu.");
          }
          break;
        case "zbierz":
          if (args.length >= 2) {
            const count = parseInt(args[0]);
            const blockType = args.slice(1).join("_");
            await collectBlock(blockType, count);
          } else {
            bot.chat(
              "Niepoprawna komenda zbierania. Użyj: !zbierz [liczba] [typ_bloku]"
            );
          }
          break;
        case "kraftuj":
          if (args.length >= 2) {
            const item = args[0];
            const count = parseInt(args[1]) || 1;
            await craftRecipe(bot, item, count);
          } else {
            bot.chat(
              "Niepoprawna komenda kraftowania. Użyj: !kraftuj [przedmiot] [liczba]"
            );
          }
          break;
        case "lista_kraftowania":
          const recipes = await bot.recipesAll(null, null, null);
          bot.chat(
            `Mogę skraftować: ${recipes.map((r) => r.result.name).join(", ")}`
          );
          break;
        case "podejdź_do_moba":
          // Implementacja podchodzenia do moba
          break;
        case "jedz":
          // Implementacja jedzenia
          break;
        case "śpij":
          // Implementacja snu
          break;
        case "przetop":
          if (args.length >= 2) {
            const item = args[0];
            const count = parseInt(args[1]) || 1;
            await smeltItem(bot, item, count);
          } else {
            bot.chat(
              "Niepoprawna komenda przetapiania. Użyj: !przetop [przedmiot] [liczba]"
            );
          }
          break;
        case "wyczyść_piec":
          await clearNearestFurnace(bot);
          break;
        case "atakuj_moba":
          const result = await attackNearestMob(bot);
          if (result.success) {
            bot.chat(`Zaatakowałem ${result.attackedMob}.`);
          } else {
            bot.chat(result.error);
          }
          break;
        case "atakuj_jednostkę":
          // Implementacja atakowania jednostki
          break;
        case "zbierz_przedmioty":
          await pickupNearbyItems(bot);
          break;
        case "umieść_blok":
          // Implementacja umieszczania bloku
          break;
        case "wyposażenie":
          // Implementacja wyposażania
          break;
        case "wyrzuć":
          // Implementacja wyrzucania przedmiotu
          break;
        case "oddal":
          // Implementacja oddalania się
          break;
        default:
          bot.chat("Nie rozumiem tej komendy.");
      }
    }
  } catch (error) {
    console.error(
      "Błąd komunikacji z API Groq:",
      error.response ? error.response.data : error.message
    );
    bot.chat("Przepraszam, mam problemy ze zrozumieniem w tej chwili.");
  }
});

bot.on("error", (err) => {
  console.error("Błąd:", err);
});

bot.on("entityHurt", (entity) => {
  if (entity === bot.entity) {
    defendSelf(bot);
  }
});

console.log(
  "Bot Minecraft z integracją Groq i wszystkimi funkcjonalnościami jest uruchomiony..."
);
