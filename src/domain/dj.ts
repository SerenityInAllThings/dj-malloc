import { createMusicTitle, MusicTitle } from "./musicTitle";
import discord, { TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, VoiceConnection, AudioPlayer, createAudioPlayer }  from '@discordjs/voice'
import { createDiscordClient } from "./discordClient";
import { getBotPrefix } from "./config";
import { getBotVoiceChannel } from "./channels";
import { getBotMessagesChannel } from './channels'

export class DJ {
  private currentMusic: MusicTitle | null = null
  private currentVoiceChannel: VoiceBasedChannel | null = null
  private currentVoiceConnection: VoiceConnection | null = null
  private audioPlayer: AudioPlayer | null = null
  private textChannel: TextBasedChannel | null = null
  // TODO: get guildId from config
  private guildId = "682045641760833603"

  constructor(
    private readonly discordClient: discord.Client
  ) {
    this.configureChatListener()

    // setInterval(() => {
    //   console.log('voiceStatus', this.currentVoiceConnection?.state.status)
    //   console.log('audioPlayer', this.audioPlayer?.state.status) 
    // }, 500)
  }

  private async configureChatListener() {
    this.discordClient.on('messageCreate', async (message) => {
      const { author, channel, content, member } = message
      if (message.guild?.id && message.guild.id !== this.guildId) 
        this.guildId = message.guild.id

      if (author.bot || channel.type === discord.ChannelType.DM) return

      const botPrefix = await getBotPrefix()
      if (!content.toLowerCase().startsWith(botPrefix.toLowerCase())) return

      const currentVoiceChannel = await this.getCurrentVoiceConnection()

      const wordsAfterPrefix = content.substring(botPrefix.length + 1).split(' ').filter(s => s)
      const [command, ...args] = wordsAfterPrefix

      switch (command.toLowerCase().trim()) {
        case 'toca':
        case 'play':
        case 'p':
          try {
            const youtubeUrl = args[0].trim()
            message.react('🧠')
            const music = await createMusicTitle(youtubeUrl)

            if (member?.voice.channel?.id && member.voice.channel.id !== currentVoiceChannel?.id)
              await this.switchVoiceChannel(member.voice.channel.id)

            if (!music) {
              message.react('😖')
              break
            }
            message.react('⬇️')
            await this.play(music)
            message.react('▶️')
          } catch (err) {
            message.react('🦖')
            channel.send(`Erro tocando \`${args[0]}\`: ${err instanceof Error ? err.message : err}`)
          }
          break
        case 'vaza':
        case 'stop':
        case 'para':
          this.stop()
          message.react('⏹️')
          break
        default:
          message.react('❓')
          channel.send('Invalid command')
      }
    })
  }

  private async getTextChannel() {
    if (!this.textChannel) 
      this.textChannel = await getBotMessagesChannel(this.discordClient)
    return this.textChannel
  }

  private async getCurrentVoiceConnection(connect: boolean = true) {
    const notConnected = !this.currentVoiceChannel 
      || this.currentVoiceConnection?.state.status === 'disconnected'
      || this.currentVoiceConnection?.state.status === 'destroyed'
    if (notConnected) {
      if (!connect) throw new Error('Not connected to any voice channel')
      this.currentVoiceChannel = await getBotVoiceChannel(this.discordClient)
      await this.switchVoiceChannel(this.currentVoiceChannel.id)
    }
    return this.currentVoiceChannel
  }

  private async switchVoiceChannel(channelId: string) {
    console.log(`Switching to channel ${channelId}`)
    const channel = await this.discordClient.channels.fetch(channelId)
    if (!channel) throw new Error(`Missing channel ${channelId}`)
    if (!channel.isVoiceBased()) throw new Error(`Channel ${channelId} is not voice based`)

    const adapterCreator = this.discordClient.guilds.cache.get(this.guildId)?.voiceAdapterCreator
    if (!adapterCreator)
      throw new Error(`Missing adapterCreator for guildId ${this.guildId}`)
    const guildId = this.guildId
    this.currentVoiceConnection = joinVoiceChannel({ channelId, guildId, adapterCreator })
    const player = createAudioPlayer()
    player.on('error', (err) => {
      console.log('Player error:', err.message)
    })
    this.currentVoiceConnection.subscribe(player)
    this.audioPlayer = player
    this.currentVoiceChannel = channel
  }

  public async play(music: MusicTitle) {
    const audio = await music.getAudio()
    if (!this.audioPlayer) 
      throw new Error(`Should connect to voice channel before trying to get player`)
    console.log(`Playing '${music.title}'`)
    this.audioPlayer.play(audio) 
    this.currentMusic = music
  } 

  public async stop() {
    if (!this.audioPlayer) 
      throw new Error(`Should connect to voice channel before trying to get player`)
    this.audioPlayer.stop()
    this.currentVoiceConnection?.disconnect()
    this.currentMusic = null
  }
}

export const createDJ = async () => {
  const discordClient = await createDiscordClient()
  return new DJ(discordClient)
}

