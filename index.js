require("dotenv/config");
const discord = require("discord.js");
const fetch = require("node-fetch").default;
const moment = require("moment");
const bot = new discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION", "USER"],
  disableMentions: "everyone",
});

/**
 * @type {discord.Guild}
 */
let guild;
/**
 * @type {discord.TextChannel}
 */
let general;
const timezoneapi = "http://worldtimeapi.org/api/timezone";
const tzcfg = require("./timezoneconfig.json");

/**
 * @param {discord.TextChannel | discord.DMChannel | discord.NewsChannel} channel
 * @param {string} message
 */
async function infoMsg(channel, message) {
  const botmsg = await channel.send(message);
  setTimeout(() => {
    botmsg.delete();
  }, 2000);
}

bot.once("ready", () => {
  // @ts-ignore
  guild = bot.guilds.cache.first();
  // @ts-ignore
  general = guild.channels.cache.get("755948596406255779");
  // @ts-ignore
  bot.user.setActivity({
    name: "Amungus",
    type: "PLAYING",
  });
  console.log("Ready");
});

bot.on("message", async (msg) => {
  if (!msg.content.startsWith("!")) return;
  if (msg.author.bot) return;
  const [command, ...args] = msg.content.slice(1).split(" ");

  switch (command) {
    case "logemoji":
      console.log(args.length ? args[0] : "");
      break;
    case "embed":
      const embed = new discord.MessageEmbed()
        .setTitle("A")
        .setDescription("A")
        .setFooter("A")
        .setAuthor("A");
      msg.channel.send(embed);
      break;
    case "ping":
      msg.channel.send("Pong!");
      break;
    case "greet":
      /**
       * @type {discord.GuildMember}
       */
      // @ts-ignore
      const member = guild.member(msg.author.id);
      msg.channel.send(`Hello, ${member.displayName}!`);
      break;
    case "clockat":
      if (args.length === 0) {
        await infoMsg(msg.channel, "No role provided");
        break;
      }
      const role = guild.roles.cache.find((role) =>
        role.name
          .toLowerCase()
          .split(" / ")
          .some((s) => s === args.join(" ").toLowerCase())
      );
      if (!role || !tzcfg.timezones.map((tr) => tr.id).includes(role.id)) {
        await infoMsg(msg.channel, "Unknown time role");
        break;
      }
      try {
        const zone = tzcfg.timezones.find((zone) => zone.id === role.id);
        // @ts-ignore
        const data = await fetch(`${timezoneapi}/${zone.timezone}`);
        const json = await data.json();
        const { utc_datetime, utc_offset } = json;
        const utcDateTimeWithoutTimeZone = utc_datetime.slice(0, -6);
        const [date, time] = utcDateTimeWithoutTimeZone.split("T");
        const hours = parseInt(time.slice(0, 2));
        const offsetByHours = parseInt(utc_offset.slice(0, 3));
        const offsetHours = hours + offsetByHours;
        const timeString = date + "T" + offsetHours + time.slice(2);
        const dateTime = new Date(timeString);
        const formattedTime = moment(dateTime).format("h:mm a");
        msg.channel.send(`Clock is now ${formattedTime} at ${role.name}`);
      } catch {}
      break;
    case "setuptimezones":
      if (msg.author.id !== "134962455544725507") {
        msg.channel.send("You are not allowed to use that command");
        break;
      }
      /**
       * @type {discord.TextChannel}
       */
      // @ts-ignore
      const timezonechannel = guild.channels.cache.get(tzcfg.channelID);
      /**
       * @type {discord.Message}
       */
      // @ts-ignore
      const botmsg = await timezonechannel.messages.fetch(tzcfg.messageID);
      let message = tzcfg.message;
      tzcfg.timezones.forEach((zone) => {
        const role = guild.roles.cache.get(zone.id);
        if (!role) return;
        message += `\n${zone.emoji} = ${role.name}`;
      });
      await botmsg.edit(message);
      if (botmsg.partial) {
        try {
          await botmsg.fetch();
        } catch (error) {
          await infoMsg(msg.channel, "An error occurred, check the console");
          console.error(
            "Something went wrong when fetching the message: ",
            error
          );
          break;
        }
      }
      for (const zone of tzcfg.timezones) {
        if (
          botmsg.reactions.cache.find(
            (reaction) => reaction.emoji.name === zone.emoji
          )
        )
          continue;
        await botmsg.react(zone.emoji);
      }
  }
  await msg.delete();
});

bot.on("guildMemberAdd", (member) => {
  general.send(
    `Welcome the new plunger, ${member.displayName} to Plunger Squad!`
  );
});

bot.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message: ", error);
      return;
    }
  }
  if (user.bot) return;
  if (reaction.message.id !== tzcfg.messageID) return;
  // @ts-ignore
  await guild.member(user.id).roles.add(
    // @ts-ignore
    tzcfg.timezones.find((role) => role.emoji === reaction.emoji.name).id
  );
});

bot.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message: ", error);
      return;
    }
  }
  if (user.bot) return;
  if (reaction.message.id !== tzcfg.messageID) return;
  // @ts-ignore
  await guild.member(user.id).roles.remove(
    // @ts-ignore
    tzcfg.timezones.find((role) => role.emoji === reaction.emoji.name).id
  );
});

bot.login(process.env.TOKEN);
