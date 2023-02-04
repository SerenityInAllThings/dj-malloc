# dj-malloc

Discord bot for playing music in discord servers.

It is important to set the environment variable `YT_COOKIE` to allow playing age restricted videos.
This should be set with the cookie of a logged in user.

## To Dos:

- Create app image
- Feature to allow creating and updating playlists
- Implement error handling
  - Youtube music
  - Short youtube link
- Implement way to instantly play a song (ignore current playlist)
- Add precommit hook to increase package.json version
  - this would allow the bot to inform it's current version
  - Maybe informing the version on startup would be helpful
- ~~Allow playing age restricted videos~~
  - https://github.com/Luuk-Dev/DiscordAudio/issues/3
  - Cookies can now be set using environment variable YT_COOKIE
- ~~Create bot image~~
- ~~Feature to allow changing bot prefix~~
- ~~Enable using alternative youtube domains~~
- ~~Allows logs to be streamed back to discord~~

## References

https://discord.com/developers/docs/getting-started

https://www.npmjs.com/package/discord.js

https://www.npmjs.com/package/discordaudio

para convidar o bot:
https://discord.com/api/oauth2/authorize?client_id=1066090657065730058&permissions=36543990784&scope=bot