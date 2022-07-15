console.log("hi");
const { Client, Intents, Message } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });
let { token, tracker } = require('./config.json');
const vc = require('@discordjs/voice');
const ffmpeg = require('ffmpeg-static');
const opus = require('@discordjs/opus');
const ns = require('sodium-native');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const player = vc.createAudioPlayer();

let queue = [];
let isPlaying = false;
let isPaused = false;
let isStop = false;

player.on(vc.AudioPlayerStatus.Idle, () => {
    queue.shift();
    if (queue.length === 0) {
        // message.channel.send("queue ended.");
        isPlaying = false;
        console.log('queue ended...');
        return;
    }
    console.log(`now playing ${queue[0]}`)
    let stream = ytdl(queue[0].url, { filter: 'audioonly' })
    let resource = vc.createAudioResource(stream);
    player.play(resource);
})

async function play(message, cmd) {
    let songInfo = {};
    let info = {};
    let toSearch = message.content.substring(5);
    info = await ytSearch(toSearch);
    songInfo = info.all[0];
    const song = {
        title: songInfo.title,
        url: songInfo.url
    };
    console.log(song);
    if (isPlaying === false) {
        isPlaying = true;
        queue.push(song);
        let connection = vc.joinVoiceChannel({
            channelId: message.member.voice.channelId,
            guildId: message.guild.id,
            adapterCreator: message.channel.guild.voiceAdapterCreator
        });
        let stream = ytdl(queue[0].url, { filter: 'audioonly' })
        let resource = vc.createAudioResource(stream);
        connection.subscribe(player);
        player.play(resource);
    }
    else {
        queue.push(song);
        message.channel.send("Song added to queue...");
    }
}

function leave(message) {
    vc.getVoiceConnection(message.guild.id).destroy();
    message.channel.send("Bot left the Channel...");
    player.stop();
}




client.on("messageCreate", (message) => {
    let cmd = message.content.split(' ');
    if (cmd[0].charAt(0) === '/') {
        const guildid = message.guild.id;
        const userId = message.author.id;
        const guild = client.guilds.cache.get(guildid);
        if (cmd[0] === "/play") {
            if (guild.members.cache.get(userId).voice.channel) {
                play(message, cmd);
            }
            else {
                message.channel.send(`${message.author.username} you are not in Voice channel`);
            }
        }
        if (cmd[0] === "/leave") {
            if (vc.getVoiceConnection(message.guild.id)) {
                leave(message);
            }
            else {
                message.channel.send("bot is not in voice channel");
            }
        }
        if (cmd[0] === "/stop") {
            if (isPlaying) {
                player.stop();
                queue.shift();
                isStop = true;
                isPlaying = false;
            }
        }
        if (cmd[0] === "/pause") {
            if (isPlaying) {
                player.pause();
                isPaused = true;
                isPlaying = false;
            }
        }
        if (cmd[0] === "/skip") {
            if (guild.members.cache.get(userId).voice.channel && vc.getVoiceConnection(message.guild.id)) {   // best check for presence of bot and author both  && vc.getVoiceConnection(message.guild.id)
                queue.shift();
                if(queue.length != 0){
                    let stream = ytdl(queue[0].url, { filter: 'audioonly' })
                    let resource = vc.createAudioResource(stream);
                    player.play(resource);
                }else{
                    message.channel.send("Queue ended.");
                }
            }
        }
        // else{
        //     message.channel.send("you or Bot both are not in Voice channel");
        // }
        if(cmd[0] === "/resume"){
            if(isPaused || isStop){
               if(isPaused) player.resume();
            }
            else{
            message.channel.send("Nothing to resume.");
            }
        }
    }
})

client.once("ready", () => {
    console.log("ready");
    // const channel = client.channels.cache.get('889017325074935873');
})
client.login(token);
