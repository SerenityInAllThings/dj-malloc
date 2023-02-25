import querystring from 'querystring'
import { google, youtube_v3 } from 'googleapis'
import { getGoogleApiKey } from '../environmentVariables'

export interface VideoDetails {
  title: string
  imageUrl: string
}

const youtubeLongUrlPrefix = 'https://www.youtube.com/watch'
const youtubeShortUrlPrefix = 'https://youtu.be/'
const youtubeMusicUrlPrefix = 'https://music.youtube.com/'

export const youtubePrefixes = [
  youtubeLongUrlPrefix,
  youtubeShortUrlPrefix,
  youtubeMusicUrlPrefix,
]

let youtubeClient: youtube_v3.Youtube | undefined
const getYoutubeClient = () => {
  if (!youtubeClient) {
    const auth = getGoogleApiKey()
    youtubeClient = google.youtube({ version: 'v3', auth })
  }
  return youtubeClient
}

export const isYoutubeUrlValid = (url: string): boolean => 
  youtubePrefixes.some(prefix => url.toLowerCase().startsWith(prefix))

export const getYoutubeVideoId = (url: string) => {
  if (url.startsWith(youtubeLongUrlPrefix) || url.startsWith(youtubeMusicUrlPrefix)) 
    return getYoutubeVideoIdFromQueryString(url)
  if (url.startsWith(youtubeShortUrlPrefix)) return getShortYoutubeUrlVideoId(url)
  throw new Error(`Don't know how to get the prefix for url: ${url}`)
}

export const getYoutubeVideoIdFromQueryString = (url: string) => {
  const querystringParameters = url.split('?')[1]
  const videoId = querystring.parse(querystringParameters)['v']
  if (videoId && typeof videoId === 'string') return videoId
  throw new Error(`Invalid video url to get id: ${url}`)
}

export const getShortYoutubeUrlVideoId = (url: string) => {
  const [protocol, _, domain, videoId] = url.split('/')
  if (videoId && typeof videoId === 'string') return videoId
  throw new Error(`Invalid short video url to get id: ${url}`)
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