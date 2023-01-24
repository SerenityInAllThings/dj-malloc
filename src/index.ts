import { AudioManager, StreamAudioManagerOptions } from "discordaudio"
import discord, { ChannelType, VoiceBasedChannel, ClientOptions, VoiceChannel } from 'discord.js'
import { getDiscordToken } from "./environmentVariables"
import { setBotPrefix, getBotPrefix} from "./config"
import { getPlayResponse } from "./responses"
import { isYoutubeUrlValid } from "./youtube"

const token = getDiscordToken()
const options = {
  retryLimit: 3,
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
} as ClientOptions
const client = new discord.Client(options)

let currentBotChannel: VoiceBasedChannel | null = null
const audioManager = new AudioManager()

//** Will play a song from youtube and retry it if necessary. Will return the retry count */
const playWithRetry = async (channel: VoiceBasedChannel, url: string, retryCount: number = 0): Promise<number> => {
  const maxRetries = 5
  const audioConfig: StreamAudioManagerOptions = { 
    quality: "high",
    audiotype: 'arbitrary',
    volume: 10
  }
  try {
    await audioManager.play(channel as VoiceChannel, url, audioConfig)
    currentBotChannel = channel
    return retryCount
  } catch (err) {
    console.error(`Error playing ${url}`, err)
    if (retryCount < maxRetries) return playWithRetry(channel as VoiceChannel, url, retryCount + 1)
    throw err
  }
}

client.once('ready', () => {
  console.log(`Bot online as '${client.user?.username}' !!`)
})

client.on('error', console.error)

client.on('messageCreate', async (message) => {
  const { author, channel, content } = message
  
  if (author.bot || channel.type === ChannelType.DM) return
  const botPrefix = await getBotPrefix()
  if (!content.toLowerCase().startsWith(botPrefix.toLowerCase())) return

  const args = content.substring(botPrefix.length + 1).split(' ')
  const [command] = args

  const userChannel = message.member?.voice.channel
  if (!userChannel) {
    channel.send('Please join a voice channel first')
    return
  }
  
  switch (command.toLowerCase().trim()) {
    case 'toca':
    case 'play':
    case 'p':
      const youtubeUrl = args[1]
      if (!isYoutubeUrlValid(youtubeUrl))  {
        channel.send('Please provide a valid youtube url')
        return
      }
      await playWithRetry(userChannel, youtubeUrl)
      currentBotChannel = userChannel
      break
    case 'pula':
    case 'skip':
      if (!currentBotChannel) {
        channel.send('Não tem nada tocando, patrão')
        return
      }
      try {
        await audioManager.skip(currentBotChannel as VoiceChannel)
        channel.send('Pulando, patrão')
      } catch (skipMusicError) {
        console.error('skipMusicError', skipMusicError)
        channel.send('Erro ao pular, patrão')
      }
      break
    case 'vaza':
    case 'stop':
    case 'para':
      if (!currentBotChannel) {
        channel.send('Não tem nada tocando, patrão')
        return
      }
      audioManager.stop(currentBotChannel as VoiceChannel)
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
        'https://www.youtube.com/watch?v=znBlH-kyR1k'
      ]
      for(const worktimeMusic of worktimePlaylist) {
        channel.send(`botei a ${worktimeMusic} pra tocar, patrão`)
        await playWithRetry(userChannel, worktimeMusic)
      }
      break
    default:
      channel.send('Comando inválido, patrão')
  }
})

client.login(token)