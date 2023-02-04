import { start as startWebserver } from "./server"
import { start as startBot } from './domain/dj'

startWebserver().then(startBot)
