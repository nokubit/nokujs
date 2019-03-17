'use strict';


console.log('---------- Prove Firma Node --------------');
const crypto = require('crypto');
//const EC = require('elliptic').ec;

//console.log(crypto.getHashes());		// elenca openssl typo
//console.log(crypto.getCurves());		// elenca openssl curves

// esempio StackOverflow
//var keys = {
//  priv: '-----BEGIN EC PRIVATE KEY-----\n' +
//        'MHcCAQEEIF+jnWY1D5kbVYDNvxxo/Y+ku2uJPDwS0r/VuPZQrjjVoAoGCCqGSM49\n' +
//        'AwEHoUQDQgAEurOxfSxmqIRYzJVagdZfMMSjRNNhB8i3mXyIMq704m2m52FdfKZ2\n' +
//        'pQhByd5eyj3lgZ7m7jbchtdgyOF8Io/1ng==\n' +
//        '-----END EC PRIVATE KEY-----\n',
//  pub: '-----BEGIN PUBLIC KEY-----\n' +
//       'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEurOxfSxmqIRYzJVagdZfMMSjRNNh\n' +
//       'B8i3mXyIMq704m2m52FdfKZ2pQhByd5eyj3lgZ7m7jbchtdgyOF8Io/1ng==\n' +
//       '-----END PUBLIC KEY-----\n'
//};

// Da bitcoin wiki, la pk è compressa
const privateKeyBtWiki = Buffer.from('eb696a065ef48a2192da5b28b694f87544b30fae8327c4510137a922f32c6dcf', 'hex');
const publicKeyBtWiki = Buffer.from('03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873', 'hex');

/*	OPENSSL	=> 	CREA openssl ecparam -name secp256k1 -genkey -rand /dev/urandom -noout -out secp256k1-key.pem
				ESTRAE PUBKEY openssl ec -in secp256k1-key.pem -pubout -out secp256k1-pub.pem
				TO DER openssl ec -in secp256k1-key.pem -outform DER > secp256k1-key.der
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIMMlxlIlA57cdbuIV8dwD7fvIiYeB8qRGGn2WpXrKvrBoAcGBSuBBAAK
oUQDQgAEP7PB+EybEFHB52BhrD1np+cYrOz4i1xCxxcT95XQbg/XSrtPsnJYR3LE
6BOS2RmZMz7bS01Jd4hRQJawCx9N5g==
-----END EC PRIVATE KEY-----
Derivata dalla sk
-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEP7PB+EybEFHB52BhrD1np+cYrOz4i1xC
xxcT95XQbg/XSrtPsnJYR3LE6BOS2RmZMz7bS01Jd4hRQJawCx9N5g==
-----END PUBLIC KEY-----
*/

const privateKeyOpenSsl = Buffer.from('C325C65225039EDC75BB8857C7700FB7EF22261E07CA911869F65A95EB2AFAC1', 'hex');
const publicKeyOpenSsl = Buffer.from('043FB3C1F84C9B1051C1E76061AC3D67A7E718ACECF88B5C42C71713F795D06E0FD74ABB4FB272584772C4E81392D91999333EDB4B4D497788514096B00B1F4DE6', 'hex');

const derHeader = Buffer.from('3000', 'hex');
const skPrefix = Buffer.from('0201010420', 'hex');
const skCurve = Buffer.from('a00706052b8104000a', 'hex');
const skPubPrefix = Buffer.from('a144034200', 'hex');
const pkCurve = Buffer.from('301006072a8648ce3d020106052b8104000a', 'hex');
const pkPrefix = Buffer.from('034200', 'hex');

function sK2Der(privateKey, publicKey) {
	let skPub = skPubPrefix;
	if (publicKey[0] == 2 || publicKey[0] == 3) {
		console.log('Chiave pubblica compressa');
		skPub = Buffer.from(skPubPrefix);
		skPub[1] = 34 + 2;
		skPub[3] = 34;
	}
	let sk = Buffer.concat([derHeader, skPrefix, privateKey, skCurve, skPub, publicKey]);
	let size = sk.length - 2;
	if (size >= 128) {
		console.log('Too long');
		return;
	}
	sk[1] = size;
	sk = sk.toString('base64');
	let pemSk = '-----BEGIN EC PRIVATE KEY-----\n';
	while (sk.length > 0) {
		pemSk += sk.slice(0, 64) + '\n';
		sk = sk.slice(64);
	}
	pemSk += '-----END EC PRIVATE KEY-----\n';
//console.log(pemSk);
	return pemSk;
};

