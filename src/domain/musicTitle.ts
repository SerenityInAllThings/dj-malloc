import { getYoutubeVideoDetails, getYoutubeVideoId, isYoutubeUrlValid } from "../youtube"
import { demuxProbe, createAudioResource }  from '@discordjs/voice'
import ytdl from 'ytdl-core' 
import { Readable } from "stream"

export class MusicTitle {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly imageUrl: string
  ) {}

  public async getAudio() {
    const stream = ytdl(this.url)
    const audioResource = probeAndCreateResource(stream)
    return audioResource
  }
}

export const createMusicTitle = async (url: string): Promise<MusicTitle | undefined> => {
  if (!url || typeof url !== 'string') return
  if (!isYoutubeUrlValid(url)) return
  const id = getYoutubeVideoId(url)
  const details = await getYoutubeVideoDetails(id)
  if (!details) return
  return new MusicTitle(url, details.title, details.imageUrl)
}

const probeAndCreateResource = async (readableStream: Readable) => {
	const { stream, type } = await demuxProbe(readableStream);
	return createAudioResource(stream, { inputType: type });
}