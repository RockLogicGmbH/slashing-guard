import { Level } from "level";

class User {
  private key: string;
  private db: Level<string, string>;

  constructor(db: Level<string, string>) {
    this.key = "users";
    this.db = db;
  }

  async find() {
    const users = await this.db.get(this.key);

    return JSON.parse(users) as Array<number>;
  }

  async add(userId: number) {
    let users: number[];

    try {
      users = await this.find();
    } catch (error) {
      users = [];
    }

    if (!users.includes(userId)) {
      await this.db.put(this.key, JSON.stringify([...users, userId]));
    }

    return userId;
  }
}

export default User;
