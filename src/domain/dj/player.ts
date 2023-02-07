import { VoiceChannel } from "discord.js"
import { StreamAudioManagerOptions } from "discordaudio"
import { asyncTimeout } from "../../asyncTimeout"
import { isYoutubeUrlValid } from "../../youtube"
import { getBotVoiceChannel } from "./channels"
import { getAudioManager } from "./discordClient"
import { sendToDiscord } from "./writing"

interface PlayResult {
  error: boolean
  message: string
}

const maxPlayRetries = 2
const timeoutPerRetry: { [key: number]: number } = {
  0: 3 * 1000,
  1: 6 * 1000,
  2: 12* 1000,
  4: 30 * 1000,
}

export const playWithRetry = async (youtubeUrl: string, retryCount: number = 0): Promise<PlayResult> => {
  const timeoutMs = timeoutPerRetry[retryCount] || 1000
  const playRequest = play(youtubeUrl)
  const timeout = asyncTimeout(timeoutMs)
  const result = await Promise.race([playRequest, timeout])

  if ("timeout" in result || result.error) {
    await sendToDiscord(`Error playing '${youtubeUrl}'. Times already tried: ${retryCount + 1}.`)
    if (retryCount < maxPlayRetries) {
      await sendToDiscord(`Will retry another ${maxPlayRetries-(retryCount)} times`)
      return await playWithRetry(youtubeUrl, retryCount + 1)
    } else {
      const message = `Could not play '${youtubeUrl}' after ${retryCount} retries.`
      await sendToDiscord(message)
      return { error: true, message }
    }
  }
  return { error: false, message: 'Playing' }
}

export const play = async (youtubeUrl: string): Promise<PlayResult> => {
  try {
    const audioManager = getAudioManager()
    if (!isYoutubeUrlValid(youtubeUrl))
      return { error: true, message: 'Please provide a valid youtube url' }
    const audioConfig: StreamAudioManagerOptions = { 
      quality: "high",
      audiotype: 'arbitrary',
      volume: 10
    }
    // TODO: investigate if the cast is really necessary
    const channel = await getBotVoiceChannel() as VoiceChannel
    console.log(1)
    await audioManager.play(channel, youtubeUrl, audioConfig)
    console.log(2)
    return { error: false, message: 'Playing' }
  } catch (err) {
    await sendToDiscord(`Error playing '${youtubeUrl}': ${JSON.stringify(err)}`)
    return { error: true, message: 'unexpected error playing song' }
  }
}