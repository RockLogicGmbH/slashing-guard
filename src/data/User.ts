import { Level } from "level";

class User {
  private key: string;
  private db: Level<string, string>;

  constructor(db: Level<string, string>) {
    this.key = "users";
    this.db = db;
  }

  async find() {
    try {
      const users = await this.db.get(this.key);
      return JSON.parse(users) as Array<number>;
    } catch (error) {
      return [];
    }
  }

  async add(userId: number) {
    let users: number[];

    try {
      users = await this.find();
    } catch (error) {
      users = [];
    }

    if (!users.includes(userId)) {
      users = [...users, userId];
      await this.db.put(this.key, JSON.stringify(users));
    }

    return userId;
  }

  async delete(userId: number) {
    let users: number[];

    try {
      users = await this.find();
    } catch (error) {
      return userId;
    }

    users = users.filter((key) => key !== userId);
    await this.db.put(this.key, JSON.stringify(users));

    return userId;
  }
}

export default User;