function pK2Der(publicKey) {
	let pkPub = pkPrefix;
	if (publicKey[0] == 2 || publicKey[0] == 3) {
		console.log('Chiave pubblica compressa');
		pkPub = Buffer.from(pkPrefix);
		pkPub[1] = 34;
	}
	let pk = Buffer.concat([derHeader, pkCurve, pkPub, publicKey]);

	let size = pk.length - 2;
	if (size >= 128) {
		console.log('Too long');
		return;
	}
	pk[1] = size;
	pk = pk.toString('base64');
	let pemPk = '-----BEGIN PUBLIC KEY-----\n';
	while (pk.length > 0) {
		pemPk += pk.slice(0, 64) + '\n';
		pk = pk.slice(64);
	}
	pemPk += '-----END PUBLIC KEY-----\n';
//console.log(pemPk);
	return pemPk;
};

function checkPk2Sk(privateKey, publicKey) {
	const sign = crypto.createSign('SHA256');
	const doubleHashS = crypto.createHash('SHA256');
	const dummy = crypto.randomBytes(300);
	doubleHashS.update(dummy);
	sign.update(doubleHashS.digest());

	let pemSk = sK2Der(privateKey, publicKey);
	const signature = sign.sign(pemSk);
	//console.log('SIGN', signature.toString('hex'));

	const verify = crypto.createVerify('SHA256');
	const doubleHashV = crypto.createHash('SHA256');
	doubleHashV.update(dummy);
	verify.update(doubleHashV.digest());

	let pemPk = pK2Der(publicKey);
	let res = verify.verify(pemPk, signature);
console.log(res);
};

console.log('Check Bitcoin Wiki');
checkPk2Sk(privateKeyBtWiki, publicKeyBtWiki);

console.log('Check OpenSsl');
checkPk2Sk(privateKeyOpenSsl, publicKeyOpenSsl);

console.log('--------Derive new pubKey by ECDH ---------');
const ecdh = crypto.createECDH('secp256k1');

ecdh.setPrivateKey(privateKeyOpenSsl);
if (ecdh.verifyError !== undefined)
	console.log('ecdh error', ecdh.verifyError);
//console.log(ecdh.getPrivateKey('hex'));
//console.log(ecdh.getPublicKey('hex'));
var publicKey = ecdh.getPublicKey();
console.log('Check OpenSsl/NodeECDH');
checkPk2Sk(privateKeyOpenSsl, publicKey);

publicKey = ecdh.getPublicKey(null, 'compressed');
console.log('Check OpenSsl/NodeECDH compressed');
checkPk2Sk(privateKeyOpenSsl, publicKey);

ecdh.setPrivateKey(privateKeyBtWiki);
if (ecdh.verifyError !== undefined)
	console.log('ecdh error', ecdh.verifyError);
//console.log(ecdh.getPrivateKey('hex'));
//console.log(ecdh.getPublicKey('hex'));
publicKey = ecdh.getPublicKey();
console.log('Check Wiki/NodeECDH');
checkPk2Sk(privateKeyBtWiki, publicKey);

publicKey = ecdh.getPublicKey(null, 'compressed');
console.log('Check Wiki/NodeECDH compressed');
checkPk2Sk(privateKeyBtWiki, publicKey);

console.log('Check Only NodeECDH');
var meKey2 = ecdh.generateKeys();
//	console.log(meKey2.toString('hex'));
//	console.log(ecdh.getPrivateKey('hex'));
//	console.log(ecdh.getPublicKey('hex'));
//	console.log(ecdh.getPublicKey('hex'));
checkPk2Sk(ecdh.getPrivateKey(), ecdh.getPublicKey());
console.log('Check Only NodeECDH compressed');
checkPk2Sk(ecdh.getPrivateKey(), ecdh.getPublicKey(null, 'compressed'));

// signature in DER format (comp bitcoin)
//3046 0221 009b5af94232d5fe59d77516cd5c94ebc45304726b6479ba152749fd78264dc9b2 0221 00f6be097081df215676ede0509df42cd3adde15602ec7e431b0e2724a330fda6d

//3046 0221 00aa148546713245fc09fcf9f60bc054bcebc8920489b46a81cd4340c1f81aa186 0221 00b8dd8fc50b779ebcea48e0754ffb963625c26d8cddccac3956d0d71d53f348f2

//SIGN 3044 0220 48d2928a673ec9c4aa8b8dd940189dc2e775b11e1dbd6c1a58dc0903b51a6a9e 0220 2aba08bb385b68dfd150ca9402db73d5c451e7991ba0fefc86b334451c2a78f4

//SIGN2 3045 0220 111b548f9bb7317f6e4134a0425958a41853a1655571f31b434f5fc97b16eff7 0221 00a9ffe6227703260251633759edaf288320e12da7856d15edc158cb63bba8e276

