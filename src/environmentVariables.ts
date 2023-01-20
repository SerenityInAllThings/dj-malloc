const getEnvironmentVariableOrThrow = (name: string): string => {
  const environmentValue = process.env[name]
  if (environmentValue) return environmentValue
  else throw new Error(`Missing '${name}' environment variable`)
}

const getDiscordToken = (): string => getEnvironmentVariableOrThrow('DISCORD_TOKEN')

export { getDiscordToken }