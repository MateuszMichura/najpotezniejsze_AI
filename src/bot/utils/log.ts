import { Bot } from 'mineflayer'

export const log = (
  bot: Bot,
  message: string,
  chat: boolean = false
): string => {
  console.log(message)
  if (chat) {
    bot.chat(message)
  }

  return message
}
