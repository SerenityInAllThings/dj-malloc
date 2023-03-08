const getEnvironmentVariableOrThrow = (name: string): string => {
  const environmentValue = process.env[name]
  if (environmentValue) return environmentValue
  else throw new Error(`Missing '${name}' environment variable`)
}

const getNumericEnvironmentVariableOrThrow = (name: string): number => {
  const value = getEnvironmentVariableOrThrow(name)
  const parsed = parseInt(value)
  if (isNaN(parsed))
    throw new Error(`Environment variable '${name}' is not numeric`)
  return parsed
}

const getDiscordToken = () => getEnvironmentVariableOrThrow('DISCORD_TOKEN')

const getRedisHost = () => getEnvironmentVariableOrThrow('REDISHOST')

const getRedisPassword = () => getEnvironmentVariableOrThrow('REDISPASSWORD')

const getRedisPort = () => getEnvironmentVariableOrThrow('REDISPORT')

const getRedisUser = () => getEnvironmentVariableOrThrow('REDISUSER')

const getPort = () => getNumericEnvironmentVariableOrThrow('PORT')

const getGoogleApiKey = () => getEnvironmentVariableOrThrow('GOOGLE_API_KEY')

const getCurrentVersion = () => getEnvironmentVariableOrThrow('npm_package_version')

const getRedisConnectionString = () => {
  const host = getRedisHost()
  const port = getRedisPort()
  const password = getRedisPassword()
  const user = getRedisUser()
  return `redis://${user}:${password}@${host}:${port}`
}

export { getDiscordToken, getRedisConnectionString, getPort, getGoogleApiKey, getCurrentVersion }