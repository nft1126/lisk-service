/*
 * LiskHQ/lisk-service
 * Copyright © 2020 Lisk Foundation
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
const core = require('./compat');
const signals = require('../signals');
const { getBlocks } = require('./blocks');
const { getEstimateFeeByteNormal, getEstimateFeeByteQuick } = require('./dynamicFees');

const events = {
	newBlock: async data => {
		const block = await getBlocks({ blockId: data.id });
		signals.get('newBlock').dispatch(block.data[0]);
	},
	newRound: data => {
		signals.get('newRound').dispatch(data);
	},
	calculateFeeEstimate: async () => {
		getEstimateFeeByteNormal();
		const feeEstimate = await getEstimateFeeByteQuick();
		signals.get('newFeeEstimate').dispatch(feeEstimate);
	},
};

const init = () => {
	core.events.register(events);
	Object.keys(events).forEach((eventName) => signals.register(eventName));
};

init();

module.exports = { init };