// Test su esempio preso da BIP-143

const private_key = Buffer.from('eb696a065ef48a2192da5b28b694f87544b30fae8327c4510137a922f32c6dcf', 'hex');
const public_key = Buffer.from('03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873', 'hex');

const hash_preimage = Buffer.from('01000000b0287b4a252ac05af83d2dcef00ba313af78a3e9c329afa216eb3aa2a7b4613a18606b350cd8bf565266bc352f0caddcf01e8fa789dd8a15386327cf8cabe198db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a5477010000001976a91479091972186c449eb1ded22b78e40d009bdf008988ac00ca9a3b00000000feffffffde984f44532e2173ca0d64314fcefe6d30da6f8cf27bafa706da61df8a226c839204000001000000', 'hex');

const nVersion = Buffer.from('01000000', 'hex');
const hashPrevouts = Buffer.from('b0287b4a252ac05af83d2dcef00ba313af78a3e9c329afa216eb3aa2a7b4613a', 'hex');
const hashSequence = Buffer.from('18606b350cd8bf565266bc352f0caddcf01e8fa789dd8a15386327cf8cabe198', 'hex');
const outpoint = Buffer.from('db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a547701000000', 'hex');
const scriptCode = Buffer.from('1976a91479091972186c449eb1ded22b78e40d009bdf008988ac', 'hex');
const amount = Buffer.from('00ca9a3b00000000', 'hex');
const nSequence = Buffer.from('feffffff', 'hex');
const hashOutputs = Buffer.from('de984f44532e2173ca0d64314fcefe6d30da6f8cf27bafa706da61df8a226c83', 'hex');
const nLockTime = Buffer.from('92040000', 'hex');
const nHashType = Buffer.from('01000000', 'hex');
  
const sigHash = Buffer.from('64f3b0f4dd2bb3aa1ce8566d220cc74dda9df97d8490cc81d89d735c92e59fb6', 'hex');
const signature = Buffer.from('3044022047ac8e878352d3ebbde1c94ce3a10d057c24175747116f8288e5d794d12d482f0220217f36a485cae903c713331d877c1f64677e3622ad4010726870540656fe9dcb01', 'hex');

let tHash1 = crypto.createHash('SHA256');
let tHash2 = crypto.createHash('SHA256');
tHash1.update(hash_preimage);
tHash2.update(tHash1.digest());
let preim = tHash2.digest();
console.log('Pre Im Compare', preim.equals(sigHash));

tHash1 = crypto.createHash('SHA256');
tHash2 = crypto.createHash('SHA256');
tHash1.update(nVersion);
tHash1.update(hashPrevouts);
tHash1.update(hashSequence);
tHash1.update(outpoint);
tHash1.update(scriptCode);
tHash1.update(amount);
tHash1.update(nSequence);
tHash1.update(hashOutputs);
tHash1.update(nLockTime);
tHash1.update(nHashType);
let image = tHash1.digest();
tHash2.update(image);
preim = tHash2.digest();
console.log('Hash data Compare', preim.equals(sigHash));

const tVerify = crypto.createVerify('SHA256');
tVerify.update(image);
// tolgo il byte finale (signature hash types)
let tVer = tVerify.verify(pK2Der(public_key), signature.slice(0, -1));
console.log('Signature Verify ----->', tVer);

const tSign = crypto.createSign('SHA256');
tSign.update(image);
let tSignature = tSign.sign(sK2Der(private_key, public_key));
console.log(tSignature.toString('hex'));

const tVerify2 = crypto.createVerify('SHA256');
tVerify2.update(image);
let tVer2 = tVerify2.verify(pK2Der(public_key), tSignature);
console.log('New Signature Verify -->', tVer2);

return;



function bech32_hrp_expand(s) {
	let bh = [];
	let bl = [];
	s.split('').forEach(function(c) {
		c = c.charCodeAt(0);
		bl.push(c & 0x1F);
		c >>>= 5;
		if (c & (~3))
			throw 'Invalid char';
		bh.push(c);
	});
	bh.push(0);
//console.log(bh, bl);
	return Buffer.from(bh.concat(bl));
};

function bech32_polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  values.forEach(function(v) {
    let b = (chk >>> 25);
    chk = ((chk & 0x1ffffff) << 5) ^ v
    GEN.forEach(function(g, i) {
	  if ((b >>> i) & 1)
        chk ^= g;
	});
//console.log(chk.toString(16));
  });
  return chk;
};

function bech32_verify_checksum(hrp, data) {
  return bech32_polymod(Buffer.concat([bech32_hrp_expand(hrp), data]));
};

