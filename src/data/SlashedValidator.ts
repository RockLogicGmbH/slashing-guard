import { Level } from "level";

class SlashedValidator {
  private key: string;
  private db: Level<string, string>;

  constructor(db: Level<string, string>) {
    this.key = "slashedValidators";
    this.db = db;
  }

  async find() {
    try {
      const keys = await this.db.get(this.key);

      return JSON.parse(keys) as Array<string>;
    } catch (error) {
      return [];
    }
  }

  async delete(publicKey: string) {
    const keys = await this.find();

    await this.db.put(this.key, JSON.stringify(keys.filter((key) => key !== publicKey)));

    return publicKey;
  }

  async add(publicKey: string) {
    let keys: string[];

    try {
      keys = await this.find();
    } catch (error) {
      keys = [];
    }

    if (!keys.includes(publicKey)) {
      await this.db.put(this.key, JSON.stringify([...keys, publicKey]));
    }

    return publicKey;
  }
}

export default SlashedValidator;
