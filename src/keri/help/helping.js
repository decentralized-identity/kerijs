const fs = require('fs-extra')
const tmp = require('tmp');
var Base64 = require('js-base64').Base64;
var libsodium = require('libsodium-wrappers-sumo')



/**
 * @param {string} baseDirPath 
 * @description : To cleanup base directory
 */
function cleanupBaseDir(baseDirPath) {
    fs.pathExists(baseDirPath).then((res, err) => {
        if (res) {
            fs.removeSync(baseDirPath);
        } else if (err)
            console.log("ERROR", err)
    })

}


/**
 * 
 * @param {String} baseDirPath 
 * @description To setup temporary base directory 
 * @return {String} returns the path directory
 */
function setupTmpBaseDir(baseDirPath = "") {
    let path = tmp.file({ mode: 0o777, prefix: 'keri', postfix: 'test' }, function _tempFileCreated(err, path, fd) {
        if (err) throw err;
        console.log('File: ', path);
        console.log('Filedescriptor: ', fd);
    });
    return path
}


/**
 * 
 * @param {String} baseDirPath
 * @description Remove temp folder str.  
 */
function cleanupTmpBaseDir(baseDirPath) {
    console.log(baseDirPath)
    console.log(baseDirPath.endsWith("test"))
    if (fs.pathExists(baseDirPath)) {
        console.log("iNSIDE RESPONSE ")
        if (baseDirPath.startsWith("tmp/keri") && baseDirPath.endsWith("test")) {
            fs.removeSync(baseDirPath);
            console.log("file successfully removed")
        } else {
            console.log("ERROR")
        }

    }
}
///tmp/keri-14360-wQkf4Ujro2tq-test


//cleanupTmpBaseDir("tmp/keri-14373-WBCHSaidtsfw-test")

/**
 * 
 * @param {bytes} key 
 * @description Convert and return bytes key to unicode base64 url-file safe version
 * @returns {string}
 */
function keyTokey64u(key) {
    return Buffer.from(Base64.encodeURI(key), 'utf-8')
}

/**
 * 
 * @param {*} key64u 
 * @description  Convert and return unicode base64 url-file safe key64u to bytes key
 */
function key64uTokey(key64u) {

    Base64.decode(Buffer.from(key64u, "utf-8"))

}


function verify(sig, msg, vk) {

    let result = libsodium.crypto_sign_verify_detached(sig, msg, vk)
    if (result)
        return true
    else
        return false
}



function verify64u(signature, message, verkey){
  let  sig = key64uToKey(signature)
  let  vk = key64uToKey(verkey)
  let  msg = Buffer.from(message, 'utf-8')
    return (verify(sig, msg, vk))
}

//setupTmpBaseDir("/home/shivam/Desktop/shivam/projects/Spherity/kerijs/kerijs/testDIr")