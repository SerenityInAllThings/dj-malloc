const playResponses = [
  'Som na Caixa!',
  'É pra já, patrão!'
]

const getPlayResponse = () => {
  const randomIndex = Math.floor(Math.random() * playResponses.length)
  return playResponses[randomIndex]
}

export { getPlayResponse }