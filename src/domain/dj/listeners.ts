import { ChannelType, VoiceChannel } from 'discord.js'
import { getBotPrefix, setBotPrefix, setLogChannel, setVoiceChannel } from '../../config'
import { shuffleArray } from '../../shuffleArray'
import { isYoutubeUrlValid } from '../../youtube'
import { getBotVoiceChannel } from './channels'
import { getAudioManager, getDiscordClient } from './discordClient'
import { playWithRetry } from './player'
import { debug, sendToDiscord } from './writing'

const getRetryEmoji = (retry: number) => {
  if (retry === 0) return '🐸'
  else if (retry === 1) return '🪳'
  else if (retry === 2) return '🪰'
  else if (retry === 3) return '🪲'
  else return '🕸️'
}

export const configureEvents = () => {
  const client = getDiscordClient(true)
  const audioManager = getAudioManager(true)

  client.once('ready', () => {
    sendToDiscord(`Bot online as '${client.user?.username}'!!`)
  })
  
  client.on('error', (error) => {
    console.error('Error:', error)
    sendToDiscord('Error: ' + error.toString())
  })
  
  client.on('debug', (info) => {
    console.debug('debug:', info)
  })

  client.on('messageCreate', async (message) => {
    const { author, channel, content } = message
  
    if (author.bot || channel.type === ChannelType.DM) return
    const botPrefix = await getBotPrefix()
    if (!content.toLowerCase().startsWith(botPrefix.toLowerCase())) return

    const args = content.substring(botPrefix.length + 1).split(' ').filter(s => s)
    const [command, firstArgument] = args

    // TODO: check if this cast is really necessary
    const botChannel = await getBotVoiceChannel() as VoiceChannel
    
    switch (command.toLowerCase().trim()) {
      case 'toca':
      case 'play':
      case 'p':
        try {
          const youtubeUrl = firstArgument.trim()
          const playResult = await playWithRetry(youtubeUrl)
          
          message.react(getRetryEmoji(playResult.retries))
          if (playResult.error) message.react('❌')
          else message.react('▶️')

          break
        } catch (err) {
          message.react('🦖')
          debug(`Error playing ${isYoutubeUrlValid}: ${err}`)
        }
      case 'pula':
      case 'skip':
        // TODO: split this logic to another function
        try {
          await audioManager.skip(botChannel)
        } catch (skipMusicError) {
          console.error('skipMusicError', skipMusicError)
          channel.send('Erro ao pular, patrão')
        }
        break
      case 'vaza':
      case 'stop':
      case 'para':
        audioManager.stop(botChannel)
        message.react('⏹️')
        break
      case 'mudaprefixo':
        const newPrefix = args[1]
        if (!newPrefix) {
          channel.send('Por favor, informe um novo prefixo')
          return
        }
        await setBotPrefix(newPrefix)
        message.react('🆗')
        channel.send(`Prefixo alterado para '${newPrefix}'`)
        break
      case 'worktime':
        channel.send('Hora do trabalho, caraleo!')
        message.react('👨‍💼')
        const worktimePlaylist = [
          'https://www.youtube.com/watch?v=ZgFoMWjng30',
          'https://www.youtube.com/watch?v=RvaywQkxlrQ',
          'https://www.youtube.com/watch?v=pQuJJy6dXog',
          'https://www.youtube.com/watch?v=4r1sKSRxsnQ',
          'https://www.youtube.com/watch?v=d6Aj2J8bMLI',
          'https://www.youtube.com/watch?v=znBlH-kyR1k',
          'https://www.youtube.com/watch?v=ycMg5Q6AtWI'
        ]
        const playlist = shuffleArray(worktimePlaylist)
        for(const worktimeMusic of playlist)
          await playWithRetry(worktimeMusic)
        const names = playlist.map((music, index) => `${index + 1}) ${music}`).join('\n')
        channel.send(`Coloquei essas, patrão: \n${names}`)

        break
      case 'logchannel':
        const logChannel = firstArgument
        await setLogChannel(logChannel)
        message.react('🆗')
        channel.send(`Log channel set to ${logChannel}`)
        break
      case 'voicechannel':
        const voicechannel = firstArgument
        await setVoiceChannel(voicechannel)
        message.react('🆗')
        channel.send(`Voice channel set to ${voicechannel}`)
        break
      default:
        message.react('❓')
        channel.send('Comando inválido, patrão')
    }
  })

  process.on('unhandledRejection', (error) => {
    let message = `unhandledRejection: ${error}`
    if (error instanceof Error)
      message += '\n' + error.toString()
    sendToDiscord(message)
  })
}

