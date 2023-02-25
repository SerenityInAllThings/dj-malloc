import { ClientOptions, Client } from 'discord.js'
import { asyncTimeout } from '../asyncTimeout'
import { getBotPrefix } from '../config'
import { getDiscordToken } from '../environmentVariables'
import { getBotMessagesChannel } from './channels'

const token = getDiscordToken()
const options = {
  retryLimit: 3,
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent", "GuildMessageReactions"],
} as ClientOptions

export const createDiscordClient = async () => {
  const client = new Client(options)
  await configureLogEvents(client)
  await client.login(token)
  await ensureClientIsReady(client)
  return client
}

const ensureClientIsReady = async (client: Client) => {
  const maxWait = 15 * 1000
  const waitInterval = 50
  let waited = 0
  while(!client.isReady()) {
    if (waited > maxWait) throw new Error(`Discord client was not started after ${waited}ms!`)
    await asyncTimeout(waitInterval)
    waited += waitInterval
  }
}

const configureLogEvents = async (client: Client) => {
  client.once('ready', async () => {
    const botPrefix = await getBotPrefix()
    const channel = await getBotMessagesChannel(client)
    const message = `Bot ready!! Using prefix \`${botPrefix}\``
    console.log(message)
    await channel.send(message)
  })

  client.on('error', async error => {
    const channel = await getBotMessagesChannel(client)
    const message = 'Discord client error:' + error.toString()
    console.error(message, error)
    await channel.send(message)
  })
}