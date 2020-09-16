    const lmdb = require('lmdb-store');
    // or
    // import { open } from 'lmdb-store';

    async function lmdb1(){

        let myStore = lmdb.open('/home/shivam/Desktop/shivam/projects/Spherity/kerijs/kerijs/lmdb', {
            // any options go where, write-map mode is faster:
            useWritemap: true,
        });
        
        let a = Buffer.from('1')
        let b = Buffer.from(JSON.stringify({"name":"Shivam"}))
        let data = await myStore.put(a,b)
        let dataReturn  = await myStore.get(a)
        console.log("dataReturn-------------->",dataReturn.toString())
        console.log('-------------------->',data)


    }


    lmdb1()