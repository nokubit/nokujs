'use strict';

const nkLib = {};

const crypto = require('crypto');
const BN = require('bn.js');

// need for verify one
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const fVoid = function() {};

const pchMessageZero = Buffer.from([0, 0, 0, 0]);
const nokubit = {
	strNetworkID: 'nokubit',
	strDataDir: 'nokubit',
	txMode: false,
	pchMessageZero: pchMessageZero,
	pchMessageStart: Buffer.from([0xf9, 0xbe, 0xb4, 0xd9]),
	nDefaultPort: 8270,
	nRPCPort: 8267,
	consensusHashGenesisBlock: Buffer.from('000000000002372343785ee8ff3cf5af1638edd078d19c1d03008cf9aadae0da', 'hex').reverse(),
	genesisHashMerkleRoot: Buffer.from('effac3dbabdc98d0f8ec9cb06d5c4b47b7b25933b87a6e1809126ccdce0104f4', 'hex').reverse()
};

const oldNokubit = {
	strNetworkID: 'nokubit',
	strDataDir: 'nokubit',
	txMode: true,
	pchMessageZero: pchMessageZero,
	pchMessageStart: Buffer.from([0xf9, 0xbe, 0xb4, 0xd9]),
	nDefaultPort: 8270,
	nRPCPort: 8267,
	consensusHashGenesisBlock: Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', 'hex').reverse(),
	genesisHashMerkleRoot: Buffer.from('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 'hex').reverse()
};

const regtest = {
	strNetworkID: 'regtest',
	strDataDir: 'regtest',
	txMode: true,
	pchMessageZero: pchMessageZero,
	pchMessageStart: Buffer.from([0xfa, 0xbf, 0xb5, 0xda]),
	nDefaultPort: 18444,
	nRPCPort: 18443,
	consensusHashGenesisBlock: Buffer.from('0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206', 'hex').reverse(),
	genesisHashMerkleRoot: Buffer.from('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 'hex').reverse()
};

const testnet3 = {
	strNetworkID: 'test',
	strDataDir: 'testnet3',
	txMode: true,
	pchMessageZero: pchMessageZero,
	pchMessageStart: Buffer.from([0x0b, 0x11, 0x09, 0x07]),
	nDefaultPort: 18333,
	nRPCPort: 18332,
	consensusHashGenesisBlock: Buffer.from('000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943', 'hex').reverse(),
	genesisHashMerkleRoot: Buffer.from('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 'hex').reverse()
};

const bitcoin = {
	strNetworkID: 'bitcoin',	// main
	strDataDir: '',
	txMode: true,
	pchMessageZero: pchMessageZero,
	pchMessageStart: Buffer.from([0xf9, 0xbe, 0xb4, 0xd9]),
	nDefaultPort: 8333,
	nRPCPort: 8332,
	consensusHashGenesisBlock: Buffer.from('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', 'hex').reverse(),
	genesisHashMerkleRoot: Buffer.from('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 'hex').reverse()
};

nkLib.netInfo = function(name) {
	switch (name || 'nokubit') {
	case 'nokubit': return nokubit;
	case 'oldNokubit': return oldNokubit;
	case 'bitcoin': return bitcoin;
	case 'test': case 'testnet3': return testnet3;
	case 'regtest': return regtest;
	}
	return {pchMessageZero: pchMessageZero};
};


function Hash256(b0, b1, r) {
	let h0 = crypto.createHash('sha256');
	let h1 = crypto.createHash('sha256');
	let digest;
	if (!Buffer.isBuffer(b1)) {
		digest = h1.update(h0.update(b0).digest()).digest();
		if (b1)
			r = b1;
	} else
		digest = h1.update(h0.update(b0).update(b1).digest()).digest();
	if (r) {
		return digest.reverse();
	}
	return digest;
};
nkLib.Hash256 = Hash256;
function Hash160(b0, b1, r) {
	let h0 = crypto.createHash('sha256');
	let h1 = crypto.createHash('ripemd160');
	let digest;
	if (!Buffer.isBuffer(b1)) {
		digest = h1.update(h0.update(b0).digest()).digest();
		if (b1)
			r = b1;
	} else
		digest = h1.update(h0.update(b0).update(b1).digest()).digest();
	if (r) {
		return digest.reverse();
	}
	return digest;
};
nkLib.Hash160 = Hash160;

const pszBase58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function DecodeBase58(psz) {
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

function EncodeBase58(buf) {
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
};

function EncodeBase58Check(vchIn) {
    // add 4-byte hash check to the end
    let vch = Buffer.from(vchIn, 'hex');
	let hash = Hash256(vch);
	vch = Buffer.concat([vch, hash.slice(0, 4)]);
    return EncodeBase58(vch);
};

function DecodeBase58Check(psz) {
	let vchRet = DecodeBase58(psz);
	if (vchRet == null || vchRet.length < 4)
        return null;

	// re-calculate the checksum, ensure it matches the included 4-byte checksum
    let hash = Hash256(vchRet.slice(0, -4));
	if (!hash.slice(0, 4).equals(vchRet.slice(-4)))
		return null;
    return vchRet.slice(0, -4);
};
nkLib.EncodeBase58Check = EncodeBase58Check;
nkLib.DecodeBase58Check = DecodeBase58Check;


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
  //console.log(data);
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

//	Da codice  Bitcoin
function encodeBech32(witness, hrp) {
	if (typeof hrp === 'undefined') {
		// Sostituire con prefisso Nokubit
		hrp = 'bc';
	}
	if (typeof witness === 'string') {
		witness = {
			version: 0,
			program: Buffer.from(witness, 'hex')
		}
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

//	Da codice in BIP
// addr e hrpFlag usati per test
function decodeBech32(s, addr, hrpFlag) {
	if (typeof hrpFlag === 'undefined' && typeof addr !== 'undefined' && !Buffer.isBuffer(addr)) {
		hrpFlag = addr;
		addr = Buffer.alloc(0);
	}
	if (typeof addr === 'undefined')
		addr = Buffer.alloc(0);
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
		ret.type = n;
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
		ret.program = ret.data.slice(2);
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
nkLib.encodeBech32 = encodeBech32;
nkLib.decodeBech32 = decodeBech32;

function arith_uint256_SetCompact(nCompact, pfNegative_pfOverflow)
{
    let nSize = nCompact >>> 24;
    let nWord = nCompact & 0x007fffff;
    let bn;
    if (nSize <= 3) {
        nWord >>>= 8 * (3 - nSize);
        bn = new BN(nWord);
    } else {
        bn = new BN(nWord);
        bn.ishln(8 * (nSize - 3));
    }
    if (pfNegative_pfOverflow) {
        pfNegative_pfOverflow.pfNegative = nWord != 0 && (nCompact & 0x00800000) != 0;
        pfNegative_pfOverflow.pfOverflow = nWord != 0 && ((nSize > 34) ||
                                     (nWord > 0xff && nSize > 33) ||
                                     (nWord > 0xffff && nSize > 32));
    }
    return bn;
};
function arith_uint256_GetCompact(ar, fNegative) {
    let nSize = ar.byteLength();
    let nCompact;
    if (nSize <= 3) {
        nCompact = (ar.toNumber() << (8 * (3 - nSize))) & 0x00FFFFFF;
    } else {
        let bn = ar.shrn(8 * (nSize - 3));
        nCompact = bn.toNumber() & 0x00FFFFFF;
    }
    // The 0x00800000 bit denotes the sign.
    // Thus, if it is already set, divide the mantissa by 256 and increase the exponent.
    if (nCompact & 0x00800000) {
        nCompact >>>= 8;
        nSize++;
    }
    nCompact |= nSize << 24;
    nCompact |= (fNegative && (nCompact & 0x007fffff) ? 0x00800000 : 0);
    return nCompact;
};
nkLib.arith_uint256_SetCompact = arith_uint256_SetCompact;
nkLib.arith_uint256_GetCompact = arith_uint256_GetCompact;


function BufferStream(buffer) {
	if (!(this instanceof BufferStream))
		return new BufferStream(buffer);

	if (!buffer) {
		this._flag = true;
		this._size = 256;
		buffer = Buffer.alloc(this._size);
	} else {
		this._flag = false;
		this._size = buffer.length;
	}
    this._data = buffer;
    this._pos = 0;
	this._mark = 0;
	this._exclude = [];
	this._excludeMark = -1;
};
BufferStream.prototype.resize = function(l) {
	l += this._pos;
	if (l > this._size) {
		if (!this._flag)
			throw 'Cannot resize buffer';
		while (this._size < l)
			this._size *= 2;
		this._data = Buffer.concat([this._data], this._size);
	}
};
BufferStream.prototype.setHashMark = function() { this._mark = this._pos; };
BufferStream.prototype.setExcludeMark = function() { this._excludeMark = this._pos; };
BufferStream.prototype.setExcludeAbort = function() { this._excludeMark = -1; };
BufferStream.prototype.setExclude = function() {
	if (this._excludeMark < 0)
		throw 'Cannot exclude';
	this._exclude.push([this._excludeMark, this._pos]);
	this._excludeMark = -1;
};
BufferStream.prototype.getExcluded = function() {
	let a = [], m = this._mark;
//console.log('getExcluded', m, this._exclude);
	this._exclude.forEach(function(se) {
//console.log('\t', se, m);
		if (se[0] >= m && se[0] < this._pos) {
			if (se[0] > m)
				a.push(this._data.slice(m, se[0]));
			m = se[1];
//console.log('\t', se, m, a);
		}
	}, this);
	if (m < this._pos)
		a.push(this._data.slice(m, this._pos));
//console.log('\t', m, this._pos, a);
//console.log(Buffer.concat(a).toString('hex'));
//console.log(this._data.slice(this._mark, this._pos).toString('hex'));
	return Buffer.concat(a);
};
BufferStream.prototype.getSignature = function(sk) {
	const sign = crypto.createSign('sha256');
	const hash = crypto.createHash('sha256');
	//console.log('Signature Data', this._mark, this._pos, this._data.slice(this._mark, this._pos).toString('hex'));
	const digest = hash.update(this._data.slice(this._mark, this._pos)).digest();
	//console.log('Signature Hash', crypto.createHash('SHA256').update(digest).digest().reverse().toString('hex'));
	sign.update(digest);
	const signature = sign.sign(sk);
	//console.log('Signature', signature.toString('hex'));
	return signature;
};
BufferStream.prototype.getHash = function(fRev) { return Hash256(this._data.slice(this._mark, this._pos), fRev); };
BufferStream.prototype.getRipemd = function(fRev) { return Hash160(this._data.slice(this._mark, this._pos), fRev); };
BufferStream.prototype.getHashForSign = function(fRev) {
	let digest = crypto.createHash('sha256').update(this._data.slice(this._mark, this._pos)).digest();
	if (fRev) {
		return digest.reverse();
	}
	return digest;
};
BufferStream.prototype.getExcludedHash = function(fRev) { return Hash256(this.getExcluded(), fRev); };
BufferStream.prototype.getExcludedHashForSign = function(fRev) {
	let digest = crypto.createHash('sha256').update(this.getExcluded()).digest();
	if (fRev) {
		return digest.reverse();
	}
	return digest;
};
BufferStream.prototype.readInt8 = function() { return this._data.readInt8(this._pos++); };
BufferStream.prototype.writeInt8 = function(b) { this.resize(1); this._data.writeInt8(b, this._pos++); };
BufferStream.prototype.readUInt8 = function() { return this._data.readUInt8(this._pos++); };
BufferStream.prototype.writeUInt8 = function(b) { this.resize(1); this._data.writeUInt8(b, this._pos++); };
BufferStream.prototype.readInt16LE = function() {
	let v = this._data.readInt16LE(this._pos);
	this._pos += 2;
	return v;
};
BufferStream.prototype.writeInt16LE = function(w) {
	this.resize(2);
	this._data.writeInt16LE(w, this._pos);
	this._pos += 2;
};
BufferStream.prototype.readUInt16LE = function() {
	let v = this._data.readUInt16LE(this._pos);
	this._pos += 2;
	return v;
};
BufferStream.prototype.writeUInt16LE = function(w) {
	this.resize(2);
	this._data.writeUInt16LE(w, this._pos);
	this._pos += 2;
};
BufferStream.prototype.readUInt16BE = function() {
	let v = this._data.readUInt16BE(this._pos);
	this._pos += 2;
	return v;
};
BufferStream.prototype.writeUInt16BE = function(w) {
	this.resize(2);
	this._data.writeUInt16BE(w, this._pos);
	this._pos += 2;
};
BufferStream.prototype.readInt32LE = function() {
	let v = this._data.readInt32LE(this._pos);
	this._pos += 4;
	return v;
};
BufferStream.prototype.writeInt32LE = function(d) {
	this.resize(4);
	this._data.writeInt32LE(d, this._pos);
	this._pos += 4;
};
BufferStream.prototype.readUInt32LE = function() {
	let v = this._data.readUInt32LE(this._pos);
	this._pos += 4;
	return v;
};
BufferStream.prototype.writeUInt32LE = function(d) {
	this.resize(4);
	this._data.writeUInt32LE(d, this._pos);
	this._pos += 4;
};
BufferStream.prototype.readInt64LE = function() {
	let v = this._data.readUIntLE(this._pos, 6);
	this._pos += 6;
	let b6 = this._data.readInt8(this._pos++);
	let b7 = this._data.readInt8(this._pos++);
	if (b6 == b7) {
		if (b7 == -1)
			return -((~v) + 1);
		if (b7 == 0)
			return v;
	}
	//throw "unsupported int64_t value";
	return new BN(this._data.slice(this._pos - 8, this._pos), 'le').fromTwos(64);
};
BufferStream.prototype.writeInt64LE = function(q) {
	if (BN.isBN(q)) {
		let b = q.toTwos(64).toBuffer('le', 8);
		this.writeBuffer(b);
		return;
	}
	if (!Number.isSafeInteger(q))
		throw "unsupported int64_t value";
	this.resize(8);
	let r = q % 0x1000000000000;
	let neg = q < 0;
	q = (q - r) / 0x1000000000000;
	this._data.writeIntLE(r, this._pos, 6);
	this._pos += 6;
	if (neg)
		q--;
	this._data.writeInt16LE(q, this._pos);
	this._pos += 2;
};
BufferStream.prototype.readUInt64LE = function() {
	let v = this._data.readUIntLE(this._pos, 6);
	this._pos += 6;
	let b6 = this._data.readUInt8(this._pos++);
	let b7 = this._data.readUInt8(this._pos++);
	if (b6 == b7 && b7 == 0)
		return v;
	//throw "unsupported uint64_t value";
	return new BN(this._data.slice(this._pos - 8, this._pos), 'le');
};
BufferStream.prototype.writeUInt64LE = function(q) {
	if (BN.isBN(q)) {
		if (q.isNeg())
			throw new TypeError('"value" argument is out of bounds');;
		let b = q.toBuffer('le', 8);
		this.writeBuffer(b);
		return;
	}
	if (!Number.isSafeInteger(q))
		throw "unsupported uint64_t value";
	this.resize(8);
	let r = q % 0x1000000000000;
	q = (q - r) / 0x1000000000000;
	this._data.writeUIntLE(r, this._pos, 6);
	this._pos += 6;
	this._data.writeUInt16LE(q, this._pos);
	this._pos += 2;
};
BufferStream.prototype.readUInt64BE = function() {
	let b6 = this._data.readUInt8(this._pos++);
	let b7 = this._data.readUInt8(this._pos++);
	if (b6 == b7 && b7 == 0) {
		let v = this._data.readUIntBE(this._pos, 6);
		this._pos += 6;
		return v;
	}
	throw "unsupported uint64_t value";
};
BufferStream.prototype.writeUInt64BE = function(q) {
	if (!Number.isSafeInteger(q))
		throw "unsupported uint64_t value";
	this.resize(8);
	let r = q % 0x1000000000000;
	q = (q - r) / 0x1000000000000;
	this._data.writeUInt16BE(q, this._pos);
	this._pos += 2;
	this._data.writeUIntBE(r, this._pos, 6);
	this._pos += 6;
};
BufferStream.prototype.readIntLE = function(l) {
	l = l || 1;
	let v = this._data.readIntLE(this._pos, l);
	this._pos += l;
	return v;
};
BufferStream.prototype.writeIntLE = function(d, l) {
	l = l || 1;
	this.resize(l);
	this._data.writeIntLE(d, this._pos, l);
	this._pos += l;
};
BufferStream.prototype.readUIntLE = function(l) {
	l = l || 1;
	let v = this._data.readUIntLE(this._pos, l);
	this._pos += l;
	return v;
};
BufferStream.prototype.writeUIntLE = function(d, l) {
	l = l || 1;
	this.resize(l);
	this._data.writeUIntLE(d, this._pos, l);
	this._pos += l;
};
BufferStream.prototype.getData = function() {
	return Buffer.from(this._data.slice(0, this._pos));
};
BufferStream.prototype.getMarkData = function() {
	return Buffer.from(this._data.slice(this._mark));
};
BufferStream.prototype.readBuffer = function(l) {
	if (l === 0)
		return Buffer.alloc(0);
	let p = this._pos;
	this._pos += l || (this._data.length - this._pos);
	return this._data.slice(p, this._pos);
};
BufferStream.prototype.readBufferSized = function() {
	let l = ReadCompactSize(this);
	if (l == 0)
		return Buffer.alloc(0);
    return this.readBuffer(l);
};
BufferStream.prototype.readString = function(t) {
	let l = ReadCompactSize(this);
	if (l == 0)
		return '';
    return this.readBuffer(l).toString(t);
};
BufferStream.prototype.readBufferReverse = function(l) {
	if (l == 0)
		return Buffer.alloc(0);
	let p = this._pos;
	this._pos += l || (this._data.length - this._pos);
	return Buffer.from(this._data.slice(p, this._pos)).reverse();
};
BufferStream.prototype.writeBuffer = function(b) {
	if (b.length == 0)
		return;
	this.resize(b.length);
	b.copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.writeScriptVector = function(b, t) {
	if (b.length == 0) {
		this.writeUInt8(0);
		return;
	}
	if (t || !Buffer.isBuffer(b))
		b = Buffer.from(b, t);
    this.writeBuffer(WriteScriptSize(b.length));
	this.resize(b.length);
	b.copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.writeBufferSized = function(b, t) {
	if (b.length == 0) {
		this.writeUInt8(0);
		return;
	}
	if (t || !Buffer.isBuffer(b))
		b = Buffer.from(b, t);
    this.writeBuffer(WriteCompactSize(b.length));
	this.resize(b.length);
	b.copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.writeString = function(s, t) {
	if (s.length == 0)
		return;
	let b = Buffer.from(s, t);
	this.resize(b.length);
	b.copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.writeBufferReverse = function(b) {
	if (b.length == 0)
		return;
	this.resize(b.length);
	Buffer.from(b).reverse().copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.writeStringReverse = function(s, t) {
	if (s.length == 0)
		return;
	let b = Buffer.from(s, t).reverse();
	this.resize(b.length);
	b.copy(this._data, this._pos);
	this._pos += b.length;
};
BufferStream.prototype.peek = function(l) {
	return this._data[this._pos + (l || 0)];
};
BufferStream.prototype.seek = function(l) {
	this._pos += (l || 0);
};
BufferStream.prototype.reset = function() {
	this._pos = 0;
};
BufferStream.prototype.end = function() {
	return this._pos == this._data.length;
};
BufferStream.prototype.hasSpace = function(l) {
	return (this._data.length - this._pos) >= (l || 0);
};
nkLib.BufferStream = BufferStream;

function WriteVarInt(os, n) {
    let tmp = [];
    while (true) {
		let v = n & 0x7F;
		if (tmp.length > 0)
			v |= 0x80;
        tmp.push(v);
        if (n <= 0x7F)
            break;
		n >>>= 7;
		n--;
	}
    while (tmp.length) {
        os.writeUInt8(tmp.shift());
    }
}
function ReadVarInt(s) {
    let n = 0;
    while(!s.end()) {
        let chData = s.readUInt8();
		n *= 128;
		n += chData & 0x7F;
		if (!Number.isSafeInteger(n))
			throw "ReadVarInt(): size too large";
		if ((chData & 0x80) == 0)
            return n;
		n++;
    }
	throw "ReadVarInt(): size too large";
};
nkLib.WriteVarInt = WriteVarInt;
nkLib.ReadVarInt = ReadVarInt;

/**
 *	class CScriptNum
 * Numeric opcodes (OP_1ADD, etc) are restricted to operating on 4-byte integers.
 * The semantics are subtle, though: operands must be in the range [-2^31 +1...2^31 -1],
 * but results may overflow (and are valid as long as they are not used in a subsequent
 * numeric operation). CScriptNum enforces those semantics by storing results as
 * an int64 and allowing out-of-range values to be returned as a vector of bytes but
 * throwing an exception if arithmetic is done or the result is interpreted as an integer.
 */
function CScriptNumSerialize(value) {
	if (value == 0)
		return Buffer.alloc(0);

	let result = new BufferStream();
	const neg = value < 0;
    let absvalue = neg ? -value : value;

	while (absvalue) {
		result.writeUInt8(absvalue & 0xff);
		absvalue >>>= 8;
	}

//    - If the most significant byte is >= 0x80 and the value is positive, push a
//    new zero-byte to make the significant byte < 0x80 again.

//    - If the most significant byte is >= 0x80 and the value is negative, push a
//    new 0x80 byte that will be popped off when converting to an integral.

//    - If the most significant byte is < 0x80 and the value is negative, add
//    0x80 to it, since it will be subtracted and interpreted as a negative when
//    converting to an integral.

	let last = result.peek(-1);
	if (last & 0x80)
		result.writeUInt8(neg ? 0x80 : 0);
	else if (neg) {
		result.seek(-1);
		result.writeUInt8(last | 0x80);
	}
	return result.getData();
};
function CScriptNumDeserialize(vch, fRequireMinimal, nMaxNumSize) {
	fRequireMinimal = !!fRequireMinimal;
	if (typeof nMaxNumSize === 'undefined')
		nMaxNumSize = 4;
	if (vch.length > nMaxNumSize) {
		throw 'script number overflow';
	}
	if (fRequireMinimal && vch.length > 0) {
		// Check that the number is encoded with the minimum possible
		// number of bytes.
		//
		// If the most-significant-byte - excluding the sign bit - is zero
		// then we're not minimal. Note how this test also rejects the
		// negative-zero encoding, 0x80.
		if ((vch[vch.length - 1] & 0x7f) == 0) {
			// One exception: if there's more than one byte and the most
			// significant bit of the second-most-significant-byte is set
			// it would conflict with the sign bit. An example of this case
			// is +-255, which encode to 0xff00 and 0xff80 respectively.
			// (big-endian).
			if (vch.length <= 1 || (vch[vch.length - 2] & 0x80) == 0) {
				throw 'non-minimally encoded script number';
			}
		}
	}

	if (vch.length == 0)
		return 0;

	let result = 0;
	let mul = 1;
	for (let i = 0; i < vch.length - 1; ++i) {
		result += vch[i] * mul;
		mul *= 256;
	}

	// If the input vector's most significant byte is 0x80, remove it from
	// the result's msb and return a negative.
	let last = vch[vch.length - 1];
	result += (last & 0x7F) * mul;
	if (last & 0x80)
		return -result;

	return result;
};
nkLib.CScriptNumSerialize = CScriptNumSerialize;
nkLib.CScriptNumDeserialize = CScriptNumDeserialize;


/** Script opcodes */
const opcodetype = Object.freeze({
    // push value
    OP_0: 0x00,
    OP_FALSE: 0x00,	// OP_0,
    OP_PUSHDATA1: 0x4c,
    OP_PUSHDATA2: 0x4d,
    OP_PUSHDATA4: 0x4e,
    OP_1NEGATE: 0x4f,
    OP_RESERVED: 0x50,
    OP_1: 0x51,
    OP_TRUE: 0x51,	// OP_1,
    OP_2: 0x52,
    OP_3: 0x53,
    OP_4: 0x54,
    OP_5: 0x55,
    OP_6: 0x56,
    OP_7: 0x57,
    OP_8: 0x58,
    OP_9: 0x59,
    OP_10: 0x5a,
    OP_11: 0x5b,
    OP_12: 0x5c,
    OP_13: 0x5d,
    OP_14: 0x5e,
    OP_15: 0x5f,
    OP_16: 0x60,

    // control
    OP_NOP: 0x61,
    OP_VER: 0x62,
    OP_IF: 0x63,
    OP_NOTIF: 0x64,
    OP_VERIF: 0x65,
    OP_VERNOTIF: 0x66,
    OP_ELSE: 0x67,
    OP_ENDIF: 0x68,
    OP_VERIFY: 0x69,
    OP_RETURN: 0x6a,

    // stack ops
    OP_TOALTSTACK: 0x6b,
    OP_FROMALTSTACK: 0x6c,
    OP_2DROP: 0x6d,
    OP_2DUP: 0x6e,
    OP_3DUP: 0x6f,
    OP_2OVER: 0x70,
    OP_2ROT: 0x71,
    OP_2SWAP: 0x72,
    OP_IFDUP: 0x73,
    OP_DEPTH: 0x74,
    OP_DROP: 0x75,
    OP_DUP: 0x76,
    OP_NIP: 0x77,
    OP_OVER: 0x78,
    OP_PICK: 0x79,
    OP_ROLL: 0x7a,
    OP_ROT: 0x7b,
    OP_SWAP: 0x7c,
    OP_TUCK: 0x7d,

    // splice ops
    OP_CAT: 0x7e,
    OP_SUBSTR: 0x7f,
    OP_LEFT: 0x80,
    OP_RIGHT: 0x81,
    OP_SIZE: 0x82,

    // bit logic
    OP_INVERT: 0x83,
    OP_AND: 0x84,
    OP_OR: 0x85,
    OP_XOR: 0x86,
    OP_EQUAL: 0x87,
    OP_EQUALVERIFY: 0x88,
    OP_RESERVED1: 0x89,
    OP_RESERVED2: 0x8a,

    // numeric
    OP_1ADD: 0x8b,
    OP_1SUB: 0x8c,
    OP_2MUL: 0x8d,
    OP_2DIV: 0x8e,
    OP_NEGATE: 0x8f,
    OP_ABS: 0x90,
    OP_NOT: 0x91,
    OP_0NOTEQUAL: 0x92,

    OP_ADD: 0x93,
    OP_SUB: 0x94,
    OP_MUL: 0x95,
    OP_DIV: 0x96,
    OP_MOD: 0x97,
    OP_LSHIFT: 0x98,
    OP_RSHIFT: 0x99,

    OP_BOOLAND: 0x9a,
    OP_BOOLOR: 0x9b,
    OP_NUMEQUAL: 0x9c,
    OP_NUMEQUALVERIFY: 0x9d,
    OP_NUMNOTEQUAL: 0x9e,
    OP_LESSTHAN: 0x9f,
    OP_GREATERTHAN: 0xa0,
    OP_LESSTHANOREQUAL: 0xa1,
    OP_GREATERTHANOREQUAL: 0xa2,
    OP_MIN: 0xa3,
    OP_MAX: 0xa4,

    OP_WITHIN: 0xa5,

    // crypto
    OP_RIPEMD160: 0xa6,
    OP_SHA1: 0xa7,
    OP_SHA256: 0xa8,
    OP_HASH160: 0xa9,
    OP_HASH256: 0xaa,
    OP_CODESEPARATOR: 0xab,
    OP_CHECKSIG: 0xac,
    OP_CHECKSIGVERIFY: 0xad,
    OP_CHECKMULTISIG: 0xae,
    OP_CHECKMULTISIGVERIFY: 0xaf,

    // expansion
    OP_NOP1: 0xb0,
    OP_CHECKLOCKTIMEVERIFY: 0xb1,
    OP_NOP2: 0xb1,	// OP_CHECKLOCKTIMEVERIFY,
    OP_CHECKSEQUENCEVERIFY: 0xb2,
    OP_NOP3: 0xb2,	// OP_CHECKSEQUENCEVERIFY,
    OP_NOP4: 0xb3,
    OP_NOP5: 0xb4,
    OP_NOP6: 0xb5,
    OP_NOP7: 0xb6,
    OP_NOP8: 0xb7,
    OP_NOP9: 0xb8,
    OP_NOP10: 0xb9,


    // template matching params
    OP_SMALLINTEGER: 0xfa,
    OP_PUBKEYS: 0xfb,
    OP_PUBKEYHASH: 0xfd,
    OP_PUBKEY: 0xfe,

    OP_INVALIDOPCODE: 0xff
});
nkLib.opcodetype = opcodetype;

function CheckMinimalPush(data, opcode) {
    if (data.length == 0) {
        // Could have used OP_0.
        return opcode == opcodetype.OP_0;
    } else if (data.length == 1 && data[0] >= 1 && data[0] <= 16) {
        // Could have used OP_1 .. OP_16.
        return opcode == opcodetype.OP_1 + (data[0] - 1);
    } else if (data.length == 1 && data[0] == 0x81) {
        // Could have used OP_1NEGATE.
        return opcode == opcodetype.OP_1NEGATE;
    } else if (data.length <= 75) {
        // Could have used a direct push (opcode indicating number of bytes pushed + those bytes).
        return opcode == data.length;
    } else if (data.length <= 255) {
        // Could have used OP_PUSHDATA.
        return opcode == opcodetype.OP_PUSHDATA1;
    } else if (data.length <= 65535) {
        // Could have used OP_PUSHDATA2.
        return opcode == opcodetype.OP_PUSHDATA2;
    }
    return true;
};
function DecodeOP_N(opcode) {
	if (opcode == opcodetype.OP_0)
		return 0;
	if ((opcode < opcodetype.OP_1 || opcode > opcodetype.OP_16) && opcode != opcodetype.OP_1NEGATE)
		throw 'opcode must be immediate number';
	return opcode - (opcodetype.OP_1 - 1);
};
function CScriptPushInt64(n) {
	if (n == -1 || (n >= 1 && n <= 16))
        return Buffer.from([(n + (opcodetype.OP_1 - 1))]);
	if (n == 0)
		return Buffer.from([opcodetype.OP_0]);

	let bs = new BufferStream();
	let result = CScriptNumSerialize(n);
	bs.writeScriptVector(result);
	return bs.getData();
};
function CScriptPopInt64(script) {
	let op = {};
	if (!script.getOp(op))
		return -1;
	if (op.opcode == opcodetype.OP_0)
		return 0;
	if (op.opcode == opcodetype.OP_1NEGATE || (op.opcode >= opcodetype.OP_1 && op.opcode <= opcodetype.OP_16))
        return DecodeOP_N(op.opcode);

	return CScriptNumDeserialize(op.pvch);
};
nkLib.CScriptPushInt64 = CScriptPushInt64;
nkLib.CScriptPopInt64 = CScriptPopInt64;

/**
 * Compact Size
 * size <  253        -- 1 byte
 * size <= USHRT_MAX  -- 3 bytes  (253 + 2 bytes)
 * size <= UINT_MAX   -- 5 bytes  (254 + 4 bytes)
 * size >  UINT_MAX   -- 9 bytes  (255 + 8 bytes)
 */
const MAX_SIZE = 0x02000000;

function GetSizeOfCompactSize(nSize)
{
    if (nSize < 253)             	return 1;		//sizeof(unsigned char);
    else if (nSize <= 0xFFFF) 		return 1 + 2; 	//std::numeric_limits<unsigned short>::max()) return sizeof(unsigned char) + sizeof(unsigned short);
    else if (nSize <= 0xFFFFFFFF) 	return 1 + 4; 	//std::numeric_limits<unsigned int>::max())  return sizeof(unsigned char) + sizeof(unsigned int);
    else                         	return 1 + 8;	//sizeof(unsigned char) + sizeof(uint64_t);
};

function WriteCompactSize(nSize)
{
	let buf = Buffer.alloc(GetSizeOfCompactSize(nSize));
    if (nSize < 253)
    {
        buf.writeUInt8(nSize, 0);
    }
    else if (nSize <= 0xFFFF)
    {
        buf.writeUInt8(253, 0);
        buf.writeUInt16LE(nSize, 1);
    }
    else if (nSize <= 0xFFFFFFFF)
    {
        buf.writeUInt8(254, 0);
        buf.writeUInt32LE(nSize, 1);
    }
    else
    {
		if (nSize > MAX_SIZE)
			throw "WriteCompactSize(): size too large";
        buf.writeUInt8(255, 0);
        buf.writeUIntLE(nSize, 1, 6);
        buf.writeUInt8(nSize >>> 48, 7);
        buf.writeUInt8(0, 8);
    }
    return buf;
};

function ReadCompactSize(is)	// uint64_t
{
    var chSize = is.readUInt8();
    if (chSize >= 253)
    {
		if (chSize == 253)
		{
			chSize = is.readUInt16LE(is.pos);
			if (chSize < 253)
				throw "non-canonical ReadCompactSize()";
		}
		else if (chSize == 254)
		{
			chSize = is.readUInt32LE(is.pos);
			if (chSize < 0x10000)
				throw "non-canonical ReadCompactSize()";
		}
		else
		{
			chSize = is.readUIntLE(6);
			if (is.readUInt8() != 0 || is.readUInt8() != 0)
				throw "unsupported ReadCompactSize()";
			if (chSize < 0x100000000)
				throw "non-canonical ReadCompactSize()";
		}
    }
    if (chSize > MAX_SIZE)
        throw "ReadCompactSize(): size too large";
    return chSize;
};
nkLib.WriteCompactSize = WriteCompactSize;
nkLib.ReadCompactSize = ReadCompactSize;

function WriteScriptSize(nSize)
{
	let bs = new BufferStream();
    if (nSize < opcodetype.OP_PUSHDATA1)
    {
        bs.writeUInt8(nSize);
    }
    else if (nSize <= 0xFF)
    {
        bs.writeUInt8(opcodetype.OP_PUSHDATA1);
        bs.writeUInt8(nSize);
    }
    else if (nSize <= 0xFFFF)
    {
        bs.writeUInt8(opcodetype.OP_PUSHDATA2);
        bs.writeUInt16LE(nSize);
    }
    else if (nSize <= 0xFFFFFFFF)
    {
        bs.writeUInt8(opcodetype.OP_PUSHDATA4);
        bs.writeUInt32LE(nSize);
    }
    else
    {
		throw "WriteScriptSize(): size too large";
    }
	return bs.getData();
};

function MerkleComputation(leaves) {
	//console.log(leaves);
    if (leaves.length == 0) {
        return null;
    }
    if (leaves.length == 1) {
        return Buffer.from(leaves[0]);
    }
	let l = [], h1;
    while ((h1 = leaves.shift())) {
		let h2 = leaves.shift();
		if (h2 && h1.equals(h2))
			console.log("Mutated");
		h2 = h2 || h1;
		l.push(Hash256(h1, h2));
	}
	if (l.length > 1)
		return MerkleComputation(l);
	return l[0];
};


var blocks = [];
function Block(data, isOld) {
	if (!(this instanceof Block))
		return new Block(data, isOld);

	this.vtx = [];
	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (data instanceof BufferStream){
		if (data.length < 81)
			throw new Error('Invalid block size');
		data.setHashMark();
		this.nVersion = data.readInt32LE();			// int32_t
		this.hashPrevBlock = data.readBuffer(32);	// uint256
		this.hashMerkleRoot = data.readBuffer(32);	// uint256
		this.nTime = data.readUInt32LE();			// uint32_t
		this.nBits = data.readUInt32LE();			// uint32_t
		this.nNonce = data.readUInt32LE();			// uint32_t
		this.hash = data.getHash();
		//console.log('B HASH', this.hash);
		let n = ReadCompactSize(data);
		if (n > 0) {
			let leaves = [];
			while (n--){
				let tx = new Transaction(data, isOld);
				this.vtx.push(tx);
				leaves.push(tx.hash);
			}
			this.merkle = MerkleComputation(leaves);
			this.merkleChecked = this.hashMerkleRoot.equals(this.merkle);
			//console.log('M HASH', this.merkleChecked, this.merkle);
		}
	} else {
		this.nVersion = 0;			// int32_t
		this.hashPrevBlock = null;	// uint256
		this.hashMerkleRoot = null;	// uint256
		this.nTime = 0;				// uint32_t
		this.nBits = 0;				// uint32_t
		this.nNonce = 0;			// uint32_t
		this.hash = null;
		this.merkle = null;
	}
};
Block.prototype.toBlockCompatible = function(mode) {
	if (mode) {
		this.vtx.forEach(function(tx) {
			tx.vout.forEach(function(txout) {
				if (txout.name)
					throw 'Cannot convert: spending asset found';
			});
		});
	}
	let flag = [];
	this.vtx.forEach(function(tx) {
		tx.vout.forEach(function(txout) {
			flag.push(txout.compatibilty);
			txout.compatibilty = !!mode;
		});
	});
	let b = this.toBuffer();
	this.vtx.forEach(function(tx) {
		tx.vout.forEach(function(txout) {
			txout.compatibilty = flag.shift();
		});
	});
	let bl = new Block(b);
	bl.hashMerkleRoot = bl.merkle;
	bl.merkleChecked = true;
	bl.getHash();
	return bl;
};
Block.prototype.toHeaderBuffer = function() {
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
    bs.writeBuffer(this.hashPrevBlock);
    bs.writeBuffer(this.hashMerkleRoot);
    bs.writeUInt32LE(this.nTime);
    bs.writeUInt32LE(this.nBits);
	bs.writeUInt32LE(this.nNonce);
	bs.writeUInt8(0);
    return bs.getData();
};
Block.prototype.toBuffer = function() {
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
    bs.writeBuffer(this.hashPrevBlock);
    bs.writeBuffer(this.hashMerkleRoot);
    bs.writeUInt32LE(this.nTime);
    bs.writeUInt32LE(this.nBits);
    bs.writeUInt32LE(this.nNonce);
    bs.writeBuffer(WriteCompactSize(this.vtx.length));
    this.vtx.forEach(function(tx) {
        bs.writeBuffer(tx.toBuffer());
    });
    return bs.getData();
};
Block.prototype.getHash = function() {
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
    bs.writeBuffer(this.hashPrevBlock);
    bs.writeBuffer(this.hashMerkleRoot);
    bs.writeUInt32LE(this.nTime);
    bs.writeUInt32LE(this.nBits);
    bs.writeUInt32LE(this.nNonce);
	this.hash = Hash256(bs.getData());
    return this.hash;
};
Block.prototype.getMerkle = function() {
	let leaves = this.vtx.map(function(e) { return e.getHash(); });
	this.hashMerkleRoot = this.merkle = MerkleComputation(leaves);
	this.merkleChecked = true;
	return this.merkle;
};
Block.prototype.getMerkleCommit = function() {
	let leaves = this.vtx.map(function(e, idx) {
		let h;
		if (idx > 0)
			h = e.getHashWitness();
		if (h)
			return h;
		return Buffer.alloc(32);
	});
	return MerkleComputation(leaves);
};

//var txCount = 0;
function Transaction(data, isOld) {
	if (!(this instanceof Transaction))
		return new Transaction(data, isOld);

//console.log(txCount++);
	this.vin = [];		// std::vector<CTxIn>
	this.vout = [];		// std::vector<CTxOut>
	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (data instanceof BufferStream){
		if (data.length < 9)
			throw new Error('Invalid tx size');
		data.setHashMark();
		this.nVersion = data.readInt32LE();		// int32_t
		let flags = 0;
		data.setExcludeMark();
		let n = ReadCompactSize(data);
		// Has SegWit?
		if (n === 0) {
			flags = data.readUInt8();
			data.setExclude();
			if (flags !== 0){
				n = ReadCompactSize(data);
				while (n--){
					this.vin.push(new TxIn(data));
				}
				n = ReadCompactSize(data);
				while (n--){
					this.vout.push(new TxOut(data, isOld));
				}
				data.setExcludeMark();
				let ni = this.vin.length;
				for (let i=0; i<ni; i++){
					let wit = this.vin[i].scriptWitness = [];
					n = ReadCompactSize(data);
//console.log('Transaction TxIn SegWit offset', n, data._pos, data.peek(), data.peek(1), data.peek(2));
					while (n--){
						let script = new Script(data);
//console.log('Transaction SegWit', script);
						wit.push(script);
					}
					// if (this.vin[i].hasTag) {
					// 	console.log('-------------------- TAG NOT PARSED --------------------', wit);
					// }
//console.log('Transaction SegWit', wit);
				}
				data.setExclude();
			}
		} else {
			data.setExcludeAbort();
			while (n--){
				this.vin.push(new TxIn(data));
			}
			n = ReadCompactSize(data);
			while (n--){
				this.vout.push(new TxOut(data, isOld));
			}
		}
		this.nLockTime = data.readUInt32LE();		// uint32_t
		
		this.hasWitness = !(this.vin[0].scriptWitness === null);
		this.hash = data.getHash();
		if (this.hasWitness) {
			this.hashWit = this.hash;
			this.hash = data.getExcludedHash();
		} else
			this.hashWit = null;
		//console.log('TX HASH', Buffer.from(this.hash).reverse(), Buffer.from((this.hashWit || Buffer.alloc(0))).reverse());
	} else {
		this.nVersion = 0;	// int32_t
		this.nLockTime;	// uint32_t
		this.hash = null;
		this.hashWit = null;
		this.hasWitness = false;
	}
};
Transaction.prototype.toTxCompatible = function(mode) {
	if (mode) {
		this.vout.forEach(function(txout) {
			if (txout.name)
				throw 'Cannot convert: spending asset found';
		});
	}
	let flag = [];
	this.vout.forEach(function(txout) {
		flag.push(txout.compatibilty);
		txout.compatibilty = !!mode;
	});
	let b = this.toBuffer();
	this.vout.forEach(function(txout) {
		txout.compatibilty = flag.shift();
	});
	return new Transaction(b);
};
Transaction.prototype.toBuffer = function() {
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
    if (this.hasWitness) {
		bs.writeUInt8(0);
		bs.writeUInt8(1);
    }
    bs.writeBuffer(WriteCompactSize(this.vin.length));
    this.vin.forEach(function(txin) {
        bs.writeBuffer(txin.toBuffer());
    });
    bs.writeBuffer(WriteCompactSize(this.vout.length));
    this.vout.forEach(function(txout) {
        bs.writeBuffer(txout.toBuffer());
    });
    if (this.hasWitness) {
		this.vin.forEach(function(txin) {
			let wit = txin.scriptWitness;
//console.log('Witness', wit);
			bs.writeBuffer(WriteCompactSize(wit.length));
			wit.forEach(function(w) {
				bs.writeBuffer(w.toBuffer());
			});
		});
    }
	bs.writeUInt32LE(this.nLockTime);
    return bs.getData();
};
Transaction.prototype.getHash = function() {
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
    bs.writeBuffer(WriteCompactSize(this.vin.length));
    this.vin.forEach(function(txin) {
        bs.writeBuffer(txin.toBuffer());
    });
    bs.writeBuffer(WriteCompactSize(this.vout.length));
    this.vout.forEach(function(txout) {
        bs.writeBuffer(txout.toBuffer());
    });
	bs.writeUInt32LE(this.nLockTime);
	this.hash = Hash256(bs.getData());
    return this.hash;
};
Transaction.prototype.getHashWitness = function() {
	if (!this.hasWitness) {
		this.hashWit = null;
		return null;
	}
	let bs = new BufferStream();
    bs.writeInt32LE(this.nVersion);
	bs.writeUInt8(0);
	bs.writeUInt8(1);
    bs.writeBuffer(WriteCompactSize(this.vin.length));
    this.vin.forEach(function(txin) {
        bs.writeBuffer(txin.toBuffer());
    });
    bs.writeBuffer(WriteCompactSize(this.vout.length));
    this.vout.forEach(function(txout) {
        bs.writeBuffer(txout.toBuffer());
    });
	this.vin.forEach(function(txin) {
		let wit = txin.scriptWitness;
//console.log('Witness', wit);
		bs.writeBuffer(WriteCompactSize(wit.length));
		wit.forEach(function(w) {
			bs.writeBuffer(w.toBuffer());
		});
	});
	bs.writeUInt32LE(this.nLockTime);
	this.hashWit = Hash256(bs.getData());
    return this.hashWit;
};

function TxIn(data) {
	if (!(this instanceof TxIn))
		return new TxIn(data);

	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	this.hasTag = false;
	if (data instanceof BufferStream){
		//if (data.length < 81)
		//	throw new Error('Invalid block size');
		this.prevout = new OutPoint(data);		// COutPoint
		this.scriptSig = new Script(data);		// CScript
		this.nSequence = data.readUInt32LE();	// uint32_t
		if (this.prevout.n != 0xFFFFFFFF && (this.prevout.n & 0x80000000)) {
			this.prevout.n &= 0x7FFFFFFF;
			this.hasTag = true;
		}
	} else {
		this.prevout = null;			// COutPoint
		this.scriptSig = null;			// CScript
		this.nSequence = 0xffffffff;	// uint32_t
	}
	this.scriptWitness = null;		// CScriptWitness 	//! Only serialized through CTransaction
	this.tag = null;				//! Only serialized through CTransaction
};
TxIn.prototype.toBuffer = function() {
	let bs = new BufferStream();
	// Prevout è serializzato così nella TxIn
    bs.writeBuffer(this.prevout.hash);
	if (this.hasTag)
		bs.writeInt32LE(this.prevout.n | 0x80000000);
	else
		bs.writeUInt32LE(this.prevout.n);
	bs.writeBuffer(this.scriptSig.toBuffer());
	bs.writeUInt32LE(this.nSequence);
    return bs.getData();
};
/* Setting nSequence to this value for every input in a transaction
 * disables nLockTime. */
Object.freeze(TxIn.SEQUENCE_FINAL = 0xffffffff);
/* Below flags apply in the context of BIP 68*/
/* If this flag set, TxIn::nSequence is NOT interpreted as a
 * relative lock-time. */
Object.freeze(TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG = (1 << 31));
/* If TxIn::nSequence encodes a relative lock-time and this flag
 * is set, the relative lock-time has units of 512 seconds,
 * otherwise it specifies blocks with a granularity of 1. */
Object.freeze(TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG = (1 << 22));
/* If TxIn::nSequence encodes a relative lock-time, this mask is
 * applied to extract that lock-time from the sequence field. */
Object.freeze(TxIn.SEQUENCE_LOCKTIME_MASK = 0x0000ffff);

function TxOut(data, isOld) {
	if (!(this instanceof TxOut))
		return new TxOut(data, isOld);

	this.compatibilty = isOld == true;
	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (data instanceof BufferStream){
		//if (data.length < 81)
		//	throw new Error('Invalid block size');
        if (this.compatibilty) {
            this.name = '';
        } else {
            this.name = new Script(data).script.toString('utf8');
		}
		this.nValue = data.readInt64LE();		// CAmount	int64_t
		this.scriptPubKey = new Script(data);	// CScript
	} else {
		this.name = '';
		this.nValue = -1;			// CAmount
		this.scriptPubKey = null;	// CScript
	}
};
TxOut.prototype.toBuffer = function() {
	let bs = new BufferStream();
	if (!this.compatibilty) {
		bs.writeBufferSized(this.name, 'utf8');
	}
	bs.writeInt64LE(this.nValue);
	// Cambiare default di scriptPubKey ?????
	if (this.scriptPubKey)
		bs.writeBuffer(this.scriptPubKey.toBuffer());
	else
		bs.writeUInt8(0)
	return bs.getData();
};

function OutPoint(data) {
	if (!(this instanceof OutPoint))
		return new OutPoint(data);

	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (data instanceof BufferStream){
		//if (data.length < 81)
		//	throw new Error('Invalid block size');
		this.hash = data.readBuffer(32);	// uint256
		this.n = data.readUInt32LE();		// uint32_t
	} else {
		this.hash = null;		// uint256
		this.n = 0xffffffff;	// uint32_t
	}
};
OutPoint.prototype.toBuffer = function() {
	let bs = new BufferStream();
	bs.writeBuffer(this.hash);
	bs.writeUInt32LE(this.n);
	return bs.getData();
};

function Script(data) {
	if (!(this instanceof Script))
		return new Script(data);

	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (data instanceof BufferStream){
		//if (data.length < 81)
		//	throw new Error('Invalid block size');
		let n = ReadCompactSize(data);
		this.script = data.readBuffer(n);
	} else {
		this.script = null;
	}
};
Script.prototype.fromBuffer = function(b) {
	if (Buffer.isBuffer(b))
		this.script = Buffer.from(b);
	else
		this.script = Buffer.from(b, 'hex');
	return this;
};
Script.prototype.toBuffer = function() {
	let bs = new BufferStream();
	if (this.script) {
		bs.writeBuffer(WriteCompactSize(this.script.length));
		if (this.script.length > 0)
			bs.writeBuffer(this.script);
	} else
		bs.writeUInt8(0);
	return bs.getData();
};
Script.prototype.getOp = function(info, data) {
	if (!data) {
		if (info && info.data)
			data = info.data;
		else
			data = new BufferStream(this.script);
	}
	if (Buffer.isBuffer(data))
		data = new BufferStream(data);
	if (!(data instanceof BufferStream))
		throw new Error('Invalid script data');
	if (info) {
		info.pvch = Buffer.alloc(0);
		info.opcode = opcodetype.OP_INVALIDOPCODE;
		info.data = data;
	}
	if (data.end())
		return false;

	// Read instruction
	let opcode = data.readUInt8();

	// Immediate operand
	if (opcode <= opcodetype.OP_PUSHDATA4) {
		let nSize = 0;
		if (opcode < opcodetype.OP_PUSHDATA1) {
			nSize = opcode;
		} else if (opcode == opcodetype.OP_PUSHDATA1) {
			if (!data.hasSpace(1))
				return false;
			nSize = data.readUInt8();
		} else if (opcode == opcodetype.OP_PUSHDATA2) {
			if (!data.hasSpace(2))
				return false;
			nSize = data.readUInt16LE();
		} else if (opcode == opcodetype.OP_PUSHDATA4) {
			if (!data.hasSpace(4))
				return false;
			nSize = data.readUInt32LE();
		}
		if (!data.hasSpace(nSize))
			return false;
		if (info)
			info.pvch = data.readBuffer(nSize);
	}
	if (info)
		info.opcode = opcode;
	return true;
};
Script.verifyFlags = Object.freeze({
	SCRIPT_VERIFY_NONE: 0,
	// Evaluate P2SH subscripts (BIP16).
	SCRIPT_VERIFY_P2SH: (1 << 0),
	// Passing a non-strict-DER signature or one with undefined hashtype to a checksig operation causes script failure.
	// Evaluating a pubkey that is not (0x04 + 64 bytes) or (0x02 or 0x03 + 32 bytes) by checksig causes script failure.
	// (not used or intended as a consensus rule).
	SCRIPT_VERIFY_STRICTENC: (1 << 1),
	// Passing a non-strict-DER signature to a checksig operation causes script failure (BIP62 rule 1)
	SCRIPT_VERIFY_DERSIG: (1 << 2),
	// Passing a non-strict-DER signature or one with S > order/2 to a checksig operation causes script failure
	// (BIP62 rule 5).
	SCRIPT_VERIFY_LOW_S: (1 << 3),
	// verify dummy stack item consumed by CHECKMULTISIG is of zero-length (BIP62 rule 7).
	SCRIPT_VERIFY_NULLDUMMY: (1 << 4),
	// Using a non-push operator in the scriptSig causes script failure (BIP62 rule 2).
	SCRIPT_VERIFY_SIGPUSHONLY: (1 << 5),
	// Require minimal encodings for all push operations (OP_0... OP_16, OP_1NEGATE where possible, direct
	// pushes up to 75 bytes, OP_PUSHDATA up to 255 bytes, OP_PUSHDATA2 for anything larger). Evaluating
	// any other push causes the script to fail (BIP62 rule 3).
	// In addition, whenever a stack element is interpreted as a number, it must be of minimal length (BIP62 rule 4).
	SCRIPT_VERIFY_MINIMALDATA: (1 << 6),
	// Discourage use of NOPs reserved for upgrades (NOP1-10)
	//
	// Provided so that nodes can avoid accepting or mining transactions
	// containing executed NOP's whose meaning may change after a soft-fork,
	// thus rendering the script invalid; with this flag set executing
	// discouraged NOPs fails the script. This verification flag will never be
	// a mandatory flag applied to scripts in a block. NOPs that are not
	// executed, e.g.  within an unexecuted IF ENDIF block, are *not* rejected.
	// NOPs that have associated forks to give them new meaning (CLTV, CSV)
	// are not subject to this rule.
	SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS: (1 << 7),
	// Require that only a single stack element remains after evaluation. This changes the success criterion from
	// "At least one stack element must remain, and when interpreted as a boolean, it must be true" to
	// "Exactly one stack element must remain, and when interpreted as a boolean, it must be true".
	// (BIP62 rule 6)
	// Note: CLEANSTACK should never be used without P2SH or WITNESS.
	SCRIPT_VERIFY_CLEANSTACK: (1 << 8),
	// Verify CHECKLOCKTIMEVERIFY
	//
	// See BIP65 for details.
	SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY: (1 << 9),
	// support CHECKSEQUENCEVERIFY opcode
	//
	// See BIP112 for details
	SCRIPT_VERIFY_CHECKSEQUENCEVERIFY: (1 << 10),
	// Support segregated witness
	SCRIPT_VERIFY_WITNESS: (1 << 11),
	// Making v1-v16 witness program non-standard
	SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM: (1 << 12),
	// Segwit script only: Require the argument of OP_IF/NOTIF to be exactly 0x01 or empty vector
	SCRIPT_VERIFY_MINIMALIF: (1 << 13),
	// Signature(s) must be empty vector if an CHECK(MULTI)SIG operation failed
	SCRIPT_VERIFY_NULLFAIL: (1 << 14),
	// Public keys in segregated witness scripts must be compressed
	SCRIPT_VERIFY_WITNESS_PUBKEYTYPE: (1 << 15),
	// Making OP_CODESEPARATOR and FindAndDelete fail any non-segwit scripts
	SCRIPT_VERIFY_CONST_SCRIPTCODE: (1 << 16),
});
const MANDATORY_SCRIPT_VERIFY_FLAGS = Script.verifyFlags.SCRIPT_VERIFY_P2SH;
const STANDARD_SCRIPT_VERIFY_FLAGS = MANDATORY_SCRIPT_VERIFY_FLAGS |
	Script.verifyFlags.SCRIPT_VERIFY_DERSIG |
	Script.verifyFlags.SCRIPT_VERIFY_STRICTENC |
	Script.verifyFlags.SCRIPT_VERIFY_MINIMALDATA |
	Script.verifyFlags.SCRIPT_VERIFY_NULLDUMMY |
	Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS |
	Script.verifyFlags.SCRIPT_VERIFY_CLEANSTACK |
	Script.verifyFlags.SCRIPT_VERIFY_MINIMALIF |
	Script.verifyFlags.SCRIPT_VERIFY_NULLFAIL |
	Script.verifyFlags.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY |
	Script.verifyFlags.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY |
	Script.verifyFlags.SCRIPT_VERIFY_LOW_S |
	Script.verifyFlags.SCRIPT_VERIFY_WITNESS |
	Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM |
	Script.verifyFlags.SCRIPT_VERIFY_WITNESS_PUBKEYTYPE |
	Script.verifyFlags.SCRIPT_VERIFY_CONST_SCRIPTCODE;

Script.txnouttype = Object.freeze({
    TX_NONSTANDARD: "nonstandard",
    TX_PUBKEY: "pubkey",
    TX_PUBKEYHASH: "pubkeyhash",
    TX_SCRIPTHASH: "scripthash",
    TX_MULTISIG: "multisig",
    TX_NULL_DATA: "nulldata",
    TX_WITNESS_V0_KEYHASH: "witness_v0_keyhash",
    TX_WITNESS_V0_SCRIPTHASH: "witness_v0_scripthash",
    TX_WITNESS_UNKNOWN: "witness_unknown"
});
// Templates
Script.mTemplates = Object.freeze({
	TX_PUBKEY: new Script(Buffer.from([2, opcodetype.OP_PUBKEY, opcodetype.OP_CHECKSIG])),
	TX_PUBKEYHASH: new Script(Buffer.from([5, opcodetype.OP_DUP, opcodetype.OP_HASH160, opcodetype.OP_PUBKEYHASH, opcodetype.OP_EQUALVERIFY, opcodetype.OP_CHECKSIG])),
	TX_MULTISIG: new Script(Buffer.from([4, opcodetype.OP_SMALLINTEGER, opcodetype.OP_PUBKEYS, opcodetype.OP_SMALLINTEGER, opcodetype.OP_CHECKMULTISIG]))
});
Script.prototype.IsPayToScriptHash = function() {
	// Extra-fast test for pay-to-script-hash CScripts:
	let s = this.script;
	return (s && s.length == 23 &&
		s[0] == opcodetype.OP_HASH160 &&
		s[1] == 0x14 &&
		s[22] == opcodetype.OP_EQUAL);
};
Script.prototype.IsPayToWitnessScriptHash = function() {
    // Extra-fast test for pay-to-witness-script-hash CScripts:
	let s = this.script;
    return (s && s.length == 34 &&
		s[0] == opcodetype.OP_0 &&
		s[1] == 0x20);
}
// A witness program is any valid CScript that consists of a 1-byte push opcode
// followed by a data push between 2 and 40 bytes.
Script.prototype.IsWitnessProgram = function(w) {
	let s = this.script;
	if (s.length < 4 || s.length > 42)
		return false;
	let op = s[0];
	if (op != opcodetype.OP_0 && (op < opcodetype.OP_1 || op > opcodetype.OP_16))
		return false;
	if ((s[1] + 2) == s.length) {
        w.version = DecodeOP_N(op);
		w.program = Buffer.from(s.slice(2));
		return true;
	}
	return false;
};
Script.prototype.IsPushOnly = function(pc) {
	let op = {data: new BufferStream(pc)};
	while (!op.data.end(op)) {
		if (!this.getOp(op))
			return false;
		// Note that IsPushOnly() *does* consider OP_RESERVED to be a
		// push-type opcode, however execution of OP_RESERVED fails, so
		// it's not relevant to P2SH/BIP62 as the scriptSig would fail prior to
		// the P2SH special validation code being executed.
		if (op.opcode > opcodetype.OP_16)
			return false;
	}
	return true;
};
Script.prototype.Solver = function(info) {
	info.solutions = [];
	// Shortcut for pay-to-script-hash, which are more constrained than the other types:
	// it is always OP_HASH160 20 [20 byte hash] OP_EQUAL
	if (this.IsPayToScriptHash()) {
		info.type = Script.txnouttype.TX_SCRIPTHASH;
		info.solutions.push(Buffer.from(this.script.slice(2, 22)));
		return true;
	}

	let witness = {};
	if (this.IsWitnessProgram(witness)) {
		if (witness.version == 0 && witness.program.length == 20) {
			info.type = Script.txnouttype.TX_WITNESS_V0_KEYHASH;
			info.solutions.push(witness.program);
			return true;
		}
		if (witness.version == 0 && witness.program.length == 32) {
			info.type = Script.txnouttype.TX_WITNESS_V0_SCRIPTHASH;
			info.solutions.push(witness.program);
			return true;
		}
		if (witness.version != 0) {
			info.type = Script.txnouttype.TX_WITNESS_UNKNOWN;
			info.solutions.push(Buffer.from([witness.version]));
			info.solutions.push(witness.program);
			return true;
		}
        return false;
    }

    // Provably prunable, data-carrying output
    //
    // So long as script passes the IsUnspendable() test and all but the first
    // byte passes the IsPushOnly() test we don't care what exactly is in the
    // script.
	let s = this.script;
	if (s.length >= 1 && s[0] == opcodetype.OP_RETURN && this.IsPushOnly(s.slice(1))) {
		info.type = Script.txnouttype.TX_NULL_DATA;
		return true;
	}

	// Scan templates
	let script1 = this;
	for (let tplate in Script.mTemplates) {
		let script2 = Script.mTemplates[tplate];
		info.solutions = [];
		let op1 = {data: new BufferStream(script1.script)},
			op2 = {data: new BufferStream(script2.script)};

		// Compare
		while (true) {
			if (op1.data.end() && op2.data.end()) {
				// Found a match
				info.type = Script.txnouttype[tplate];
				if (info.type == Script.txnouttype.TX_MULTISIG) {
					// Additional checks for TX_MULTISIG:
					// ????? è così, nonostante le chiavi iniziano per 2 o 3 (anche se coperto da OP_SMALLINTEGER) ?????
                    let m = info.solutions[0][0];
                    let n = info.solutions[info.solutions.length - 1][0];
                    if (m < 1 || n < 1 || m > n || (info.solutions.length - 2) != n)
                        return false;
				}
				return true;
			}
			if (!script1.getOp(op1))
				break;
			if (!script2.getOp(op2))
				break;

			// Template matching opcodes:
			if (op2.opcode == opcodetype.OP_PUBKEYS) {
				while (op1.pvch.length >= 33 && op1.pvch.length <= 65) {
					info.solutions.push(op1.pvch);
					if (!script1.getOp(op1))
						break;
				}
				if (!script2.getOp(op2))
					break;
				// Normal situation is to fall through
				// to other if/else statements
			}

			if (op2.opcode == opcodetype.OP_PUBKEY) {
				if (op1.pvch.length < 33 || op1.pvch.length > 65)
					break;
				info.solutions.push(op1.pvch);
			} else if (op2.opcode == opcodetype.OP_PUBKEYHASH) {
				if (op1.pvch.length != 20)
					break;
				info.solutions.push(op1.pvch);
			} else if (op2.opcode == opcodetype.OP_SMALLINTEGER) {
				// Single-byte small integer pushed onto vSolutions
				if (op1.opcode == opcodetype.OP_0 || (op1.opcode >= opcodetype.OP_1 && op1.opcode <= opcodetype.OP_16)) {
                    info.solutions.push(Buffer.from([DecodeOP_N(op1.opcode)]));
				} else
					break;
			} else if (op1.opcode != op2.opcode || !op1.pvch.equals(op2.pvch))
                // Others must match exactly
                break;
		}
	}

    info.solutions = [];
    info.type = Script.txnouttype.TX_NONSTANDARD;
    return false;
}



nkLib.Block = Block;
nkLib.Transaction = Transaction;
nkLib.TxIn = TxIn;
nkLib.TxOut = TxOut;
nkLib.OutPoint = OutPoint;
nkLib.Script = Script;


/* secp256k1 order. */
const SECP256K1_N = Buffer.from('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 'hex');
/* half the secp256k1 order (inclusive). */
const SECP256K1_N_H = Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex');



function IsValidSignatureEncoding(sig) {
    // Format: 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S] [sighash]
    // * total-length: 1-byte length descriptor of everything that follows,
    //   excluding the sighash byte.
    // * R-length: 1-byte length descriptor of the R value that follows.
    // * R: arbitrary-length big-endian encoded R value. It must use the shortest
    //   possible encoding for a positive integers (which means no null bytes at
    //   the start, except a single one when the next byte has its highest bit set).
    // * S-length: 1-byte length descriptor of the S value that follows.
    // * S: arbitrary-length big-endian encoded S value. The same rules apply.
    // * sighash: 1-byte value indicating what data is hashed (not part of the DER
    //   signature)

    // Minimum and maximum size constraints.
    if (sig.length < 8) return {error: 'Signature too short'};
    if (sig.length > 73) return {error: 'Signature too long'};

    // A signature is of type 0x30 (compound).
	if (sig[0] != 0x30) return {error: 'No DER format (SEQUENCE)'};

	// Make sure the length covers the entire signature.
	// Accetta firma standard senza sighash
	let ret = {};
    if (sig[1] != sig.length - 2) {
		if (sig[1] != sig.length - 3)
			ret.error = 'No DER format (LENGTH)';
		if (sig[1] > sig.length - 2)
			return ret;
		ret.sigHash = sig[sig.length - 1];
		sig = sig.slice(0, sig[1] + 2);
	}

    // Extract the length of the R element.
	let lenR = sig[3];

    // Make sure the length of the S element is still inside the signature.
	if (lenR & 0x80 || 5 + lenR >= sig.length) return {error: 'No DER format (R LENGTH)'};

	let r = sig.slice(4, 4 + lenR);

    // Extract the length of the S element.
	let lenS = sig[5 + lenR];

    // Verify that the length of the signature matches the sum of the length
    // of the elements.
    if (lenS & 0x80 || (lenR + lenS + 6) != sig.length) return {error: 'No DER format (R S LENGTH)'};

	let s = sig.slice(6 + lenR);

    // Check whether the R element is an integer.
    // Zero-length integers are not allowed for R.
	if (sig[2] != 0x02 || lenR == 0) return {error: 'No DER format (R FORMAT)'};

    // Check whether the S element is an integer.
    // Zero-length integers are not allowed for S.
	if (sig[lenR + 4] != 0x02 || lenS == 0) return {error: 'No DER format (S FORMAT)'};

	// Negative numbers are not allowed for R.
   	if (sig[4] & 0x80) ret.error = 'No DER format (R negative FORMAT)';

    // Null bytes at the start of R are not allowed, unless R would
    // otherwise be interpreted as a negative number.
    else if (lenR > 1 && sig[4] == 0x00 && !(sig[5] & 0x80)) ret.error = 'No DER format (R leading zero FORMAT)';

    // Negative numbers are not allowed for S.
	if (sig[lenR + 6] & 0x80) ret.error = 'No DER format (S negative FORMAT)';

    // Null bytes at the start of S are not allowed, unless S would otherwise be
    // interpreted as a negative number.
	else if (lenS > 1 && sig[lenR + 6] == 0x00 && !(sig[lenR + 7] & 0x80)) ret.error = 'No DER format (S leading zero FORMAT)';

	ret.r = Buffer.from(r);
	ret.s = Buffer.from(s);
    return ret;
};
function _IsValidSignatureEncoding(sig) {
	let rs = IsValidSignatureEncoding(sig);
	if ('error' in rs) return false;
	if (!('sigHash' in rs)) return false;

    return true;
};

function CheckLowS(rs) {
	let s = rs.s;
	if (s.length < 32)
		return false;
	//console.log('S:', s.toString('hex'));
	if (s.length > 32) {
		let z = s.slice(0, s.length - 32);
		for (let v of z) {
			if (v != 0) {
				rs.error = 'S too long';
				return true;
			}
		}
		s = s.slice(-32);
		//console.log('S:', s.toString('hex'));
	}
	for (let i=0; i<32; i++) {
		//console.log('CMP:', s[i].toString(16), SECP256K1_N_H[i].toString(16));
		if (s[i] < SECP256K1_N_H[i])
			return false;
		if (s[i] > SECP256K1_N_H[i])
			break;
	} // inclusivo
	let carry = 1;
	for (let i=31; i>=0; i--) {
		//console.log('NEG IN:', s[i].toString(16), SECP256K1_N[i].toString(16), (~s[i] & 0xFF).toString(16));
		carry += (~s[i] & 0xFF) + SECP256K1_N[i];
		s[i] = carry & 0xFF;
		carry >>>= 8;
		//console.log('NEG OUT:', s[i].toString(16), carry.toString(16));
	}
	carry = 0;
	while (s[carry] == 0 && (s[carry + 1] & 0x80) == 0)
		carry++;
	if (carry)
		s = s.slice(carry);
	//console.log('TST:', s.toString('hex'));
	//console.log('TST:', rs);
	rs.s = s;
	let bs = new BufferStream();
	bs.writeUInt8(0x30);
	bs.writeUInt8(4 + rs.r.length + s.length);
	bs.writeUInt8(2);
	bs.writeUInt8(rs.r.length);
	bs.writeBuffer(rs.r);
	bs.writeUInt8(2);
	bs.writeUInt8(s.length);
	bs.writeBuffer(s);
	rs.signature = bs.getData();
	//console.log('TST:', rs);
	return true;
};

/** This function is taken from the libsecp256k1 distribution and implements
 *  DER parsing for ECDSA signatures, while supporting an arbitrary subset of
 *  format violations.
 *
 *  Supported violations include negative integers, excessive padding, garbage
 *  at the end, and overly long length descriptors. This is safe to use in
 *  Bitcoin because since the activation of BIP66, signatures are verified to be
 *  strict DER before being passed to this module, and we know it supports all
 *  violations present in the blockchain before that point.
 */
function ecdsa_signature_parse_der_lax(sig, input) {
    let rpos, rlen, spos, slen;
    let pos = 0;
    let lenbyte;
    let overflow = false;

    /* Hack to initialize sig with a correctly-parsed but invalid signature. */
    sig.r = Buffer.alloc(32);
    sig.s = Buffer.alloc(32);

    /* Sequence tag byte */
    if (pos == input.length || input[pos] != 0x30) {
        return false;
    }
    pos++;

    /* Sequence length bytes */
    if (pos == input.length) {
        return false;
    }
    lenbyte = input[pos++];
    if (lenbyte & 0x80) {
        lenbyte -= 0x80;
        if (lenbyte > input.length - pos) {
            return false;
        }
        pos += lenbyte;
    }

    /* Integer tag byte for R */
    if (pos == input.length || input[pos] != 0x02) {
        return false;
    }
    pos++;

    /* Integer length for R */
    if (pos == input.length) {
        return false;
    }
    lenbyte = input[pos++];
    if (lenbyte & 0x80) {
        lenbyte -= 0x80;
        if (lenbyte > inputlen - pos) {
            return false;
        }
        while (lenbyte > 0 && input[pos] == 0) {
            pos++;
            lenbyte--;
        }
        if (lenbyte >= 4) {
            return false;
        }
        rlen = 0;
        while (lenbyte > 0) {
            rlen = (rlen << 8) + input[pos];
            pos++;
            lenbyte--;
        }
    } else {
        rlen = lenbyte;
    }
    if (rlen > input.length - pos) {
        return false;
    }
    rpos = pos;
    pos += rlen;

    /* Integer tag byte for S */
    if (pos == input.length || input[pos] != 0x02) {
        return false;
    }
    pos++;

    /* Integer length for S */
    if (pos == input.length) {
        return false;
    }
    lenbyte = input[pos++];
    if (lenbyte & 0x80) {
        lenbyte -= 0x80;
        if (lenbyte > input.length - pos) {
            return false;
        }
        while (lenbyte > 0 && input[pos] == 0) {
            pos++;
            lenbyte--;
        }
        if (lenbyte >= 4) {
            return false;
        }
        slen = 0;
        while (lenbyte > 0) {
            slen = (slen << 8) + input[pos];
            pos++;
            lenbyte--;
        }
    } else {
        slen = lenbyte;
    }
    if (slen > input.length - pos) {
        return false;
    }
    spos = pos;

    /* Ignore leading zeroes in R */
    while (rlen > 0 && input[rpos] == 0) {
        rlen--;
        rpos++;
    }
    /* Copy R value */
    if (rlen > 32) {
        overflow = true;
    } else {
		input.copy(sig.r, 32 - rlen, rpos, rpos + rlen);

		let over = true;
		for (let i=0; i<32; i++) {
			if (sig.r[i] == SECP256K1_N[i])
				continue;
			if (sig.r[i] < SECP256K1_N[i])
				over = false;
			break;
		} // inclusivo
		if (over)
			overflow = true;
	}

    /* Ignore leading zeroes in S */
    while (slen > 0 && input[spos] == 0) {
        slen--;
        spos++;
    }
    /* Copy S value */
    if (slen > 32) {
        overflow = true;
    } else if (!overflow) {
		input.copy(sig.s, 32 - slen, spos, spos + slen);

		let over = true;
		for (let i=0; i<32; i++) {
			if (sig.s[i] == SECP256K1_N[i])
				continue;
			if (sig.s[i] < SECP256K1_N[i])
				over = false;
			break;
		} // inclusivo
		if (over)
			overflow = true;
	}

    if (overflow) {
        /* Overwrite the result again with a correctly-parsed but invalid
           signature if parsing failed. */
		sig.r =Buffer.alloc(32);
		sig.s =Buffer.alloc(32);
	}
    return true;
};

function secp256k1_ecdsa_signature_normalize(sigout, sigin) {
    let ret = true;

	for (let i=0; i<32; i++) {
		if (sigin.s[i] == SECP256K1_N_H[i])
			continue;
		if (sigin.s[i] < SECP256K1_N_H[i])
			ret = false;
		break;
	} // inclusivo
    if (sigout) {
		sigout.r = Buffer.from(sigin.r);
		sigout.s = Buffer.from(sigin.s);
        if (ret) {
			let carry = 1;
			for (let i=31; i>=0; i--) {
				carry += (~sigout.s[i] & 0xFF) + SECP256K1_N[i];
				sigout.s[i] = carry & 0xFF;
				carry >>>= 8;
			}
			carry = 0;
			while (sigout.s[carry] == 0 && (sigout.s[carry + 1] & 0x80) == 0)
				carry++;
			if (carry)
				sigout.s = sigout.s.slice(carry);
		}
    }

    return ret;
};

function _CheckLowS(vchSig) {
    let sig = {};
    if (!ecdsa_signature_parse_der_lax(sig, vchSig)) {
        return false;
    }
    return !secp256k1_ecdsa_signature_normalize(null, sig);
};

function IsLowDERSignature(vchSig, serror) {
    if (!_IsValidSignatureEncoding(vchSig)) {
        return set_error(serror, 'SCRIPT_ERR_SIG_DER');
    }
    // https://bitcoin.stackexchange.com/a/12556:
    //     Also note that inside transaction signatures, an extra hashtype byte
    //     follows the actual signature data.
    let vchSigCopy = vchSig.slice(0, -1);
    // If the S value is above the order of the curve divided by two, its
    // complement modulo the order could have been used instead, which is
    // one byte shorter when encoded correctly.
    if (!_CheckLowS(vchSigCopy)) {
        return set_error(serror, 'SCRIPT_ERR_SIG_HIGH_S');
    }
    return true;
};

function IsDefinedHashtypeSignature(vchSig) {
    if (vchSig.length == 0) {
        return false;
    }
    let nHashType = vchSig[vchSig.length - 1] & (~(SIGHASH_ANYONECANPAY));
    if (nHashType < SIGHASH_ALL || nHashType > SIGHASH_SINGLE)
        return false;

    return true;
};

function ValidSignatureTest(s, flags) {
	if (!s || s.length == 0)
		return {signature: s};
	let rsInfo = IsValidSignatureEncoding(s);
	rsInfo.signature = s;
	if ((flags & (Script.verifyFlags.SCRIPT_VERIFY_DERSIG | Script.verifyFlags.SCRIPT_VERIFY_LOW_S | Script.verifyFlags.SCRIPT_VERIFY_STRICTENC))) {
		if ('error' in rsInfo)
			return rsInfo;
		if ((flags & Script.verifyFlags.SCRIPT_VERIFY_LOW_S) != 0) {
			if (CheckLowS(rsInfo)) {
				if ('error' in rsInfo) {
					rsInfo.error = 'Invalid signature: ' + rsInfo.error;
					return rsInfo;
				}
				if ('sigHash' in rsInfo)
					rsInfo.signature = Buffer.concat([rsInfo.signature, rsInfo.sigHash]);
			}
		}
	} else if (rsInfo.error && 'r' in rsInfo && 's' in rsInfo) {
		delete rsInfo.error;
		if (rsInfo.r[0] & 0x80)
			rsInfo.r = Buffer.concat([Buffer.from([0]), rsInfo.r]);
		else {
			let carry = 0;
			while (rsInfo.r.length > 1 && rsInfo.r[carry] == 0 && (rsInfo.r[carry + 1] & 0x80) == 0)
				carry++;
			if (carry)
				rsInfo.r = rsInfo.r.slice(carry);
		}
		if (rsInfo.s[0] & 0x80)
			rsInfo.s = Buffer.concat([Buffer.from([0]), rsInfo.s]);
		else {
			let carry = 0;
			while (rsInfo.s.length > 1 && rsInfo.s[carry] == 0 && (rsInfo.s[carry + 1] & 0x80) == 0)
				carry++;
			if (carry)
				rsInfo.s = rsInfo.s.slice(carry);
		}
		let bs = new BufferStream();
		bs.writeUInt8(0x30);
		bs.writeUInt8(4 + rsInfo.r.length + rsInfo.s.length);
		bs.writeUInt8(2);
		bs.writeUInt8(rsInfo.r.length);
		bs.writeBuffer(rsInfo.r);
		bs.writeUInt8(2);
		bs.writeUInt8(rsInfo.s.length);
		bs.writeBuffer(rsInfo.s);
		if ('sigHash' in rsInfo)
			bs.writeUInt8(rsInfo.sigHash);
		rsInfo.signature = bs.getData();
	}
	return rsInfo;
};

function CheckPubKeyEncoding(vchPubKey, flags, sigversion) {
	if (flags & Script.verifyFlags.SCRIPT_VERIFY_STRICTENC) {
		if (vchPubKey.length < 33	//  Non-canonical public key: too short
		|| (vchPubKey[0] == 0x04 && vchPubKey.length != 65)	//  Non-canonical public key: invalid length for uncompressed key
		|| ((vchPubKey[0] == 0x02 || vchPubKey[0] == 0x03) && vchPubKey.length != 33)	//  Non-canonical public key: invalid length for compressed key
		|| (vchPubKey[0] != 0x04 && vchPubKey[0] != 0x03 && vchPubKey[0] != 0x02)) {	//  Non-canonical public key: neither compressed nor uncompressed
			return set_error(serror, 'SCRIPT_ERR_PUBKEYTYPE');
		}
	}
    // Only compressed keys are accepted in segwit
    if ((flags & Script.verifyFlags.SCRIPT_VERIFY_WITNESS_PUBKEYTYPE) != 0 && sigversion == SIGVERSION_WITNESS_V0) {
		if (vchPubKey.length != 33	//  Non-canonical public key: invalid length for compressed key
		|| (vchPubKey[0] != 0x02 && vchPubKey[0] != 0x03)) {	//  Non-canonical public key: invalid prefix for compressed key
			return set_error(serror, 'SCRIPT_ERR_WITNESS_PUBKEYTYPE');
		}
    }
    return true;
};


const derHeader = Buffer.from('3000', 'hex');
const skPrefix = Buffer.from('0201010420', 'hex');
const skCurve = Buffer.from('a00706052b8104000a', 'hex');
const skPubPrefix = Buffer.from('a144034200', 'hex');
const pkCurve = Buffer.from('301006072a8648ce3d020106052b8104000a', 'hex');
const pkPrefix = Buffer.from('034200', 'hex');

function sk2Der(privateKey, publicKey) {
	let skPub = skPubPrefix;
	if (publicKey[0] == 2 || publicKey[0] == 3) {
		//console.log('Chiave pubblica compressa');
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
	pemSk += '-----END EC PRIVATE KEY-----';
//console.log(pemSk);
	return pemSk;
};
function pk2Der(publicKey) {
	let pkPub = pkPrefix;
	if (publicKey[0] == 2 || publicKey[0] == 3) {
		//console.log('Chiave pubblica compressa');
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
	pemPk += '-----END PUBLIC KEY-----';
//console.log(pemPk);
	return pemPk;
};
function EcCrypto(pem, pk) {
	if (!(this instanceof EcCrypto))
		return new EcCrypto(pem, pk);

	this.ecdh = crypto.createECDH('secp256k1');
	this.pKeys = [];
	if (pem) {
		if (typeof pem === 'object' && 'sk' in pem) {
			if (typeof pem.sk === 'string')
				pem.sk = Buffer.from(pem.sk, 'hex');
			if (!Buffer.isBuffer(pem.sk))
				throw 'Invalid secret key, object.sk must be string or Buffer';
			this.secretKey = pem.sk;
			this.ecdh.setPrivateKey(this.secretKey);
			this.publicKey = this.ecdh.getPublicKey(null, 'compressed');
			this.pKeys.push(this.publicKey);
		} else {
			if (Buffer.isBuffer(pem))
				pem = pem.toString('binary');
			if (typeof pem !== 'string')
				throw 'Invalid PEM, must be string or Buffer';
			this.skPem = pem;
			const aSk = pem.split('\n');
			aSk.shift();
			aSk.pop();
			// trimmare
			let bSk = Buffer.from(aSk.join(''), 'base64');
			//console.log(bSk.toString('hex'));
			if (bSk[0] != derHeader[0] || bSk[1] != bSk.length - 2 || bSk.length < (derHeader.length + skPrefix.length + 32 + skCurve.length))
				throw 'Invalid PEM key';
			bSk = bSk.slice(2);
			if (!skPrefix.equals(bSk.slice(0, 5)))
				throw 'Invalid PEM version';
			this.secretKey = Buffer.from(bSk.slice(5, 5 + 32));
			if (!skCurve.equals(bSk.slice(5 + 32, 5 + 32 + skCurve.length)))
				throw 'Invalid PEM EC secp256k1';
			//console.log('SK', this.secretKey.toString('hex'));
			bSk = bSk.slice(5 + 32 + skCurve.length);
			if (bSk[0] != skPubPrefix[0] || bSk[1] != bSk.length - 2 || bSk[2] != skPubPrefix[2] || bSk[3] != bSk.length - 4 || bSk[4] != skPubPrefix[4])
				throw 'Invalid PEM pubkey';
			this.publicKey = Buffer.from(bSk.slice(5));
			this.pKeys.push(this.publicKey);
			//console.log('Current PK', this.publicKey.toString('hex'));

			this.ecdh.setPrivateKey(this.secretKey);
		}
	} else {
		this.publicKey = this.ecdh.generateKeys(null, 'compressed');
		this.pKeys.push(this.publicKey);
		this.secretKey = this.ecdh.getPrivateKey();
	}
	if (this.ecdh.verifyError !== undefined) {
		console.log('ecdh error', this.ecdh.verifyError);
		throw 'Error EC secp256k1 ' + this.ecdh.verifyError;
	}
	//console.log(this.ecdh.getPrivateKey('hex'));

	if (!pk) {
		this.publicKey = this.ecdh.getPublicKey(null, 'compressed');
		this.pKeys.push(this.publicKey);
	} else if (pk !== true) {
		this.publicKey = pk;
		this.pKeys.push(this.publicKey);
	}
	if (!this.skPem)
		this.skPem = sk2Der(this.secretKey, this.publicKey);

//console.log('Current PK', this.publicKey.toString('hex'));
};
EcCrypto.prototype.generatePk = function(format) {
	this.publicKey = this.ecdh.getPublicKey(null, 'compressed');
	this.pKeys.push(this.publicKey);
	return this.publicKey;
};
// Le firme di Bitcoin sono ottenute da doppio Sha256 e firma semplice con restrizioni sul DER
// Quindi gli oggetti hash da firmare in Bitcoin sono Double Sha256
// La firma NodeJs richiede una funzione di HASH
// Quindi qui gli oggetti hash devono essere Simple Sha256
// Il secondo Sha lo fa la firma
EcCrypto.prototype.signSha256 = function(hash) {
	const sign = crypto.createSign('sha256');
	sign.update(hash);
	let signature = sign.sign(this.skPem);
	// BIP-62 Low S DER
	let rsInfo = IsValidSignatureEncoding(signature);
	if ('error' in rsInfo)
		throw 'Invalid signature: ' + rsInfo.error;
	if (CheckLowS(rsInfo)) {
		if ('error' in rsInfo)
			throw 'Invalid signature: ' + rsInfo.error;
//console.log('High S DER converted ----------------------------------------');
		signature = rsInfo.signature;
	}
	return signature;
};
EcCrypto.prototype.checkPk2Sk = function(publicKey, privateKey) {
	const sign = crypto.createSign('sha256');
	const dummy = crypto.randomBytes(256);
	sign.update(dummy);

	let pemSk = this.skPem;
	if (typeof privateKey !== 'undefined') {
		pemSk = sk2Der(privateKey, publicKey);
	}
	const signature = sign.sign(pemSk);
	//console.log('SIGN', signature.toString('hex'));

	const verify = crypto.createVerify('sha256');
	verify.update(dummy);

	let pemPk = pk2Der(publicKey);
	let res = verify.verify(pemPk, signature);
//console.log(res);
	return res;
};

nkLib.EcCrypto = EcCrypto;


function FindAndDelete(script, sign)
{
	let nFound = 0;
	if (sign.length == 0)
		return nFound;
	let result = new BufferStream();
	let op = {};
	while (script.getOp(op)) {
		if (op.pvch.length == sign.length && op.pvch.equals(sign)) {
			nFound++;
			continue;
		}
		result.writeUInt8(op.opcode);
		if (op.pvch)
			result.writeBuffer(op.pvch);
	}

	if (nFound > 0) {
		script.script = result.getData();
	}

	return nFound;
}

function candidateScript(script) {
	let op = {};
	while (script.getOp(op)) {
		if (op.opcode == opcodetype.OP_CHECKSIG || op.opcode == opcodetype.OP_CHECKSIGVERIFY
			|| op.opcode == opcodetype.OP_CHECKMULTISIG || op.opcode == opcodetype.OP_CHECKMULTISIGVERIFY)
			break;
		if (op.opcode == opcodetype.OP_CODESEPARATOR)
			op.data.setHashMark();
	}
	op.data.setExcludeMark();
	while (script.getOp(op)) {
		if (op.opcode == opcodetype.OP_CODESEPARATOR)
			op.data.setExclude();
		else
			op.data.setExcludeAbort();
		op.data.setExcludeMark();
	}
	op.data.setExcludeAbort();
	return new Script().fromBuffer(op.data.getExcluded());
};

function SerializeScriptCode(s, script) {
	let op = {data: new BufferStream(script.script)};
	op.data.setExcludeMark();
	while (script.getOp(op)) {
		if (op.opcode == opcodetype.OP_CODESEPARATOR)
			op.data.setExclude();
		op.data.setExcludeMark();
	}
	s.writeBufferSized(op.data.getExcluded());
};

function GetPrevoutHash(txTo) {
    let ss = new BufferStream();
    txTo.vin.forEach(function(txin) {
		ss.writeBuffer(txin.prevout.toBuffer());
	});
    return ss.getHash();
};
function GetSequenceHash(txTo) {
    let ss = new BufferStream();
    txTo.vin.forEach(function(txin) {
		ss.writeUInt32LE(txin.nSequence);
    });
    return ss.getHash();
};
function GetOutputsHash(txTo) {
    let ss = new BufferStream();
    txTo.vout.forEach(function(txout) {
		ss.writeBuffer(txout.toBuffer());
    });
//console.log('hashOutputs 1', ss.getData().toString('hex'));
    return ss.getHash();
};
function PrecomputedTransactionData(txTo) {
	if (!(this instanceof PrecomputedTransactionData))
		return new PrecomputedTransactionData(txTo);

	this.ready = false;
    // Cache is calculated only for transactions with witness
    if (txTo.hasWitness) {
        this.hashPrevouts = GetPrevoutHash(txTo);
        this.hashSequence = GetSequenceHash(txTo);
        this.hashOutputs = GetOutputsHash(txTo);
        this.ready = true;
    }
};

const SIGVERSION_BASE = 0,
    SIGVERSION_WITNESS_V0 = 1;
const SIGHASH_ALL = 1,
    SIGHASH_NONE = 2,
    SIGHASH_SINGLE = 3,
    SIGHASH_ANYONECANPAY = 0x80;
nkLib.SIGHASH_ALL = SIGHASH_ALL;
nkLib.SIGHASH_NONE = SIGHASH_NONE;
nkLib.SIGHASH_SINGLE = SIGHASH_SINGLE;
nkLib.SIGHASH_ANYONECANPAY = SIGHASH_ANYONECANPAY;

function SignatureHash(scriptCode, txTo, nIn, nHashType, amount, sigversion, cache) {
//console.log('SignatureHash', arguments);
	if (nIn >= txTo.vin.length)
		throw 'Invalid nIn';

	if (sigversion == SIGVERSION_WITNESS_V0) {
		let hashPrevouts = Buffer.alloc(32), hashSequence = Buffer.alloc(32), hashOutputs = Buffer.alloc(32);
		let cacheready = cache instanceof PrecomputedTransactionData && cache.ready;

		if (!(nHashType & SIGHASH_ANYONECANPAY)) {
			hashPrevouts = cacheready ? cache.hashPrevouts : GetPrevoutHash(txTo);
		}
//console.log('hashPrevouts', hashPrevouts.toString('hex'));

		if (!(nHashType & SIGHASH_ANYONECANPAY) && (nHashType & 0x1f) != SIGHASH_SINGLE && (nHashType & 0x1f) != SIGHASH_NONE) {
			hashSequence = cacheready ? cache.hashSequence : GetSequenceHash(txTo);
		}
//console.log('hashSequence', hashSequence.toString('hex'));

		if ((nHashType & 0x1f) != SIGHASH_SINGLE && (nHashType & 0x1f) != SIGHASH_NONE) {
			hashOutputs = cacheready ? cache.hashOutputs : GetOutputsHash(txTo);
		} else if ((nHashType & 0x1f) == SIGHASH_SINGLE && nIn < txTo.vout.length) {
			let ss = new BufferStream();
			ss.writeBuffer(txTo.vout[nIn].toBuffer());
			hashOutputs = ss.getHash();
		}
//console.log('hashOutputs', hashOutputs.toString('hex'));

		let ss = new BufferStream();
		// Version
//console.log('SignatureHash: nVersion', txTo.nVersion.toString(16));
		ss.writeInt32LE(txTo.nVersion);
		// Input prevouts/nSequence (none/all, depending on flags)
//console.log('SignatureHash: hashPrevouts', Buffer.from(hashPrevouts).reverse().toString('hex'));
		ss.writeBuffer(hashPrevouts);
//console.log('SignatureHash: hashSequence', Buffer.from(hashSequence).reverse().toString('hex'));
		ss.writeBuffer(hashSequence);
        // The input being signed (replacing the scriptSig with scriptCode + amount)
        // The prevout may already be contained in hashPrevout, and the nSequence
        // may already be contain in hashSequence.
//console.log('SignatureHash: prevout.hash', nIn, Buffer.from(txTo.vin[nIn].prevout.hash).reverse().toString('hex'), txTo.vin[nIn].prevout.n);
    	ss.writeBuffer(txTo.vin[nIn].prevout.toBuffer());
//console.log('SignatureHash: scriptCode', scriptCode.script.toString('hex'));
		ss.writeBufferSized(scriptCode.script);
		// if AssetAmount
		if (typeof amount === 'object') {
//console.log('AssetAmount', amount);
			ss.writeBufferSized(amount.name, 'utf8');
			ss.writeInt64LE(amount.nValue);
		} else
			ss.writeInt64LE(amount);
//console.log('SignatureHash: nSequence', txTo.vin[nIn].nSequence.toString(16));
		ss.writeUInt32LE(txTo.vin[nIn].nSequence);
		// Outputs (none/one/all, depending on flags)
//console.log('SignatureHash: hashOutputs', Buffer.from(hashOutputs).reverse().toString('hex'));
		ss.writeBuffer(hashOutputs);
		// Locktime
//console.log('SignatureHash: nLockTime', txTo.nLockTime.toString(16));
		ss.writeUInt32LE(txTo.nLockTime);
		// Sighash type
//console.log('SignatureHash: nHashType', nHashType.toString(16));
		ss.writeUInt32LE(nHashType);

//console.log('PREIMAGE', ss.getData().toString('hex'));
//console.log('sigHash', ss.getHash().reverse().toString('hex'));
		return ss.getHashForSign();
    }

    //var one = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex').reverse();

    // Check for invalid use of SIGHASH_SINGLE
    if ((nHashType & 0x1f) == SIGHASH_SINGLE) {
        if (nIn >= txTo.vout.length) {
            //  nOut out of range
            //return one;
            return 1;
        }
    }

    // // Wrapper to serialize only the necessary parts of the transaction being signed
    // CTransactionSignatureSerializer txTmp(txTo, scriptCode, nIn, nHashType);

	let ss = new BufferStream();
	// Version
//console.log('SignatureHash: nVersion', txTo.nVersion.toString(16));
	ss.writeInt32LE(txTo.nVersion);

	// Serialize vin
	if (nHashType & SIGHASH_ANYONECANPAY) {
		let vin = txTo.vin[nIn];
		ss.writeUInt8(1);
		// In case of SIGHASH_ANYONECANPAY, only the input being signed is serialized
		// Serialize the prevout
		ss.writeBuffer(vin.prevout.toBuffer());
		// Serialize the script
		SerializeScriptCode(ss, scriptCode);
		// Serialize the nSequence
		ss.writeUInt32LE(vin.nSequence);
	} else {
		ss.writeBuffer(WriteCompactSize(txTo.vin.length));
		txTo.vin.forEach(function(vin, idx) {
			// Serialize the prevout
			ss.writeBuffer(vin.prevout.toBuffer());
			// Serialize the script
			if (idx != nIn)
				// Blank out other inputs' signatures
				ss.writeUInt8(0);
			else
				SerializeScriptCode(ss, scriptCode);
			// Serialize the nSequence
			if (idx != nIn && ((nHashType & 0x1f) == SIGHASH_SINGLE || (nHashType & 0x1f) == SIGHASH_NONE))
				// let the others update at will
				ss.writeUInt32LE(0);
			else
				ss.writeUInt32LE(vin.nSequence);
		});
	}
	// Serialize vout
	if ((nHashType & 0x1f) == SIGHASH_NONE)
		ss.writeUInt8(0);
	else {
		let nOutputs = (nHashType & 0x1f) == SIGHASH_SINGLE ? nIn + 1 : txTo.vout.length;
		ss.writeBuffer(WriteCompactSize(nOutputs));
        for (let nOutput = 0; nOutput < nOutputs; nOutput++) {
			if ((nHashType & 0x1f) == SIGHASH_SINGLE && nOutput != nIn)
				// Do not lock-in the txout payee at other indices as txin
				ss.writeBuffer(new TxOut(null, txTo.vout[nOutput].compatibilty).toBuffer());
			else
				ss.writeBuffer(txTo.vout[nOutput].toBuffer());
		}
	}
	// Serialize nLockTime
//console.log('SignatureHash: nLockTime', txTo.nLockTime.toString(16));
	ss.writeUInt32LE(txTo.nLockTime);

	ss.writeInt32LE(nHashType);

	// console.log('PREIMAGE', ss.getData().toString('hex'));
	// console.log('sigHash', ss.getHash().reverse().toString('hex'));

    // Serialize and hash
	return ss.getHashForSign();
};
nkLib.SignatureHash = SignatureHash;

function Sign1(address, creator, scriptCode, ret, sigversion) {
	let vchSig = [];
	if (!creator.CreateSig(vchSig, address, scriptCode, sigversion))
		return false;
	ret.push(vchSig);
	return true;
};
function SignN(multisigdata, creator, scriptCode, ret, sigversion) {
	multisigdata = multisigdata.slice();
	multisigdata.pop();
	let nRequired = multisigdata.shift()[0];
	return multisigdata.some(function(pubkey) {
		let keyID = Hash160(pubkey);
		if (Sign1(keyID, creator, scriptCode, ret, sigversion))
			nRequired--;
		if (nRequired)
			return false;
		return true;
	});
};
function SignStep(creator, scriptPubKey, info, sigversion) {
//    CScript scriptRet;
    info.sign = [];
    if (!scriptPubKey.Solver(info))
        return false;
//console.log('SignStep Solver', info);

	let keyID;
    switch (info.type) {
    case Script.txnouttype.TX_NONSTANDARD:
    case Script.txnouttype.TX_NULL_DATA:
    case Script.txnouttype.TX_WITNESS_UNKNOWN:
        return false;
    case Script.txnouttype.TX_PUBKEY:
        keyID = Hash160(info.solutions[0]);
        return Sign1(keyID, creator, scriptPubKey, info.sign, sigversion);
    case Script.txnouttype.TX_PUBKEYHASH:
        keyID = info.solutions[0];
        if (!Sign1(keyID, creator, scriptPubKey, info.sign, sigversion))
            return false;
        else {
            //CPubKey vch;
            creator.KeyStore().GetPubKey(keyID, vch);
            info.sign.push_back(ToByteVector(vch));
        }
        return true;
    case Script.txnouttype.TX_SCRIPTHASH:
        //if (creator.KeyStore().GetCScript(uint160(vSolutions[0]), scriptRet)) {
        if (creator.reedemScript) {
            info.sign.push(reedemScript);
            return true;
        }
        return false;

    case Script.txnouttype.TX_MULTISIG:
        info.sign.push(Buffer.alloc(0)); // workaround CHECKMULTISIG bug
        return (SignN(info.solutions, creator, scriptPubKey, info.sign, sigversion));

    case Script.txnouttype.TX_WITNESS_V0_KEYHASH:
        info.sign.push(info.solutions[0]);
        return true;

    case Script.txnouttype.TX_WITNESS_V0_SCRIPTHASH:
		//let h160 = crypto.createHash('ripemd160').update(info.solutions[0]).digest();
        //if (creator.KeyStore().GetCScript(h160, scriptRet)) {
        if (creator.reedemScript) {
            info.sign.push(reedemScript);
            return true;
        }
        return false;

    default:
        return false;
    }
};

function PushAll(values) {
	let bs = new BufferStream();
    values.forEach(function(v) {
        if (v.length == 0) {
			bs.writeUInt8(opcodetype.OP_0);
        } else if (v.length == 1 && v[0] >= 1 && v[0] <= 16) {
			bs.writeUInt8(v[0] + (opcodetype.OP_1 - 1));
        } else {
			bs.writeScriptVector(v);
        }
    });
    return bs.getData();
};

function TransactionSignatureChecker(txTo, nIn, amount, txdata) {
	if (!(this instanceof TransactionSignatureChecker))
		return new TransactionSignatureChecker(txTo, nIn, amount, txdata);

	this.txTo = txTo;
    this.nIn = nIn;
    this.amount = amount;
    this.txdata = txdata;
};
TransactionSignatureChecker.prototype.CheckSig = function(vchSig, vchPubKey, scriptCode, sigversion) {
    // CPubKey pubkey(vchPubKey);
    // if (!pubkey.IsValid())
    //     return false;
    if (!vchPubKey)
		return false;
	if (!(vchPubKey[0] == 2 || vchPubKey[0] == 3 || vchPubKey[0] == 4 || vchPubKey[0] == 6 || vchPubKey[0] == 7))
		return false;

    // Hash type is one byte tacked on to the end of the signature
    if (!vchSig || vchSig.length == 0)
        return false;
	// OpenSSL no more accept no stictly DER format
	vchSig = ValidSignatureTest(vchSig, 0).signature;

    let nHashType = vchSig[vchSig.length - 1];
    vchSig = vchSig.slice(0, -1);

    let sigHash = SignatureHash(scriptCode, this.txTo, this.nIn, nHashType, this.amount, sigversion, this.txdata);
	//console.log('signature', vchSig.toString('hex'));
	//console.log('sigHash', sigHash.toString('hex'));
	if (sigHash === 1) {
		let one = Buffer.from('0100000000000000000000000000000000000000000000000000000000000000', 'hex');
		let key = ec.keyFromPublic(vchPubKey);
		return key.verify(one, vchSig);	 
	}
	let verify = crypto.createVerify('sha256');
	verify.update(sigHash);
	let pemPk = pk2Der(vchPubKey);
	//console.log(pemPk);
	if (!verify.verify(pemPk, vchSig))
        return false;

	return true;
};
TransactionSignatureChecker.prototype.CheckLockTime = function(nLockTime) {
	// There are two kinds of nLockTime: lock-by-blockheight
	// and lock-by-blocktime, distinguished by whether
	// nLockTime < LOCKTIME_THRESHOLD.
	//
	// We want to compare apples to apples, so fail the script
	// unless the type of nLockTime being tested is the same as
	// the nLockTime in the transaction.
	if (!(
		(this.txTo.nLockTime <  LOCKTIME_THRESHOLD && nLockTime <  LOCKTIME_THRESHOLD) ||
		(this.txTo.nLockTime >= LOCKTIME_THRESHOLD && nLockTime >= LOCKTIME_THRESHOLD)
	))
		return false;

	// Now that we know we're comparing apples-to-apples, the
	// comparison is a simple numeric one.
	if (nLockTime > this.txTo.nLockTime)
		return false;

	// Finally the nLockTime feature can be disabled and thus
	// CHECKLOCKTIMEVERIFY bypassed if every txin has been
	// finalized by setting nSequence to maxint. The
	// transaction would be allowed into the blockchain, making
	// the opcode ineffective.
	//
	// Testing if this vin is not final is sufficient to
	// prevent this condition. Alternatively we could test all
	// inputs, but testing just this input minimizes the data
	// required to prove correct CHECKLOCKTIMEVERIFY execution.
	if (TxIn.SEQUENCE_FINAL == this.txTo.vin[this.nIn].nSequence)
		return false;

	return true;
};
TransactionSignatureChecker.prototype.CheckSequence = function(nSequence) {
	// Relative lock times are supported by comparing the passed
	// in operand to the sequence number of the input.
	let txToSequence = this.txTo.vin[this.nIn].nSequence;

	// Fail if the transaction's version number is not set high
	// enough to trigger BIP 68 rules.
	if (this.txTo.nVersion < 2)
		return false;

	// Sequence numbers with their most significant bit set are not
	// consensus constrained. Testing that the transaction's sequence
	// number do not have this bit set prevents using this property
	// to get around a CHECKSEQUENCEVERIFY check.
	if (txToSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG)
		return false;

	// Mask off any bits that do not have consensus-enforced meaning
	// before doing the integer comparisons
	let nLockTimeMask = TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG | TxIn.SEQUENCE_LOCKTIME_MASK;
	let txToSequenceMasked = txToSequence & nLockTimeMask;
	let nSequenceMasked = nSequence & nLockTimeMask;

	// There are two kinds of nSequence: lock-by-blockheight
	// and lock-by-blocktime, distinguished by whether
	// nSequenceMasked < TxIn::SEQUENCE_LOCKTIME_TYPE_FLAG.
	//
	// We want to compare apples to apples, so fail the script
	// unless the type of nSequenceMasked being tested is the same as
	// the nSequenceMasked in the transaction.
	if (!(
		(txToSequenceMasked <  TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked <  TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG) ||
		(txToSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG)
	)) {
		return false;
	}

	// Now that we know we're comparing apples-to-apples, the
	// comparison is a simple numeric one.
	if (nSequenceMasked > txToSequenceMasked)
		return false;

	return true;
};


function ProduceSignature(creator, fromPubKey, sigdata) {
    let script = new Script(fromPubKey);
console.log('ProduceSignature', script);
    let info = {};
    let solved = SignStep(creator, script, info, SIGVERSION_BASE);
console.log('ProduceSignature', info);
    let P2SH = false;
    let subscript;
    sigdata.scriptWitness = [];

    if (solved && info.type == Script.txnouttype.TX_SCRIPTHASH) {
        // Solver returns the subscript that needs to be evaluated;
        // the final scriptSig is the signatures from that
        // and then the serialized subscript:
        script = subscript = new Script(info.solutions[0]);
        solved = solved && SignStep(creator, script, info, SIGVERSION_BASE) && info.type != Script.txnouttype.TX_SCRIPTHASH;
        P2SH = true;
    }

    if (solved && info.type == Script.txnouttype.TX_WITNESS_V0_KEYHASH) {
		let bs = new BufferStream();
		bs.writeUInt8(opcodetype.OP_DUP);
		bs.writeUInt8(opcodetype.OP_HASH160);
		bs.writeScriptVector(info.solutions[0]);
		bs.writeUInt8(opcodetype.OP_EQUALVERIFY);
		bs.writeUInt8(opcodetype.OP_CHECKSIG);
        let witnessscript = new Script(bs.getData());
        let subInfo = {};
        solved = solved && SignStep(creator, witnessscript, subInfo, SIGVERSION_WITNESS_V0);
        sigdata.scriptWitness = subInfo.solutions;
    }
    else if (solved && info.type == Script.txnouttype.TX_WITNESS_V0_SCRIPTHASH) {
        let witnessscript = new Script(info.solutions);
        let subInfo = {};
        solved = solved && SignStep(creator, witnessscript, subInfo, SIGVERSION_WITNESS_V0) && subInfo.type != TX_SCRIPTHASH && subInfo.type != Script.txnouttype.TX_WITNESS_V0_SCRIPTHASH && subInfo.type != Script.txnouttype.TX_WITNESS_V0_KEYHASH;
        subInfo.solutions.push(witnessscript.script);
        sigdata.scriptWitness = subInfo.solutions;
    }

    if (P2SH) {
        info.solutions.push(subscript.script);
    }
	console.log(info.solutions);
    sigdata.scriptSig = PushAll(info.solutions);

    // Test solution
//    return solved && VerifyScript(sigdata.scriptSig, fromPubKey, &sigdata.scriptWitness, STANDARD_SCRIPT_VERIFY_FLAGS, creator.Checker());
}

function CheckSignatureEncoding(vchSig, flags, serror) {
    // Empty signature. Not strictly DER encoded, but allowed to provide a
    // compact way to provide an invalid signature for use with CHECK(MULTI)SIG
    if (vchSig.length == 0) {
        return true;
    }
    if ((flags & (Script.verifyFlags.SCRIPT_VERIFY_DERSIG | Script.verifyFlags.SCRIPT_VERIFY_LOW_S | Script.verifyFlags.SCRIPT_VERIFY_STRICTENC)) != 0 && !_IsValidSignatureEncoding(vchSig)) {
        return set_error(serror, 'SCRIPT_ERR_SIG_DER');
    } else if ((flags & Script.verifyFlags.SCRIPT_VERIFY_LOW_S) != 0 && !IsLowDERSignature(vchSig, serror)) {
        // serror is set
        return false;
    } else if ((flags & Script.verifyFlags.SCRIPT_VERIFY_STRICTENC) != 0 && !IsDefinedHashtypeSignature(vchSig)) {
        return set_error(serror, 'SCRIPT_ERR_SIG_HASHTYPE');
    }
    return true;
};

function set_error(obj, e) {
	if (typeof obj === 'object') obj.error = e;
	return false;
};
function set_success(obj) {
	if (typeof obj === 'object') delete obj.error;
	return true;
};

function CastToBool(vch) {
	let l = vch.length;
	return vch.some(function(e, idx) {
		if (e == 0)
			return false;
		// Can be negative zero
		if (e == 0x80 && idx == l - 1)
			return false;
		return true;
	});
};

const MAX_SCRIPT_SIZE = 10000;
const MAX_SCRIPT_ELEMENT_SIZE = 520;
const MAX_OPS_PER_SCRIPT = 201;
const MAX_STACK_SIZE = 1000;
const MAX_PUBKEYS_PER_MULTISIG = 20;
const LOCKTIME_THRESHOLD = 500000000; // Tue Nov  5 00:53:20 1985 UTC

function EvalScript(stack, script, flags, checker, sigversion, serror) {
	const stacktop = function(i)  { return stack[stack.length + i] };
	const altstacktop = function(i)  { return altstack[altstack.length + i] };
	const swap = function(i, j) { let c = stack[stack.length + i]; stack[stack.length + i] = stack[stack.length + j]; stack[stack.length + j] = c; }
    const bnZero = 0;
    const bnOne = 1;
    const vchFalse = Buffer.alloc(0);
    const vchTrue = Buffer.alloc(1, 1);

    let pc = {data: new BufferStream(script.script)};
    let vfExec = [];
    let altstack = [];
    set_error(serror, 'SCRIPT_ERR_UNKNOWN_ERROR');
    if (script.script.length > MAX_SCRIPT_SIZE)
        return set_error(serror, 'SCRIPT_ERR_SCRIPT_SIZE');
    let nOpCount = 0;
    let fRequireMinimal = (flags & Script.verifyFlags.SCRIPT_VERIFY_MINIMALDATA) != 0;

    try {
		while (!pc.data.end()) {
            let fExec = !vfExec.some(function(e) {
				return !e;
			});

            //
            // Read instruction
            //
            if (!script.getOp(pc))
                return set_error(serror, 'SCRIPT_ERR_BAD_OPCODE');
            if (pc.pvch.length > MAX_SCRIPT_ELEMENT_SIZE)
                return set_error(serror, 'SCRIPT_ERR_PUSH_SIZE');

            // Note how OP_RESERVED does not count towards the opcode limit.
            if (pc.opcode > opcodetype.OP_16 && ++nOpCount > MAX_OPS_PER_SCRIPT)
                return set_error(serror, 'SCRIPT_ERR_OP_COUNT');

            if (pc.opcode == opcodetype.OP_CAT ||
                pc.opcode == opcodetype.OP_SUBSTR ||
                pc.opcode == opcodetype.OP_LEFT ||
                pc.opcode == opcodetype.OP_RIGHT ||
                pc.opcode == opcodetype.OP_INVERT ||
                pc.opcode == opcodetype.OP_AND ||
                pc.opcode == opcodetype.OP_OR ||
                pc.opcode == opcodetype.OP_XOR ||
                pc.opcode == opcodetype.OP_2MUL ||
                pc.opcode == opcodetype.OP_2DIV ||
                pc.opcode == opcodetype.OP_MUL ||
                pc.opcode == opcodetype.OP_DIV ||
                pc.opcode == opcodetype.OP_MOD ||
                pc.opcode == opcodetype.OP_LSHIFT ||
                pc.opcode == opcodetype.OP_RSHIFT)
                return set_error(serror, 'SCRIPT_ERR_DISABLED_OPCODE'); // Disabled opcodes.

            // With SCRIPT_VERIFY_CONST_SCRIPTCODE, OP_CODESEPARATOR in non-segwit script is rejected even in an unexecuted branch
            if (pc.opcode == opcodetype.OP_CODESEPARATOR && sigversion == SIGVERSION_BASE && (flags & Script.verifyFlags.SCRIPT_VERIFY_CONST_SCRIPTCODE))
                return set_error(serror, 'SCRIPT_ERR_OP_CODESEPARATOR');

            if (fExec && 0 <= pc.opcode && pc.opcode <= opcodetype.OP_PUSHDATA4) {
                if (fRequireMinimal && !CheckMinimalPush(pc.pvch, pc.opcode)) {
                    return set_error(serror, 'SCRIPT_ERR_MINIMALDATA');
                }
                stack.push(pc.pvch);
            } else if (fExec || (opcodetype.OP_IF <= pc.opcode && pc.opcode <= opcodetype.OP_ENDIF))
            switch (pc.opcode)
            {
                //
                // Push value
                //
                case opcodetype.OP_1NEGATE:
                case opcodetype.OP_1:
                case opcodetype.OP_2:
                case opcodetype.OP_3:
                case opcodetype.OP_4:
                case opcodetype.OP_5:
                case opcodetype.OP_6:
                case opcodetype.OP_7:
                case opcodetype.OP_8:
                case opcodetype.OP_9:
                case opcodetype.OP_10:
                case opcodetype.OP_11:
                case opcodetype.OP_12:
                case opcodetype.OP_13:
                case opcodetype.OP_14:
                case opcodetype.OP_15:
                case opcodetype.OP_16:
                {
                    // ( -- value)
                    stack.push(CScriptNumSerialize(pc.opcode - (opcodetype.OP_1 - 1)));
                    // The result of these opcodes should always be the minimal way to push the data
                    // they push, so no need for a CheckMinimalPush here.
                }
                break;


                //
                // Control
                //
                case opcodetype.OP_NOP:
                    break;

                case opcodetype.OP_CHECKLOCKTIMEVERIFY:
                {
                    if (!(flags & Script.verifyFlags.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
                        // not enabled; treat as a NOP2
                        break;
                    }

                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    // Note that elsewhere numeric opcodes are limited to
                    // operands in the range -2**31+1 to 2**31-1, however it is
                    // legal for opcodes to produce results exceeding that
                    // range. This limitation is implemented by CScriptNum's
                    // default 4-byte limit.
                    //
                    // If we kept to that limit we'd have a year 2038 problem,
                    // even though the nLockTime field in transactions
                    // themselves is uint32 which only becomes meaningless
                    // after the year 2106.
                    //
                    // Thus as a special case we tell CScriptNum to accept up
                    // to 5-byte bignums, which are good until 2**39-1, well
                    // beyond the 2**32-1 limit of the nLockTime field itself.
                    const nLockTime = CScriptNumDeserialize(stacktop(-1), fRequireMinimal, 5);

                    // In the rare event that the argument may be < 0 due to
                    // some arithmetic being done first, you can always use
                    // 0 MAX CHECKLOCKTIMEVERIFY.
                    if (nLockTime < 0)
                        return set_error(serror, 'SCRIPT_ERR_NEGATIVE_LOCKTIME');

                    // Actually compare the specified lock time with the transaction.
                    if (!checker.CheckLockTime(nLockTime))
                        return set_error(serror, 'SCRIPT_ERR_UNSATISFIED_LOCKTIME');

                    break;
                }

                case opcodetype.OP_CHECKSEQUENCEVERIFY:
                {
                    if (!(flags & Script.verifyFlags.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY)) {
                        // not enabled; treat as a NOP3
                        break;
                    }

                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    // nSequence, like nLockTime, is a 32-bit unsigned integer
                    // field. See the comment in CHECKLOCKTIMEVERIFY regarding
                    // 5-byte numeric operands.
                    const nSequence = CScriptNumDeserialize(stacktop(-1), fRequireMinimal, 5);

                    // In the rare event that the argument may be < 0 due to
                    // some arithmetic being done first, you can always use
                    // 0 MAX CHECKSEQUENCEVERIFY.
                    if (nSequence < 0)
                        return set_error(serror, 'SCRIPT_ERR_NEGATIVE_LOCKTIME');

                    // To provide for future soft-fork extensibility, if the
                    // operand has the disabled lock-time flag set,
                    // CHECKSEQUENCEVERIFY behaves as a NOP.
                    if ((nSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) != 0)
                        break;

                    // Compare the specified sequence number with the input.
                    if (!checker.CheckSequence(nSequence))
                        return set_error(serror, 'SCRIPT_ERR_UNSATISFIED_LOCKTIME');

                    break;
                }

                case opcodetype.OP_NOP1: case opcodetype.OP_NOP4: case opcodetype.OP_NOP5:
                case opcodetype.OP_NOP6: case opcodetype.OP_NOP7: case opcodetype.OP_NOP8: case opcodetype.OP_NOP9: case opcodetype.OP_NOP10:
                {
                    if (flags & Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS)
                        return set_error(serror, 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS');
                }
                break;

                case opcodetype.OP_IF:
                case opcodetype.OP_NOTIF:
                {
                    // <expression> if [statements] [else [statements]] endif
                    let fValue = false;
                    if (fExec) {
                        if (stack.length < 1)
                            return set_error(serror, 'SCRIPT_ERR_UNBALANCED_CONDITIONAL');
                        let vch = stacktop(-1);
                        if (sigversion == SIGVERSION_WITNESS_V0 && (flags & Script.verifyFlags.SCRIPT_VERIFY_MINIMALIF)) {
                            if (vch.length > 1)
                                return set_error(serror, 'SCRIPT_ERR_MINIMALIF');
                            if (vch.length == 1 && vch[0] != 1)
                                return set_error(serror, 'SCRIPT_ERR_MINIMALIF');
                        }
                        fValue = CastToBool(vch);
                        if (pc.opcode == opcodetype.OP_NOTIF)
                            fValue = !fValue;
                        stack.pop();
                    }
                    vfExec.push(fValue);
                }
                break;

                case opcodetype.OP_ELSE:
                {
                    if (vfExec.length == 0)
                        return set_error(serror, 'SCRIPT_ERR_UNBALANCED_CONDITIONAL');
                    vfExec.push(!vfExec.pop());
                }
                break;

                case opcodetype.OP_ENDIF:
                {
                    if (vfExec.length == 0)
                        return set_error(serror, 'SCRIPT_ERR_UNBALANCED_CONDITIONAL');
                    vfExec.pop();
                }
                break;

                case opcodetype.OP_VERIFY:
                {
                    // (true -- ) or
                    // (false -- false) and return
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let fValue = CastToBool(stacktop(-1));
                    if (fValue)
                        stack.pop();
                    else
                        return set_error(serror, 'SCRIPT_ERR_VERIFY');
                }
                break;

                case opcodetype.OP_RETURN:
                {
                    return set_error(serror, 'SCRIPT_ERR_OP_RETURN');
                }
                break;


                //
                // Stack ops
                //
                case opcodetype.OP_TOALTSTACK:
                {
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    altstack.push(stacktop(-1));
                    stack.pop();
                }
                break;

                case opcodetype.OP_FROMALTSTACK:
                {
                    if (altstack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION');
                    stack.push(altstacktop(-1));
                    altstack.pop();
                }
                break;

                case opcodetype.OP_2DROP:
                {
                    // (x1 x2 -- )
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    stack.pop();
                    stack.pop();
                }
                break;

                case opcodetype.OP_2DUP:
                {
                    // (x1 x2 -- x1 x2 x1 x2)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch1 = stacktop(-2);
                    let vch2 = stacktop(-1);
                    stack.push(vch1);
                    stack.push(vch2);
                }
                break;

                case opcodetype.OP_3DUP:
                {
                    // (x1 x2 x3 -- x1 x2 x3 x1 x2 x3)
                    if (stack.length < 3)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch1 = stacktop(-3);
                    let vch2 = stacktop(-2);
                    let vch3 = stacktop(-1);
                    stack.push(vch1);
                    stack.push(vch2);
                    stack.push(vch3);
                }
                break;

                case opcodetype.OP_2OVER:
                {
                    // (x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2)
                    if (stack.length < 4)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch1 = stacktop(-4);
                    let vch2 = stacktop(-3);
                    stack.push(vch1);
                    stack.push(vch2);
                }
                break;

                case opcodetype.OP_2ROT:
                {
                    // (x1 x2 x3 x4 x5 x6 -- x3 x4 x5 x6 x1 x2)
                    if (stack.length < 6)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vcha = stack.splice(-6, 2);
                    stack.push(vcha[0]);
                    stack.push(vcha[1]);
                }
                break;

                case opcodetype.OP_2SWAP:
                {
                    // (x1 x2 x3 x4 -- x3 x4 x1 x2)
                    if (stack.length < 4)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    swap(-4, -2);
                    swap(-3, -1);
                }
                break;

                case opcodetype.OP_IFDUP:
                {
                    // (x - 0 | x x)
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-1);
                    if (CastToBool(vch))
                        stack.push(vch);
                }
                break;

                // case opcodetype.OP_DEPTH:
                // {
                //     // -- stacksize
                //     let bn = CScriptNumSerialize(stack.length);
                //     stack.push(bn);
                // }
                // break;

                case opcodetype.OP_DROP:
                {
                    // (x -- )
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    stack.pop();
                }
                break;

                case opcodetype.OP_DUP:
                {
                    // (x -- x x)
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-1);
                    stack.push(vch);
                }
                break;

                case opcodetype.OP_NIP:
                {
                    // (x1 x2 -- x2)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    stack.splice(-2, 1);
                }
                break;

                case opcodetype.OP_OVER:
                {
                    // (x1 x2 -- x1 x2 x1)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-2);
                    stack.push(vch);
                }
                break;

                case opcodetype.OP_PICK:
                case opcodetype.OP_ROLL:
                {
                    // (xn ... x2 x1 x0 n - xn ... x2 x1 x0 xn)
                    // (xn ... x2 x1 x0 n - ... x2 x1 x0 xn)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let n = CScriptNumDeserialize(stacktop(-1), fRequireMinimal);
                    stack.pop();
                    if (n < 0 || n >= stack.length)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-n-1);
                    if (pc.opcode == opcodetype.OP_ROLL)
                        stack.splice(-n-1);
                    stack.push(vch);
                }
                break;

                case opcodetype.OP_ROT:
                {
                    // (x1 x2 x3 -- x2 x3 x1)
                    //  x2 x1 x3  after first swap
                    //  x2 x3 x1  after second swap
                    if (stack.length < 3)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    swap(-3, -2);
                    swap(-2, -1);
                }
                break;

                case opcodetype.OP_SWAP:
                {
                    // (x1 x2 -- x2 x1)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    swap(-2, -1);
                }
                break;

                case opcodetype.OP_TUCK:
                {
                    // (x1 x2 -- x2 x1 x2)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-1);
                    stack.splice(-2, 0, vch);
                }
                break;


                case opcodetype.OP_SIZE:
                {
                    // (in -- in size)
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let bn = CScriptNumSerialize(stacktop(-1).length);
                    stack.push(bn);
                }
                break;


                //
                // Bitwise logic
                //
                case opcodetype.OP_EQUAL:
                case opcodetype.OP_EQUALVERIFY:
                //case OP_NOTEQUAL: // use OP_NUMNOTEQUAL
                {
                    // (x1 x2 - bool)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
					let vch1 = stacktop(-2);
					let vch2 = stacktop(-1);
                    let fEqual = vch1.equals(vch2);
                    // OP_NOTEQUAL is disabled because it would be too easy to say
                    // something like n != 1 and have some wiseguy pass in 1 with extra
                    // zero bytes after it (numerically, 0x01 == 0x0001 == 0x000001)
                    //if (pc.opcode == OP_NOTEQUAL)
                    //    fEqual = !fEqual;
					stack.pop();
                    stack.pop();
                    stack.push(fEqual ? vchTrue : vchFalse);
                    if (pc.opcode == opcodetype.OP_EQUALVERIFY)
                    {
                        if (fEqual)
                            stack.pop();
                        else
                            return set_error(serror, 'SCRIPT_ERR_EQUALVERIFY');
                    }
                }
                break;


                //
                // Numeric
                //
                case opcodetype.OP_1ADD:
                case opcodetype.OP_1SUB:
                case opcodetype.OP_NEGATE:
                case opcodetype.OP_ABS:
                case opcodetype.OP_NOT:
                case opcodetype.OP_0NOTEQUAL:
                {
                    // (in -- out)
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let bn = CScriptNumDeserialize(stacktop(-1), fRequireMinimal);
                    switch (pc.opcode)
                    {
                    case opcodetype.OP_1ADD:       bn += bnOne; break;
                    case opcodetype.OP_1SUB:       bn -= bnOne; break;
                    case opcodetype.OP_NEGATE:     bn = -bn; break;
                    case opcodetype.OP_ABS:        if (bn < bnZero) bn = -bn; break;
                    case opcodetype.OP_NOT:        bn = (bn == bnZero); break;
                    case opcodetype.OP_0NOTEQUAL:  bn = (bn != bnZero); break;
                    default:            throw("invalid opcode");
                    }
                    stack.pop();
                    stack.push(CScriptNumSerialize(bn));
                }
                break;

                case opcodetype.OP_ADD:
                case opcodetype.OP_SUB:
                case opcodetype.OP_BOOLAND:
                case opcodetype.OP_BOOLOR:
                case opcodetype.OP_NUMEQUAL:
                case opcodetype.OP_NUMEQUALVERIFY:
                case opcodetype.OP_NUMNOTEQUAL:
                case opcodetype.OP_LESSTHAN:
                case opcodetype.OP_GREATERTHAN:
                case opcodetype.OP_LESSTHANOREQUAL:
                case opcodetype.OP_GREATERTHANOREQUAL:
                case opcodetype.OP_MIN:
                case opcodetype.OP_MAX:
                {
                    // (x1 x2 -- out)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let bn1 = CScriptNumDeserialize(stacktop(-2), fRequireMinimal);
                    let bn2 = CScriptNumDeserialize(stacktop(-1), fRequireMinimal);
                    let bn = 0;
                    switch (pc.opcode) {
                    case opcodetype.OP_ADD:
                        bn = bn1 + bn2;
                        break;

                    case opcodetype.OP_SUB:
                        bn = bn1 - bn2;
                        break;

                    case opcodetype.OP_BOOLAND:             bn = (bn1 != bnZero && bn2 != bnZero); break;
                    case opcodetype.OP_BOOLOR:              bn = (bn1 != bnZero || bn2 != bnZero); break;
                    case opcodetype.OP_NUMEQUAL:            bn = (bn1 == bn2); break;
                    case opcodetype.OP_NUMEQUALVERIFY:      bn = (bn1 == bn2); break;
                    case opcodetype.OP_NUMNOTEQUAL:         bn = (bn1 != bn2); break;
                    case opcodetype.OP_LESSTHAN:            bn = (bn1 < bn2); break;
                    case opcodetype.OP_GREATERTHAN:         bn = (bn1 > bn2); break;
                    case opcodetype.OP_LESSTHANOREQUAL:     bn = (bn1 <= bn2); break;
                    case opcodetype.OP_GREATERTHANOREQUAL:  bn = (bn1 >= bn2); break;
                    case opcodetype.OP_MIN:                 bn = (bn1 < bn2 ? bn1 : bn2); break;
                    case opcodetype.OP_MAX:                 bn = (bn1 > bn2 ? bn1 : bn2); break;
                    default:                     throw(!"invalid opcode");
                    }
                    stack.pop();
                    stack.pop();
                    stack.push(CScriptNumSerialize(bn));

                    if (pc.opcode == opcodetype.OP_NUMEQUALVERIFY) {
                        if (CastToBool(stacktop(-1)))
                            stack.pop();
                        else
                            return set_error(serror, 'SCRIPT_ERR_NUMEQUALVERIFY');
                    }
                }
                break;

                case opcodetype.OP_WITHIN:
                {
                    // (x min max -- out)
                    if (stack.length < 3)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let bn1 = CScriptNumDeserialize(stacktop(-3), fRequireMinimal);
                    let bn2 = CScriptNumDeserialize(stacktop(-2), fRequireMinimal);
                    let bn3 = CScriptNumDeserialize(stacktop(-1), fRequireMinimal);
                    let fValue = (bn2 <= bn1 && bn1 < bn3);
                    stack.pop();
                    stack.pop();
                    stack.pop();
                    stack.push(fValue ? vchTrue : vchFalse);
                }
                break;


                //
                // Crypto
                //
                case opcodetype.OP_RIPEMD160:
                case opcodetype.OP_SHA1:
                case opcodetype.OP_SHA256:
                case opcodetype.OP_HASH160:
                case opcodetype.OP_HASH256:
                {
                    // (in -- hash)
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    let vch = stacktop(-1);
                    let vchHash;
                    if (pc.opcode == opcodetype.OP_RIPEMD160)
						vchHash = crypto.createHash('ripemd160').update(vch).digest();
                    else if (pc.opcode == opcodetype.OP_SHA1)
						vchHash = crypto.createHash('sha1').update(vch).digest();
                    else if (pc.opcode == opcodetype.OP_SHA256)
						vchHash = crypto.createHash('sha256').update(vch).digest();
                    else if (pc.opcode == opcodetype.OP_HASH160)
                        vchHash = Hash160(vch);
                    else if (pc.opcode == opcodetype.OP_HASH256)
						vchHash = Hash256(vch);
					stack.pop();
                    stack.push(vchHash);
                }
                break;

                case opcodetype.OP_CODESEPARATOR:
                {
                    // If SCRIPT_VERIFY_CONST_SCRIPTCODE flag is set, use of OP_CODESEPARATOR is rejected in pre-segwit
                    // script, even in an unexecuted branch (this is checked above the opcode case statement).

                    // Hash starts after the code separator
                    pc.data.setHashMark();
                }
                break;

                case opcodetype.OP_CHECKSIG:
                case opcodetype.OP_CHECKSIGVERIFY:
                {
                    // (sig pubkey -- bool)
                    if (stack.length < 2)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    let vchSig    = stacktop(-2);
                    let vchPubKey = stacktop(-1);

                    // Subset of script starting at the most recent codeseparator
                    let scriptCode = new Script().fromBuffer(pc.data.getMarkData());

                    // Drop the signature in pre-segwit scripts but not segwit scripts
                    if (sigversion == SIGVERSION_BASE) {
                        let found = FindAndDelete(scriptCode, vchSig);
                        if (found > 0 && (flags & Script.verifyFlags.SCRIPT_VERIFY_CONST_SCRIPTCODE))
                            return set_error(serror, 'SCRIPT_ERR_SIG_FINDANDDELETE');
                    }

                    if (!CheckSignatureEncoding(vchSig, flags, serror) || !CheckPubKeyEncoding(vchPubKey, flags, sigversion, serror)) {
                        //serror is set
                        return false;
                    }
                    let fSuccess = checker.CheckSig(vchSig, vchPubKey, scriptCode, sigversion);

                    if (!fSuccess && (flags & Script.verifyFlags.SCRIPT_VERIFY_NULLFAIL) && vchSig.length)
                        return set_error(serror, 'SCRIPT_ERR_SIG_NULLFAIL');

                    stack.pop();
                    stack.pop();
                    stack.push(fSuccess ? vchTrue : vchFalse);
                    if (pc.opcode == opcodetype.OP_CHECKSIGVERIFY)
                    {
                        if (fSuccess)
                            stack.pop();
                        else
                            return set_error(serror, 'SCRIPT_ERR_CHECKSIGVERIFY');
                    }
                }
                break;

                case opcodetype.OP_CHECKMULTISIG:
                case opcodetype.OP_CHECKMULTISIGVERIFY:
                {
                    // ([sig ...] num_of_signatures [pubkey ...] num_of_pubkeys -- bool)

                    let i = 1;
                    if (stack.length < i)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    let nKeysCount = CScriptNumDeserialize(stacktop(-i), fRequireMinimal);
                    if (nKeysCount < 0 || nKeysCount > MAX_PUBKEYS_PER_MULTISIG)
                        return set_error(serror, 'SCRIPT_ERR_PUBKEY_COUNT');
                    nOpCount += nKeysCount;
                    if (nOpCount > MAX_OPS_PER_SCRIPT)
                        return set_error(serror, 'SCRIPT_ERR_OP_COUNT');
                    let ikey = ++i;
                    // ikey2 is the position of last non-signature item in the stack. Top stack item = 1.
                    // With SCRIPT_VERIFY_NULLFAIL, this is used for cleanup if operation fails.
                    let ikey2 = nKeysCount + 2;
                    i += nKeysCount;
                    if (stack.length < i)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    let nSigsCount = CScriptNumDeserialize(stacktop(-i), fRequireMinimal);
                    if (nSigsCount < 0 || nSigsCount > nKeysCount)
                        return set_error(serror, 'SCRIPT_ERR_SIG_COUNT');
                    let isig = ++i;
                    i += nSigsCount;
                    if (stack.length < i)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');

                    // Subset of script starting at the most recent codeseparator
                    let scriptCode = new Script().fromBuffer(pc.data.getMarkData());

                    // Drop the signature in pre-segwit scripts but not segwit scripts
                    for (let k = 0; k < nSigsCount; k++)
                    {
                        let vchSig = stacktop(-isig-k);
                        if (sigversion == SIGVERSION_BASE) {
                            let found = FindAndDelete(scriptCode, vchSig);
                            if (found > 0 && (flags & Script.verifyFlags.SCRIPT_VERIFY_CONST_SCRIPTCODE))
                                return set_error(serror, 'SCRIPT_ERR_SIG_FINDANDDELETE');
                        }
                    }

                    let fSuccess = true;
                    while (fSuccess && nSigsCount > 0)
                    {
                       	let vchSig    = stacktop(-isig);
                        let vchPubKey = stacktop(-ikey);

                        // Note how this makes the exact order of pubkey/signature evaluation
                        // distinguishable by CHECKMULTISIG NOT if the STRICTENC flag is set.
                        // See the script_(in)valid tests for details.
                        if (!CheckSignatureEncoding(vchSig, flags, serror) || !CheckPubKeyEncoding(vchPubKey, flags, sigversion, serror)) {
                            // serror is set
                            return false;
                        }

                        // Check signature
                        let fOk = checker.CheckSig(vchSig, vchPubKey, scriptCode, sigversion);

                        if (fOk) {
                            isig++;
                            nSigsCount--;
                        }
                        ikey++;
                        nKeysCount--;

                        // If there are more signatures left than keys left,
                        // then too many signatures have failed. Exit early,
                        // without checking any further signatures.
                        if (nSigsCount > nKeysCount)
                            fSuccess = false;
                    }

                    // Clean up stack of actual arguments
                    while (i-- > 1) {
                        // If the operation failed, we require that all signatures must be empty vector
                        if (!fSuccess && (flags & Script.verifyFlags.SCRIPT_VERIFY_NULLFAIL) && !ikey2 && stacktop(-1).length)
                            return set_error(serror, 'SCRIPT_ERR_SIG_NULLFAIL');
                        if (ikey2 > 0)
                            ikey2--;
                        stack.pop();
                    }

                    // A bug causes CHECKMULTISIG to consume one extra argument
                    // whose contents were not checked in any way.
                    //
                    // Unfortunately this is a potential source of mutability,
                    // so optionally verify it is exactly equal to zero prior
                    // to removing it from the stack.
                    if (stack.length < 1)
                        return set_error(serror, 'SCRIPT_ERR_INVALID_STACK_OPERATION');
                    if ((flags & Script.verifyFlags.SCRIPT_VERIFY_NULLDUMMY) && stacktop(-1).length)
                        return set_error(serror, 'SCRIPT_ERR_SIG_NULLDUMMY');
                    stack.pop();

                    stack.push(fSuccess ? vchTrue : vchFalse);

                    if (pc.opcode == opcodetype.OP_CHECKMULTISIGVERIFY)
                    {
                        if (fSuccess)
                            stack.pop();
                        else
                            return set_error(serror, 'SCRIPT_ERR_CHECKMULTISIGVERIFY');
                    }
                }
                break;

                default:
                    return set_error(serror, 'SCRIPT_ERR_BAD_OPCODE');
            }

            // Size limits
            if (stack.length + altstack.length > MAX_STACK_SIZE)
                return set_error(serror, 'SCRIPT_ERR_STACK_SIZE');
        }
    } catch (e) {
        return set_error(serror, 'SCRIPT_ERR_UNKNOWN_ERROR');
    }

    if (vfExec.length != 0)
        return set_error(serror, 'SCRIPT_ERR_UNBALANCED_CONDITIONAL');

    return set_success(serror);
};

function VerifyWitnessProgram(witness, witversion, program, flags, checker, serror) {
    let stack = [];
    let scriptPubKey;

    if (witversion == 0) {
        if (program.length == 32) {
            // Version 0 segregated witness program: SHA256(CScript) inside the program, CScript + inputs in witness
            if (witness.length == 0) {
                return set_error(serror, 'SCRIPT_ERR_WITNESS_PROGRAM_WITNESS_EMPTY');
            }
            scriptPubKey = witness[witness.length - 1];
            stack = witness.slice(0, -1).map(function(e) { return e.script; });
			let bs = new BufferStream();
			bs.writeBuffer(scriptPubKey.script);
            let hashScriptPubKey = bs.getHashForSign();
            if (!hashScriptPubKey.equals(program)) {
                return set_error(serror, 'SCRIPT_ERR_WITNESS_PROGRAM_MISMATCH');
            }
        } else if (program.length == 20) {
            // Special case for pay-to-pubkeyhash; signature + pubkey in witness
            if (witness.length != 2) {
                return set_error(serror, 'SCRIPT_ERR_WITNESS_PROGRAM_MISMATCH'); // 2 items in witness
            }
			let bs = new BufferStream();
			bs.writeUInt8(opcodetype.OP_DUP);
			bs.writeUInt8(opcodetype.OP_HASH160);
			bs.writeScriptVector(program);
			bs.writeUInt8(opcodetype.OP_EQUALVERIFY);
			bs.writeUInt8(opcodetype.OP_CHECKSIG);
            scriptPubKey = new Script().fromBuffer(bs.getData());
            stack = witness.map(function(e) { return e.script; });
        } else {
            return set_error(serror, 'SCRIPT_ERR_WITNESS_PROGRAM_WRONG_LENGTH');
        }
    } else if (flags & Script.verifyFlags.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM) {
        return set_error(serror, 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM');
    } else {
        // Higher version witness scripts return true for future softfork compatibility
        return set_success(serror);
    }

    // Disallow stack item size > MAX_SCRIPT_ELEMENT_SIZE in witness stack
    if (stack.some(function(e) { return e.length > MAX_SCRIPT_ELEMENT_SIZE; }))
		return set_error(serror, 'SCRIPT_ERR_PUSH_SIZE');

    if (!EvalScript(stack, scriptPubKey, flags, checker, SIGVERSION_WITNESS_V0, serror)) {
        return false;
    }

    // Scripts inside witness implicitly require cleanstack behaviour
    if (stack.length != 1)
        return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');
    if (!CastToBool(stack[stack.length - 1]))
        return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');
    return true;
};

function VerifyScript(scriptSig, scriptPubKey, witness, flags, checker, serror) {
    if (!witness) {
        witness = [];
    }
    let hadWitness = false;

    set_error(serror, 'SCRIPT_ERR_UNKNOWN_ERROR');

    if ((flags & Script.verifyFlags.SCRIPT_VERIFY_SIGPUSHONLY) != 0 && !scriptSig.IsPushOnly(scriptSig.script)) {
        return set_error(serror, 'SCRIPT_ERR_SIG_PUSHONLY');
    }

    let stack = [], stackCopy = [];
    if (!EvalScript(stack, scriptSig, flags, checker, SIGVERSION_BASE, serror))
        // serror is set
        return false;
    if (flags & Script.verifyFlags.SCRIPT_VERIFY_P2SH)
        stackCopy = stack.slice();
    if (!EvalScript(stack, scriptPubKey, flags, checker, SIGVERSION_BASE, serror))
        // serror is set
        return false;
    if (stack.length == 0)
        return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');
    if (CastToBool(stack[stack.length - 1]) == false)
        return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');

    // Bare witness programs
    let winfo = {};
    if (flags & Script.verifyFlags.SCRIPT_VERIFY_WITNESS) {
        if (scriptPubKey.IsWitnessProgram(winfo)) {
            hadWitness = true;
            if (scriptSig.script.length != 0) {
                // The scriptSig must be _exactly_ CScript(), otherwise we reintroduce malleability.
                return set_error(serror, 'SCRIPT_ERR_WITNESS_MALLEATED');
            }
            if (!VerifyWitnessProgram(witness, winfo.version, winfo.program, flags, checker, serror)) {
                return false;
            }
            // Bypass the cleanstack check at the end. The actual stack is obviously not clean
            // for witness programs.
            stack.splice(1);
        }
    }

    // Additional validation for spend-to-script-hash transactions:
    if ((flags & Script.verifyFlags.SCRIPT_VERIFY_P2SH) && scriptPubKey.IsPayToScriptHash())
    {
        // scriptSig must be literals-only or validation fails
        if (!scriptSig.IsPushOnly(scriptSig.script))
            return set_error(serror, 'SCRIPT_ERR_SIG_PUSHONLY');

        // Restore stack.
        stack = stackCopy;

        // stack cannot be empty here, because if it was the
        // P2SH  HASH <> EQUAL  scriptPubKey would be evaluated with
        // an empty stack and the EvalScript above would return false.
        if (stack.length == 0) throw('assert');

        let pubKey2 = new Script().fromBuffer(stack.pop());

        if (!EvalScript(stack, pubKey2, flags, checker, SIGVERSION_BASE, serror))
            // serror is set
            return false;
        if (stack.length == 0)
            return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');
        if (!CastToBool(stack[stack.length - 1]))
            return set_error(serror, 'SCRIPT_ERR_EVAL_FALSE');

        // P2SH witness program
        if (flags & Script.verifyFlags.SCRIPT_VERIFY_WITNESS) {
            if (pubKey2.IsWitnessProgram(winfo)) {
                hadWitness = true;
				let bs = new BufferStream();
				bs.writeScriptVector(pubKey2.script);
				if (!scriptSig.script.equals(bs.getData())) {
                    // The scriptSig must be _exactly_ a single push of the redeemScript. Otherwise we
                    // reintroduce malleability.
                    return set_error(serror, 'SCRIPT_ERR_WITNESS_MALLEATED_P2SH');
                }
                if (!VerifyWitnessProgram(witness, winfo.version, winfo.program, flags, checker, serror)) {
                    return false;
                }
                // Bypass the cleanstack check at the end. The actual stack is obviously not clean
                // for witness programs.
                stack.splice(1);
            }
        }
    }

   	// The CLEANSTACK check is only performed after potential P2SH evaluation,
   	// as the non-P2SH evaluation of a P2SH script will obviously not result in
   	// a clean stack (the P2SH inputs remain). The same holds for witness evaluation.
   	if ((flags & Script.verifyFlags.SCRIPT_VERIFY_CLEANSTACK) != 0) {
		// Disallow CLEANSTACK without P2SH, as otherwise a switch CLEANSTACK->P2SH+CLEANSTACK
		// would be possible, which is not a softfork (and P2SH should be one).
        if ((flags & Script.verifyFlags.SCRIPT_VERIFY_P2SH) == 0) throw('assert');
        if ((flags & Script.verifyFlags.SCRIPT_VERIFY_WITNESS) == 0) throw('assert');
       	if (stack.length != 1) {
           return set_error(serror, 'SCRIPT_ERR_CLEANSTACK');
       }
   }

   if (flags & Script.verifyFlags.SCRIPT_VERIFY_WITNESS) {
       // We can't check for correct unexpected witness data if P2SH was off, so require
       // that WITNESS implies P2SH. Otherwise, going from WITNESS->P2SH+WITNESS would be
       // possible, which is not a softfork.
	   if ((flags & Script.verifyFlags.SCRIPT_VERIFY_P2SH) == 0) throw('assert');
       if (!hadWitness && witness.length > 0) {
           return set_error(serror, 'SCRIPT_ERR_WITNESS_UNEXPECTED');
       }
   }

   return set_success(serror);
};



//	prevOuts
//	[
//		{
//				tx: (serialized | Transaction) of prevout at i-esimo txin
//			or
//				hash: (hex string) prevout hash
//				index: (int n) prevout index
//				scriptPubKey:	(Script Buffer) prevout scriptPubKey
//				amount?:	(opt int64) 		
//			hashType: int hashType
//				sk:	to sign
//			or
//				reedemScript: (hex string) to sign (TX_SCRIPTHASH or TX_WITNESS_V0_SCRIPTHASH)
//			pk: of sk
//		},
//		...
//	]
function signCheckTx(tx, prevOuts, test, signFlag, bitcoinFlag) {
	if (typeof test === 'undefined')
		test = STANDARD_SCRIPT_VERIFY_FLAGS;
	if (!(tx instanceof Transaction))
		tx = new Transaction(tx, bitcoinFlag);
	let buf = tx.toBuffer();
	let witCache;
	tx.vin.forEach(function(cur, idx) {
//console.log('Current parse', cur);
		let poInfo = prevOuts[idx];
		if (!poInfo)
			return;
		let curPrevOut = cur.prevout;
		//console.log(curPrevOut.hash.toString('hex'));
		let sigData = {};
		if (poInfo.tx) {
			let prevTx = poInfo.tx;
//console.log('prevOuts', poInfo);
//console.log('prevTx', prevTx);
			if (!(prevTx instanceof Transaction))
				prevTx = new Transaction(prevTx, bitcoinFlag);
			if (curPrevOut.n >= prevTx.vout.length || !curPrevOut.hash.equals(prevTx.hash))
				throw 'Invalid data for Tx ' + idx;
			let pOutTx = prevTx.vout[curPrevOut.n];
//console.log('pOutTx', pOutTx);
			poInfo.scriptPubKey = pOutTx.scriptPubKey.toBuffer();
			if (!bitcoinFlag) {
				let nbAmount = {
					name: pOutTx.name,
					nValue: pOutTx.nValue
				};
				poInfo.amount = nbAmount;
			} else
				poInfo.amount = pOutTx.nValue;
		} else {
			if (poInfo.index < 0)
				poInfo.index = 0xFFFFFFFF + poInfo.index + 1; 
			if (curPrevOut.n != poInfo.index || !curPrevOut.hash.equals(Buffer.from(poInfo.hash, 'hex')))
				throw 'Invalid data for Tx ' + idx;
		}
//console.log('Current previous', poInfo);
		let scriptPubKey = new Script(poInfo.scriptPubKey);
//console.log('signCheckTx', scriptPubKey);
		
		if (!signFlag) {
			let serror = {};
			if (VerifyScript(cur.scriptSig, scriptPubKey, cur.scriptWitness, test, new TransactionSignatureChecker(tx, idx, poInfo.amount), serror)) {
				poInfo.signed = 'OK';
			} else {
				poInfo.failed = 'ERROR VerifyScript: ' + serror.error;
			}
			return;
		}

		let info = {sign: []};
		if (!scriptPubKey.Solver(info)) {
			poInfo.failed = 'Solver';
			console.log('signCheckTx Solver error', info);
			return;
		}
//console.log('signCheckTx Solver', info);
		if (info.type == Script.txnouttype.TX_WITNESS_V0_KEYHASH) {
			let bs = new BufferStream();
			bs.writeUInt8(opcodetype.OP_DUP);
			bs.writeUInt8(opcodetype.OP_HASH160);
			//console.log('P2WPKH', info.solutions[0].toString('hex'));
			bs.writeScriptVector(info.solutions[0]);
			bs.writeUInt8(opcodetype.OP_EQUALVERIFY);
			bs.writeUInt8(opcodetype.OP_CHECKSIG);
			let witnessscript = new Script().fromBuffer(bs.getData());

			let hashType = poInfo.hashType || SIGHASH_ALL;
//console.log('hashType', hashType);
			if (!witCache)
				witCache = new PrecomputedTransactionData(tx);
			let hash = SignatureHash(witnessscript, tx, idx, hashType, poInfo.amount, SIGVERSION_WITNESS_V0, witCache);
			//console.log(crypto.createHash('sha256').update(hash).digest().toString('hex'));
		
			// prefixed & compressed
			let key;
			if (poInfo.sk.length > 32 && poInfo.sk[0] == 0x80) {
				if (poInfo.sk.length > 33 && poInfo.sk[poInfo.sk.length - 1] == 1)
					key = poInfo.sk.slice(1, -1);
				else
					key = poInfo.sk.slice(1);
			} else
				key = poInfo.sk;
			let ecKey = new EcCrypto({sk: key}, poInfo.pk);
//console.log('Prova chiavi 0', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 1', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 2', ecKey.checkPk2Sk(poInfo.pk));

			const signature = ecKey.signSha256(hash);
//console.log('signature', signature.toString('hex'));
			if (!tx.hasWitness) {
				tx.hasWitness = true;
				tx.vin.forEach(function(wtx, idx) {
					if (!wtx.scriptWitness)
						wtx.scriptWitness = [];
				});
			}
			cur.scriptWitness = [];
			bs.reset();
			bs.writeBufferSized(Buffer.concat([signature, Buffer.from([hashType])]));
			cur.scriptWitness.push(new Script(bs.getData()));
			bs.reset();
			bs.writeBufferSized(ecKey.publicKey);
			cur.scriptWitness.push(new Script(bs.getData()));
		} else if (info.type == Script.txnouttype.TX_WITNESS_V0_SCRIPTHASH) {
			// Da finire
			if (!poInfo.reedemScript) {
				poInfo.failed = 'No reedemScript';
				return;
			}
			let bs = new BufferStream();
			bs.writeScriptVector(poInfo.reedemScript, 'hex');
			let witnessscript = new Script();
			witnessscript.fromBuffer(bs.getData());
			let digest = crypto.createHash('sha256').update(bs.getData()).digest();
			if (!digest.equals(info.solutions[0])) {
				poInfo.failed = 'Invalid reedemScript';
				console.log('Invalid reedemScript', digest.toString('hex'));
				return;
			}

			let hashType = poInfo.hashType || SIGHASH_ALL;
			//console.log('hashType', hashType);
		
			let infoPg = {sign: []};
			if (!witnessscript.Solver(infoPg)) {
				poInfo.failed = 'Solver Program';
				console.log('witnessscript Solver Program error', infoPg);
				return;
			}
			console.log('witnessscript Solver', info);
				
// TODO
// if (!witCache)
// 	witCache = new PrecomputedTransactionData(tx);
// let hash = SignatureHash(witnessscript, tx, idx, hashType, poInfo.amount, SIGVERSION_WITNESS_V0, witCache);
// 	// prefixed & compressed
// 	let key;
// 	if (poInfo.sk.length > 32 && poInfo.sk[0] == 0x80) {
// 		if (poInfo.sk.length > 33 && poInfo.sk[poInfo.sk.length - 1] == 1)
// 			key = poInfo.sk.slice(1, -1);
// 		else
// 			key = poInfo.sk.slice(1);
// 	} else
// 		key = poInfo.sk;
// 	let ecKey = new EcCrypto({sk: key}, poInfo.pk);
// //console.log('Prova chiavi 0', ecKey.checkPk2Sk(ecKey.publicKey));
// //console.log('Prova chiavi 1', ecKey.checkPk2Sk(ecKey.publicKey));
// //console.log('Prova chiavi 2', ecKey.checkPk2Sk(poInfo.pk));

// 	const signature = ecKey.signSha256(hash);
// //console.log('signature', signature.toString('hex'));
// 	if (!tx.hasWitness) {
// 		tx.hasWitness = true;
// 		tx.vin.forEach(function(wtx, idx) {
// 			if (!wtx.scriptWitness)
// 				wtx.scriptWitness = [];
// 		});
// 	}
// 	cur.scriptWitness = [];
// 	bs.reset();
// 	bs.writeScriptVector(Buffer.concat([signature, Buffer.from([hashType])]));
// 	cur.scriptWitness.push(new Script(bs.getData()));
// 	bs.reset();
// 	bs.writeBufferSized(ecKey.publicKey);
// 	cur.scriptWitness.push(new Script(bs.getData()));
// TODO
		} else if (info.type == Script.txnouttype.TX_SCRIPTHASH) {
			// if (!poInfo.reedemScript) {
			// 	poInfo.failed = 'No reedemScript';
			// 	return;
			// }

			let reedemScript;
			// prefixed & compressed
			let key;
			if (poInfo.sk.length > 32 && poInfo.sk[0] == 0x80) {
				if (poInfo.sk.length > 33 && poInfo.sk[poInfo.sk.length - 1] == 1)
					key = poInfo.sk.slice(1, -1);
				else
					key = poInfo.sk.slice(1);
			} else
				key = poInfo.sk;
			let ecKey = new EcCrypto({sk: key}, poInfo.pk);
//console.log('Prova chiavi 0', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 1', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 2', ecKey.checkPk2Sk(poInfo.pk));

			const signature = ecKey.signSha256(hash);
//console.log('signature', signature.toString('hex'));
			if (!tx.hasWitness) {
				tx.hasWitness = true;
				tx.vin.forEach(function(wtx, idx) {
					if (!wtx.scriptWitness)
						wtx.scriptWitness = [];
				});
			}
			cur.scriptWitness = [];
			bs.reset();
			bs.writeBufferSized(Buffer.concat([signature, Buffer.from([hashType])]));
			cur.scriptWitness.push(new Script(bs.getData()));
			bs.reset();
			bs.writeBufferSized(ecKey.publicKey);
			cur.scriptWitness.push(new Script(bs.getData()));
	
		} else if (info.type == Script.txnouttype.TX_MULTISIG) {

		// case Script.txnouttype.TX_MULTISIG:
		// 	info.sign.push(Buffer.alloc(0)); // workaround CHECKMULTISIG bug
		// 	return (SignN(info.solutions, creator, scriptPubKey, info.sign, sigversion));
	
			let hashType;
			let signatures = [];
			let pubKeys = info.solutions.slice(1, -1);
			let m = info.solutions[0][0], n = info.solutions[info.solutions.length - 1][0];
			if (n < 0 || n > 20) {
				poInfo.failed = 'Multisig: SCRIPT_ERR_PUBKEY_COUNT' + n;
				return;
			}
			if (m < 0 || m > n) {
				poInfo.failed = 'Multisig: SCRIPT_ERR_SIG_COUNT' + m;
				return;
			}
			if (!signFlag) {
				let op = {};
				if (!cur.scriptSig.getOp(op)) {
					poInfo.failed = 'Not signature: ' + info.type;
					return;
				}
				if (op.opcode != opcodetype.OP_0) {
					console.log('multisig invalid dummy: ' + op.opcode);
					if (test & Script.verifyFlags.SCRIPT_VERIFY_NULLDUMMY) {
						poInfo.failed = 'multisig invalid dummy: ' + op.opcode;
						return;
					}
				}
				let f = false;
				while (cur.scriptSig.getOp(op)) {
					if (op.pvch.length == 0) {
						f = true;
						break;
					}
					signatures.push(op.pvch);
				}
				if (f) {
					poInfo.failed = 'Extra signature: ' + info.type;
					return;
				}
				if (signatures.length < m) {
					poInfo.failed = 'Not signature: ' + info.type;
					return;
				}
				//	DROP Signatures from scriptPubKey
				scriptPubKey = candidateScript(scriptPubKey);
				signatures.forEach(function(sign) {
					FindAndDelete(scriptPubKey, sign); 
				});
				signatures = signatures.map(function(s) {
					let rs = ValidSignatureTest(s, test);
					if ('error' in rs)
						poInfo.failed = rs.error;
					return rs.signature;
				});
				let fSuccess = true;
				while (fSuccess && m > 0) {
					let signature = signatures[signatures.length - 1];
					hashType = signature[signature.length - 1];
					signature = signature.slice(0, -1);
					let pubKey = pubKeys.pop();
					if (!CheckPubKeyEncoding(pubKey, test)) {
						poInfo.failed = 'Invalid pubkey';
						return;	
					}
//console.log('hashType', hashType);
					let hash = SignatureHash(scriptPubKey, tx, idx, hashType);
//console.log(crypto.createHash('sha256').update(hash).digest().toString('hex'));
					console.log('signature', signature.toString('hex'));
					console.log('sigHash', hash.toString('hex'));
		
					let verify = crypto.createVerify('sha256');
					verify.update(hash);
					let pemPk = pk2Der(pubKey);
					//console.log(pemPk);
					if (verify.verify(pemPk, signature)) {
						signatures.shift();
						m--;
					}
					n--;
					if (m > n)
						fSuccess = false;
				}
				if (fSuccess)
					poInfo.signed = 'OK';
				else
					poInfo.failed = 'Invalid Signature';
			}

		} else {
			// TX_SCRIPTHASH: "scripthash",
			if (info.type != Script.txnouttype.TX_PUBKEY
				&& info.type != Script.txnouttype.TX_PUBKEYHASH) {
			//if (info.type == Script.txnouttype.TX_NONSTANDARD || info.type == Script.txnouttype.TX_NULL_DATA || info.type == Script.txnouttype.TX_WITNESS_UNKNOWN) {
				poInfo.failed = 'Not implemented: ' + info.type;
				return;
			}

			let hashType;
			let signature;
			let pubKey;
			if (!signFlag) {
				let op = {};
				if (!cur.scriptSig.getOp(op) || op.pvch.length == 0) {
					poInfo.failed = 'Not signature: ' + info.type;
					return;
				}
				signature = op.pvch;
				hashType = signature[signature.length - 1];
				if ('hashType' in poInfo && poInfo.hashType != hashType) {
					poInfo.failed = 'Invalid hashType';
					console.log('Invalid hashType', hashType);
					return;
				}
				if (info.type != Script.txnouttype.TX_PUBKEY) {
					if (!cur.scriptSig.getOp(op) || op.pvch.length == 0) {
						poInfo.failed = 'Not pubkey: ' + info.type;
						return;
					}
					pubKey = op.pvch;
				} else
					pubKey = info.solutions[0];
				if (cur.scriptSig.getOp(op)) {
					poInfo.failed = 'Invalid scriptSig: ' + info.type;
					return;
				}
			}
//console.log('hashType', poInfo.hashType, hashType);
			if (typeof hashType === 'undefined')
				hashType = poInfo.hashType || hashType || SIGHASH_ALL;
//console.log('hashType', hashType);
			//	DROP Signatures from scriptPubKey
			scriptPubKey = candidateScript(scriptPubKey);
			FindAndDelete(scriptPubKey, signature); 
			let rs = ValidSignatureTest(signature, test);
			if ('error' in rs) {
				poInfo.failed = rs.error;
				return;
			}
			signature = rs.signature;
			signature = signature.slice(0, -1);
			let hash = SignatureHash(scriptPubKey, tx, idx, hashType);

			//console.log(crypto.createHash('sha256').update(hash).digest().toString('hex'));
		
			if (signFlag) {
				// prefixed & compressed
				let key;
				if (poInfo.sk.length > 32 && poInfo.sk[0] == 0x80) {
					if (poInfo.sk.length > 33 && poInfo.sk[poInfo.sk.length - 1] == 1)
						key = poInfo.sk.slice(1, -1);
					else
						key = poInfo.sk.slice(1);
				} else
					key = poInfo.sk;
				let ecKey = new EcCrypto({sk: key}, poInfo.pk);
//console.log('Prova chiavi 0', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 1', ecKey.checkPk2Sk(ecKey.publicKey));
//console.log('Prova chiavi 2', ecKey.checkPk2Sk(poInfo.pk));

				const signature = ecKey.signSha256(hash);
//console.log('signature', signature.toString('hex'));
				if (!tx.hasWitness) {
					tx.hasWitness = true;
					tx.vin.forEach(function(wtx, idx) {
						if (!wtx.scriptWitness)
							wtx.scriptWitness = [];
					});
				}
				cur.scriptWitness = [];
				bs.reset();
				bs.writeBufferSized(Buffer.concat([signature, Buffer.from([hashType])]));
				cur.scriptWitness.push(new Script(bs.getData()));
				bs.reset();
				bs.writeBufferSized(ecKey.publicKey);
				cur.scriptWitness.push(new Script(bs.getData()));
			} else {
				let pkHash = Hash160(pubKey);
				if (poInfo.pk && !pubKey.equals(poInfo.pk)) {
					poInfo.warning = 'Invalid passed PublicKey';
					console.log('Invalid passed PublicKey', poInfo.pk);
				}
				if (info.type != Script.txnouttype.TX_PUBKEY) {
					if (!pkHash.equals(info.solutions[0])) {
					 	poInfo.failed = 'Invalid PublicKey';
					 	console.log('Invalid PublicKey', pkHash.toString('hex'));
					 	return;
					}
				}
				console.log('signature', signature.toString('hex'));
				console.log('sigHash', hash.toString('hex'));

				const verify = crypto.createVerify('sha256');
				verify.update(hash);
				let pemPk = pk2Der(pubKey);
				//console.log(pemPk);
				if (verify.verify(pemPk, signature))
					poInfo.signed = 'OK';
				else
					poInfo.failed = 'Invalid Signature';
			}
	
		}
//console.log('signCheckTx', info);



//		let yyy = ProduceSignature(poInfo, poInfo.scriptPubKey, sigData);
//console.log(yyy, sigData);
//		let xxx = SignStep(poInfo, poInfo.scriptPubKey);

//		let pkScript = candidateScript(poInfo.scriptPubKey);

	});
//console.log(tx);
//console.log(tx.vout[0]);
	return tx.toBuffer();
};
function signNbTx(tx, prevOuts, test) {
	return signCheckTx(tx, prevOuts, test, true, false);
};
function signBcTx(tx, prevOuts, test) {
	return signCheckTx(tx, prevOuts, test, true, true);
};
function checkNbTx(tx, prevOuts, test) {
	return signCheckTx(tx, prevOuts, test, false, false);
};
function checkBcTx(tx, prevOuts, test) {
	return signCheckTx(tx, prevOuts, test, false, true);
};

nkLib.PrecomputedTransactionData = PrecomputedTransactionData;
nkLib.signNbTx = signNbTx;
nkLib.signBcTx = signBcTx;
nkLib.checkNbTx = checkNbTx;
nkLib.checkBcTx = checkBcTx;

module.exports = nkLib;
