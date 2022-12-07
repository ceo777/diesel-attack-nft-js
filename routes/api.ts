//const controllers = require('../controllers/api');
import * as controllers from '../controllers/api';

async function routes(fastify, options, done) {
    const opts = {
        schema: {
            // mint-nft and get-info requests need to have a querystring with a `nearid` and `appkey` parameters
            querystring: {
                nearid: {type: 'string'},
                // appkey: {type: 'string'}
            }
        }
    }

    fastify.get('/api/', controllers.Api);
    fastify.get('/api/mint-nft', opts, controllers.ApiMintNft);
    fastify.get('/api/get-info', opts, controllers.ApiGetInfo);
    done();
}

//module.exports = routes;
export default routes;