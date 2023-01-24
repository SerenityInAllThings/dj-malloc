const youtubePrefixes = [
  'https://www.youtube.com/',
  'https://youtu.be/',
  'https://music.youtube.com/'
]

const isYoutubeUrlValid = (url: string): boolean => 
  youtubePrefixes.some(prefix => url.toLowerCase().startsWith(prefix))

export { isYoutubeUrlValid }