import fs from 'fs'
import {
  collectBlock,
  craftRecipe,
  defendSelf,
  findNearestPlayer,
  moveToPlayer,
  sendWelcomeMessage,
  sleep,
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
      let botResponse: any = ''
      let actionResult: any = ''
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

          switch (command) {
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
            // Kontynuacja wszystkich przypadków switcha...
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
