const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let workingPath = process.argv[2].replace("'", "").replace("'", "").replace('"', "").replace('"', "");
let hashTable = [];

fs.readdir(workingPath, async (err, files) => {
    if(err) throw err;
    for(let i = 0; i < files.length; i++) {
        let data = await fs.readFileSync(path.join(workingPath, files[i]));
        hashTable.push({
            file: files[i],
            hash: crypto.createHash('sha1').update(data).digest('hex')
        })
    }
    await fs.writeFileSync(path.join(workingPath, 'index.json'), JSON.stringify(hashTable));
});
