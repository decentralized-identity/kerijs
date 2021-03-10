const path = require('path');
const fs = require('fs-extra')
var os = require('os');
const MAX_DB_COUNT = 16;
const DATABASE_DIR_PATH = "/var/keri/db"
const ALT_DATABASE_DIR_PATH = path.join("~", '.keri/db')
const DB_KEY_EVENT_LOG_NAME = Buffer.from('kel', 'binary')
const lmdb = require('lmdb-store');
var keriDbDirPath;      //database directory location has not been set up yet
var keriDB;            //database environment has not been set up yet


/**
 * 
 * @param {string} baseDirPath  db directory path
 * @param {int} port  db port 
 */
async function setupDbEnv(baseDirPath = '', port = 8080) {

    if (!baseDirPath)
    baseDirPath = DATABASE_DIR_PATH + port
    baseDirPath = path.resolve(resolveHome(baseDirPath))
    if (!fs.pathExistsSync(baseDirPath)) {
        try {
            fs.mkdirsSync(baseDirPath, 0o777)
        } catch (e) {
            baseDirPath = ALT_DATABASE_DIR_PATH + port
            baseDirPath = path.resolve(resolveHome(baseDirPath))
            if (!fs.pathExistsSync(baseDirPath)) {
                fs.mkdirsSync(baseDirPath, 0o777)
            }
        }
    } else {
        if (fs.accessSync(baseDirPath, fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK)) {
            baseDirPath = ALT_DATABASE_DIR_PATH + port
            baseDirPath = path.resolve(resolveHome(baseDirPath))
            if (!fs.pathExistsSync(baseDirPath)) { fs.mkdirsSync(baseDirPath, 0o777) }
        }
    }
    keriDbDirPath = baseDirPath  // set global db directory path
    lmdb.open(keriDbDirPath ,{
        dbName : DB_KEY_EVENT_LOG_NAME
    }  )


}
/**
 * 
 * @param {String} filepath 
 * @description This method will resolve file path starting with tilda '~'
 */

function resolveHome(filepath) {
    if (filepath[0] === '~') {
        return path.join(process.env.HOME, filepath.slice(1));
    }
    return filepath;
}

