import getConnection from '../db';

export const gameInit = async (deviceId) => {
    if (!deviceId) return { status: 400, json: 'deviceID is a required paramter' }
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
        return { status: 200, json: reels };
    } catch (error) {
        conn.release();
        console.log('error', error);
        return {
            status: 500, json: error,
        };
    }
};