function bech32_create_checksum(hrp, data) {
  //console.log(hrp, data);
  let b = Buffer.concat([bech32_hrp_expand(hrp), data, Buffer.alloc(6)]);
  let polymod = bech32_polymod(b) ^ 1;
  b = [];
  for (let i=0; i<6; i++) {
	  b.unshift(polymod & 0x1F);
	  polymod >>>= 5;
  }
  return b;
};

const cc32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

//	Da codice in BIP
// addr e hrpFlag usati per test
function decodeBech32(s, addr, hrpFlag) {
	if (hrpFlag === undefined && addr !== undefined && !Buffer.isBuffer(addr)) {
		hrpFlag = addr;
		addr = Buffer.alloc(0);
	}
	var ret = {
		address: s,
		validBech: false,
		validAddr: false
	};

	let n = s.length;
	if (n < 8) {
		ret.error = 'Too Short';
		return ret;
	}
	if (n > 90) {
		ret.error = 'Too Long';
		return ret;
	}
	let s1 = s.lastIndexOf('1');
	if (s1 < 0) {
		ret.error = 'No Separator';
		return ret;
	}
	let hrp = s.slice(0, s1);
	n = hrp.length;
	if (n < 1 || n > 83) {
		ret.error = 'Invalid HRP length ' + n;
		return ret;
	}
	while (n--) {
		let c = hrp.charCodeAt(n);
		if (c < 33 || c > 126) {
			ret.error = 'Invalid HRP char \'' + hrp[n] + '\'';
			return ret;
		}
	}
	if (!hrpFlag)
		hrp = hrp.toLowerCase();
	ret.hrp = hrp;

	let data = s.slice(s1 + 1).toLowerCase();
	n = data.length;
	if (n < 6) {
		ret.error = 'Invalid DATA length ' + n;
		return ret;
	}
	let d = Buffer.alloc(data.length);
	while (n--) {
		let c = cc32.indexOf(data.charAt(n));
		if (c < 0) {
			ret.error = 'Invalid DATA char \'' + data[n] + '\'';
			return ret;
		}
		d[n] = c;
	}
	ret.data = d;
	ret.chkSum = bech32_verify_checksum(hrp, d);
	ret.validBech = ret.chkSum === 1;
	ret.calcChkSum = bech32_create_checksum(hrp, d.slice(0, -6)).map(function (e) { return cc32[e]; } ).join('');

	if (addr != undefined) {
		let buffer = 0, blen = 0;
		n = d[0];
		if (n < 0 || n > 16) {
			ret.error = 'Invalid SEGWIT version \'' + n + '\'';
			return ret;
		}
		let hex = [(n ? n + 0x50 : 0), 0];
		d.slice(1, -6).forEach(function(e) {
			buffer <<= 5;
			buffer |= e;
			blen += 5;
			if (blen >= 8) {
				hex.push((buffer >>> (blen - 8)) & 0xFF);
				blen -= 8;
				buffer &= (1 << blen) - 1;
			}
		});
		n = hex.length - 2;
		hex[1] = n;
		ret.data = Buffer.from(hex);
		if (blen > 0) {
			if (blen > 4 || buffer != 0) {
//	console.log('Error PAD address: ' + buffer.toString(16) + ' - ' + blen + ' bit');
				ret.error = 'Error PAD address: ' + buffer.toString(16) + ' - ' + blen + ' bit';
				return ret;
			}
		}
		//console.log(ret.data.toString('hex'), addr.toString('hex'));
		if (hrp == 'bc')
			ret.net = 'main';
		else if (hrp == 'tb')
			ret.net = 'testnet';
		else {
			ret.error = 'Invalid hrp: ' + hrp;
			return ret;
		}
		if (hex[0] == 0) {
			if (n != 20 && n != 32) {
				ret.error = 'Invalid data len: ' + n;
				return ret;
			}
		}
		if (ret.data.equals(addr))
			ret.validAddr = true;
	}
	if (!ret.validBech) {
		if (!ret.error)
			ret.error = 'Invalid ChkSum ' + ret.chkSum.toString(16) + ' vs ' + ret.calcChkSum.toString(16);
		return ret;
	}
	return ret;
};

