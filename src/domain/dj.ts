import { AudioManager, StreamAudioManagerOptions } from "discordaudio"
import discord, { ChannelType, ClientOptions, VoiceChannel } from 'discord.js'
import { getDiscordToken } from "../environmentVariables"
import { isYoutubeUrlValid } from "../youtube"
import { getLogChannel, getVoiceChannel, getBotPrefix, setBotPrefix, setLogChannel } from "../config"
import { shuffleArray } from "../shuffleArray"

const token = getDiscordToken()
const options = {
  retryLimit: 3,
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
} as ClientOptions
const client = new discord.Client(options)
const audioManager = new AudioManager()

let botMessagesChannel: discord.TextBasedChannel
const getBotMessagesChannel = async () => {
  if (!botMessagesChannel) {
    const botChannelId = await getLogChannel()
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot log channel '${botChannelId}' not found`)
    if (!channel.isTextBased())
      throw new Error(`Bot log channel '${botChannelId}' is not voice based`)
    botMessagesChannel = channel
  }
  return botMessagesChannel
}

export const log = async (text: string) => {
  console.log(text)
  const logChannel = await getBotMessagesChannel()
  logChannel.send(text)
}

let voiceChannel: discord.VoiceBasedChannel
const getBotVoiceChannel = async () => {
  if (!voiceChannel) {
    const botChannelId = await getVoiceChannel()
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot voice channel '${botChannelId}' not found`)
    if (!channel.isVoiceBased())
      throw new Error(`Bot voice channel '${botChannelId}' is not text based`)
    voiceChannel = channel
  }

  return voiceChannel
}

client.once('ready', () => {
  console.log(`Bot online as '${client.user?.username}'!!`)
})

// TODO: send logs to discord channel
client.on('error', (error) => {
  console.log(error)
  log(error.toString())
})

client.on('debug', (info) => {
  console.log('debugInfo', info)
})

client.on('messageCreate', async (message) => {
  const { author, channel, content } = message
  
  if (author.bot || channel.type === ChannelType.DM) return
  const botPrefix = await getBotPrefix()
  if (!content.toLowerCase().startsWith(botPrefix.toLowerCase())) return

  const args = content.substring(botPrefix.length + 1).split(' ')
  const [command, firstArgument] = args

  // TODO: check if this cast is really necessary
  const botChannel = await getBotVoiceChannel() as VoiceChannel
  
  switch (command.toLowerCase().trim()) {
    case 'toca':
    case 'play':
    case 'p':
      const youtubeUrl = firstArgument
      await playWithRetry(youtubeUrl)
      break
    case 'pula':
    case 'skip':
      // TODO: split this logic to another function
      try {
        
        await audioManager.skip(channel as VoiceChannel)
      } catch (skipMusicError) {
        console.error('skipMusicError', skipMusicError)
        channel.send('Erro ao pular, patrão')
      }
      break
    case 'vaza':
    case 'stop':
    case 'para':
      audioManager.stop(botChannel)
      channel.send('Parando, patrão')
      break
    case 'mudaprefixo':
      const newPrefix = args[1]
      if (!newPrefix) {
        channel.send('Por favor, informe um novo prefixo')
        return
      }
      await setBotPrefix(newPrefix)
      channel.send(`Prefixo alterado para '${newPrefix}'`)
      break
    case 'worktime':
      channel.send('Hora do trabalho, caraleo!')
      const worktimePlaylist = [
        'https://www.youtube.com/watch?v=ZgFoMWjng30',
        'https://www.youtube.com/watch?v=RvaywQkxlrQ',
        'https://www.youtube.com/watch?v=pQuJJy6dXog',
        'https://www.youtube.com/watch?v=4r1sKSRxsnQ',
        'https://www.youtube.com/watch?v=d6Aj2J8bMLI',
        'https://www.youtube.com/watch?v=znBlH-kyR1k',
        'https://www.youtube.com/watch?v=ycMg5Q6AtWI'
      ]
      for(const worktimeMusic of shuffleArray(worktimePlaylist)) {
        channel.send(`botei a ${worktimeMusic} pra tocar, patrão`)
        await playWithRetry(worktimeMusic)
      }
      break
    case 'logchannel':
      const logChannel = firstArgument
      await setLogChannel(logChannel)
      channel.send(`Log channel set to ${logChannel}`)
      break
    default:
      channel.send('Comando inválido, patrão')
  }
})

interface PlayResult {
  error: boolean
  message: string
}

const asyncTimeout = (ms: number) => new Promise<{timeout:boolean}>(resolve => setTimeout(() => resolve({ timeout: true }), ms))

const maxPlayRetries = 3
const timeoutPerRetry: { [key: number]: number } = {
  0: 1000,
  1: 2000,
  2: 4000,
  4: 8000,
}
export const playWithRetry = async (youtubeUrl: string, retryCount: number = 0): Promise<PlayResult> => {
  const timeoutMs = timeoutPerRetry[retryCount] || 1000
  const timeout = asyncTimeout(timeoutMs)
  const playRequest = play(youtubeUrl)
  const result = await Promise.race([playRequest, timeout])

  if ("timeout" in result || result.error) {
    await log(`Error playing ${youtubeUrl}. Retry count: ${retryCount}.`)
    if (retryCount <= maxPlayRetries) {
      await log(`Retrying until ${retryCount}/${maxPlayRetries}.`)
      return await playWithRetry(youtubeUrl, retryCount + 1)
    } else {
      // TODO: add feature to skip this song
      const message = `Could not play ${youtubeUrl} after ${retryCount} retries.`
      await log(message)
      return { error: true, message }
    }
  }
  return { error: false, message: 'Playing' }
}

export const play = async (youtubeUrl: string): Promise<PlayResult> => {
  try {
    if (!isYoutubeUrlValid(youtubeUrl))
      return { error: true, message: 'Please provide a valid youtube url' }
    const audioConfig: StreamAudioManagerOptions = { 
      quality: "high",
      audiotype: 'arbitrary',
      volume: 10
    }
    const channel = await getBotVoiceChannel()
    // TODO: investigate if this is the correct way to play audio.
    // Maybe the cast is not needed or a sign that the types are wrong
    await audioManager.play(channel as VoiceChannel, youtubeUrl, audioConfig)
    return { error: false, message: 'Playing' }
  } catch (err) {
    await log(`Error playing music: ${JSON.stringify(err)}`)
    return { error: true, message: 'unexpected error playing song' }
  }
}

export const start = async () => {
  await client.login(token)
}