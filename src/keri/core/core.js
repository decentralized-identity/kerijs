const util = require('./utls')


const VERRAWSIZE = 6
const Versionage = { major: 1, minor: 0 }
const Serialage = { json: "", mgpk: "", cbor: "" }
const Vstrings = Serialage
let Serials = { json: "JSON", mgpk: "MGPK", cbor: "CBOR" }
let mimes = {
  json: "application/keri+json",
  mgpk: "application/keri+msgpack",
  cbor: "application/keri+cbor",
}
// let yourNumber = 899
// let hexString =  yourNumber.toString(16);
// let two = '29'.toString(16);
// let three = '39'.toString(16)
let VERFMT = `KERI${hexString} ${two} ${three}_`   /// version format string

//nameString.toString("utf8");

console.log("hexString", VERFMT)

/**
 * @description  It will return version string 
 */
function versify(version, kind, size) {
  if (!Serials.includes(kind))
    return "Invalid serialization kind =", kind.toString(16)
  if (!version)
    version = Versionage
  let hex1 = version[0].toString(16)
  let hex2 = version[1].toString(16)
  let kind_hex = kind.toString(16)
  let hex3 = util.pad(size, VERRAWSIZE)
  return `KERI${hex1}${hex2}${kind_hex}${hex3}_`
}



Vstrings.json = versify(version = "", kind = Serials.json, size = 0)
Vstrings.mgpk = versify(version = "", kind = Serials.mgpk, size = 0)
Vstrings.cbor = versify(version = "", kind = Serials.cbor, size = 0)


const version_pattern = 'KERI(?P<major>[0-9a-f])(?P<minor>[0-9a-f])(?P<kind>[A-Z]{4})(?P<size>[0-9a-f]{6})_'
const version_pattern1 = 'KERI\(\?P<major>\[0\-9a\-f\]\)\(\?P<minor>\[0\-9a\-f\]\)\(\?P<kind>\[A\-Z\]\{4\}\)\(\?P<size>\[0\-9a\-f\]\{6\}\)_'
const VEREX = version_pattern1


// Regex pattern matching 

/**
 * @description This function is use to deversify the version 
 * Here we will use regex to  to validate and extract serialization kind,size and version 
 * @param {string} vs   version string
 * @return {Object}  contaning kind of serialization like cbor,json,mgpk   
 *                    version = version of object ,size = raw size integer
 */
function deversify(versionString) {
  let kind, size, version = Versionage
  // we need to identify how to match the bffers pattern like we do regex matching for strings
  let match = version_pattern1.exec(versionString)

  if (match) {
    [version.major, version.minor, kind, size] = [match[0], match[1], match[2], match[3]]
    if (!Object.values(Serials).includes(kind))
      throw `Invalid serialization kind = ${kind}`
    return { 'type': kind, 'version': version, 'size': size }

  }
  return `Invalid version string = ${versionString}`
}