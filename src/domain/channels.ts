import { TextBasedChannel, VoiceBasedChannel, Client } from 'discord.js'
import { getLogChannel, getVoiceChannel } from '../config'

let botMessagesChannel: TextBasedChannel
let logChannelId: string
export const getBotMessagesChannel = async (client: Client) => {
  const botChannelId = await getLogChannel()
  if (!botMessagesChannel || botChannelId !== logChannelId) {
    console.log('getting log channel')
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot log channel '${botChannelId}' not found`)
    if (!channel.isTextBased())
      throw new Error(`Bot log channel '${botChannelId}' is not voice based`)
    botMessagesChannel = channel
    logChannelId = botChannelId
  }
  return botMessagesChannel
}

let voiceChannel: VoiceBasedChannel
let voiceChannelId: string
export const getBotVoiceChannel = async (client: Client) => {
  const botChannelId = await getVoiceChannel()
  if (!voiceChannel || botChannelId !== voiceChannelId) {
    console.log('getting voice channel')
    let channel = await client.channels.fetch(botChannelId)
    if (!channel)
      throw new Error(`Bot voice channel '${botChannelId}' not found`)
    if (!channel.isVoiceBased())
      throw new Error(`Bot voice channel '${botChannelId}' is not text based`)
    voiceChannel = channel
    voiceChannelId = botChannelId
  }

  return voiceChannel
}