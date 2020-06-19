import { createPool } from 'mysql2/promise';

const pool = [];
let acquiredConnections = 0;
let queueSize = 0;
// let poolSize = 0;
export default function getConnection(host = 'localhost') {
    if (pool[host]) {
        // console.log(`db slot reusing, host ${host}`);
        return pool[host].getConnection();
    }
    // console.log(`db slot, host ${host} 1ra. vez`);
    const config = {
        connectionLimit: 10,
        host,
        user: 'jpsala',
        password: 'lani0363',
        database: 'slot',
        debug: false,
        waitForConnections: true,
        multipleStatements: true,
    };
    pool[host] = createPool(config);
    pool[host].on('acquire', () => {
        acquiredConnections += 1;
        console.info('db slot:acquire', acquiredConnections);
        if (acquiredConnections > 5) console.error('verify cant of connections maybe a release is missing');
    });
    pool[host].on('connection', () => {
        // poolSize += 1;
        // console.info('db slot:connection connector.DBConnection.connection', { poolSize, host });
    });
    pool[host].on('enqueue', () => {
        queueSize += 1;
        // export more Prometheus metrics...
        console.error('db slot:enqueue Connection pool is waiting for a connection, posibly a release is missing')
        console.info('db slot:enqueue connector.DBConnection.enqueue', { queueSize });
    });
    pool[host].on('release', () => {
        acquiredConnections -= 1;
        console.info('db slot:release', acquiredConnections);
        //   console.info('connector.DBConnection.release', { acquiredConnections });
    });
    return pool[host].getConnection();
}
