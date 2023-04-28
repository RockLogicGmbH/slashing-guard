const pino = require("pino");

const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      level: "error",
      options: { destination: `${__dirname}/../../app.log` },
    },
    {
      target: "pino/file", // logs to the standard output by default
    },
  ],
});

export default pino({}, transport);
