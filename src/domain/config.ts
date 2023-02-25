import { getKey, setKey } from "../clients/redis"

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

const botLogChannelKey = 'botLogChannel'
let currentBotLogChannel: string

const getLogChannel = async () => {
  if (!currentBotLogChannel) {
    const stored = await getKey(botLogChannelKey)
    if (stored) {
      currentBotLogChannel = stored
      console.log(`Using bot log channel '${currentBotLogChannel}'`)
    }
  }
  return currentBotLogChannel
}

const setLogChannel = async (newLogChannelId: string) => {
  currentBotLogChannel = newLogChannelId
  await setKey(botLogChannelKey, newLogChannelId)
}

const botVoiceChannelKey = 'botVoiceChannel'
let currentBotVoiceChannel: string

const getVoiceChannel = async () => {
  if (!currentBotVoiceChannel) {
    const stored = await getKey(botVoiceChannelKey)
    if (stored) {
      currentBotVoiceChannel = stored
      console.log(`Using bot voice channel '${currentBotVoiceChannel}'`)
    }
  }

  return currentBotVoiceChannel
}

const setVoiceChannel = async (newVoiceChannelId: string) => {
  currentBotVoiceChannel = newVoiceChannelId
  await setKey(botVoiceChannelKey, newVoiceChannelId)
}

export { getBotPrefix, setBotPrefix, getLogChannel, setLogChannel, getVoiceChannel, setVoiceChannel }