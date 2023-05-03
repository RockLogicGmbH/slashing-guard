/* eslint-disable @typescript-eslint/no-var-requires */
const pino = require("pino");

const dockerized = process.env.__DOCKERIZED__ || "unknown";
const targets = [];
const toFile = {
  target: "pino/file",
  level: "trace",
  options: { destination: `${__dirname}/../../app.log` },
};
const toStdOut = {
  target: "pino/file", // logs to the standard output by default
  level: "trace",
};
if (dockerized != "dockerized") {
  targets.push(toFile);
}
targets.push(toStdOut);
const transport = pino.transport({
  targets: targets,
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
