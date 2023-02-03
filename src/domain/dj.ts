import { AudioManager, StreamAudioManagerOptions } from "discordaudio"
import discord, { ChannelType, VoiceBasedChannel, ClientOptions, VoiceChannel } from 'discord.js'
import { getDiscordToken } from "../environmentVariables"
import { isYoutubeUrlValid } from "../youtube"
import { getLogChannel, getVoiceChannel } from "../config"

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
      throw new Error('Bot log channel not found')
    if (!channel.isTextBased())
      throw new Error('Bot log channel is not voice based')
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
      throw new Error('Bot voice channel not found')
    if (!channel.isVoiceBased())
      throw new Error('Bot voice channel is not text based')
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

interface PlayResult {
  error: boolean
  message: string
}

export const play = async (youtubeUrl: string): Promise<PlayResult> => {
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
}

export const start = async () => {
  await client.login(token)
}