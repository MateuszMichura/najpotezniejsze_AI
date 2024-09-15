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
