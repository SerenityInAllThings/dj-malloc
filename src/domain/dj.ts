import { createMusicTitle, MusicTitle } from "./musicTitle";
import discord, { TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, VoiceConnection, AudioPlayer, createAudioPlayer }  from '@discordjs/voice'
import { createDiscordClient } from "./discordClient";
import { getBotPrefix } from "./config";
import { getBotVoiceChannel } from "./channels";
import { getBotMessagesChannel } from './channels'
import { shuffleArray } from "./shuffleArray";

export class DJ {
  private currentMusic: MusicTitle | null = null
  private nextSongs: MusicTitle[] = []
  private currentVoiceChannel: VoiceBasedChannel | null = null
  private _currentVoiceConnection: VoiceConnection | null = null
  private get currentVoiceConnection(){ return this._currentVoiceConnection }
  private set currentVoiceConnection(connection: VoiceConnection | null) {
    if (this._currentVoiceConnection) {
      this._currentVoiceConnection.disconnect()
      this._currentVoiceConnection.destroy()
    }
    connection?.on('stateChange', (oldState, newState) => {
      console.log('Voice connection state changed', oldState.status, newState.status)

      // TODO: due to https://github.com/discordjs/discord.js/issues/9185
      const oldNetworking = Reflect.get(oldState, 'networking');
      const newNetworking = Reflect.get(newState, 'networking');
      const networkStateChangeHandler = (oldNetworkState: any, newNetworkState: any) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
      }
      oldNetworking?.off('stateChange', networkStateChangeHandler);
      newNetworking?.on('stateChange', networkStateChangeHandler);
    })
    connection?.on('error', error => {
      console.error('Voice connection error', error)
    })

    const player = createAudioPlayer()
    player.on('error', (err) => {
      console.error('Player error:' + err.message, err)
    })
    player.on('stateChange', async ({ status: oldStatus }, { status: newStatus }) => {
      console.log('player state change from', oldStatus, 'to', newStatus)
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
          const textChannel = await this.getTextChannel()
          textChannel.send(`Erro tocando \`${justPlayed?.title}\``)
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
    connection?.subscribe(player)
    this.audioPlayer = player
    this._currentVoiceConnection = connection
  }
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
    // this.playIfIdleAndHasNextSong()
  }

  // private playIfIdleAndHasNextSong = () => {
  //   setInterval(async () => {
  //     if (this.audioPlayer?.state.status !== 'idle') return
  //     const nextSong = this.nextSongs.shift()
  //     if (!nextSong) return

  //     const textChannel = await this.getTextChannel()
  //     if (this.currentMusic)
  //     textChannel.send(`Estava inativo, mas agora toco \`${nextSong.title}\``)

  //     this.play(nextSong)
  //   }, 5000)
  // }

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
      case 'worktime':
        message.react('👷')
        channel.send('Hora do trabalho, powrra')

        if (member?.voice.channel?.id && member.voice.channel.id !== this.currentVoiceChannel?.id)
            await this.switchVoiceChannel(member.voice.channel.id)

        const worktimePlaylist = [
          'https://www.youtube.com/watch?v=ZgFoMWjng30',
          'https://www.youtube.com/watch?v=RvaywQkxlrQ',
          'https://www.youtube.com/watch?v=pQuJJy6dXog',
          'https://www.youtube.com/watch?v=4r1sKSRxsnQ',
          'https://www.youtube.com/watch?v=d6Aj2J8bMLI',
          'https://www.youtube.com/watch?v=znBlH-kyR1k',
          'https://www.youtube.com/watch?v=ycMg5Q6AtWI'
        ]
        const suffledPlaylist = shuffleArray(worktimePlaylist)
        const firstUrl = suffledPlaylist.shift()
        if (!firstUrl) {
          message.react('😖')
          return
        }
        const firstMusic = await createMusicTitle(firstUrl)
        await this.play(firstMusic)
        for(const url of suffledPlaylist) {
          const music = await createMusicTitle(url)
          this.addSongToQueue(music)
        }
        const response = 'Coloquei essas, patrão:\n' + [firstUrl, ...suffledPlaylist]
          .map((m, i) => i + 1 + ') ' + m)
          .join('\n')
        channel.send(response)
        break;
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

