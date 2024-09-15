require('dotenv').config() //Musi byc jako pierwsze

const mineflayer = require('mineflayer')
const {
  pathfinder,
  Movements,
  goals: { GoalNear },
} = require('mineflayer-pathfinder')
const Vec3 = require('vec3')
const fs = require('fs')
const { sendRequest } = require('./api')
const { moveToPlayer } = require('./bot/actions/moveToPlayer')
const { placeBlock } = require('./bot/actions/place-block')

const BOT_USERNAME = 'Lama'
const BOT_HOST = '136.243.134.246'
const BOT_PORT = '38210'
const GROQ_API_ENDPOINT = process.env.GROQ_API_ENDPOINT
const GROQ_API_KEY = process.env.GROQ_API_KEY

const RANGE_GOAL = 1

const bot = mineflayer.createBot({
  username: BOT_USERNAME,
  host: BOT_HOST,
  port: BOT_PORT,
  version: '1.20.4',
})

bot.loadPlugin(pathfinder)

const fileContent = fs.readFileSync('./content.txt', 'utf-8') // Treść pliku content.txt
const history = [] // Historia komunikacji z botem
let apiTimer = Date.now() // Timer do ograniczenia zapytań do API

function log(bot, message, chat = false) {
  console.log(message)
  if (chat) bot.chat(message)

  return message
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

bot.once('spawn', () => {
  console.log('Bot pojawił się w grze')
  const defaultMove = new Movements(bot)
  bot.pathfinder.setMovements(defaultMove)
  sendWelcomeMessage()

  bot.on('entityHurt', entity => {
    if (entity === bot.entity) {
      defendSelf(bot)
    }
  })
})

function sendWelcomeMessage() {
  bot.chat(
    'Cześć! Jestem GroqBot, asystent Minecraft. Możesz komunikować się ze mną naturalnym językiem.'
  )
  bot.chat(
    "Przykłady: 'Co mogę skraftować?', 'Przetop 5 żelaza', 'Zaatakuj najbliższego zombie', 'Zbierz pobliskie przedmioty'"
  )
}

function findNearestPlayer() {
  let nearestPlayer = null
  let nearestDistance = Infinity

  for (const playerName in bot.players) {
    const player = bot.players[playerName]
    if (player.entity && player.entity !== bot.entity) {
      const distance = bot.entity.position.distanceTo(player.entity.position)
      if (distance < nearestDistance) {
        nearestPlayer = player
        nearestDistance = distance
      }
    }
  }

  return nearestPlayer
}

async function collectBlock(blockType, num = 1) {
  try {
    const blocks = bot.findBlocks({
      matching: block => block.name === blockType,
      maxDistance: 320,
      count: num,
    })

    if (blocks.length === 0) {
      return log(bot, `Nie mogę znaleźć ${blockType} w pobliżu.`, true)
    }

    let collected = 0
    for (const blockPos of blocks) {
      if (collected >= num) break

      await bot.pathfinder.goto(
        new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2)
      )

      if (bot.canDigBlock(bot.blockAt(blockPos))) {
        await bot.dig(bot.blockAt(blockPos))
        collected++
      } else return log(bot, `Nie mogę zebrać ${blockType}.`, true)
    }

    return log(bot, `Zebrałem ${collected} ${blockType}.`, true)
  } catch (error) {
    console.error('Błąd podczas zbierania bloku:', error)
    const message = 'Wystąpił błąd podczas zbierania bloku.'
    bot.chat(message)

    return message
  }
}

