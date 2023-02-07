import discord, { ClientOptions } from 'discord.js'
import { AudioManager } from "discordaudio"
import { getDiscordToken } from "../../environmentVariables"
import { configureEvents } from './listeners'

const token = getDiscordToken()
const options = {
  retryLimit: 3,
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
} as ClientOptions

const client = new discord.Client(options)
const audioManager = new AudioManager()

export const start = async () => {
  await client.login(token)
  configureEvents()
}

export const getAudioManager = (ignoreIfNotReady: boolean = false) => {
  if (ignoreIfNotReady || client.isReady()) return audioManager
  throw new Error('Discord client was not started!')
  
}

export const getDiscordClient = (ignoreIfNotReady: boolean = false) => {
  if (ignoreIfNotReady || client.isReady()) return client
  throw new Error('Discord client was not started!!')
}