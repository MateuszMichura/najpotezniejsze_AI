module.exports.log = (bot, message, chat = false) => {
  console.log(message)
  if (chat) bot.chat(message)

  return message
}