async function craftRecipe(bot, itemName, num = 1) {
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

async function smeltItem(bot, itemName, num = 1) {
  try {
    const foods = [
      'beef',
      'chicken',
      'cod',
      'mutton',
      'porkchop',
      'rabbit',
      'salmon',
      'tropical_fish',
    ]
    if (!itemName.includes('raw') && !foods.includes(itemName)) {
      return log(
        bot,
        `Cannot smelt ${itemName}, must be a "raw" item, like "raw_iron".`,
        true
      )
    }

    let placedFurnace = false
    let furnaceBlock = undefined
    const furnaceRange = 32
    furnaceBlock = bot.findBlock({
      matching: block => block.name === 'furnace',
      maxDistance: furnaceRange,
    })
    if (!furnaceBlock) {
      let hasFurnace = bot.inventory
        .items()
        .some(item => item.name === 'furnace')
      if (hasFurnace) {
        let pos = bot.entity.position.offset(1, 0, 0)
        await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0))
        furnaceBlock = bot.findBlock({
          matching: block => block.name === 'furnace',
          maxDistance: furnaceRange,
        })
        placedFurnace = true
      }
    }
    if (!furnaceBlock) {
      return log(
        bot,
        `There is no furnace nearby and you have no furnace.`,
        true
      )
    }
    if (bot.entity.position.distanceTo(furnaceBlock.position) > 4) {
      await bot.pathfinder.goto(
        new GoalNear(
          furnaceBlock.position.x,
          furnaceBlock.position.y,
          furnaceBlock.position.z,
          1
        )
      )
    }
    await bot.lookAt(furnaceBlock.position)

    console.log('smelting...')
    console.log('furnace: ', furnaceBlock)
    const furnace = await bot.openFurnace(furnaceBlock)

    console.log('opened furnace...')
    let input_item = furnace.inputItem()
    console.log(input_item)

    if (input_item && input_item.name !== itemName && input_item.count > 0) {
      if (placedFurnace) await collectBlock('furnace', 1)
      return log(
        bot,
        `The furnace is currently smelting ${input_item.name}.`,
        true
      )
    }
    let inv_counts = bot.inventory.items().reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.count
      return acc
    }, {})
    if (!inv_counts[itemName] || inv_counts[itemName] < num) {
      if (placedFurnace) await collectBlock('furnace', 1)
      return log(bot, `You do not have enough ${itemName} to smelt.`, true)
    }

    if (!furnace.fuelItem()) {
      let fuel = bot.inventory
        .items()
        .find(item => item.name === 'coal' || item.name === 'charcoal')
      let put_fuel = Math.ceil(num / 8)
      if (!fuel || fuel.count < put_fuel) {
        if (placedFurnace) await collectBlock('furnace', 1)
        return log(
          bot,
          `You do not have enough coal or charcoal to smelt ${num} ${itemName}, you need ${put_fuel} coal or charcoal`,
          true
        )
      }
      await furnace.putFuel(fuel.type, null, put_fuel)
      log(bot, `Added ${put_fuel} ${fuel.name} to furnace fuel.`, true)
    }
    console.log(`putting ${num} ${itemName} into furnace...`)
    await furnace.putInput(bot.registry.itemsByName[itemName].id, null, num)
    console.log(`put ${num} ${itemName} into furnace...`)

    let total = 0
    let collected_last = true
    let smelted_item = null
    await new Promise(resolve => setTimeout(resolve, 200))
    while (total < num) {
      await new Promise(resolve => setTimeout(resolve, 10000))
      console.log('checking...')
      let collected = false
      if (furnace.outputItem()) {
        smelted_item = await furnace.takeOutput()
        if (smelted_item) {
          total += smelted_item.count
          collected = true
        }
      }
      if (!collected && !collected_last) {
        break
      }
      collected_last = collected
    }

    if (placedFurnace) {
      await collectBlock('furnace', 1)
    }
    if (total === 0) {
      return log(bot, `Failed to smelt ${itemName}.`, true)
    }
    if (total < num) {
      return log(bot, `Only smelted ${total} ${smelted_item.name}.`, true)
    }

    return log(
      bot,
      `Successfully smelted ${itemName}, got ${total} ${smelted_item.name}.`,
      true
    )
  } catch (error) {
    console.error('Błąd podczas przetapiania przedmiotu:', error)
    bot.chat('Wystąpił błąd podczas przetapiania przedmiotu.')

    return 'Wystąpił błąd podczas przetapiania przedmiotu.'
  }
}

