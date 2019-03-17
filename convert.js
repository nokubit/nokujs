'use strict';

const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

var startDate = moment.utc();
var endDate = moment.utc(startDate);
var days = 0;
if (process.argv.length > 2) {
	startDate = moment.utc(process.argv[2], 'DD-MM-YYYY');
	if (!startDate.isValid())
		throw 'Invalide date format DD-MM-YYYY';
	if (process.argv.length > 3) {
		let n = process.argv[3];
		if (!isNaN(parseFloat(n)) && isFinite(n)) {
			days = parseInt(n);
			if (days < 0) {
				endDate = moment.utc(startDate);
				startDate.add(days, 'days');
				days = -days;
			} else
				endDate = moment.utc(startDate).add(days, 'days');
		} else {
			endDate = moment.utc(n, 'DD-MM-YYYY');
			if (!endDate.isValid())
				throw 'Invalide date format DD-MM-YYYY, second arg must date or days';
			if (endDate.isBefore(startDate)) {
				let t = startDate;
				startDate = endDate;
				endDate = t;
			}
			days = endDate.diff(startDate, 'days');
		}
	}
}
//console.log(startDate.format('DD/MM/YYYY') + ' ' + endDate.format('DD/MM/YYYY') + ', diff ' +days);


function exec(u) {
    return new Promise(function(resolve, reject) {
		try {
			let urlObj = url.parse(u);
			let options = {
				protocol: urlObj.protocol,
				hostname: urlObj.hostname,
				port: urlObj.port,
				path: urlObj.path,
				method: 'GET',
				timeout: 2000,
				headers: {
					//'CB-VERSION': '2016-02-18',
					'CB-VERSION': '2017-08-07',
					accept: 'application/json',
					//accept: 'text/html,application/json,application/xml',
					//'accept-encoding': 'gzip, deflate, sdch, br',
					//'accept-language': 'en-US,en;q=0.8',
					//'Content-Type': 'application/json; charset=UTF-8',
					//'Content-Length': JSON.stringify(reqCapture).length
					'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.3'
				}
			};

			setTimeout(function() {
				let get_req = https.request(options, function(res) {
					res.setEncoding('utf8');
					//console.log(res.statusCode);
					//console.log(res.headers);
					let data = [];
					res.on('data', function (chunk) {
						data.push(chunk);
					});
					res.on('end', function() {
						if (res.statusCode == 200) {
							//console.log(res.req._header);
							resolve(JSON.parse(data.join('')));
						} else {
							try {
								resolve({errcode: res.statusCode, message: JSON.parse(data.join(''))});
							} catch (e) {
								resolve({errcode: res.statusCode, message: data.join('')});
							}
						}
					});
				}).on('error', function(e) {
					console.log('NET ERROR', e);
					resolve({errcode: -2, message: e});
				});
				get_req.end();
			}, 100);
		} catch (e) {
			reject({errcode: -1, message: e});
		}
	});
};

if (days) {
	let base = 'https://api.coinbase.com/v2/prices/ETH-USD/spot';
	let a = [];
	let date = moment.utc(startDate);
	let p = Promise.resolve(startDate);
	while (!date.isAfter(endDate)) {
		p = p.then(function(r) {
			let t;
			if (Array.isArray(r)) {
				t = r[0];
				r = r[1];
				let tx = moment.utc(t).add(-1, 'days');
				console.log('ETH-USD at ' + tx.format('DD-MM-YYYY'));
				console.dir(r, {color: true, depth: 4});
				if ('data' in r && 'amount' in r.data)
					a.push({date: tx.format('DD-MM-YYYY'), amount: r.data.amount});
				else
					a.push({date: tx.format('DD-MM-YYYY'), r: r});
			} else {
				t = r;
				console.log('START ' + t.format('DD-MM-YYYY'));
			}
			let tt = moment.utc(t);
			tt.add(1, 'days');
			let b = [tt];
			b.push(exec(base + '?date=' + t.format('YYYY-MM-DD')));
			return Promise.all(b);
		});
		date.add(1, 'days');
	}
	p = p.then(function(r) {
		let t;
		if (Array.isArray(r)) {
			t = r[0];
			r = r[1];
			let tx = moment.utc(t).add(-1, 'days');
			console.log('ETH-USD at ' + tx.format('DD-MM-YYYY'));
			console.dir(r, {color: true, depth: 4});
			if ('data' in r && 'amount' in r.data)
				a.push({date: tx.format('DD-MM-YYYY'), amount: r.data.amount});
			else
				a.push({date: tx.format('DD-MM-YYYY'), r: r});
		} else
			t = r;
		console.log('END ' + t.format('DD-MM-YYYY'));
		console.log(a);
		let sum = 0;
		a.forEach(function(e) { sum += parseFloat(e.amount); });
		console.log('Media: ' + (sum / (days + 1)) + ' (' + sum + ', ' + (days + 1) + ')');
	}).catch (function(e) {
		console.log('ERROR', e);
	});
	return p;
} else {
	exec('https://api.coinbase.com/v2/prices/BTC-USD/sell')
	.then(function(r) {
		console.log(Date.now());
		console.log('BTC-USD/sell', r);
		return exec('https://api.coinbase.com/v2/prices/ETH-USD/sell');
	}).then(function(r) {
		console.log(Date.now());
		console.log('ETH-USD/sell', r);
		return exec('https://api.coinbase.com/v2/prices/ETH-EUR/sell');
	}).then(function(r) {
		console.log(Date.now());
		console.log('ETH-EUR/sell', r);
		return exec('https://api.coinbase.com/v2/prices/ETH-EUR/buy');
	}).then(function(r) {
		console.log(Date.now());
		console.log('ETH-EUR/buy', r);
		return exec('https://api.coinbase.com/v2/prices/ETH-EUR/spot');
	}).then(function(r) {
		console.log(Date.now());
		console.log('ETH-EUR/spot', r);
	}).catch (function(e) {
		console.log('ERROR', e);
	});
}
