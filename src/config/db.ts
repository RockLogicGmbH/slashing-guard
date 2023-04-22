import { Level } from "level";
import path from "path";

const dbPath = path.join(`${__dirname}/../../`, "database");

const db = new Level(dbPath);

export default db;
