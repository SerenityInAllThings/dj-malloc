import { getKey, setKey } from "./redis"

const defaultBotPrefix = 'dj'

const botPrefixKey = 'botPrefix'
let currentBotPrefix: string

const botLogChannelKey = 'botLogChannel'
let currentBotLogChannel: string

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

const getLogChannel = async () => {
  if (!currentBotLogChannel) {
    const stored = await getKey(botLogChannelKey)
    if (stored) {
      currentBotLogChannel = stored
      console.log(`Using bot prefix '${currentBotPrefix}'`)
    }
  }
  return currentBotLogChannel
}

const setLogChannel = async (newLogChannel: string) => {
  currentBotLogChannel = newLogChannel
  await setKey(botLogChannelKey, newLogChannel)
}

export { getBotPrefix, setBotPrefix, getLogChannel, setLogChannel }