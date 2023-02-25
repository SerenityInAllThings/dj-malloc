import { demuxProbe, createAudioResource, createAudioPlayer, joinVoiceChannel  }  from '@discordjs/voice'
import { Readable } from 'stream';
import ytdl from 'ytdl-core' 
import { createDiscordClient } from './domain/discordClient';
import { createDJ } from './domain/dj';

createDJ()

// const probeAndCreateResource = async (readableStream: Readable) => {
// 	const { stream, type } = await demuxProbe(readableStream);
// 	return createAudioResource(stream, { inputType: type });
// }

// const start = async () =>{
//   const discordClient = await createDiscordClient()
//   discordClient.on('messageCreate', async (message) => {
//     console.log('heard something')
//     const { channel, guild, member } = message
//     if (!channel || !guild) return
//     const ydStream = ytdl('https://www.youtube.com/watch?v=cciWAD60OIQ')
//     const resource = await probeAndCreateResource(ydStream)
//     const connection = joinVoiceChannel({
//       channelId: member?.voice.channel?.id || '1052049829506850967',
//       guildId: guild.id,
//       adapterCreator: guild.voiceAdapterCreator,
//     })
//     const player = createAudioPlayer()
//     const s = connection.subscribe(player)
//     console.log(s)
//     // console.log(resource)
//     player.play(resource)
//   })
// }
// start()