async function clearNearestFurnace(bot) {
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

async function attackNearestMob(bot, specificType = null) {
  const entity = bot.nearestEntity(e => {
    if (e.type !== 'mob' && e.type !== 'animal') return false
    if (specificType && e.name.toLowerCase() !== specificType.toLowerCase())
      return false
    return true
  })

  if (!entity) {
    bot.chat(
      specificType
        ? `Nie znaleziono moba typu ${specificType} w pobliżu.`
        : 'Nie znaleziono żadnego moba w pobliżu.'
    )
    return { success: false, error: 'Nie znaleziono moba do ataku.' }
  }

  try {
    bot.chat(
      `Znaleziono moba: ${
        entity.name
      } w odległości ${bot.entity.position.distanceTo(entity.position)} bloków.`
    )
    await approachAndAttackUntilDead(bot, entity)
    return { success: true, attackedMob: entity.name }
  } catch (error) {
    console.error(error.stack)
    return {
      success: false,
      error: `Nie udało się zaatakować moba: ${error.message}`,
    }
  }
}

async function approachAndAttackUntilDead(bot, entity) {
  while (entity.isValid) {
    if (bot.entity.position.distanceTo(entity.position) > 3) {
      await bot.pathfinder.goto(
        new GoalNear(entity.position.x, entity.position.y, entity.position.z, 2)
      )
    }
    await bot.lookAt(entity.position.offset(0, entity.height, 0))
    await bot.attack(entity)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  console.log('entity: ', entity)

  if (!entity.isValid) {
    await pickupNearbyItems(bot)

    return log(bot, `Zabiłem ${entity.name}.`, true)
  } else {
    return log(bot, `Przerwano atak na ${entity.name}.`, true)
  }
}

async function defendSelf(bot, range = 9) {
  let attacked = false
  let enemy = bot.nearestEntity(
    entity =>
      entity.type === 'mob' &&
      bot.entity.position.distanceTo(entity.position) < range &&
      entity.name !== 'Armor Stand'
  )
  while (enemy) {
    if (bot.entity.position.distanceTo(enemy.position) > 3) {
      try {
        await bot.pathfinder.goto(
          new GoalNear(enemy.position.x, enemy.position.y, enemy.position.z, 2)
        )
      } catch (err) {
        console.error('Błąd podczas podchodzenia do przeciwnika:', err)
      }
    }
    try {
      await bot.attack(enemy)
      attacked = true
    } catch (err) {
      console.error('Błąd podczas atakowania przeciwnika:', err)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    enemy = bot.nearestEntity(
      entity =>
        entity.type === 'mob' &&
        bot.entity.position.distanceTo(entity.position) < range &&
        entity.name !== 'Armor Stand'
    )
  }
  if (attacked) {
    return log(bot, `Obroniłem się przed atakiem.`, true)
  } else {
    return log(bot, `Nie znalazłem żadnych wrogów w pobliżu.`, true)
  }
}

async function pickupNearbyItems(bot) {
  const distance = 8
  const getNearestItem = bot =>
    bot.nearestEntity(
      entity =>
        entity.name === 'item' &&
        bot.entity.position.distanceTo(entity.position) < distance
    )
  let nearestItem = getNearestItem(bot)
  let pickedUp = 0
  while (nearestItem) {
    bot.pathfinder.setMovements(new Movements(bot))
    await bot.pathfinder.goto(
      new GoalNear(
        nearestItem.position.x,
        nearestItem.position.y,
        nearestItem.position.z,
        1
      )
    )
    await new Promise(resolve => setTimeout(resolve, 200))
    let prev = nearestItem
    nearestItem = getNearestItem(bot)
    if (prev === nearestItem) {
      break
    }
    pickedUp++
  }

  return log(bot, `Picked up ${pickedUp} items.`, true)
}

async function eat() {
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
      return
    }

    await bot.equip(food, 'hand')
    await bot.consume()
    bot.chat(`Zjadłem ${food.name}.`)
  } catch (error) {
    console.error('Błąd podczas jedzenia:', error)
    bot.chat('Nie udało mi się zjeść.')
  }
}

async function sleepBed() {
  try {
    const bed = bot.findBlock({
      matching: block => block.name.includes('bed'),
      maxDistance: 32,
    })

    if (!bed) {
      bot.chat('Nie mogę znaleźć łóżka w pobliżu.')
      return
    }

    await bot.pathfinder.goto(
      new GoalNear(bed.position.x, bed.position.y, bed.position.z, 1)
    )
    await bot.sleep(bed)
    bot.chat('Dobranoc! Idę spać.')
  } catch (error) {
    console.error('Błąd podczas próby spania:', error)
    bot.chat('Nie udało mi się pójść spać.')
  }
}

async function fire() {
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!flintAndSteel) {
    bot.chat('Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.')
    return
  }

  await bot.lookAt(bot.entity.position.offset(2, 1, 2))
  console.log('fire...')
  await bot.equip(flintAndSteel, 'hand')
  bot.useOn(bot.blockAt(bot.entity.position.offset(2, 1, 2)))
}

