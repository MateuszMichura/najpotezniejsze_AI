import dotenv from 'dotenv'
dotenv.config()

import mineflayer from 'mineflayer'

import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
const { GoalNear } = goals

import fs from 'fs'

import { sendRequest } from './bot/api/api'
import { Vec3 } from 'vec3'

import {
  moveToPlayer,
  placeBlock,
  craftRecipe,
  attackNearestMob,
  clearNearestFurnace,
  findNearestPlayer,
  pickupNearbyItems,
  smeltItem,
  collectBlock,
  log,
} from './bot/utils/actions'

import config from '../config.json'

const { BOT_USERNAME, BOT_HOST, BOT_PORT } = config

const bot = mineflayer.createBot({
  username: BOT_USERNAME,
  host: BOT_HOST,
  port: BOT_PORT,
  version: '1.20.4',
})

interface HistoryItem {
  user: string
  bot: string
  result: string
}

bot.loadPlugin(pathfinder)

const fileContent = fs.readFileSync('./src/bot/utils/content.txt', 'utf-8') // Treść pliku content.txt
const history: HistoryItem[] = [] // Historia komunikacji z botem
let apiTimer = Date.now() // Timer do ograniczenia zapytań do API

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

async function eat(): Promise<string> {
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
      return 'Nie mam żadnego jedzenia w ekwipunku.'
    }

    await bot.equip(food, 'hand')
    await bot.consume()
    const message = `Zjadłem ${food.name}.`
    bot.chat(message)
    return message
  } catch (error) {
    console.error('Błąd podczas jedzenia:', error)
    bot.chat('Nie udało mi się zjeść.')
    return 'Nie udało mi się zjeść.'
  }
}

async function sleepInBed(): Promise<string> {
  try {
    const bed = bot.findBlock({
      matching: block => block.name.includes('bed'),
      maxDistance: 32,
    })

    if (!bed) {
      bot.chat('Nie mogę znaleźć łóżka w pobliżu.')
      return 'Nie mogę znaleźć łóżka w pobliżu.'
    }

    await bot.pathfinder.goto(
      new GoalNear(bed.position.x, bed.position.y, bed.position.z, 1)
    )
    await bot.sleep(bed)
    const message = 'Dobranoc! Idę spać.'
    bot.chat(message)
    return message
  } catch (error) {
    console.error('Błąd podczas próby spania:', error)
    bot.chat('Nie udało mi się pójść spać.')
    return 'Nie udało mi się pójść spać.'
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

  const block = bot.blockAt(bot.entity.position.offset(2, 1, 2))

  if (block) {
    // Zmiana na `bot.activateItem()` zamiast `bot.useOn(block)`
    await bot.activateItem()
    await sleep(100)
    bot.deactivateItem()
  } else {
    console.error('Blok nie został znaleziony.')
  }
}

async function moveAway(distance = 5): Promise<string> {
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
    if (i > 4)
      return 'Nie udało się znaleźć miejsca do oddalenia, po 4 razach przestaje szukać'

    try {
      await bot.pathfinder.goto(new GoalNear(newPos.x, newPos.y, newPos.z, 1))
      i++
      const message = `Oddaliłem się o ${distance} bloków.`
      bot.chat(message)
      return message
    } catch (error) {
      console.log('Nie mogę się ruszyć w tym kierunku, próbuję innego.')
    }
  }

  const errorMessage = 'Nie mogę się oddalić w żadnym kierunku.'
  bot.chat(errorMessage)
  return errorMessage
}
async function createNetherPortal(): Promise<string> {
  const obsidian = bot.inventory.items().find(item => item.name === 'obsidian')
  const flintAndSteel = bot.inventory
    .items()
    .find(item => item.name === 'flint_and_steel')

  if (!obsidian || obsidian.count < 10) {
    const message =
      'Nie mam wystarczająco dużo obsydianu, aby stworzyć portal Nether.'
    bot.chat(message)
    return message
  }
  if (!flintAndSteel) {
    const message = 'Nie mam krzesiwa i żelaza, aby stworzyć portal Nether.'
    bot.chat(message)
    return message
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

      const block = bot.blockAt(pos)
      if (block) {
        await bot.placeBlock(block, new Vec3(0, 1, 0))
      } else {
        console.error('Blok nie został znaleziony w pozycji:', pos)
      }
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

  const successMessage = 'Stworzyłem portal Nether.'
  bot.chat(successMessage)
  return successMessage
}

bot.on('chat', async (username, message) => {
  if (username === bot.username) return

  console.log(`[${username}]: ${message}`)

  let objective = 'brak'

  do {
    let botResponse = ''
    let actionResult: any = ''
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

        switch (
          command //wszystkie funkccje w switch musza zwracac w stringu rezultat akcji
        ) {
          case 'idź':
            const nearestPlayer: any = findNearestPlayer(bot)
            if (nearestPlayer) {
              bot.chat(`Idę do ${nearestPlayer.username}!`)
              moveToPlayer(bot, nearestPlayer)
            } else {
              bot.chat('Nie mogę znaleźć żadnego gracza w pobliżu.')
            }
            break
          case 'zbierz':
            if (args.length >= 2) {
              const count = parseInt(args[0])
              const blockType = args.slice(1).join('_')
              actionResult = await collectBlock(bot, blockType, count)
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
            try {
              const recipes = await bot.recipesAll(0, null, null)

              if (recipes && recipes.length > 0) {
                const recipeNames = recipes
                  .map(recipe => {
                    if (recipe.result && 'name' in recipe.result) {
                      return (recipe.result as { name: string }).name
                    }
                    return 'Nieznany przedmiot'
                  })
                  .join(', ')

                bot.chat(`Mogę skraftować: ${recipeNames}`)
              } else {
                bot.chat('Brak dostępnych przepisów do skraftowania.')
              }
            } catch (error) {
              console.error('Błąd podczas pobierania przepisów:', error)
              bot.chat('Nie udało się pobrać listy przepisów.')
            }
            break
          case 'podejdź_do_moba':
            // Implementacja podchodzenia do moba
            break
          case 'jedz':
            // Implementacja jedzenia
            actionResult = await eat()
            break
          case 'śpij':
            actionResult = await sleepInBed()
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
              const mobType: any = args.join('_')
              const result: any = await attackNearestMob(bot, mobType)
              if (result.success) {
                bot.chat(`Zaatakowałem ${result.attackedMob}.`)
              } else {
                bot.chat(result.error)
              }
            } else {
              const result: any = await attackNearestMob(bot)
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
    } catch (error: any) {
      console.error(
        'Ogólny błąd akcji:',
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
