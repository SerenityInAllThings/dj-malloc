import express from 'express'
import { getPort } from './environmentVariables'

const app = express()

// TODO: add endpoints

export const start = () => new Promise<number>((resolve) => {
  const port = getPort()
  app.listen(port, '0.0.0.0', () => {
    console.log('Server started on port', port)
    resolve(port)
  })
})