async function moveAway(distance = 5) {
  const currentPos = bot.entity.position
  const directions = [
    new Vec3(1, 0, 0),
    new Vec3(-1, 0, 0),
    new Vec3(0, 0, 1),
    new Vec3(0, 0, -1),
  ]

  let i = 0

  for (const direction of directions) {
    const newPos = currentPos.plus(direction.scaled(distance))
    if (i > 4) return // Nie udało się znaleźć miejsca do oddalenia, po 4 razach przestaje szukac

    try {
      await bot.pathfinder.goto(new GoalNear(newPos.x, newPos.y, newPos.z, 1))
      i++
      bot.chat('Oddaliłem się o ${distance} bloków.')
      return
    } catch (error) {
      console.log('Nie mogę się ruszyć w tym kierunku, próbuję innego.')
    }
  }
  bot.chat('Nie mogę się oddalić w żadnym kierunku.')
}
async function createNetherPortal() {
  const obsidian = bot.inventory.items().find(item => item.name === 'obsidian')
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!obsidian || obsidian.count < 10) {
    bot.chat(
      'Nie mam wystarczająco dużo obsydianu, aby stworzyć portal Nether.'
    )
    return
  }
  if (!flintAndSteel) {
    bot.chat('Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.')
    return
  }

  await bot.equip(obsidian, 'hand')

  const portalBlocks = [
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 0, z: 1 },
    { x: 2, y: 0, z: 2 },
    { x: 2, y: 0, z: 3 },
    { x: 2, y: 1, z: 0 },
    { x: 2, y: 1, z: 3 },
    { x: 2, y: 2, z: 0 },
    { x: 2, y: 2, z: 3 },
    { x: 2, y: 3, z: 0 },
    { x: 2, y: 3, z: 3 },
    { x: 2, y: 4, z: 0 },
    { x: 2, y: 4, z: 1 },
    { x: 2, y: 4, z: 2 },
    { x: 2, y: 4, z: 3 },
  ]

  for (const blockPos of portalBlocks) {
    try {
      const pos = bot.entity.position.offset(blockPos.x, blockPos.y, blockPos.z)
      await bot.lookAt(pos)
      await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0)) //serwer czasem nei wysyla response o update bloku i dlatego try i bez await, bo sie buguje
    } catch (error) {
      console.error('Błąd podczas stawiania bloku:', error)
    }
  }

  await bot.lookAt(
    bot.entity.position.offset(
      portalBlocks[1].x,
      portalBlocks[1].y,
      portalBlocks[1].z
    )
  )
  await bot.equip(flintAndSteel, 'hand')
  bot.activateItem()
  await sleep(100)
  bot.deactivateItem()

  bot.chat('Stworzyłem portal Nether.')
}

