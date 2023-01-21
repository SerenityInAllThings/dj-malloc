import { AudioManager, StreamAudioManagerOptions } from "discordaudio"
import discord, { ChannelType, VoiceBasedChannel, ClientOptions, VoiceChannel } from 'discord.js'
import { getDiscordToken } from "./environmentVariables"
import { setBotPrefix, getBotPrefix} from "./config"
import { getPlayResponse } from "./responses"

const token = getDiscordToken()
const options = {
  retryLimit: 5,
  restRequestTimeout: 30 * 1000,
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
} as ClientOptions
const client = new discord.Client(options)

let currentBotChannel: VoiceBasedChannel | null = null
const audioManager = new AudioManager()

client.once('ready', () => {
  console.log(`Bot online as '${client.user?.username}' !!`)
})

client.on('error', console.error)

client.on('messageCreate', async (message) => {
  const { author, channel, content } = message
  
  if (author.bot || channel.type === ChannelType.DM) return
  const botPrefix = await getBotPrefix()
  if (!content.startsWith(botPrefix)) return

  const args = content.substring(botPrefix.length + 1).split(' ')
  const [command] = args
  
  switch (command.toLowerCase().trim()) {
    case 'toca':
    case 'play':
    case 'p':
      const userChannel = message.member?.voice.channel
      if (!userChannel) {
        channel.send('Please join a voice channel first')
        return
      }

      const youtubeUrl = args[1]
      if (!youtubeUrl.startsWith('https://www.youtube.com'))  {
        channel.send('Please provide a valid youtube url')
        return
      }
      const audioConfig: StreamAudioManagerOptions = { 
        quality: "high",
        audiotype: 'arbitrary',
        volume: 10
      }
      const queue = await audioManager.play(userChannel as VoiceChannel, youtubeUrl, audioConfig)
      if (!queue) channel.send(getPlayResponse())
      else channel.send('Na fila, patrão')

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
    default:
      channel.send('Comando inválido, patrão')
  }
})

client.login(token)