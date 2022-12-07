// Diesel Attack NFT backend server 1.2.0

import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import routes from './routes/api';

const fastify : FastifyInstance = Fastify({
    logger: {
        level: 'info',
        file: './api.log'
    }
});

//const port = process.env.PORT || 4000;

// One should create api.log file in project root directory if it doesn't exist
// const fastify = require('fastify')({
//     logger: {
//         level: 'info',
//         file: './api.log'
//     }
// });

fastify.register(routes);

const start = async () => {
    try {
        // await fastify.listen({port});
        await fastify.listen({ port: 4000 });

        const address = fastify.server.address();
        const port = typeof address === 'string' ? address : address?.port;

        console.log(`Diesel Attack NFT backend server v1.2.0 is listening at localhost: ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();