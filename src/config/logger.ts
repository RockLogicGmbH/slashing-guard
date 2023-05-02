const pino = require("pino");

const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      level: "trace",
      options: { destination: `${__dirname}/../../app.log` },
    },
    {
      target: "pino/file", // logs to the standard output by default
      level: "trace",
    },
  ],
});

let logLevel = process.env.LOG_LEVEL || "info";
if (!["fatal", "error", "warn", "info", "debug", "trace"].includes(logLevel)) {
  logLevel = "info";
}

export default pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);
