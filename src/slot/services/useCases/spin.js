import getConnection from '../db';

const runSpin = async () => {
    const conn = await getConnection();
    try {
        const [reels] = await conn.query('select * from reel');
        const spinResultData = [];
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
            spinResultData.push({
                paymentType: symbolRows[0].payment_type,
                // textureUrl: symbolRows[0].texture_url,
            });
        }
        await conn.release();
        console.log('runSpin -> spinResultData', spinResultData)
        return spinResultData
    } catch (error) {
        console.error(error)
        await conn.release();
        return { status: 'error' }
    }
}
const isWin = (spinResults) => {
    const symbols = spinResults
        .map((symbolData) => symbolData.paymentType);
    return symbols.every((val, i, arr) => val === arr[0])
}
export const spin = async () => {
    const spinResults = await runSpin()
    const win = isWin(spinResults)
    console.log('spin -> spinResults', spinResults, win)
    return { symbolsData: spinResults, isWin: win };
}
