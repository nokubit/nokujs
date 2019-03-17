'use strict';

const crypto = require('crypto');

function dSha256(data) {
	let hash = crypto.createHash('sha256');
	hash.update(data);
	let digest = hash.digest();
	hash = crypto.createHash('sha256');
	hash.update(digest);
	return hash.digest();
};

/*
	let hash = crypto.createHash('sha256');
	hash.update('');
	let digest = hash.digest();
	console.log(digest.toString('hex'));
	hash = crypto.createHash('sha256');
	hash.update(digest);
	digest = hash.digest();
	console.log(digest.toString('hex'));
return;
*/

var block = Buffer.alloc(80);
for (let i = 4; i < block.length; ++i)
	block[i] = Math.random() * 256;
var start = Date.now();
while (true){
	let digest = dSha256(block);

	let zero = 0;
	for (let i = 0; i < digest.length; ++i){
		if (digest[i] != 0)
			break;
		zero++;
	}
	if (zero > 4)
		break;
	block[0]++;
	if (block[0] != 0)
		continue;
	block[1]++;
	if (block[1] != 0)
		continue;
	console.log(('00000000' + block.readUInt32LE(0).toString(16)).slice(-8));
	block[2]++;
	if (block[2] != 0)
		continue;
	block[3]++;
	if (block[3] == 0)
		break;
}
var delta = (Date.now() - start);
console.log(('00000000' + block.readUInt32LE(0).toString(16)).slice(-8));
console.log('Delta', delta);
