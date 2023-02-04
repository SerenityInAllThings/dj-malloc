const getEnvironmentVariableOrThrow = (name: string): string => {
  const environmentValue = process.env[name]
  if (environmentValue) return environmentValue
  else throw new Error(`Missing '${name}' environment variable`)
}

const getDiscordToken = () => getEnvironmentVariableOrThrow('DISCORD_TOKEN')

const redisHost = () => getEnvironmentVariableOrThrow('REDISHOST')

const redisPassword = () => getEnvironmentVariableOrThrow('REDISPASSWORD')

const redisPor = () => getEnvironmentVariableOrThrow('REDISPORT')

const redisUser = () => getEnvironmentVariableOrThrow('REDISUSER')

const getRedisConnectionString = () => {
  const host = redisHost()
  const port = redisPor()
  const password = redisPassword()
  const user = redisUser()
  return `redis://${user}:${password}@${host}:${port}`
}

export { getDiscordToken, getRedisConnectionString }