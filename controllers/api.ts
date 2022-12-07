import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

const fastify : FastifyInstance = Fastify({
    logger: {
        level: 'info',
        file: './api.log'
    }
});

// const fastify = require('fastify')({
//     logger: {
//         level: 'info',
//         file: './api.log'
//     }
// });

//const nearAPI = require('near-api-js');
import * as nearAPI from 'near-api-js';
//const getConfig = require('../config/near');
import getConfig from '../config/near';

const nearConfig = getConfig(process.env.APP_ENV || 'development');
const { nodeUrl, networkId, contractName } = nearConfig;
const contractMethods = {
    viewMethods: ['nft_info_for_player'],
    changeMethods: ['nft_mint_for_player']
};

const creds = `../creds/${contractName}`;
let msg = `Loading Credentials: ${creds}`;
console.log(msg);
fastify.log.info(msg);

const credentials = require(creds);
//import * as credentials from `../creds/${contractName}`;
//import credentials from '../creds/${contractName}';

const {
    keyStores: { InMemoryKeyStore },
    Near,
    Account,
    Contract,
    KeyPair,
    utils: {
        format: { parseNearAmount },
    },
} = nearAPI;

const keyStore = new InMemoryKeyStore();
keyStore.setKey(
    networkId,
    contractName,
    KeyPair.fromString(credentials.private_key)
);

// const near = new Near({
//     networkId,
//     nodeUrl,
//     deps: { keyStore },
// });
const near = new Near(nearConfig);
const { connection } = near;
const contractAccount = new Account(connection, contractName);

// @ts-ignore
contractAccount.addAccessKey = (publicKey) =>
    contractAccount.addKey(
        publicKey,
        contractName,
        contractMethods.changeMethods,
        parseNearAmount("0.1")
    );

const contract = new Contract(contractAccount, contractName, contractMethods);

export const Api = async (request, reply) => {
    return 'Diesel Attack NEAR NFT Backend Server!';
}

export const ApiMintNft = async (request, reply) => {
    let result;
    const username = request.query.nearid;
    const gas_cost = 300000000000000;
    const minting_cost = "100000000000000000000000";
    msg = `Minting new NFT for ${username}`;
    console.log(msg);
    // fastify.log.info(msg);

    try {
        // @ts-ignore
        result = contract.nft_mint_for_player(
            username
            //args: {username},
            //gas: gas_cost,
            //amount: minting_cost,
        )
        // fastify.log.info(`Success! NFT has been minted for ${username}! Token code = ${result}`);
    } catch (err) {
        console.log(err);
        fastify.log.error(err);
        return 'Error. For more info see log!';
    }

    return result;
}

export const ApiGetInfo = async (request, reply) => {
    let result;
    const username = request.query.nearid;
    msg = `Searching all NFT tokens for ${username}`;
    console.log(msg);
    // fastify.log.info(msg);

    try {
        // @ts-ignore
        result = contract.nft_info_for_player(
            username
            //args: { username }
        )
        fastify.log.info(`All minted tokens for ${username}: ${result}`);
    } catch (err) {
        console.log(err);
        fastify.log.error(err);
        return 'Error. For more info see log!';
    }

    return result;
}

// module.exports = {
//     Api,
//     ApiMintNft,
//     ApiGetInfo
// }