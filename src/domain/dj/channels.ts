import { TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { getLogChannel, getVoiceChannel } from '../../config'
import { getDiscordClient } from './discordClient'

let botMessagesChannel: TextBasedChannel
let botChannelId: string
export const getBotMessagesChannel = async () => {
  if (!botMessagesChannel || botMessagesChannel.id !== botChannelId) {
    console.log('getting log channel')
    const botChannelId = await getLogChannel()
    const client = getDiscordClient()
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot log channel '${botChannelId}' not found`)
    if (!channel.isTextBased())
      throw new Error(`Bot log channel '${botChannelId}' is not voice based`)
    botMessagesChannel = channel
  }
  return botMessagesChannel
}

let voiceChannel: VoiceBasedChannel
let voiceChannelId: string
export const getBotVoiceChannel = async () => {
  if (!voiceChannel || voiceChannel.id !== voiceChannelId) {
    console.log('getting voice channel')
    const botChannelId = await getVoiceChannel()
    const client = getDiscordClient()
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot voice channel '${botChannelId}' not found`)
    if (!channel.isVoiceBased())
      throw new Error(`Bot voice channel '${botChannelId}' is not text based`)
    voiceChannel = channel
  }

  return voiceChannel
}