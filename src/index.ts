import bot from "./bot";

bot.start({
  onStart: (info) => console.log(`bot ${info.username} is up and running...`),
});
