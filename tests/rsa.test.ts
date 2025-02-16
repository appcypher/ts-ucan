import * as fc from "fast-check"
import * as uint8arrays from "uint8arrays"
import * as did from "../src/did"
import * as rsaCrypto from "../src/crypto/rsa"
import RSAKeypair from "../src/keypair/rsa"


describe("rsa", () => {

  let keypair: RSAKeypair
  let signature: Uint8Array
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])

  it("creates an rsa keypair", async () => {
    keypair = await RSAKeypair.create()
  })

  it("returns a publicKeyStr and did", () => {
    const publicKey = keypair.publicKeyStr()
    const keyDid = keypair.did()
    const transformed = did.didToPublicKey(keyDid)
    expect(transformed.publicKey).toEqual(publicKey)
    expect(transformed.type).toEqual("rsa")
  })

  it("signs data", async () => {
    signature = await keypair.sign(data)
  })

  it("can verify signature", async () => {
    const isValid = await did.verifySignature(data, signature, keypair.did())
    expect(isValid).toEqual(true)
  })

})

describe("ASN", () => {

  describe("asn1DERLengthEncode/Decode", () => {

    it("works with simple examples", () => {
      // 82 - bigger than 127 & 2 length octets
      // 01 - 1 * 256^1 +
      // b3 - 179 * 256^0
      // = 435
      // Example from https://en.wikipedia.org/wiki/X.690#Length_octets
      expect(uint8arrays.toString(rsaCrypto.asn1DERLengthEncode(435), "hex")).toEqual("8201b3")
    })

    it("round-trips", () => {
      fc.assert(fc.property(fc.nat(), n => {
        expect(rsaCrypto.asn1DERLengthDecode(rsaCrypto.asn1DERLengthEncode(n))).toEqual(n)
      }))
    })

    it("encodes in a simple way until 127", () => {
      for (let i = 0; i < 128; i++) {
        expect(`Encoded ${i}: ${uint8arrays.toString(rsaCrypto.asn1DERLengthEncode(i), "hex")}`)
          .toEqual(`Encoded ${i}: ${uint8arrays.toString(new Uint8Array([i]), "hex")}`)
      }
    })
  })

  describe("SPKI/PKCS1 conversion", () => {

    it("round trips with webcrypto-generated spki keys", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(1024, 2048, 3072, 4096),
          async size => {
            const key = await rsaCrypto.generateKeypair(size)
            if (key.publicKey == null) {
              expect(key.publicKey).toBeDefined()
              throw "public key is undefined"
            }
            const spki = await rsaCrypto.exportKey(key.publicKey)
            const converted =
              rsaCrypto.convertRSAPublicKeyToSubjectPublicKeyInfo(
                rsaCrypto.convertSubjectPublicKeyInfoToRSAPublicKey(
                  spki
                )
              )

            // I find hex dumps the most readable when it comes to ASN1
            expect(uint8arrays.toString(converted, "hex")).toEqual(uint8arrays.toString(spki, "hex"))
          }
        ),
        {
          numRuns: 5, // unfortunately, generating rsa keys is quite slow. Let's try to reliably keep below the 5s timeout
          examples: [[1024], [2048], [3072], [4096]], // ensure we're testing each variant at least once
        }
      )
    })

  })
})
