class VALIDATE {
  public static async interval(sec: number) {
    return sec > 60 ? 60 : sec < 1 ? 1 : sec;
  }
}

export default VALIDATE;
