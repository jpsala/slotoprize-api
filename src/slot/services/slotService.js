import fs from 'fs';
import getConnection from './db';

export * from './useCases/gameInit'

export * from './useCases/spin'

export const proccessReelsDataFromFS = async () => {
    return { status: 'Closed endpoint' }
    // eslint-disable-next-line no-unreachable
    const files = fs.readdirSync('/var/www/html/public/assets/symbols/food');
    const conn = await getConnection();
    await conn.beginTransaction();
    try {
        await conn.query('delete from reel_symbol');
        await conn.query('delete from symbol');
        const [reels] = await conn.query('select * from reel');
        for (const _file of files) {
            const filename = _file.split('.')[0];
            const [result] = await conn.query(`
                insert into symbol(payment_type, texture_url)
                    values(
                        "${filename}",
                        "http://wopidom.homelinux.com/public/assets/symbols/food/${_file}")
                `);
            const symbolId = result.insertId;
            for (const _reel of reels) {
                const reelId = _reel.id;
                await conn.query(
                    'insert into reel_symbol(reel_id, symbol_id) values(?,?)',
                    [reelId, symbolId],
                );
            }
        }
        await conn.query('COMMIT');
        await conn.release();
        return {
            status: 'ok',
        };
    } catch (error) {
        console.log('error', error);
        await conn.query('ROLLBACK');
        await conn.release();
        return {
            status: 'error',
        };
    }
};
export const proccessReelsData = async () => {
    return { status: 'Closed endpoint' }
    // eslint-disable-next-line no-unreachable
    const conn = await getConnection();
    await conn.beginTransaction();
    try {
        // borremos todo primero
        await conn.query('delete from reel_symbol');
        await conn.query('delete from symbol');
        const [reels] = await conn.query('select * from reel');
        for (const _reelsData of jsonData.reelsData) {
            for (const _symbol of _reelsData.symbolsData) {
                const { paymentType } = _symbol;
                const [doesSymbolExistsRow] = await conn.query(`
            select count(*) cant from symbol where payment_type = "${paymentType}"
        `);
                const doesSymbolExists = +doesSymbolExistsRow[0].cant > 0;
                if (!doesSymbolExists) {
                    const [result] = await conn.query(`
            insert into symbol(payment_type, texture_url)
                values(
                    "${paymentType}",
                    "http://wopidom.homelinux.com/public/assets/symbols/food/${paymentType}.png")
            `);
                    const symbolId = result.insertId;
                    reels.forEach(async (_reel) => {
                        const reelId = _reel.id;
                        await conn.query(
                            'insert into reel_symbol(reel_id, symbol_id) values(?,?)',
                            [reelId, symbolId],
                        );
                    });
                }
            }
        }
        // eslint-disable-next-line no-unreachable
        await conn.query('COMMIT');
        await conn.release();
        return {
            status: 'ok',
        };
    // eslint-disable-next-line no-unreachable
    } catch (error) {
        console.log('error', error);
        await conn.query('ROLLBACK');
        await conn.release();
        return {
            status: 'error',
        };
    }
};

const jsonData = {
    reelsData: [
        {
            symbolsData: [
                {
                    paymentType: 'tangerines',
                    textureUrl: '',
                },
                {
                    paymentType: 'jellyBear',
                    textureUrl: '',
                },
                {
                    paymentType: 'eggs',
                    textureUrl: '',
                },
                {
                    paymentType: 'banana',
                    textureUrl: '',
                },
                {
                    paymentType: 'appleStump',
                    textureUrl: '',
                },
                {
                    paymentType: 'alga',
                    textureUrl: '',
                },
                {
                    paymentType: 'fish',
                    textureUrl: '',
                },
            ],
        },
        {
            symbolsData: [
                {
                    paymentType: 'tangerines',
                    textureUrl: '',
                },
                {
                    paymentType: 'jellyBear',
                    textureUrl: '',
                },
                {
                    paymentType: 'eggs',
                    textureUrl: '',
                },
                {
                    paymentType: 'banana',
                    textureUrl: '',
                },
                {
                    paymentType: 'appleStump',
                    textureUrl: '',
                },
                {
                    paymentType: 'alga',
                    textureUrl: '',
                },
                {
                    paymentType: 'fish',
                    textureUrl: '',
                },
            ],
        },
        {
            symbolsData: [
                {
                    paymentType: 'tangerines',
                    textureUrl: '',
                },
                {
                    paymentType: 'jellyBear',
                    textureUrl: '',
                },
                {
                    paymentType: 'eggs',
                    textureUrl: '',
                },
                {
                    paymentType: 'banana',
                    textureUrl: '',
                },
                {
                    paymentType: 'appleStump',
                    textureUrl: '',
                },
                {
                    paymentType: 'alga',
                    textureUrl: '',
                },
                {
                    paymentType: 'fish',
                    textureUrl: '',
                },
            ],
        },
    ],
};
