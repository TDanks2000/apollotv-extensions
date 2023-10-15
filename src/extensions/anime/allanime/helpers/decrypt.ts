export class AllAnimeDecryptor {
  public static oneDigitSymmetricXOR(password: number, target: string) {
    let result = "";
    for (let i = 0; i < target.length; i += 2) {
      let segment = parseInt(target.substr(i, 2), 16);
      result += String.fromCharCode(segment ^ password);
    }
    return result;
  }

  static decryptAllAnime(password: string, target: string): string {
    const data: Uint8Array = this.hexStringToByteArray(target);
    let result = "";

    for (const segment of data) {
      const decryptedSegment = password
        .split("")
        .reduce((acc, char) => acc ^ char.charCodeAt(0), segment);

      result += String.fromCharCode(decryptedSegment);
    }

    return result;
  }

  private static hexStringToByteArray(hexString: string): Uint8Array {
    const result = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      result[i / 2] = (parseInt(hexString.substr(i, 2), 16) & 0xff) >>> 0;
    }
    return result;
  }
}
