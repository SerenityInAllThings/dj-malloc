import { getBotMessagesChannel } from "./channels"

export const sendToDiscord = async (text: string) => {
  console.log(text)
  const logChannel = await getBotMessagesChannel()
  logChannel.send(text)
}