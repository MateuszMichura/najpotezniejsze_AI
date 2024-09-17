import dotenv from 'dotenv'
dotenv.config({ path: ['.env.local', '.env'] })

import { setupBotEvents } from './bot/core/botEvents'

console.log(
  `Bot Minecraft z integracją ${process.env.AI_PROVIDER} i wszystkimi funkcjonalnościami jest uruchomiony...`
)

setupBotEvents()
