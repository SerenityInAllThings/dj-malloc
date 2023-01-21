import { getKey, setKey } from "./redis"

const defaultBotPrefix = 'dj'
const botPrefixKey = 'botPrefix'
let currentBotPrefix: string

const getBotPrefix = async () => {
  if (!currentBotPrefix) {
    const stored = await getKey(botPrefixKey)
    if (stored) {
      currentBotPrefix = stored
      console.log(`Using bot prefix '${currentBotPrefix}'`)
    }
  }
  return currentBotPrefix || defaultBotPrefix
}

const setBotPrefix = async (newPrefix: string) => {
  currentBotPrefix = newPrefix
  await setKey(botPrefixKey, newPrefix)
}

export { getBotPrefix, setBotPrefix }