//	Da codice  Bitcoin
function encodeBech32(witness, hrp) {
	if (typeof hrp === 'undefined') {
		// Sostituire con prefisso Nokubit
		hrp = 'bc';
	}
	if (Buffer.isBuffer(witness)) {
		witness = {
			version: witness[0],
			program: witness.slice(2)
		}
	}
	if (typeof witness !== 'object' || !('version' in witness) || !('program' in witness))
		throw 'Invalid Witness';
	if (witness.version < 0 || witness.version > 16 || witness.program.length < 2 || witness.program.length > 40)
		throw 'Invalid Witness Version';
	if (witness.version == 0 && witness.program.length != 20 && witness.program.length != 32)
		throw 'Invalid Witness V0 len';
	let values = [witness.version];
	let acc = 0, bits = 0;
	for (let v of witness.program) {
		acc <<= 8;
		acc |= v;
		bits += 8;
		while (bits >= 5) {
			bits -= 5;
			values.push((acc >>> bits) & 0x1F);
		}
	}
	if (bits)
		values.push((acc << (5 - bits)) & 0x1F);
    let checksum = bech32_create_checksum(hrp, Buffer.from(values));
    let ret = (hrp + '1').split('');
	values.forEach(function (e) { ret.push(cc32[e]); });
	checksum.forEach(function (e) { ret.push(cc32[e]); });
    return ret.join('');
};

console.log('FIRST TEST');
let xt, xa, r;
xt = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'; r = decodeBech32(xt, Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex')); if (!r.validAddr) console.log('FIRST TEST', xt, r.error);
xt = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'; r = decodeBech32(xt, Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex')); if (!r.validAddr) console.log('FIRST TEST', xt, r.error);
xt = 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'; r = decodeBech32(xt, Buffer.from('00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262', 'hex')); if (!r.validAddr) console.log('FIRST TEST', xt, r.error);
xt = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7'; r = decodeBech32(xt, Buffer.from('00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262', 'hex')); if (!r.validAddr) console.log('FIRST TEST', xt, r.error);

xt = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'; r = encodeBech32(Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex')); if (r != xt) console.log('FIRST TEST', xt, r);
xt = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'; r = encodeBech32(Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex'), 'tb'); if (r != xt) console.log('FIRST TEST', xt, r);
xt = 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'; r = encodeBech32(Buffer.from('00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262', 'hex')); if (r != xt) console.log('FIRST TEST', xt, r);
xt = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7'; r = encodeBech32(Buffer.from('00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262', 'hex'), 'tb'); if (r != xt) console.log('FIRST TEST', xt, r);


