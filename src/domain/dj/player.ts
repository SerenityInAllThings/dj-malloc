import { VoiceChannel } from "discord.js"
import { StreamAudioManagerOptions } from "discordaudio"
import { asyncTimeout } from "../../asyncTimeout"
import { isYoutubeUrlValid } from "../../youtube"
import { getBotVoiceChannel } from "./channels"
import { getAudioManager } from "./discordClient"
import { debug } from "./writing"

interface PlayResult {
  error: boolean
  retries: number
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
    await debug(`Error playing '${youtubeUrl}'. Times already tried: ${retryCount + 1}.`)
    if (retryCount < maxPlayRetries) {
      await debug(`Will retry another ${maxPlayRetries-(retryCount)} times`)
      return await playWithRetry(youtubeUrl, retryCount + 1)
    } else {
      const message = `Could not play '${youtubeUrl}' after ${retryCount} retries.`
      await debug(message)
      return { error: true, message, retries: retryCount }
    }
  }
  return { error: false, message: 'Playing', retries: retryCount }
}

export const play = async (youtubeUrl: string): Promise<PlayResult> => {
  try {
    const audioManager = getAudioManager()
    if (!isYoutubeUrlValid(youtubeUrl))
      return { error: true, message: 'Please provide a valid youtube url', retries: 0 }
    const audioConfig: StreamAudioManagerOptions = { 
      quality: "high",
      audiotype: 'arbitrary',
      volume: 10
    }
    // TODO: investigate if the cast is really necessary
    const channel = await getBotVoiceChannel() as VoiceChannel
    await audioManager.play(channel, youtubeUrl, audioConfig)
    return { error: false, message: 'Playing', retries: 0 }
  } catch (err) {
    await debug(`Error playing '${youtubeUrl}': ${JSON.stringify(err)}`)
    return { error: true, message: 'unexpected error playing song', retries: 0 }
  }
}