import pino from "pino";

const transport = pino.transport({
  targets: [
    {
      level: "info",
      target: "pino/file",
      options: { destination: `${__dirname}/../../app.log` },
    },
    {
      level: "info",
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  ],
});

export default pino({}, transport);