bot.on('chat', async (username, message) => {
  if (username === bot.username) return

  console.log(`[${username}]: ${message}`)

  let objective = 'brak'

  do {
    let botResponse = ''
    let actionResult = ''
    try {
      // const availableRecipes = await bot.recipesAll(null, null, null)
      // const reciepiesToCraft = availableRecipes
      //   .map(r => r.result.name)
      //   .join(', ')

      // console.log("Rzeczy do skraftowania: ", reciepiesToCraft);

      const inventory = bot.inventory
        .items()
        .map(item => item.name + '*' + item.count)
        .join(', ')

      const historyText = history
        .map(
          ({ user, bot, result }) =>
            `user: ${user}, bot: ${bot}, result:${result}`
        )
        .join('; ')

      const systemContent =
        fileContent + `\nEkwipunek ${inventory}\nHistoria: ${historyText}`

      if (Date.now() - apiTimer < 2000) await sleep(2000)
      apiTimer = Date.now()

      const botResponse = await sendRequest(
        objective === 'brak'
          ? message
          : 'Kontynuuj działanie na bazie historii',
        systemContent
      )

      if (!botResponse) {
        return bot.chat('Nie udało się zrealizować akcji.')
      }

      console.log(`[Bot]: ${botResponse}`)
      bot.chat(botResponse)

      if (botResponse.startsWith('!') || botResponse.startsWith('`!')) {
        const [command, ...args] = botResponse
          .replaceAll('`', '')
          .slice(1)
          .split(' ')

        actionResult = 'Nie udało się zrealizować akcji.'

        switch (command) {
          case 'idź':
            const nearestPlayer = findNearestPlayer()
            if (nearestPlayer) {
              moveToPlayer(nearestPlayer)
              bot.chat(`Idę do ${nearestPlayer.username}!`)
            } else {
              bot.chat('Nie mogę znaleźć żadnego gracza w pobliżu.')
            }
            break
          case 'zbierz':
            if (args.length >= 2) {
              const count = parseInt(args[0])
              const blockType = args.slice(1).join('_')
              actionResult = await collectBlock(blockType, count)
            } else {
              bot.chat(
                'Niepoprawna komenda zbierania. Użyj: !zbierz [liczba] [typ_bloku]'
              )
            }
            break
          case 'kraftuj':
            if (args.length >= 2) {
              const item = args[0]
              const count = parseInt(args[1]) || 1
              actionResult = await craftRecipe(bot, item, count)
            } else {
              bot.chat(
                'Niepoprawna komenda kraftowania. Użyj: !kraftuj [przedmiot] [liczba]'
              )
            }
            break
          case 'lista_kraftowania':
            const recipes = await bot.recipesAll(null, null, null)
            bot.chat(
              `Mogę skraftować: ${recipes.map(r => r.result.name).join(', ')}`
            )
            break
          case 'podejdź_do_moba':
            // Implementacja podchodzenia do moba
            break
          case 'jedz':
            // Implementacja jedzenia
            actionResult = await eat()
            break
          case 'śpij':
            actionResult = await sleepBed()
            break
          case 'przetop':
            if (args.length >= 2) {
              const item = args[0]
              const count = parseInt(args[1]) || 1
              actionResult = await smeltItem(bot, item, count)
            } else {
              bot.chat(
                'Niepoprawna komenda przetapiania. Użyj: !przetop [przedmiot] [liczba]'
              )
            }
            break
          case 'wyczyść_piec':
            actionResult = await clearNearestFurnace(bot)
            break
          case 'atakuj_moba':
            if (args.length > 0) {
              const mobType = args.join('_')
              const result = await attackNearestMob(bot, mobType)
              if (result.success) {
                bot.chat(`Zaatakowałem ${result.attackedMob}.`)
              } else {
                bot.chat(result.error)
              }
            } else {
              const result = await attackNearestMob(bot)
              if (result.success) {
                bot.chat(
                  `Zaatakowałem najbliższego moba: ${result.attackedMob}.`
                )
              } else {
                bot.chat(result.error)
              }
            }
            break
          case 'atakuj_jednostkę':
            // Implementacja atakowania jednostki
            break
          case 'zbierz_przedmioty':
            actionResult = await pickupNearbyItems(bot)
            break
          case 'umieść_blok':
            // Implementacja umieszczania bloku
            actionResult = await placeBlock(bot, args[0])
            break
          case 'wyposażenie':
            // Implementacja wyposażania
            break
          case 'wyrzuć':
            // Implementacja wyrzucania przedmiotu
            break
          case 'oddal':
            // Implementacja oddalania się
            actionResult = await moveAway(10)
            break

          case 'stwórz_portal_nether':
            actionResult = await createNetherPortal()
            break
          case 'zapal':
            await fire()
            break
          case 'ustaw_cel':
            objective = botResponse.split('cel')[1]
            break
          case 'usuń_cel':
            objective = 'brak'
            break
          default:
            bot.chat('Nie rozumiem tej komendy.')
        }

        console.log('koniec akcji')
      }
    } catch (error) {
      console.error(
        'Błąd komunikacji z API Groq:',
        error.response ? error.response.data : error.message
      )
      bot.chat('Przepraszam, mam problemy ze zrozumieniem w tej chwili.')
    }

    history.push({
      user: message || '',
      bot: botResponse || '',
      result: actionResult || '',
    })
    if (history.length > 100) history.shift()
  } while (objective !== 'brak')
})

bot.on('error', err => {
  console.error('Błąd:', err)
})

console.log(
  'Bot Minecraft z integracją Groq i wszystkimi funkcjonalnościami jest uruchomiony...'
)
