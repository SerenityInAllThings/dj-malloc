import { createClient } from 'redis'
import { getRedisConnectionString } from './environmentVariables'

const client = createClient({ url: getRedisConnectionString() })
client.on('error', (err): void => console.log('Redis Client Error', err))

const getClient = async () => {
  if (!client.isReady) await client.connect()
  return client
}

const getKey = async (key: string) => {
  const client = await getClient()
  const value = await client.get(key)
  return value
}

const setKey = async (key: string, value: string) => {
  const client = await getClient()
  await client.set(key, value)  
}

export { getKey, setKey }