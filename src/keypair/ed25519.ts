import nacl from "tweetnacl"
import * as uint8arrays from "uint8arrays"
import BaseKeypair from "./base"
import { Encodings } from "../types"

export class EdKeypair extends BaseKeypair {

  private secretKey: Uint8Array

  constructor(secretKey: Uint8Array, publicKey: Uint8Array, exportable: boolean) {
    super(publicKey, "ed25519", exportable)
    this.secretKey = secretKey
  }

  static async create(params?: {
    exportable: boolean
  }): Promise<EdKeypair> {
    const { exportable } = params || {}
    const keypair = nacl.sign.keyPair()
    return new EdKeypair(keypair.secretKey, keypair.publicKey, exportable ?? false)
  }

  static fromSecretKey(key: string, params?: {
    format?: Encodings
    exportable?: boolean
  }): EdKeypair {
    const { format = "base64pad", exportable = false } = params || {}
    const secretKey = uint8arrays.fromString(key, format)
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey)
    return new EdKeypair(keypair.secretKey, keypair.publicKey, exportable)
  }

  async sign(msg: Uint8Array): Promise<Uint8Array> {
    return nacl.sign.detached(msg, this.secretKey)
  }

  async export(format: Encodings = "base64pad"): Promise<string> {
    if (!this.exportable) {
      throw new Error("Key is not exportable")
    }
    return uint8arrays.toString(this.secretKey, format)
  }

}

export default EdKeypair
