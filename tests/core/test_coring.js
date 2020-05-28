var libsodium = require('libsodium-wrappers-sumo')
const assert = require('assert').strict;
const blake3 = require('blake3')

async function testslibsodium() {
  await libsodium.ready
  let verkey, sigkey

  /*
  Generating Keypair without seed
  */
  let keypair = await libsodium.crypto_sign_keypair()
  verkey = keypair.publicKey
  sigkey = keypair.privateKey

  assert.equal(32, verkey.length)
  assert.equal(64, sigkey.length)
  assert.equal(verkey.length, libsodium.crypto_sign_PUBLICKEYBYTES)
  assert.equal(sigkey.length, libsodium.crypto_sign_SECRETKEYBYTES)

  /*
  Generating Seed
  var str = String.fromCharCode.apply(null, uint8Arr);
  */
  let sigseed = libsodium.randombytes_buf(libsodium.crypto_sign_SEEDBYTES)
  sigseed = String.fromCharCode.apply(null, sigseed)
  assert.equal(32, verkey.length)

  /*
  Key streching  from 16 bytes using libsodium.crypto_pwhash()
  */
  assert.equal(16, libsodium.crypto_pwhash_SALTBYTES)
  let salt = libsodium.randombytes_buf(libsodium.crypto_pwhash_SALTBYTES)
  assert.equal(16, salt.length)

  /*
    algorithm default is argon2id
  */
  sigseed = libsodium.crypto_pwhash(outlen = 32,
    passwd = "",
    salt = salt,
    opslimit = libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    memlimit = libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    alg = libsodium.crypto_pwhash_ALG_DEFAULT)
  assert.equal(32, sigseed.length)
  let seedKeypair = libsodium.crypto_sign_seed_keypair(sigseed)
  verkey = seedKeypair.publicKey
  sigkey = seedKeypair.privateKey
  assert.equal(32, verkey.length)
  assert.equal(64, sigkey.length)
  assert.deepStrictEqual(sigseed, sigkey.slice(0, 32))
  assert.deepStrictEqual(verkey, sigkey.slice(-32))
  //  assert.deepStrictEqual(sigkey,[sigseed+verkey])


  /*
  utility function to extract seed from secret sigkey (really just extracting from front half)
  */

  assert.deepStrictEqual(sigseed, libsodium.crypto_sign_ed25519_sk_to_seed(sigkey))
  assert.deepStrictEqual(64, libsodium.crypto_sign_BYTES)

  let msg = "The lazy dog jumped over the river"
  msg = Buffer.from(msg, 'binary')
  let msgb = Buffer.from(msg)
  assert.deepStrictEqual(msg, msgb)




  /*
  Cryptobox authentication with X25519 keys
  */


  let box_keypair = libsodium.crypto_box_keypair()
  let alice_pubkey = box_keypair.publicKey
  let alice_prikey = box_keypair.privateKey
  assert.equal(32, alice_pubkey.length)
  assert.deepStrictEqual(alice_pubkey.length, libsodium.crypto_box_PUBLICKEYBYTES)
  assert.deepStrictEqual(32, alice_prikey.length)
  assert.deepStrictEqual(alice_prikey.length, libsodium.crypto_box_SECRETKEYBYTES)

  let repubkey = libsodium.crypto_scalarmult_base(alice_prikey)
  assert.deepStrictEqual(repubkey, alice_pubkey)
  assert.equal(32, libsodium.crypto_box_SEEDBYTES)
  let boxseed = libsodium.randombytes_buf(libsodium.crypto_box_SEEDBYTES)
  assert.equal(32, boxseed.length)
  let box_seed_keypair = libsodium.crypto_box_seed_keypair(boxseed)
  //  console.log("box_seed_keypair----------------_>",box_seed_keypair)
  let bob_pubkey = box_seed_keypair.publicKey
  let bob_prikey = box_seed_keypair.privateKey
  assert.equal(32, bob_pubkey.length)
  assert.equal(32, bob_prikey.length)

  repubkey = libsodium.crypto_scalarmult_base(bob_prikey)
  assert.deepStrictEqual(repubkey, bob_pubkey)
  assert.equal(24, libsodium.crypto_box_NONCEBYTES)
  let nonce = libsodium.randombytes_buf(libsodium.crypto_box_NONCEBYTES)
  assert.equal(24, nonce.length)
  let atob_tx = "Hi Bob I am Alice"
  let atob_txb = Buffer.from(atob_tx, 'utf-8');


  /*Detached recomputes shared key every time.
  A encrypt to B

  */
  let acrypt_amac = await libsodium.crypto_box_detached(atob_txb, nonce, bob_pubkey, alice_prikey)
  let acrypt = acrypt_amac.ciphertext
  let amac = acrypt_amac.mac
  let amacl = libsodium.crypto_box_MACBYTES
  assert.equal(16, amacl)

  /*
  # when transmitting prepend amac to crypt
  */


  let acypher = await libsodium.crypto_box_easy(atob_txb, nonce, bob_pubkey, alice_prikey)
  //  console.log('acypher',acypher.toString())
  //console.log('amac + acrypt',(amac + acrypt))


  //console.log("b--------------------------------->",String.fromCharCode.apply(null, amac+acrypt))
  assert.deepStrictEqual(acypher.toString(), amac + ',' + acrypt)

  let atob_rxb = await libsodium.crypto_box_open_detached(acrypt, amac, nonce, alice_pubkey, bob_prikey)

  let atob_rx = Buffer.from(atob_rxb, 'utf-8');
  assert.deepStrictEqual(atob_tx, atob_rx.toString())
  assert.deepStrictEqual(atob_txb.toString(), String.fromCharCode.apply(null, atob_rxb))

  let btoa_tx = 'Hi Alice ,BOB this side'
  let btoa_txb = Buffer.from(btoa_tx, 'utf-8');
  let bcrypt_bmac = libsodium.crypto_box_detached(btoa_txb, nonce, alice_pubkey, bob_prikey)

  let bcrypt = bcrypt_bmac.ciphertext
  let bmac = bcrypt_bmac.mac
  let bcipher = libsodium.crypto_box_easy(btoa_txb, nonce, alice_pubkey, bob_prikey)
  //  console.log("bcipher",String.fromCharCode.apply(null, bcipher))
  // let a = bmac+bcrypt
  // console.log("bmac+bcrypt",a.toString('utf-8'))
  //   assert.deepStrictEqual(bcipher,bmac+bcrypt)


  // COMPUTE SHARED KEY =========================================

  let asymmkey = libsodium.crypto_box_beforenm(bob_pubkey, alice_prikey)
  let bsymmkey = libsodium.crypto_box_beforenm(alice_pubkey, bob_prikey)
  assert.deepStrictEqual(asymmkey, bsymmkey)

  acipher = libsodium.crypto_box_easy_afternm(atob_txb, nonce, asymmkey)
  atob_rxb = libsodium.crypto_box_open_easy_afternm(acipher, nonce, bsymmkey)
  assert.deepStrictEqual(String.fromCharCode.apply(null, atob_rxb), atob_txb.toString())

  bcipher = libsodium.crypto_box_easy_afternm(btoa_txb, nonce, bsymmkey)
  btoa_rxb = libsodium.crypto_box_open_easy_afternm(bcipher, nonce, asymmkey)

  assert.deepStrictEqual(String.fromCharCode.apply(null, btoa_rxb), btoa_txb.toString())
  /*
  # crypto_box_seal public key encryption with X25519 keys
  #  uses same X25519 type of keys as crypto_box authenticated encryption
  #  so when converting sign key Ed25519 to X25519 can use for both types of encryption
  */

  let crypto_keypair = libsodium.crypto_box_keypair()
  let crypto_publickey = crypto_keypair.publicKey
  let crypto_privatekey = crypto_keypair.privateKey
  assert.equal(32, crypto_publickey.length)
  assert.equal(32, crypto_privatekey.length)
  assert.equal(48, libsodium.crypto_box_SEALBYTES)


  let random_msg = "The lazy dog jumped over the river"
  random_msg_txb = Buffer.from(random_msg, 'binary')
  let msg_b = Buffer.from(random_msg_txb)


  cipher = libsodium.crypto_box_seal(random_msg_txb, crypto_publickey)
  assert.equal(cipher.length, 48 + random_msg_txb.length)


  let msg_rxb = libsodium.crypto_box_seal_open(cipher, crypto_publickey, crypto_privatekey)
  assert.deepStrictEqual(String.fromCharCode.apply(null, msg_rxb), random_msg_txb.toString())



  let crypto_sign_pubkey = libsodium.crypto_sign_ed25519_pk_to_curve25519(verkey)
  let crypto_sign_prikey = libsodium.crypto_sign_ed25519_sk_to_curve25519(sigkey)
  assert.equal(crypto_sign_pubkey.length, libsodium.crypto_box_PUBLICKEYBYTES)
  assert.equal(crypto_sign_prikey.length, libsodium.crypto_box_SECRETKEYBYTES)


  let crypto_repubkey = libsodium.crypto_scalarmult_base(crypto_sign_prikey)
  assert.deepStrictEqual(crypto_sign_pubkey, crypto_repubkey)

  let crypto_msg = "Encoded using X25519 key converted from Ed25519 key"
  crypto_msg_txb = Buffer.from(crypto_msg, 'binary')
  let crypto_msg_b = Buffer.from(crypto_msg_txb)
  let crypto_cipher = libsodium.crypto_box_seal(crypto_msg_txb, crypto_sign_pubkey)
  assert.equal(crypto_cipher.length, 48 + crypto_msg_txb.length)
}

async function blake() {
  await libsodium.ready
  let keypair = await libsodium.crypto_sign_keypair()
  let verkey = keypair.publicKey
  let sigkey = keypair.privateKey
  assert.equal(verkey.length, libsodium.crypto_sign_PUBLICKEYBYTES)
  assert.equal(32, verkey.length)
  assert.equal(sigkey.length, libsodium.crypto_sign_SECRETKEYBYTES)
  assert.equal(64, sigkey.length)

  verkey = String.fromCharCode.apply(null, verkey)


  /*
  Digest of public key 
  */

  let hash = blake3.createHash(verkey)
  let hash2 = blake3.createHash(verkey)
  let hash_32 = hash.digest()
  let hash_64 = hash2.digest({ length: 64 })
  assert.equal(32, hash_32.length)
  assert.equal(64, hash_64.length)
}
testslibsodium()