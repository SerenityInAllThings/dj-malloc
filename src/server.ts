import express from 'express'
import { getQueue } from './domain/dj/player'
import { getPort } from './environmentVariables'

const app = express()

app.get('/queue', async (req, res) => {
  try {
    const queue = await getQueue()
    res.send(queue)
  } catch (err) {
    console.error('Error getting queue', err)
    res.status(500).send(err)
  }
})

export const start = () => new Promise<number>((resolve) => {
  // TODO: get port from env
  const port = getPort()
  app.listen(`0.0.0.0:${port}`, () => {
    console.log('Server started on port', port)
    resolve(port)
  })
})