import { createDJ } from './domain/dj';
import { generateDependencyReport } from '@discordjs/voice'

console.log('Discordjs voice dependencies:', generateDependencyReport());
createDJ()
// TODO: start webserver too