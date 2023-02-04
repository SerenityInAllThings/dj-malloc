import { start as startWebserver } from "./server"
import { start as startBot } from './domain/dj/discordClient'

startWebserver().then(startBot)
