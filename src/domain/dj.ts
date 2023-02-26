import { createMusicTitle, MusicTitle } from "./musicTitle";
import discord, { TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, VoiceConnection, AudioPlayer, createAudioPlayer }  from '@discordjs/voice'
import { createDiscordClient } from "./discordClient";
import { getBotPrefix } from "./config";
import { getBotVoiceChannel } from "./channels";
import { getBotMessagesChannel } from './channels'

export class DJ {
  private currentMusic: MusicTitle | null = null
  private nextSongs: MusicTitle[] = []
  private currentVoiceChannel: VoiceBasedChannel | null = null
  private currentVoiceConnection: VoiceConnection | null = null
  private audioPlayer: AudioPlayer | null = null
  private textChannel: TextBasedChannel | null = null
  // TODO: get guildId from config
  private guildId = "682045641760833603"

  constructor(
    private readonly discordClient: discord.Client
  ) {
    // For debugging
    // setInterval(() => {
    //   console.log('voiceStatus', this.currentVoiceConnection?.state.status)
    //   console.log('audioPlayer', this.audioPlayer?.state.status) 
    // }, 500)
  }

  reactToMessage = async (message: discord.Message) => {
    const { author, channel, content, member } = message
    if (message.guild?.id && message.guild.id !== this.guildId) 
      this.guildId = message.guild.id

    if (author.bot || channel.type === discord.ChannelType.DM) return

    const botPrefix = await getBotPrefix()
    if (!content.toLowerCase().startsWith(botPrefix.toLowerCase())) return

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

          if (member?.voice.channel?.id && member.voice.channel.id !== this.currentVoiceChannel?.id)
            await this.switchVoiceChannel(member.voice.channel.id)

          if (!music) {
            message.react('😖')
            break
          }
          message.react('⬇️')
          if (!this.currentMusic) await this.play(music)
          else this.addSongToQueue(music)
          message.react('▶️')
        } catch (err) {
          message.react('🦖')
          channel.send(`Erro tocando \`${args[0]}\`: ${err instanceof Error ? err.message : err}`)
        }
        break
      case 'pula':
      case 'skip':
      case 'proxima':
      case 'next':
        if (!this.currentMusic) {
          message.react('😖')
          break
        }
        message.react('⏭️')
        this.stop(false)
        break;
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
  }

  addSongToQueue = async (music: MusicTitle) => {
    console.log(`Adding '${music.title}' to queue`)
    this.nextSongs.push(music)
  }

  private getTextChannel = async () => {
    if (!this.textChannel) 
      this.textChannel = await getBotMessagesChannel(this.discordClient)
    return this.textChannel
  }

  private getCurrentVoiceConnection = async (connect: boolean = true) => {
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

  private switchVoiceChannel = async (channelId: string) => {
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
    player.on('stateChange', async ({ status: oldStatus }, { status: newStatus }) => {
      // Reference: https://discordjs.guide/voice/audio-player.html#life-cycle
      if (newStatus === 'idle') {
        const justPlayed = this.currentMusic
        if (this.currentMusic) {
          console.log(`Finished playing '${this.currentMusic.title}'`)
          this.currentMusic = null
        }
        if (oldStatus === 'playing') {
          // TODO: Send to played list for stats
        }
        else if (oldStatus === 'buffering') {
          console.log(`Error playing '${justPlayed?.title}'`)
          // TODO: do something with errored songs. 
          // Maybe send to a list to be analysed later
        }
        const nextSong = this.nextSongs.shift()
        if (!nextSong) {
          console.log('No more songs to play')
          this.stop()
          return
        }
        await this.play(nextSong)
      }
    })
    this.currentVoiceConnection.subscribe(player)
    this.audioPlayer = player
    this.currentVoiceChannel = channel
  }

  public play = async (music: MusicTitle) => {
    const audio = await music.getAudio()
    if (!this.audioPlayer) 
      throw new Error(`Should connect to voice channel before trying to get player`)
    console.log(`Playing '${music.title}'`)
    this.audioPlayer.play(audio) 
    this.currentMusic = music
  } 

  public stop = async (disconnect: boolean = true) => {
    if (!this.audioPlayer) 
      throw new Error(`Should connect to voice channel before trying to get player`)
    this.audioPlayer.stop()
    if (disconnect) {
      this.currentVoiceConnection?.disconnect()
      this.currentVoiceConnection = null
      this.currentVoiceChannel = null
    }
    this.currentMusic = null
  }
}

export const createDJ = async () => {
  const discordClient = await createDiscordClient()
  const dj = new DJ(discordClient)
  discordClient.on('messageCreate', dj.reactToMessage)
  return dj
}

