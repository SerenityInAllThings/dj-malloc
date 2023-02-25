import querystring from 'querystring'
import { google, youtube_v3 } from 'googleapis'
import { getGoogleApiKey } from './environmentVariables'
import { VideoDetails } from './domain/youtube'

const youtubePrefixes = [
  'https://www.youtube.com/',
  'https://youtu.be/',
  'https://music.youtube.com/'
]

export const isYoutubeUrlValid = (url: string): boolean => 
  youtubePrefixes.some(prefix => url.toLowerCase().startsWith(prefix))

let youtubeClient: youtube_v3.Youtube | undefined
const getYoutubeClient = () => {
  if (!youtubeClient) {
    const auth = getGoogleApiKey()
    youtubeClient = google.youtube({ version: 'v3', auth })
  }
  return youtubeClient
}

export const getYoutubeVideoId = (url: string) => {
  const querystringParameters = url.split('?')[1]
  const videoId = querystring.parse(querystringParameters)['v']
  if (typeof videoId === 'string') return videoId
  throw new Error(`Invalid video url to get id: ${url}`)
}

export const getYoutubeVideoDetails = async (id: string): Promise<VideoDetails | undefined> => {
  if (!id || typeof id !== 'string') return
  const youtubeClient = getYoutubeClient()
  const { status, data: response } = await youtubeClient.videos.list({ part: ['snippet'], id: [id] })
  const video = response?.items?.[0]
  if (status !== 200 || !video) {
    console.error(`Failed to get video details for id '${id}'. Status ${status}`)
    return
  }
  const title = video.snippet?.title
  const imageUrl = video.snippet?.thumbnails?.high?.url
  if (!title || !imageUrl) {
    console.error(`Video ${id} is missing title or image url.`)
    return
  }
  return {title, imageUrl}
}