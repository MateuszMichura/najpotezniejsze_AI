import fs from 'fs'
import {
  attackNearestMob,
  clearNearestFurnace,
  collectBlock,
  craftRecipe,
  createNetherPortal,
  defendSelf,
  eat,
  findNearestPlayer,
  fire,
  getRecipe,
  moveAway,
  moveToPlayer,
  pickupNearbyItems,
  placeBlock,
  sendWelcomeMessage,
  sleep,
  sleepInBed,
  smeltItem,
  toss,
} from '../utils/actions'
import { Movements, pathfinder } from 'mineflayer-pathfinder'
import { sendRequest } from '../api/api'
import { HistoryItem } from '../utils/types'
import { bot } from '../core/botConfig'

const fileContent = fs.readFileSync('./src/bot/utils/content.txt', 'utf-8') // Treść pliku content.txt
const history: HistoryItem[] = [] // Historia komunikacji z botem
let apiTimer = Date.now() // Timer do ograniczenia zapytań do API
let objective = 'brak' // globalna zmienna dla !ustaw_cel, musi byc globalna

export function setupBotEvents() {
  bot.loadPlugin(pathfinder)
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

  bot.on('chat', async (username: string, message: string) => {
    if (username === bot.username) return
    if (message[0] !== '!') return

    message = message.slice(1)
    console.log(`[${username}]: ${message}`)

    do {
      let botResponse: string = ''
      let actionResult: string = ''
      try {
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

        console.log('Ekwipunek:', inventory)
        console.log('Historia:', historyText)

        const systemContent =
          fileContent + `\nEkwipunek: ${inventory}\nHistoria: ${historyText}`

        if (Date.now() - apiTimer < 2000) await sleep(2000)
        apiTimer = Date.now()

        botResponse = await sendRequest(
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
              // Implementacja wyrzucania przedmiotów
              await toss(bot, args[0], parseInt(args[1]))
              break
            case 'oddal':
              // Implementacja oddalania się
              const distance = parseInt(args[0])
              if (Number.isNaN(distance))
                actionResult = 'Niepoprawna wartość odległości'
              else actionResult = await moveAway(bot, distance)

              break
            case 'stwórz_portal_nether':
              actionResult = await createNetherPortal()
              break
            case 'zapal':
              await fire()
              break
            case 'ustaw_cel':
              objective = botResponse.split('cel')[1]
              actionResult = 'Ustawiono cel - ' + objective
              break
            case 'usuń_cel':
              objective = 'brak'
              actionResult = 'Usunięto cel - ' + objective
              break
            case 'przepis':
              // Implementacja wyświetlania przepisu
              await getRecipe(bot, args[0])
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

        actionResult = error.response ? error.response.data : error.message
      }

      history.push({
        user: message || '',
        bot: botResponse || '',
        result: actionResult || '',
      })

      if (history.length > 100) history.shift()
    } while (objective !== 'brak')
  })

  bot.on('kicked', reason => {
    console.error('Zostałem wyrzucony z gry:', reason)
  })

  bot.on('end', message => {
    console.error('Bot został wyłączony. Wiadomość: ', message)
  })

  bot.on('error', err => {
    console.error('Błąd:', err)
  })
}
