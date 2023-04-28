import { Level } from "level";

class Group {
  private key: string;
  private db: Level<string, string>;

  constructor(db: Level<string, string>) {
    this.key = "groups";
    this.db = db;
  }

  async find() {
    const groups = await this.db.get(this.key);

    return JSON.parse(groups) as Array<number>;
  }

  async add(chatId: number) {
    let groups: number[];

    try {
      groups = await this.find();
    } catch (error) {
      groups = [];
    }

    if (!groups.includes(chatId)) {
      await this.db.put(this.key, JSON.stringify([...groups, chatId]));
    }

    return chatId;
  }
}

export default Group;
