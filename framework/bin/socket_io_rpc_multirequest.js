#!/usr/bin/env node
/*
 * LiskHQ/lisk-service
 * Copyright © 2019 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
/* eslint-disable no-console,no-multi-spaces,key-spacing,no-unused-vars */

const io = require('socket.io-client');
const util = require('util');
const prettyjson = require('prettyjson');

if (process.argv.length < 3) {
	console.log('Usage: node socket_io_rpc_multirequest.js <endpoint>');
	console.log('');
	console.log('Examples:');
	console.log('  node socket_io_rpc_multirequest.js ws://localhost:9901/rpc');
	console.log('  node socket_io_rpc_multirequest.js wss://service.lisk.io/rpc');
	process.exit(1);
}

const cliEndpoint = process.argv[2];
const cliProcedureName = process.argv[3];
const cliParams = process.argv[4] ? JSON.parse(process.argv[4]) : undefined;
const TIMEOUT = 15 * 1000;

const socket = io(cliEndpoint, { forceNew: true, transports: ['websocket'] });

[
	'connect', 'reconnect',
	'connect_error', 'connect_timeout', 'error', 'disconnect',
	'reconnect', 'reconnect_attempt',
	'reconnecting', 'reconnect_error', 'reconnect_failed',
	// 'ping', 'pong',
].forEach((item) => {
	socket.on(item, (res) => {
		// Enable this to log all events
		// console.log(`Event: ${item}, res: ${res || '-'}`);
	});
});

['status'].forEach((eventName) => {
	socket.on(eventName, (newData) => {
		// Enable this to log incoming data
		// console.log(`Received data from ${cliEndpoint}/${eventName}: ${newData}`);
	});
});

const request = (path, params) => new Promise((resolve) => {
	socket.emit(path, params, (answer) => {
		// Enable this to log incoming data
		// console.log(`Got answer: ${JSON.stringify(answer)}`);
		// console.log(path);
		// console.log(util.inspect(answer));
		resolve(answer);
	});
});

setTimeout(() => {
	console.log('Timeout exceeded - could not get a response');
	process.exit(1);
}, TIMEOUT);

(async () => {
	/*
	* Enable particular console.log to see different outputs
	* Consider `jq` as a JSON parser
	*/
	const results = [];

	const response1 = await request('request', { method: 'get.blocks', params: { limit: 100 } });

	results.push(response1);
	// console.log(JSON.stringify(response1));

	const requests = response1.result.data
		.filter(o => Number(o.numberOfTransactions) > 0)
		.map(o => ({ method: 'get.transactions', params: { block: o.id } }));

	results.push(requests);
	// console.log(JSON.stringify(requests));

	const response2 = await request('request', requests);
	// console.log(JSON.stringify(response2));

	results.push(response2);
	// console.log(JSON.stringify(results));

	// This returns combined result
	console.log(prettyjson.render(response2));

	process.exit(0);
})();