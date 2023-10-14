export class AllAnimeDecryptor {
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

(async () => {
  const password = "allanime";
  const target =
    "175948514e4c4f57175b54575b5307515c050f5c0a0c0f0b0f0c0e590a0c0b5b0a0c0a010f0d0e5e0f0a0e0b0f0d0a010e0d0e5d0e0f0f0c0f0a0e590e010f0b0f0d0f0a0f5e0a010e0f0e000e5e0e5a0e0b0a010c5a0e0a0e010d0e0b5d0e000f0a0f080c0c0d5e0b080e5c0f0a0f0b0d0c0b0a0e0f0d010b0f0b0d0d010f0d0f0b0e0c0a000e5a0f0e0b0a0a0c0a590a0c0f0d0f0a0f0c0e0b0e0f0e5a0e0b0f0c0c5e0e0a0a0c0b5b0a0c0d0d0e5d0e0f0f0c0e0b0f0e0e010e5e0e000f0a0a0c0a590a0c0e0a0e0f0f0a0e0b0a0c0b5b0a0c0b0c0b0e0b0c0b0d0a5a0b0f0b0e0a5a0b0f0b0a0d0a0b0f0b0f0b5b0b0c0b5d0b5b0b0e0b0e0a000b0e0b0e0b0e0d5b0a0c0a590a0c0f0a0f0c0e0f0e000f0d0e590e0f0f0a0e5e0e010e000d0a0f5e0f0e0e0b0a0c0b5b0a0c0f0d0f0b0e0c0a0c0a590a0c0e5c0e0b0f5e0a0c0b5b0a0c0e0b0f0e0a5a0c5a0e0a0e010d0e0b5d0e000f0a0f080c0c0d5e0b080e5c0f0a0f0b0d0c0b0a0e0f0d010b0f0b0d0d010f0d0f0b0e0c0a0c0f5a";
  const decrypted = AllAnimeDecryptor.decryptAllAnime(password, target);
  console.log(decrypted); // "Hello World!"
})();
