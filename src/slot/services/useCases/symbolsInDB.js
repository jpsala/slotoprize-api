import getConnection from '../db';

export const symbolsInDB = async () => {
    const conn = await getConnection();
    try {
        const [SymbolsRows] = await conn.query('select * from symbol');
        const [reelsRows] = await conn.query('select * from reel');
        const reels = [];
        for (const reel of reelsRows) {
            const [reelRows] = await conn.query(`
                SELECT rs.id as reel_symbol_id, rs.order, s.* FROM reel_symbol rs
                INNER JOIN symbol s ON s.id = rs.symbol_id
                order by rs.order
            `)
            reels.push({
                reel,
                symbols: reelRows,
            });
        }
        await conn.release();
        return { reels, symbols: SymbolsRows }
    } catch (error) {
        console.error(error)
        await conn.release();
        return { status: 'error' }
    }
}
