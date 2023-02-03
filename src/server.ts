import express from 'express'
import { log } from './domain/dj'

const app = express()

app.put('/queue', (req, res) => {
  req.query
})

export const start = () => new Promise<number>((resolve) => {
  // TODO: get port from env
  const port = 3000
  app.listen(port, () => {
    console.log('Server started on port', port)
    log('Dj online!!').then(() => resolve(port))
  })
})