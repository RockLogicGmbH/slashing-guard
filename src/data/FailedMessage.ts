import { Level } from "level";
import crypto from "crypto";

interface FailedMessageData {
  hash: string;
  text: string;
  time: number;
  publicKeys: string[];
  utsLastAttempt: number;
  totalAttempts: number;
}

interface FailedMessages {
  [telegramId: string]: Array<FailedMessageData>;
}

interface FailedMessageToHash {
  [telegramId: string]: string;
}

class FailedMessage {
  private key: string;
  private db: Level<string, string>;

  constructor(db: Level<string, string>) {
    this.key = "failedMessages";
    this.db = db;
  }

  // Examples:
  // clear() => destroy FailedMessages object in database
  // Returns true on success false otherwise
  async clear() {
    try {
      await this.db.del(this.key);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Examples:
  // find() => get FailedMessages object from database
  // find(failedMessages) => get existing FailedMessages object from failedMessages
  // Returns FailedMessage object
  async find(failedMessages: FailedMessages | null = null) {
    if (failedMessages != null) return failedMessages;
    try {
      const fails = await this.db.get(this.key);
      return JSON.parse(fails) as FailedMessages;
    } catch (error) {
      return {} as FailedMessages;
    }
  }

  // Examples:
  // get("123") => get Array<FailedMessageData> for telegramId 123
  // get("123",true) => get FailedMessage object filtered for telegramId 123
  // Returns Array<FailedMessageData> or filtered FailedMessage object depending on "asObject"
  async get(telegramId: number, asObject: boolean | null = false, failedMessages: FailedMessages | null = null) {
    const fails: FailedMessages = await this.find(failedMessages);
    const filtered: FailedMessages = {};
    const asArray = !asObject;
    if (!fails.hasOwnProperty(telegramId)) {
      return asArray ? [] : filtered;
    }
    if (asArray) return fails[telegramId];
    filtered[telegramId] = fails[telegramId];
    return filtered;
  }

  // Examples:
  // filter("hash","b3caca00dc720f772865341ec662a02f") => get all messages where hash == "b3caca00dc720f772865341ec662a02f"
  // filter((item) => {return item.text === "msgtextAAA"}) => get all messages where text == "msgtextAAA"
  // filter((item) => item.publicKeys.includes("pubkeyAAA")) => get all messages where publicKeys includes "pubkeyAAA"
  // Returns filtered FailedMessage object
  async filter(
    by: keyof FailedMessageData | ((item: FailedMessageData) => boolean),
    val = "",
    failedMessages: FailedMessages | null = null
  ) {
    const fails: FailedMessages = await this.find(failedMessages);
    return Object.fromEntries(
      Object.entries(fails).map(([key, value]) => {
        return [
          key,
          value.filter((item) => {
            return typeof by === "function" ? by(item) : item[by] === val;
          }),
        ];
      })
    );
  }

  // Examples:
  // delete("b3caca00dc720f772865341ec662a02f") => delete message where hash is "b3caca00dc720f772865341ec662a02f" (no matter what telegramId)
  // Returns refreshed FailedMessage object
  async delete(hash: string, failedMessages: FailedMessages | null = null) {
    const fails: FailedMessages = await this.find(failedMessages);

    const failsFiltered = Object.fromEntries(
      Object.entries(fails).filter(([key, value]) => value.some((data) => data.hash != hash)) // eslint-disable-line @typescript-eslint/no-unused-vars
    );

    await this.db.put(this.key, JSON.stringify(failsFiltered));

    return failsFiltered;
  }

  // Examples:
  // deleteAll('123') or delete('123',null) or delete('123','') => deletes all messages where telegramId = 123
  // deleteAll(['123','456']) or delete(['123','456'],null) or delete(['123','456'],'') => deletes all messages where telegramId = (123 or 456)
  // deleteAll('123','pubkey') => delete all messages where where telegramId = 123 and publicKeys includes "pubkey"
  // deleteAll('123','pubkey','hello') => delete all messages where message hash is serialized md5 sum of "['123', ['pubkey'], 'hello']"
  // deleteAll(['123','456'],['pub','key'],'my text') => delete all messages where message hash is serialized md5 sum of "['123', ['pub','key'], 'my text']" or "['456', ['pub','key'], 'my text']"
  // Returns refreshed FailedMessage object
  async deleteAll(
    telegramIds: number | number[],
    publicKeys: string | string[] | null = null,
    text: string | null = null,
    failedMessages: FailedMessages | null = null
  ) {
    const fails: FailedMessages = await this.find(failedMessages);

    if (!Array.isArray(telegramIds)) {
      telegramIds = [telegramIds];
    }

    for (const telegramId of telegramIds) {
      if (!fails.hasOwnProperty(telegramId)) {
        continue;
      }

      if (publicKeys == "" || publicKeys == null) {
        console.log("delete by telegramId", telegramId);
        delete fails[telegramId];
        continue;
      }

      if (!Array.isArray(publicKeys)) {
        publicKeys = [publicKeys];
      }

      if (text != "" && text != null) {
        const hash = crypto
          .createHash("md5")
          .update(JSON.stringify([telegramId, publicKeys, text]))
          .digest("hex");
        console.log("delete by hash", hash);
        fails[telegramId] = fails[telegramId].filter((data) => data.hash != hash);
      } else {
        console.log("delete by publicKeys", publicKeys);
        fails[telegramId] = fails[telegramId].filter((data) => !data.publicKeys.some((pk) => publicKeys?.includes(pk)));
      }
      if (fails[telegramId].length < 1) {
        delete fails[telegramId];
      }
    }

    await this.db.put(this.key, JSON.stringify(fails));

    return fails;
  }

  // Examples:
  // toHash([123, 889], "pubkeyAAA", "msgtextAAA") => returns an FailedMessageToHash object with serialized md5 sum of "['123', ['pubkeyAAA'], 'msgtextAAA']" and "['456', ['pubkeyAAA'], 'msgtextAAA']"
  // toHash(123, "pubkeyAAA", "msgtextAAA") => returns serialized md5 sum of "['123', ['pubkeyAAA'], 'msgtextAAA']"
  // toHash([889], "pubkeyAAA", "msgtextAAA") => returns an FailedMessageToHash object with serialized md5 sum of "['889', ['pubkeyAAA'], 'msgtextAAA']"
  // Returns FailedMessageToHash object by default or string if telegramIds was a sole number
  async toHash(telegramIds: number | number[], publicKeys: string | string[], text: string) {
    const results: FailedMessageToHash = {};

    if (!Array.isArray(publicKeys)) {
      publicKeys = [publicKeys];
    }

    if (!Array.isArray(telegramIds)) {
      return crypto
        .createHash("md5")
        .update(JSON.stringify([telegramIds, publicKeys, text]))
        .digest("hex");
    }

    for (const telegramId of telegramIds) {
      const hash = crypto
        .createHash("md5")
        .update(JSON.stringify([telegramId, publicKeys, text]))
        .digest("hex");
      results[telegramId] = hash;
    }
    return results;
  }
  // Examples:
  // add(123, "pubkeyAAA", "msgtextAAA") => adds new FailedMessageData object for telegramId 123 and 889 to database and returns refreshed FailedMessage object
  // add([123, 889], "pubkeyAAA", "msgtextAAA") => adds new FailedMessageData object for telegramId 123 and 889 to database and returns refreshed FailedMessage object
  // add([123, 889], "pubkeyAAA", "msgtextAAA",true) => adds new FailedMessageData object for telegramId 123 and 889 to database and returns a new FailedMessage object containing the affected rows only
  // Returns refreshed or new filtered FailedMessages object
  async add(
    telegramIds: number | number[],
    publicKeys: string | string[],
    text: string,
    getOnlyAffectedRows: boolean | null = null
  ) {
    const uts = Math.floor(Date.now() / 1000);

    const fails: FailedMessages = await this.find();

    const affectedRows: FailedMessages = {};

    if (!Array.isArray(telegramIds)) {
      telegramIds = [telegramIds];
    }

    if (!Array.isArray(publicKeys)) {
      publicKeys = [publicKeys];
    }

    for (const telegramId of telegramIds) {
      const hash = crypto
        .createHash("md5")
        .update(JSON.stringify([telegramId, publicKeys, text]))
        .digest("hex");
      if (!fails.hasOwnProperty(telegramId)) {
        fails[telegramId] = [];
      }
      if (!affectedRows.hasOwnProperty(telegramId)) {
        affectedRows[telegramId] = [];
      }
      const existingMessage = fails[telegramId].filter((data) => data.hash == hash).pop();
      if (!existingMessage) {
        const data: FailedMessageData = {
          hash: hash,
          text: text,
          time: uts,
          publicKeys: publicKeys,
          utsLastAttempt: uts,
          totalAttempts: 1,
        };
        if (getOnlyAffectedRows) {
          affectedRows[telegramId].push(data);
        }
        fails[telegramId].push(data);
      } else {
        existingMessage["utsLastAttempt"] = uts;
        existingMessage["totalAttempts"] = existingMessage["totalAttempts"] + 1;
        if (getOnlyAffectedRows) {
          affectedRows[telegramId].push(existingMessage);
        }
      }
    }

    await this.db.put(this.key, JSON.stringify(fails));

    return getOnlyAffectedRows ? affectedRows : fails;
  }
}

export default FailedMessage;
