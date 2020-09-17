require("dotenv/config");
const discord = require("discord.js");
const bot = new discord.Client();

/**
 * @type {discord.Guild}
 */
let guild = null;
/**
 * @type {discord.TextChannel}
 */
let general = null;

bot.once("ready", () => {
  guild = bot.guilds.cache.first();
  general = guild.channels.cache.get("755948596406255779");
  console.log("Ready");
});

bot.on("message", async (msg) => {
  if (!msg.content.startsWith("!")) return;
  if (msg.author.bot) return;
  const [command, ...args] = msg.content.slice(1).split(" ");

  switch (command) {
    case "ping":
      msg.channel.send("Pong!");
      return;
    case "greet":
      const member = guild.member(msg.author.id);
      msg.channel.send(`Hello, ${member.displayName}`);
      return;
  }
});

bot.on("guildMemberAdd", (member) => {
  general.send(
    `Welcome the new plunger, ${member.displayName} to Plunger Squad!`
  );
});

bot.login(process.env.TOKEN);
