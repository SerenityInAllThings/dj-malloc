import { ChannelType, VoiceChannel } from 'discord.js'
import { getBotPrefix, setBotPrefix, setLogChannel } from '../../config'
import { shuffleArray } from '../../shuffleArray'
import { getBotVoiceChannel } from './channels'
import { getAudioManager, getDiscordClient } from './discordClient'
import { playWithRetry } from './player'
import { sendToDiscord } from './writing'

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

  process.on('unhandledRejection', (error) => {
    let message = `unhandledRejection: ${error}`
    if (error instanceof Error)
      message += '\n' + error.toString()
    sendToDiscord(message)
  })
}

