import { getYoutubeVideoDetails, getYoutubeVideoId, isYoutubeUrlValid, youtubePrefixes } from "./youtube"
import { demuxProbe, createAudioResource }  from '@discordjs/voice'
import ytdl, { downloadOptions } from 'ytdl-core' 
import { Readable } from "stream"

export class MusicTitle {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly imageUrl: string
  ) {}

  public async getAudio() {
    const streamOptions: downloadOptions = {
      filter: "audioonly", 
      quality: 'highestaudio', 
      // Load 32mb of data to local buffer
      highWaterMark: 1 << 25
    }
    const stream = ytdl(this.url, streamOptions)
    const audioResource = probeAndCreateResource(stream)
    return audioResource
  }
}

export const createMusicTitle = async (url: string) => {
  if (!url || typeof url !== 'string') throw new Error('Missing video url')
  if (!isYoutubeUrlValid(url)) {
    const message =`Invalid youtube url: \`${url}\`` + 
      `\nValid prefixes:\n${youtubePrefixes.map(p => '`' + p + '`').join(',\n')}`
    throw new Error(message)
  }
  const id = getYoutubeVideoId(url)
  const details = await getYoutubeVideoDetails(id)
  if (!details) throw new Error(`Could not get video details for id: ${id}`)
  return new MusicTitle(url, details.title, details.imageUrl)
}

const probeAndCreateResource = async (readableStream: Readable) => {
	const { stream, type } = await demuxProbe(readableStream);
	return createAudioResource(stream, { inputType: type });
}