// Test vectors
// Il seguente sbaglia perche' io non metto la prima A minuscola: che senso HA? comunque messo flag
console.log('TEST VALID BECH');
xt = 'A12UEL5L'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = 'a12uel5l'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = 'an83characterlonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1tt5tgs'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = 'abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = '11qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc8247j'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = 'split1checkupstagehandshakeupstreamerranterredcaperred2y9e3w'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
xt = '?1ezyfcl'; r = decodeBech32(xt); if (!r.validBech) console.log('INVALID VALID', xt, r.error);
// FAIL
console.log('TEST FAIL BECH');
xt = ' 1nwldj5'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : HRP character out of range
xt = '\x7F1axkwrx'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : HRP character out of range
xt = '\x801eym55h'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : HRP character out of range
xt = 'an84characterslonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1569pvx'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : overall max length exceeded
xt = 'pzry9x0s0muk'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : No separator character
xt = '1pzry9x0s0muk'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : Empty HRP
xt = 'x1b4n0q5v'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : Invalid data character
xt = 'li1dgmt3'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : Too short checksum
xt = 'de1lg7wt\xFF'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : Invalid character in checksum
// Vedi sopra cons su lowercase
xt = 'A1G7SGD8'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : checksum calculated with uppercase form of HRP
xt = '10a06t8'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : empty HRP
xt = '1qzzfhee'; r = decodeBech32(xt); if (r.validBech) console.log('VALID INVALID', xt, r.error);	// : empty HRP
console.log('TEST VALID BECH ADDRESS');
xt = 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4'; xa = Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
xt = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7'; xa = Buffer.from('00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
xt = 'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx'; xa = Buffer.from('5128751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
xt = 'BC1SW50QA3JX3S'; xa = Buffer.from('6002751e', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
xt = 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj'; xa = Buffer.from('5210751e76e8199196d454941c45d1b3a323', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
xt = 'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy'; xa = Buffer.from('0020000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433', 'hex'); r = decodeBech32(xt, xa); if (!r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);
console.log('TEST INVALID BECH ADDRESS');
xt = 'tc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Invalid human-readable part
xt = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Invalid checksum
xt = 'BC13W508D6QEJXTDG4Y5R3ZARVARY0C5XW7KN40WF2'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Invalid witness version
xt = 'bc1rw5uspcuh';	// : Invalid program length
xt = 'bc10w508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kw5rljs90'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Invalid program length
xt = 'BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Invalid program length for witness version 0 (per BIP141)
xt = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Mixed case
xt = 'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : zero padding of more than 4 bits
xt = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Non-zero padding in 8-to-5 conversion
xt = 'bc1gmk9yu'; r = decodeBech32(xt, Buffer.alloc(0)); if (r.validAddr) console.log('INVALID VALID ADDR', xt, r.error);	// : Empty data section

process.exit();

const privateKey = 'tprv8ZgxMBicQKsPeVAXzsFrsnWNPizHn4D86Yo8Q52jQhCHHij5wD1WekbkFXUMY59n3U3fc8rfYfoP5P76CBdeWhXeTDVYAwQxgreVP3dBMko';
// cTkAmtmhpLDZrDvL58hWZKNqmF34zCmjw1Wu57K7hojbV8dQmbxs
// 2018-01-20T19:07:10Z
// reserve=1
// # addr=mftyJqSmfctppyedv5bKHGP3xtEdTAKdA4
// hdkeypath=m/0'/0'/49'

const pszBase58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function DecodeBase58(psz)
{
	let vch;

    // Skip leading spaces.	(and trailing)
    psz = psz.trim();
	if (/[\s\uFEFF\xA0]/.test(psz))
		return Buffer.alloc(0);

    // Skip and count leading '1's.
    let zeroes = 0;
    let length = 0;
	let pos = 0;
    while (psz.charAt(pos) == '1') {
        zeroes++;
        pos++;
    }
    // Allocate enough space in big-endian base256 representation.
	let pszl = (psz.length - pos);
    //let size = Math.ceil(pszl * 733 / 1000); // log(58) / log(256), rounded up.
    let b256 = [];
	if (pszl > 0) {
		// Process the characters.
		while (pszl--) {
			// Decode base58 character
			let carry = pszBase58.indexOf(psz.charAt(pos++));
			if (carry === -1)
				return Buffer.alloc(0);
			// Apply "b256 = b256 * 58 + carry".	(ordine invertito)
			b256 = b256.map(function(e) {
				carry += 58 * e;
				e = carry % 256;
				carry >>>= 8;
				return e;
			});
			while (carry !== 0) {
				b256.push(carry % 256);
				carry >>>= 8;
			}
		}
		// Skip trailing spaces. (already tested)

		// Skip leading zeroes in b256.
		while (b256[0] == 0)
			b256.shift();
	}
	while (zeroes--)
		b256.push(0);

    return Buffer.from(b256.reverse());
};

function EncodeBase58(buf)
{
    // Skip & count leading zeroes.
    let zeroes = 0;
    let length = 0;
	let pos = 0;
	while (buf[pos] === 0) {
		zeroes++;
		pos++;
	}
	// Allocate enough space in big-endian base58 representation.
	let pszl = (buf.length - pos);
	//let size = Math.ceil(pszl * 138 / 100); // log(256) / log(58), rounded up.
	let b58 = [];
	if (pszl > 0) {
		// Process the bytes.
		while (pszl--) {
			let carry = buf[pos++];
			// Apply "b58 = b58 * 256 + ch".
			b58 = b58.map(function(e) {
				carry += 256 * e;
				e = carry % 58;
				carry = (carry/58)>>>0;
				return e;
			});
			while (carry !== 0) {
				b58.push(carry % 58);
				carry = (carry/58)>>>0;
			}
		}
		// Skip leading zeroes in base58 result.
		while (b58[0] == 0)
			b58.shift();
	}

    // Translate the result into a string.
	let str = b58.reverse().map(function(e) { return pszBase58[e]; }).join('');
	if (zeroes === 0)
	    return str;
	return '1'.repeat(zeroes) + str;
}

function EncodeBase58Check(vchIn)
{
    // add 4-byte hash check to the end
    let vch = Buffer.from(vchIn);
	let hash = Sha256(vch);
    vch = Buffer.concat([vch, hash.slice(0, 4)]);
    return EncodeBase58(vch);
}

function DecodeBase58Check(psz)
{
	let vchRet = DecodeBase58(psz);
	if (vchRet == null || vchRet.length < 4)
        return null;

	// re-calculate the checksum, ensure it matches the included 4-byte checksum
    let hash = Sha256(vchRet.slice(0, -4));
	if (!hash.slice(0, 4).equals(vchRet.slice(-4)))
		return null;
    return vchRet.slice(0, -4);
};

function Sha256(b0, b1, r) {
	let h0 = crypto.createHash('sha256');
	let h1 = crypto.createHash('sha256');
	let digest;
	if (!Buffer.isBuffer(b1)){
		digest = h1.update(h0.update(b0).digest()).digest();
		if (b1)
			r = b1;
	}else
		digest = h1.update(h0.update(b0).update(b1).digest()).digest();
	if (r){
		return digest.reverse();
	}
	return digest;
};


var testv = require('../nokubit/src/test/data/base58_encode_decode.json');
var testf = true;

console.log('RUN TEST base58_encode_decode:');
testv.forEach(function(e){
	let r = DecodeBase58(e[1]).toString('hex');
	if (r != e[0]) {
		console.log('Decode BAD', r, e);
		testf = false;
	}
	r = EncodeBase58(Buffer.from(e[0], 'hex'));
	if (r != e[1]) {
		console.log('Encode BAD', r, e);
		testf = false;
	}
});
if (testf)
	console.log('\tOK');

testv = require('../nokubit/src/test/data/base58_keys_valid.json');
testf = true;

function getAddressType(addr) {
	let r = { addr: addr, isPrivkey: false, isTestnet: false };
	if (addr[0] === 0) {
		r.addr = addr.slice(1);
		r.type = 'pubkey';
	} else if (addr[0] === 111) {
		r.addr = addr.slice(1);
		r.type = 'pubkey';
		r.isTestnet = true;
	} else if (addr[0] === 5) {
		r.addr = addr.slice(1);
		r.type = 'script';
	} else if (addr[0] === 196) {
		r.addr = addr.slice(1);
		r.type = 'script';
		r.isTestnet = true;
	} else if (addr[0] === 128) {
		r.addr = addr.slice(1);
		r.isPrivkey = true;
		r.isCompressed = (r.addr.length > 32 && r.addr[r.addr.length - 1] == 1);
		if (r.isCompressed)
			r.addr = r.addr.slice(0, -1);
	} else if (addr[0] === 239) {
		r.addr = addr.slice(1);
		r.isPrivkey = true;
		r.isCompressed = (r.addr.length > 32 && r.addr[r.addr.length - 1] == 1);
		if (r.isCompressed)
			r.addr = r.addr.slice(0, -1);
		r.isTestnet = true;
	} else if (addr[0] === 4 && addr[1] === 0x88 && addr[2] === 0xB2 && addr[3] === 0x1E) {
		r.addr = addr.slice(4);
		r.type = 'pubkey';
	} else if (addr[0] === 4 && addr[1] === 0x35 && addr[2] === 0x87 && addr[3] === 0xCF) {
		r.addr = addr.slice(4);
		r.type = 'pubkey';
		r.isTestnet = true;
	} else if (addr[0] === 4 && addr[1] === 0x88 && addr[2] === 0xAD && addr[3] === 0xE4) {
		r.addr = addr.slice(4);
		r.isPrivkey = true;
	} else if (addr[0] === 4 && addr[1] === 0x35 && addr[2] === 0x83 && addr[3] === 0x94) {
		r.addr = addr.slice(4);
		r.isPrivkey = true;
		r.isTestnet = true;
	}
	return r;	
};
function setAddressType(addr, options) {
	let a = [addr];
	if (options.isPrivkey) {
		if (options.isTestnet) {
			a.unshift(Buffer.from([239]));
			if (options.isCompressed)
				a.push(Buffer.from([1]));
		} else {
			a.unshift(Buffer.from([128]));
			if (options.isCompressed)
			a.push(Buffer.from([1]));
		}
	//} else if (addr[0] === 4 && addr[0] === 0x88 && addr[0] === 0xAD && addr[0] === 0xE4) {
	//	r.addr = addr.slice(4);
	//	r.isPrivkey = true;
	//} else if (addr[0] === 4 && addr[0] === 0x35 && addr[0] === 0x83 && addr[0] === 0x94) {
	//	r.addr = addr.slice(4);
	//	r.isPrivkey = true;
	//	r.isTestnet = true;
	} else if (options.addrType == 'script') {
		if (options.isTestnet) {
			a.unshift(Buffer.from([196]));
		} else {
			a.unshift(Buffer.from([5]));
		}
	} else if (options.addrType == 'pubkey') {
		if (options.isTestnet) {
			a.unshift(Buffer.from([111]));
		} else {
			a.unshift(Buffer.from([0]));
		}
	//} else if (addr[0] === 4 && addr[0] === 0x88 && addr[0] === 0xB2 && addr[0] === 0x1E) {
	//	r.addr = addr.slice(4);
	//	r.type = 'pubkey';
	//} else if (addr[0] === 4 && addr[0] === 0x35 && addr[0] === 0x87 && addr[0] === 0xCF) {
	//	r.addr = addr.slice(4);
	//	r.type = 'pubkey';
	//	r.isTestnet = true;
	}
	return Buffer.concat(a);	
};
console.log('RUN TEST base58_keys_valid:');
testv.forEach(function(e){
	let r = getAddressType(DecodeBase58Check(e[0]));
	if (e[1] != r.addr.toString('hex') || r.type != e[2].addrType
	|| r.isPrivkey != e[2].isPrivkey
	|| r.isCompressed != e[2].isCompressed
	|| r.isTestnet != e[2].isTestnet) {
		console.log('Decode BAD', r, e);
		testf = false;
	}
	r = EncodeBase58Check(setAddressType(Buffer.from(e[1], 'hex'), e[2]));
	if (r != e[0]) {
		console.log('Encode BAD', r, e);
		testf = false;
	}
});
if (testf)
	console.log('\tOK');

testv = require('../nokubit/src/test/data/base58_keys_invalid.json');
testf = true;

console.log('RUN TEST base58_keys_invalid:');
//testv.forEach(function(e){
//	let r = DecodeBase58Check(e[0]);
//	if (r != null) {
//		r = getAddressType(r);
//		//if (!(r.isPrivkey && r.addr.length == (r.isCompressed ? 33 : 32)))
//		//	return;
//		//if (!r.isPrivkey && (r.type == 'pubkey'))
//		//	return;
//		console.log('Decode BAD', r, e);
//		testf = false;
//	}
//});
//if (testf)
//	console.log('\tOK');




var sk = DecodeBase58Check(privateKey);
console.log('SK:', sk, sk.length);
var pk = DecodeBase58('cTkAmtmhpLDZrDvL58hWZKNqmF34zCmjw1Wu57K7hojbV8dQmbxs');
console.log('PK:', pk, pk.length);
console.log('PK:', 'cTkAmtmhpLDZrDvL58hWZKNqmF34zCmjw1Wu57K7hojbV8dQmbxs');
console.log('PK:', EncodeBase58(pk));
var qq = DecodeBase58Check('mftyJqSmfctppyedv5bKHGP3xtEdTAKdA4');
//console.log('mftyJqSmfctppyedv5bKHGP3xtEdTAKdA4');
console.log(qq);
//console.log(EncodeBase58Check(qq));
console.log(DecodeBase58Check('mtrRss6Mx9DVHxuwDCyWTCVmDeeuw6Qjxi'));

var sTest = 'sNku' + '1'.repeat(103);
var sBuf = DecodeBase58(sTest);
console.log('NOKU', sBuf.slice(0, 4), sBuf, sTest);
sBuf.slice(4).fill(0);
sBuf[110] = 1;
console.log('NOKU da', EncodeBase58(sBuf), sBuf.length);
sBuf.slice(4).fill(0xff);
console.log('NOKU a', EncodeBase58Check(sBuf));
return;
var test2 = Buffer.alloc(78);
test2.fill(85);
test2[0] = 0x04;
for (let i=0; i<0x00FFFFFF; i+=0x10000) {
	test2.writeUInt32BE(i, 1);
	//test2[0] = 0x04;
	//test2[1] = 0x35;
	//test2[2] = 0x83;
	//test2[3] = 0x94;
	let enc = EncodeBase58Check(test2);
	console.log(enc.substr(0,5));
	if (enc.startsWith('no')) {
		console.log('TEST PREFIX: ' + i.toString(16), EncodeBase58Check(test2));
		break;
	}
}

var n = 8332;
console.log(n.toString(16));
var test = Buffer.from([83, 32, 32, 83]);
console.log(test, test.toString('ascii'), test.toString('hex'), test.toString('base64'));
console.log(Buffer.from('nokubt', 'base64'));
console.log(Buffer.from('NokuBt', 'base64'));

console.log(DecodeBase58Check('xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y'));
console.log(DecodeBase58Check('xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L'));
return;

const me = crypto.createECDH('secp256k1');
const meKey = me.generateKeys();
	console.log(meKey.toString('hex'));
	console.log(me.getPrivateKey('hex'));
	console.log(me.getPublicKey('hex'));
	console.log(me.getPublicKey('hex'));

	return;
let hash = crypto.createHash('sha256');
	hash.update('');
	let digest = hash.digest();
	console.log(digest.toString('hex'));
	hash = crypto.createHash('sha256');
	hash.update(digest);
	digest = hash.digest();
	console.log(digest.toString('hex'));
return;


var block = Buffer.alloc(80);
for (let i = 4; i < block.length; ++i)
	block[i] = Math.random() * 256;
var start = Date.now();
while (true){
	let hash = crypto.createHash('sha256');
	hash.update(block);
	let digest = hash.digest();
	hash = crypto.createHash('sha256');
	hash.update(digest);
	digest = hash.digest();

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
