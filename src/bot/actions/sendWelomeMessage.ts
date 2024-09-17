import { bot } from '../core/botConfig'

export const sendWelcomeMessage = () => {
  bot.chat(
    'Cześć! Jestem GroqBot, asystent Minecraft. Możesz komunikować się ze mną naturalnym językiem.'
  )
  bot.chat(
    "Przykłady: 'Co mogę skraftować?', 'Przetop 5 żelaza', 'Zaatakuj najbliższego zombie', 'Zbierz pobliskie przedmioty'"
  )
}
