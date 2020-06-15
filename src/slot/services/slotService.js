import fs from 'fs';
import getConnection from './db';

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
export const gameInit = async () => {
    const conn = await getConnection();
    const resp = {
        reelsData: [],
    };
    try {
        const [reels] = await conn.query('select * from reel');
        for (const _reel of reels) {
            const [symbols] = await conn.query(`
            SELECT s.payment_type AS paymentType, s.texture_url AS textureUrl FROM reel_symbol rs
            INNER JOIN reel r ON rs.reel_id = r.id AND r.id = ${_reel.id}
            INNER JOIN symbol s ON rs.symbol_id = s.id
            order by rs.order
        `);
            const symbolsData = [];
            for (const _symbol of symbols) {
                symbolsData.push(_symbol);
            }
            resp.reelsData.push({
                symbolsData,
            });
        }
        conn.release();
        return resp;
    } catch (error) {
        conn.release();
        console.log('error', error);
        return {
            status: 'error',
        };
    }
};
export const spin = async () => {
    const conn = await getConnection();
    try {
        const [reels] = await conn.query('select * from reel');
        const spinResult = [];
        for (const reel of reels) {
            const [reelSymbolCountRows] = await conn.query(`
                select count(*) as count FROM reel_symbol rs WHERE rs.reel_id = ${reel.id}
            `);
            const reelSymbolCount = reelSymbolCountRows[0].count;
            const reelSymbolIndex = Math.floor(Math.random() * reelSymbolCount) + 1;
            const [reelSymbolRows] = await conn.query(`
                select symbol_id symbolId from reel_symbol where reel_id = ${reel.id} limit 1 offset ${reelSymbolIndex - 1}
            `)
            const { symbolId } = reelSymbolRows[0];
            const [symbolRows] = await conn.query(`select * from symbol where id = ${symbolId}`)
            spinResult.push({
                paymentType: symbolRows[0].payment_type,
                textureUrl: symbolRows[0].texture_url,
            });
        }
        await conn.release();
        return spinResult
    } catch (error) {
        console.error(error)
        await conn.release();
        return { status: 'error' }
    }
}
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
