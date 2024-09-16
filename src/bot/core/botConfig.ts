import mineflayer from 'mineflayer'
import config from '../../../config.json'

const { BOT_USERNAME, BOT_HOST, BOT_PORT } = config

export const bot = mineflayer.createBot({
  username: BOT_USERNAME,
  host: BOT_HOST,
  port: BOT_PORT,
  version: '1.20.4',
})
