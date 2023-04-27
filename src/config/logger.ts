import pino from "pino";

const transport = pino.transport({
  targets: [
    {
      level: "info",
      target: "pino/file",
      options: { destination: `${__dirname}/../../app.log` },
    },
    ...(process.env.NODE_ENV === "development"
      ? [
          {
            level: "info",
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          },
        ]
      : []),
  ],
});

export default pino({}, transport);
