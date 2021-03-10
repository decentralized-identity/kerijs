const libsodium = require('libsodium-wrappers-sumo');
const assert = require('assert').strict;
const { Signer } = require('../../src/keri/core/signer');
const derivationCodes = require('../../src/keri/core/derivationCode&Length');
const { TraitCodex } = require('../../src/keri/eventing/TraitCodex');
const { Kevery } = require('../../src/keri/eventing/kevery');
const { Nexter } = require('../../src/keri/core/nexter');
const { Sigcounter } = require('../../src/keri/core/SigCounter');
const {
  Serials, Versionage,
} = require('../../src/keri/core/core');

const {
  openLogger, snkey, dgkey,
} = require('../../src/keri/db/index');

/**
 *   """
    Test direct mode with transverable validator event receipts

    """
    # manual process to generate a list of secrets
    # root = pysodium.randombytes(pysodium.crypto_pwhash_SALTBYTES)
    # secrets = generateSecrets(root=root, count=8)

    #  Direct Mode initiated by coe is controller, val is validator
    #  but goes both ways once initiated.
 */
async function test_direct_mode() {
  await libsodium.ready;
  const coeSigners = [];
  const signers = [];
  const valSigners = [];
  const signers1 = [];
  // # set of secrets  (seeds for private keys)
  const coeSecrets = [
    'ArwXoACJgOleVZ2PY7kXn7rA0II0mHYDhc6WrBH8fDAc',
    'A6zz7M08-HQSFq92sJ8KJOT2cZ47x7pXFQLPB0pckB3Q',
    'AcwFTk-wgk3ZT2buPRIbK-zxgPx-TKbaegQvPEivN90Y',
    'Alntkt3u6dDgiQxTATr01dy8M72uuaZEf9eTdM-70Gk8',
    'A1-QxDkso9-MR1A8rZz_Naw6fgaAtayda8hrbkRVVu1E',
    'AKuYMe09COczwf2nIoD5AE119n7GLFOVFlNLxZcKuswc',
    'AxFfJTcSuEE11FINfXMqWttkZGnUZ8KaREhrnyAXTsjw',
    'ALq-w1UKkdrppwZzGTtz4PWYEeWm0-sDHzOv5sq96xJY',
  ];

  //     #  create coe signers
  for (const secret in coeSecrets) {
    coeSigners[secret] = new Signer(null, derivationCodes.oneCharCode.Ed25519_Seed, true, libsodium, coeSecrets[secret]);
  }
  for (const signer in coeSigners) {
    signers[signer] = coeSigners[signer].qb64();
    assert.deepStrictEqual(signers[signer], coeSecrets[signer]);
  }

  // # set of secrets (seeds for private keys)
  const valSecrets = ['AgjD4nRlycmM5cPcAkfOATAp8wVldRsnc9f1tiwctXlw',
    'AKUotEE0eAheKdDJh9QvNmSEmO_bjIav8V_GmctGpuCQ',
    'AK-nVhMMJciMPvmF5VZE_9H-nhrgng9aJWf7_UHPtRNM',
    'AT2cx-P5YUjIw_SLCHQ0pqoBWGk9s4N1brD-4pD_ANbs',
    'Ap5waegfnuP6ezC18w7jQiPyQwYYsp9Yv9rYMlKAYL8k',
    'Aqlc_FWWrxpxCo7R12uIz_Y2pHUH2prHx1kjghPa8jT8',
    'AagumsL8FeGES7tYcnr_5oN6qcwJzZfLKxoniKUpG4qc',
    'ADW3o9m3udwEf0aoOdZLLJdf1aylokP0lwwI_M2J9h0s',
  ];

  //  #  create val signers

  for (const secret in valSecrets) {
    valSigners[secret] = new Signer(null, derivationCodes.oneCharCode.Ed25519_Seed, true, libsodium, valSecrets[secret]);
  }

  for (const signer in valSigners) {
    signers1[signer] = valSigners[signer].qb64();
    assert.deepStrictEqual(signers1[signer], valSecrets[signer]);
  }

  const coeLogger = openLogger('controller').next().value;
  const valLogger = openLogger('validator').next().value;

  //  #  init Keverys
  const coeKevery = new Kevery(null, null, null, coeLogger);
  const valKevery = new Kevery(null, null, null, valLogger);

  const coeEventDigs = []; // # list of coe's own event log digs to verify against database
  const valEventDigs = []; // # list of val's own event log digs to verify against database

  // #  init sequence numbers for both coe and vala
  let csn = cesn = 0; // # sn and last establishment sn = esn
  const vsn = vesn = 0; // # sn and last establishment sn = esn

  // # Coe Event 0  Inception Transferable (nxt digest not empty)
  const Trait_instance = new TraitCodex();

  const coe_ = coeSigners[cesn].verfer();
  const coe1_ = coeSigners[cesn + 1].verfer();

  let coeSerder = Trait_instance.incept([coe_.qb64()], derivationCodes.oneCharCode.Blake3_256,
    Versionage, Serials.json, null, new Nexter(null, null, [coe1_.qb64()]).qb64());

  let ked = coeSerder.ked();
  console.log('COSERDER KED IS :', ked);
  coeSerder.set_ked(ked);

  assert.deepStrictEqual(parseInt(coeSerder.ked()['sn'], 16), 0);
  const coepre = coeSerder.ked()['pre'];
  assert.deepStrictEqual(coepre, 'EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E');

  coeEventDigs.push(coeSerder.dig());

  let counter = new Sigcounter(null, null, null, null, derivationCodes.SigCntCodex.Base64);
  // console.log("CONTROLLER PUBLIC KEY IS ", coeSigners[cesn]._qb64)
  let siger = await coeSigners[cesn].sign(coeSerder.raw(), 0);

  // #  create serialized message
  let cmsg = [coeSerder.raw(), counter.qb64b(), siger.qb64b()];
  const cmsgToString = '{"vs":"KERI10JSON0000fb_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"0","ilk":"icp","sith":"1","keys":["DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA"],"nxt":"EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4","toad":"0","wits":[],"cnfg":[]}-AABAAxUKz3U0KToap5s6VzigOhEHjRgPQgfSkCT3aFgHDoQAD_zWacmgVyX1fMTeb_4jdLlW_iMItLqTYrXYXA5IzDw';
  cmsg = Buffer.concat(cmsg);
  console.log('creating serialized message (controller):\n', cmsg.toString(), '\n');
  // console.log('SERIALIZED MESSAGE GENERATED BY CONTROLLER IS : ', cmsg.toString())
  assert.deepStrictEqual(cmsg, Buffer.from(cmsgToString, 'binary'));

  // #     # create own Coe Kever in  Coe's Kevery
  console.log("creating own controller Kever in  controller 's Kevery");
  // console.log("CONTROLLER'S OWN KEY VERIFIER : ", coeKevery.kevers)
  // console.log("\n\n SENDING COPY OF LOGS TO DATABASE :")
  coeKevery.processOne(cmsg); // # send copy of cmsg1
  console.log('PROCESS ONE SUCCESSFULLY CALLED');
  const coeKever = await coeKevery.kevers[coepre];
  console.log('coeKever :', coeKever.prefixer.qb64());
  assert.deepStrictEqual(coeKever.prefixer.qb64(), coepre);
  //   // console.log("CONTROLLER'S DATA SUCCESSFULLY VERIFIED")

  const val_ = valSigners[vesn].verfer();
  const val1_ = valSigners[vesn + 1].verfer();

  // # Val Event 0  Inception Transferable (by Validator)
  // console.log("CREATING INSCEPTION EVENT 0 BY VALIDATOR :")
  const valSerder = Trait_instance.incept([val_.qb64()], derivationCodes.oneCharCode.Blake3_256,
    Versionage, Serials.json, null,
    new Nexter(null, null, [val1_.qb64()]).qb64());

  const ked_ = valSerder.ked();
  // console.log("VALERDER KEd IS :", val1_.qb64() , val_.qb64())
  valSerder.set_ked(ked_);
  console.log('valSerder.ked() ======================>', valSerder.ked());
  const valpre = valSerder.ked()['pre'];

  assert.deepStrictEqual(parseInt(valSerder.ked()['sn'], 16), 0);
  assert.deepStrictEqual(vsn, 0);
  assert.deepStrictEqual(valpre, 'EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY');
  valEventDigs.push(valSerder.dig());

  // //         create sig counter
  // //         counter = SigCounter()  # default is count = 1
  // //         sign serialization
  // console.log("SIGNING SERIALIZATION:")
  siger = await valSigners[vesn].sign(valSerder.raw(), 0); // # return Siger if index
  console.log('SIGNATURE WITH VERFER PROPERTY:', siger.qb64b());
  console.log('SERIALIZATION SUCCESSFULLY SIGNED');
  // //      create serialized message

  let vmsg = [valSerder.raw(), counter.qb64b(), siger.qb64b()];
  vmsg = Buffer.concat(vmsg);
  console.log('Creating Val Event 0  Inception Transferable (by Validator)\n\n', vmsg.toString());
  //   # create own Val Kever in  Val's Kevery
  // console.log(" ######### PROCESS ONE CALLING  ##############################2")
  try { valKevery.processOne(vmsg); } catch (e) {
    console.log('ERROR IS ------------->', e);
  }
  // // // // //   //  send copy of vmsg
  const valKever = await valKevery.kevers[valpre];
  // let qb64b = await valKever.diger.qb64b()
  // let coe_qqb64 = coeKever.diger.qb64b()
  // console.log('VALEKEVERY. KEVERS IS : ========', valKever)
  assert.deepStrictEqual(valKever.prefixer.qb64(), valpre);

  console.log("simulating sending of coe's inception message to val");
  //     # simulate sending of coe's inception message to val
  valKevery.processAll(cmsg); // # make copy of msg3

  const SealEvent = { pre: '', dig: '' };
  SealEvent.pre = valpre;
  SealEvent.dig = valKever.lastEst.dig; /// valKever.lastEst.dig
  let seal = SealEvent;
  const coeK = await valKevery.kevers[coepre]; // # lookup coeKever from val's .kevers
  //   // // // // //   //  # create validator receipt
  let reserder = Trait_instance.chit(coeK.prefixer.qb64(),
    coeK.sn,
    coeK.diger.qb64(),
    seal, Versionage, Serials.json);

  ked = reserder.ked();
  reserder.set_ked(ked);
  // console.log("reserder =====================+>",'\n\n\n')
  // console.log("reserder RAW =====================+>",(reserder.raw()).toString())
  console.log(" validator will ssign coe's event not receipt ");
  //  # sign coe's event not receipt
  //  # look up event to sign from val's kever for coe
  //   console.log("look up event to sign from val's kever for coe")
  const coeIcpDig = valKevery.logger.getKeLast(snkey(coepre, csn));
  //   // let coeIcpDig = Buffer.from(data, 'binary')
  assert.deepStrictEqual(coeK.diger.qb64(), coeIcpDig.toString());
  assert.deepStrictEqual(coeK.diger.qb64(), 'EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc'); // Val ke key hai ye
  const coeIcpRaw = valKevery.logger.getEvt(dgkey(coepre, coeIcpDig));
  const bufString = '{"vs":"KERI10JSON0000fb_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"0","ilk":"icp","sith":"1","keys":["DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA"],"nxt":"EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4","toad":"0","wits":[],"cnfg":[]}';
  console.log("look up event to sign from val's kever for coe :", coeIcpRaw.toString());

  const raw = Buffer.from(bufString, 'binary');
  assert.deepStrictEqual(coeIcpRaw, raw);
  // // //   // #     counter = SigCounter(count=1)
  counter = new Sigcounter(null, null, null, null, derivationCodes.SigCntCodex.Base64, null, 1);
  // console.log("COUNTER :", counter)
  assert.deepStrictEqual(counter.qb64(), '-AAB');
  // // #     assert counter.qb64 == '-AAB'
  siger = await valSigners[vesn].sign(coeIcpRaw, 0); // # return Siger if index
  assert.deepStrictEqual(siger.qb64(), 'AAez7HD-dtLmHuG3M1nlodjPodCNVK7QPtlSzUlCyJsl3UuHnt39sVxqYRRW4mjkMMyTw_FvDVsDA5fplDM58kAw');

  let rmsg = [Buffer.from(reserder.raw(), 'binary'), Buffer.from(counter.qb64b(), 'binary'), Buffer.from(siger.qb64b(), 'binary')];

  rmsg = Buffer.concat(rmsg);
  // console.log("rmsg ================>",rmsg.toString())
  let vmsgString = '{"vs":"KERI10JSON00010c_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","ilk":"vrc","sn":"0","dig":"EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc","seal":{"pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8"}}-AABAAez7HD-dtLmHuG3M1nlodjPodCNVK7QPtlSzUlCyJsl3UuHnt39sVxqYRRW4mjkMMyTw_FvDVsDA5fplDM58kAw';
  vmsgString = Buffer.from(vmsgString, 'binary');
  assert.deepStrictEqual(rmsg, vmsgString);

  valKevery.processOne(rmsg); // # process copy of rmsg4

  //   // // // #     # attach reciept message to existing message with val's incept message
  vmsg = Buffer.concat([vmsg, rmsg]);
  // console.log("vmsg =======>", vmsg.toString())
  let vmsg1String = '{"vs":"KERI10JSON0000fb_","pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","sn":"0","ilk":"icp","sith":"1","keys":["D8KY1sKmgyjAiUDdUBPNPyrSz_ad_Qf9yzhDNZlEKiMc"],"nxt":"E29akD_tuTrdFXNHBQWdo6qPVXsoOu8K2A4LssoCunwc","toad":"0","wits":[],"cnfg":[]}-AABAA23aEckS_DxKOrfr4NOzk_KlLtZ_kCrUkSpgf9Y7ulvZIkayvRRGpi4j0CUBGkHJosXiUrKscJR2IRumoTdQrCA{"vs":"KERI10JSON00010c_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","ilk":"vrc","sn":"0","dig":"EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc","seal":{"pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8"}}-AABAAez7HD-dtLmHuG3M1nlodjPodCNVK7QPtlSzUlCyJsl3UuHnt39sVxqYRRW4mjkMMyTw_FvDVsDA5fplDM58kAw';
  vmsg1String = Buffer.from(vmsg1String, 'binary');
  assert.deepStrictEqual(vmsg, vmsg1String);

  // //   // // // // // #
  console.log(" #Validator will  Simulate and send to controller of val's incept + validator's receipt of controller's inception message");
  try { coeKevery.processAll(vmsg); } catch (e) {
    console.log('ERROR :', e);
  }
  // coeKever.lastEst.dig = 'EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc'
  // coeKever.lastEst.dig = coe_qqb64.toString() 
  // console.log('valKever.prefixer.qb64b() ================>' );


  const dgKey = dgkey(coeKever.prefixer.qb64(), coeKever.diger.qb64());
  const result_ = coeKevery.logger.getVrcs(dgKey);
  // console.log("################### valKever.prefixer.qb64() ####################",valKever.diger)
  // console.log("valKever.prefixer.qb64b() ================>",valKever)
  let valSig = [valKever.prefixer.qb64b(), Buffer.from(valKever.lastEst.dig, 'binary'), siger.qb64b()];
  valSig = Buffer.concat(valSig);
  // console.log("result_ -=========================>", result_[0].toString())
  console.log("valSig -=========================>", coeKevery.logger);
  assert.deepStrictEqual(result_[0], valSig);
  assert.deepStrictEqual(result_[0].toString(), 'EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAYEAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8AAez7HD-dtLmHuG3M1nlodjPodCNVK7QPtlSzUlCyJsl3UuHnt39sVxqYRRW4mjkMMyTw_FvDVsDA5fplDM58kAw');
  // #     # create receipt to escrow use invalid dig and sn so not in coe's db
  console.log("# create receipt to escrow use invalid dig and sn so not in coe's db");
  const fake = reserder.dig(); // # some other dig

  reserder = Trait_instance.chit(coeK.prefixer.qb64(),
    10,
    fake,
    seal, Versionage, Serials.json);

  ked = reserder.ked();
  reserder.set_ked(ked);

  // // // //   // #     # sign event not receipt
  // // // //   // #     counter = SigCounter(count=1)
  siger = await valSigners[vesn].sign(coeIcpRaw, 0); // # return Siger if index
  // // // // //   // #     # create message
  // console.log("")
  vmsg = [Buffer.from(reserder.raw(), 'binary'), Buffer.from(counter.qb64b(), 'binary'), Buffer.from(siger.qb64b(), 'binary')];
  vmsg = Buffer.concat(vmsg);
  console.log('\n # create message\n\n', vmsg.toString());

  let vmsg1 = '{"vs":"KERI10JSON00010c_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","ilk":"vrc","sn":"a","dig":"E8NHnmjzoG9ITC40QdhLqGhiB3V50FaV3wzaTMI7SHmA","seal":{"pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8"}}-AABAAez7HD-dtLmHuG3M1nlodjPodCNVK7QPtlSzUlCyJsl3UuHnt39sVxqYRRW4mjkMMyTw_FvDVsDA5fplDM58kAw';
  vmsg1 = Buffer.from(vmsg1, 'binary');

  assert.deepStrictEqual(vmsg, vmsg1);


  console.log('controller process the escrow receipt from val');
  coeKevery.processAll(vmsg); // #  coe process the escrow receipt from val
  console.log('coKever ========================>');
  // #     #  check if in escrow database
  let getVres = coeKevery.logger.getVres(dgkey(coeKever.prefixer.qb64(), fake));

  getVres = Buffer.from(getVres[0], 'binary');

  assert.deepStrictEqual(getVres, Buffer.from((valKever.prefixer.qb64b() + valKever.diger.qb64b() + siger.qb64b()), 'binary'));

  console.log('Send receipt from controller to validator ');
  console.log("\ncreate receipt of validator's inception");
  // console.log("\ncreate seal of coe's last est event")
  // // // // //   // #     # Send receipt from coe to val
  // // // // //   // #     # create receipt of val's inception
  // // // // //   // #     # create seal of coe's last est event
  SealEvent.pre = coepre;
  SealEvent.dig = coeKever.lastEst.dig;
  seal = SealEvent;
  const valK = await coeKevery.kevers[valpre]; // # lookup valKever from coe's .kevers
  // // // //   // #     # create validator receipt

  console.log('\ncreating validator receipt');
  reserder = Trait_instance.chit(valK.prefixer.qb64(),
    valK.sn,
    valK.diger.qb64(),
    seal, Versionage, Serials.json);
  // // 
  ked = reserder.ked();
  reserder.set_ked(ked);

  // // // // // //       // # sign vals's event not receipt
  // // // // // //   // #     # look up event to sign from coe's kever for val
  console.log("\nsigning vals's event not receipt");
  console.log("saving receipt in controller's own db for further use");
  console.log("\nlook up event to sign from controller's kever for val");
  // console.log("valIcpDig:",coeKevery.logger.getKes(snkey(valpre, vsn)))
  // console.log("valIcpDig :",(valK.diger.qb64b()).toString())
  let valIcpDig = coeKevery.logger.getKeLast(snkey(valpre, vsn));
  valIcpDig = Buffer.from(valIcpDig, 'binary');
  assert.deepStrictEqual(valIcpDig, valK.diger.qb64b());
  assert.deepStrictEqual(valK.diger.qb64b(), Buffer.from('EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8', 'binary'));

  const valIcpRaw = Buffer.from(coeKevery.logger.getEvt(dgkey(valpre, valIcpDig)), 'binary');
  const calIcpRawBuf = Buffer.from('{"vs":"KERI10JSON0000fb_","pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","sn":"0","ilk":"icp","sith":"1","keys":["D8KY1sKmgyjAiUDdUBPNPyrSz_ad_Qf9yzhDNZlEKiMc"],"nxt":"E29akD_tuTrdFXNHBQWdo6qPVXsoOu8K2A4LssoCunwc","toad":"0","wits":[],"cnfg":[]}', 'binary');

  assert.deepStrictEqual(valIcpRaw, calIcpRawBuf);
  // //   // #     counter = SigCounter(count=1)
  assert.deepStrictEqual(counter.qb64(), '-AAB');
  // //   // #     assert counter.qb64 == '-AAB'
  siger = await coeSigners[vesn].sign(valIcpRaw, 0); // # return Siger if index
  assert.deepStrictEqual(siger.qb64(), 'AAPJrY-fBD2FkQJ_p2m9w_sapqM2xB6uLuhqOftFVcS04QZgKQeXIZxeLHUUtH9ulc0-5Rcipr-4z1UVTzsQXiDg');

  // #     # create receipt message

  cmsg = [Buffer.from(reserder.raw(), 'binary'),
    Buffer.from(counter.qb64b(), 'binary'),
    Buffer.from(siger.qb64b(), 'binary')];
  cmsg = Buffer.concat(cmsg);
  // console.log("cmsg",cmsg.toString())
  let cmsgString = '{"vs":"KERI10JSON00010c_","pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","ilk":"vrc","sn":"0","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8","seal":{"pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","dig":"EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc"}}-AABAAPJrY-fBD2FkQJ_p2m9w_sapqM2xB6uLuhqOftFVcS04QZgKQeXIZxeLHUUtH9ulc0-5Rcipr-4z1UVTzsQXiDg';
  assert.deepStrictEqual(cmsg, Buffer.from(cmsgString, 'binary'));
 
  console.log('\n create receipt message \n', cmsgString);
  //   // #     # coe process own receipt in own Kevery so have copy in own log
  console.log('\ncoe process own receipt in own Kevery so have copy in own log');
  await coeKevery.processOne(cmsg); // # make copy

  // //  # Simulate send to val of coe's receipt of val's inception message
  console.log("Controller is Simulating and sending to validator of controller's receipt of validator's inception message");
  valKevery.processAll(cmsg); // #  coe process val's incept and receipt

  // //  #  check if receipt from coe in val's receipt database
  console.log("validator is checkig  if receipt from controller in validator's receipt database");
  let result = valKevery.logger.getVrcs(dgkey(valKever.prefixer.qb64(), valKever.diger.qb64()));

  // console.log("result[0]=======================>")
  assert.deepStrictEqual(result[0], Buffer.from(coeKever.prefixer.qb64b() + coeKever.diger.qb64b() + siger.qb64b(), 'binary'));
  assert.deepStrictEqual(result[0].toString(), 'EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3EEmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgcAAPJrY-fBD2FkQJ_p2m9w_sapqM2xB6uLuhqOftFVcS04QZgKQeXIZxeLHUUtH9ulc0-5Rcipr-4z1UVTzsQXiDg');

  // // // #     # Coe RotationTransferable
  console.log('Coe Rotation Transferable');
  csn += 1;
  cesn += 1; 
  assert.equal(csn, cesn);
  const coesigner0 = coeSigners[cesn].verfer();

  coeSerder = Trait_instance.rotate(coeKever.prefixer.qb64(),
    [coesigner0.qb64()], coeKever.diger.qb64(),
    csn, Versionage, Serials.json, null,
    new Nexter(null, null, [coesigner0.qb64()]).qb64(),
  );

  ked = coeSerder.ked();
  coeSerder.set_ked(ked);
  counter = new Sigcounter(null, null, null, null, derivationCodes.SigCntCodex.Base64);
  coeEventDigs.push(coeSerder.dig());
  siger = await coeSigners[cesn].sign(coeSerder.raw(), 0);

  // #     #  create serialized message

  cmsg = [coeSerder.raw(), counter.qb64b(), siger.qb64b()];
  cmsg = Buffer.concat(cmsg);
  // console.log("cmsg ==============+>",cmsg.toString()  )
  cmsgString = '{"vs":"KERI10JSON00013a_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"1","ilk":"rot","dig":"EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc","sith":"1","keys":["DVcuJOOJF1IE8svqEtrSuyQjGTd2HhfAkt9y2QkUtFJI"],"nxt":"EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4","toad":"0","cuts":[],"adds":[],"data":[]}-AABAAnhFQiHG-5_cl9pSSX-eeSh8XEel8UghWUMdjfgtbAgG9m04SoGIOsjgmc84jM2Lyf-t4h0Do_f20c7MHnXSTBA';
  assert.deepStrictEqual(cmsg.toString(), cmsgString);

  console.log('creating serialized message\n\n', cmsgString);
  // #     # update coe's key event verifier state
  console.log(" updating controller's key event verifier state");
  await coeKevery.processOne(cmsg); // # make copy
  console.log(" verify controller's copy of coe's event stream is updated");
  // #     # verify coe's copy of coe's event stream is updated
  assert.equal(coeKever.sn, csn); // These value should not be same
  assert.equal(coeKever.diger.qb64(), coeSerder.dig()); // these two digest should not be same

  // // // #     # simulate send message from coe to val
  console.log('simulate send message from controller to validator ');
  valKevery.processAll(cmsg);

  // #     # verify val's copy of coe's event stream is updated
  console.log("verify validator's copy of controller's event stream is updated");
  assert.deepStrictEqual(coeK.sn, csn);
  assert.deepStrictEqual(coeK.diger.qb64(), coeSerder.dig());

  // #     # create receipt of coe's rotation
  // #     # create seal of val's last est event
  SealEvent.pre = valpre;
  SealEvent.dig = valKever.lastEst.dig;
  seal = SealEvent;
  console.log("# create receipt of controller's rotation");
  console.log('# create validator receipt');
  // #     # create validator receipt

  reserder = Trait_instance.chit(coeK.prefixer.qb64(),
    coeK.sn,
    coeK.diger.qb64(),
    seal, Versionage, Serials.json);

  ked = reserder.ked();
  reserder.set_ked(ked);

  // #     # sign coe's event not receipt
  // #     # look up event to sign from val's kever for coe
  console.log("sign controller's event not receipt");
  console.log("look up event to sign from validator's kever for controller");
  const coeRotDig = valKevery.logger.getKeLast(snkey(coepre, csn));
  assert.deepStrictEqual(coeRotDig, coeK.diger.qb64b());
  assert.deepStrictEqual(coeRotDig, Buffer.from('Eu4ONQk4BmAW9hMyQlh3kq1icF4pkG8qOpjPsAv5vtFs', 'binary'));
  const coeRotRaw = valKevery.logger.getEvt(dgkey(coepre, coeRotDig));
  //  console.log("coeRotRaw ---------------------->",coeRotRaw.toString())

  const coeRotRawString = '{"vs":"KERI10JSON00013a_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"1","ilk":"rot","dig":"EmyxWXl_tNYzRGGjwA2IOi2yBBG_cIniU1JVdB6nHFgc","sith":"1","keys":["DVcuJOOJF1IE8svqEtrSuyQjGTd2HhfAkt9y2QkUtFJI"],"nxt":"EGAPkzNZMtX-QiVgbRbyAIZGoXvbGv9IPb0foWTZvI_4","toad":"0","cuts":[],"adds":[],"data":[]}';
  assert.deepStrictEqual(coeRotRaw.toString(), coeRotRawString);
  siger = await valSigners[vesn].sign(coeRotRaw, 0); // # return Siger if index

  assert.deepStrictEqual(siger.qb64(), 'AAuKYFfqyOtLD0RmiMFTtCK_RNtr0P2LH-64lTjAmMBQPvJn-sAsjzKd9IeWfHv2YAeGwkxrkbYxhCu5QD8COgDg');
  // #     # val create receipt message
  console.log('validator create receipt message\n\n');
  vmsg = [reserder.raw(), counter.qb64b(), siger.qb64b()];
  // console.log("vmsg ====================>",vmsg.toString())
  vmsg = Buffer.concat(vmsg);

  vmsgString = '{"vs":"KERI10JSON00010c_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","ilk":"vrc","sn":"1","dig":"Eu4ONQk4BmAW9hMyQlh3kq1icF4pkG8qOpjPsAv5vtFs","seal":{"pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8"}}-AABAAuKYFfqyOtLD0RmiMFTtCK_RNtr0P2LH-64lTjAmMBQPvJn-sAsjzKd9IeWfHv2YAeGwkxrkbYxhCu5QD8COgDg';
  assert.deepStrictEqual(vmsg, Buffer.from(vmsgString, 'binary'));

  // #     # val process own receipt in own kevery so have copy in own log
  console.log('# validator process own receipt in own kevery so have copy in own log');
  valKevery.processOne(vmsg); // # make copy
  // #     # Simulate send to coe of val's receipt of coe's rotation message
  console.log("\n# validator Simulate and  send to controller of validator's receipt of controller's rotation message");
  coeKevery.processAll(vmsg); //  #  coe process val's incept and receipt

  // #     #  check if receipt from val in receipt database
  result = coeKevery.logger.getVrcs(dgkey(coeKever.prefixer.qb64(), coeKever.diger.qb64()));
  assert.deepStrictEqual(result[0].toString(), (valKever.prefixer.qb64b() + valKever.diger.qb64b() + siger.qb64b()));
  //  console.log("result[0] ===============>",result[0].toString())

  assert.deepStrictEqual(result[0].toString(), 'EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAYEAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8AAuKYFfqyOtLD0RmiMFTtCK_RNtr0P2LH-64lTjAmMBQPvJn-sAsjzKd9IeWfHv2YAeGwkxrkbYxhCu5QD8COgDg');

  // #     # Next Event Coe Interaction
  console.log('\n# Next Event controller Interaction');
  csn += 1; // #  do not increment esn
  assert.equal(csn, 2);
  assert.equal(cesn, 1);
  coeSerder = Trait_instance.interact(coeKever.prefixer.qb64(), coeKever.diger.qb64(), csn,
    Versionage, Serials.json);
  ked = coeSerder.ked();
  //  console.log("COSERDER KED IS :", ked)
  coeSerder.set_ked(ked);

  coeEventDigs.push(coeSerder.dig());
  // #     # sign serialization
  siger = await coeSigners[cesn].sign(coeSerder.raw(), 0);

  // #     # create msg
  // console.log("OLD CMSG = ",cmsg.toString())
  cmsg = [coeSerder.raw(), counter.qb64b(), siger.qb64b()];
  cmsg = Buffer.concat(cmsg);
  // console.log("NEW CMSG = ",cmsg.toString())
  cmsgString = '{"vs":"KERI10JSON0000a3_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"2","ilk":"ixn","dig":"Eu4ONQk4BmAW9hMyQlh3kq1icF4pkG8qOpjPsAv5vtFs","data":[]}-AABAAEEI5iKVv3xufP14oKpggTsbZkiFAPfLmLOG9-N6NuXiEm-ftIXEJMoaUqdrBgN8It43AmMks6RldGtHECY0KBQ';
  assert.deepStrictEqual(cmsg, Buffer.from(cmsgString, 'binary'));
  console.log('\n# create msg :\n', cmsgString);

  // #     # update coe's key event verifier state
  console.log("# update controller's key event verifier state");
  coeKevery.processOne(cmsg); // # make copy
  console.log(" # verify cntroller's copy of controller's event stream is updated");
  // #     # verify coe's copy of coe's event stream is updated
  assert.deepStrictEqual(coeKever.sn, csn);
  assert.deepStrictEqual(coeKever.diger.qb64(), coeSerder.dig());

  // #     # simulate send message from coe to val
  console.log(' # simulate send message from controller to validator');
  valKevery.processAll(cmsg);

  // #     # verify val's copy of coe's event stream is updated
  console.log(" # verify validator's copy of controller's event stream is updated");
  assert.deepStrictEqual(coeK.sn, csn);
  assert.deepStrictEqual(coeK.diger.qb64(), coeSerder.dig());

  // #     # create receipt of coe's interaction
  // #     # create seal of val's last est event
  console.log(" # create receipt of controller's interaction");
  console.log(" # create seal of validator's last est event");
  SealEvent.pre = valpre;
  SealEvent.dig = valKever.lastEst.dig; /// valKever.lastEst.dig
  seal = SealEvent;
  // #     seal = SealEvent(pre=valpre, dig=valKever.lastEst.dig)
  // #     # create validator receipt

  reserder = Trait_instance.chit(coeK.prefixer.qb64(),
    coeK.sn,
    coeK.diger.qb64(),
    seal, Versionage, Serials.json);

  ked = reserder.ked();
  reserder.set_ked(ked);

  // #     reserder = chit(pre=coeK.prefixer.qb64,
  // #                     sn=coeK.sn,
  // #                     dig=coeK.diger.qb64,
  // #                     seal=seal)

  // #     # sign coe's event not receipt
  // #     # look up event to sign from val's kever for coe
  console.log(" # sign controller's event not receipt");
  console.log(" # look up event to sign from validator's kever for controller\n");
  const coeIxnDig = valKevery.logger.getKeLast(snkey(coepre, csn));
  assert.deepStrictEqual(coeIxnDig, coeK.diger.qb64b());
  // console.log("coeIxnDig -================>",coeIxnDig.toString())
  assert.deepStrictEqual(coeIxnDig.toString(), 'EkpnsM8T3VcBsiGxSN7KHKc2-e-yrRvgG1DhOTY82PNs');
  const coeIxnRaw = valKevery.logger.getEvt(dgkey(coepre, coeIxnDig));
  // console.log("coeIxnRaw =================>",coeIxnRaw.toString())

  const coeRotRaw1String = '{"vs":"KERI10JSON0000a3_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","sn":"2","ilk":"ixn","dig":"Eu4ONQk4BmAW9hMyQlh3kq1icF4pkG8qOpjPsAv5vtFs","data":[]}';
  assert.deepStrictEqual(Buffer.from(coeRotRaw1String, 'binary'), coeIxnRaw);

  // #     counter = SigCounter(count=1)
  siger = await valSigners[vesn].sign(coeIxnRaw, 0); // # return Siger if index
  //  console.log("siger.qb64 ==================>",siger.qb64())
  assert.deepStrictEqual(siger.qb64(), 'AAyalO3CBhIrv5ywmQx3V82RxwvN94UjZxIucYP0YR_XAvfraYvus7XpmFXzTfvVDBVnJ7XfZD4slygn0H6FTUAg');

  // #     # create receipt message
  
  vmsg = [reserder.raw(), counter.qb64b(), siger.qb64b()];
  // console.log("vmsg ====================>",vmsg.toString())
  vmsg = Buffer.concat(vmsg);
  // console.log("vmsg ===============>",vmsg.toString())
  vmsgString = '{"vs":"KERI10JSON00010c_","pre":"EN7nOioHAZlAuQgEs77Zz1gAzVsGwWNwpwUXxqhDWt3E","ilk":"vrc","sn":"2","dig":"EkpnsM8T3VcBsiGxSN7KHKc2-e-yrRvgG1DhOTY82PNs","seal":{"pre":"EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAY","dig":"EAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8"}}-AABAAyalO3CBhIrv5ywmQx3V82RxwvN94UjZxIucYP0YR_XAvfraYvus7XpmFXzTfvVDBVnJ7XfZD4slygn0H6FTUAg';

  console.log('  # create receipt message\n', vmsgString);
  Buffer.from(vmsg, Buffer.from(vmsgString, 'binary'));

  // #     # val process own receipt in own kevery so have copy in own log

  console.log(' # validator process own receipt in own kevery so have copy in own log');
  valKevery.processOne(vmsg); // # make copy

  // #     # Simulate send to coe of val's receipt of coe's rotation message
  console.log(" # Simulate send to controller of validator's receipt of controller's rotation message");
  coeKevery.processAll(vmsg); // #  coe process val's incept and receipt
  console.log('#  check if receipt from validator in receipt database');
  // #     #  check if receipt from val in receipt database
  result = coeKevery.logger.getVrcs(dgkey(coeKever.prefixer.qb64(), coeKever.diger.qb64()));
  //  console.log("execution finished =======================>",result[0].toString())
  assert.deepStrictEqual(result[0], Buffer.from(valKever.prefixer.qb64b() + valKever.diger.qb64b() + siger.qb64b(), 'binary'));
  assert.deepStrictEqual(result[0].toString(), 'EmWUcTv3revddO0RML3XhrNxGjkcVHzKJFKejyRnANAYEAdmmM5ZwZF5sJFJN5jMkh5WdS-79c3oAtonBMDBChg8AAyalO3CBhIrv5ywmQx3V82RxwvN94UjZxIucYP0YR_XAvfraYvus7XpmFXzTfvVDBVnJ7XfZD4slygn0H6FTUAg');

  // #     #  verify final coe event state
  console.log('#  verify final cntroller event state');
  assert.deepStrictEqual(coeKever.verfers[0].qb64(), coeSigners[cesn].verfer().qb64());
  assert.deepStrictEqual(coeKever.sn, coeK.sn);
  assert.deepStrictEqual(coeK.sn, csn);

  // #     db_digs = [bytes(v).decode("utf-8") for v in coeKever.logger.getKelIter(coepre)]
  // #     assert len(db_digs) == len(coeEventDigs) == csn+1
  // #     assert db_digs == coeEventDigs == ['EixO2SBNow3tYDfYX6NRt1O9ZSMx2IsBeWkh8YJRp5VI',
  // #                                          'E7MC1Sr7igW4JEDdvZu_HtmNoyBn4_Th-TcfKwwFBYR4',
  // #                                          'Ec9ivQTiqBXBhx4d2HCA7qfUksJyB6sKSHz5cHufFiyo']

  // #     db_digs = [bytes(v).decode("utf-8") for v in valKever.logger.getKelIter(coepre)]
  // #     assert len(db_digs) == len(coeEventDigs) == csn+1
  // #     assert db_digs == coeEventDigs == ['EixO2SBNow3tYDfYX6NRt1O9ZSMx2IsBeWkh8YJRp5VI',
  // #                                          'E7MC1Sr7igW4JEDdvZu_HtmNoyBn4_Th-TcfKwwFBYR4',
  // #                                          'Ec9ivQTiqBXBhx4d2HCA7qfUksJyB6sKSHz5cHufFiyo']

  // #     #  verify final val event state
  console.log('#  verify final val event state');
  assert.deepStrictEqual(valKever.verfers[0].qb64(), valSigners[vesn].verfer().qb64());
  // assert.deepStrictEqual(valKever.sn, valK.sn);
  // console.log('valKever.sn =================>',valKever)
  // assert.deepStrictEqual(valKever.sn , vsn)
  // #     assert valKever.verfers[0].qb64 == valSigners[vesn].verfer.qb64
  // #     assert valKever.sn == valK.sn == vsn

  // #     db_digs = [bytes(v).decode("utf-8") for v in valKever.logger.getKelIter(valpre)]
  // #     assert len(db_digs) == len(valEventDigs) == vsn+1
  // #     assert db_digs == valEventDigs == ['E0CxRRD8SSBHZlSt-gblJ5_PL6JskFaaHsnSiAgX5vrA']

  // #     db_digs = [bytes(v).decode("utf-8") for v in coeKever.logger.getKelIter(valpre)]
  // #     assert len(db_digs) == len(valEventDigs) == vsn+1
  // #     assert db_digs == valEventDigs == ['E0CxRRD8SSBHZlSt-gblJ5_PL6JskFaaHsnSiAgX5vrA']

  // # assert not os.path.exists(valKevery.logger.path)
  // # assert not os.path.exists(coeKever.logger.path)
}
test_direct_mode();
