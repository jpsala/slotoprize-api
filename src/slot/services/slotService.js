import getPool from './db';

const fs = require('fs');

export const proccessReelsDataFromFS = async () => {
  const files = await fs.readdirSync('/var/www/html/public/assets/symbols/food')
  console.log('files', files);
  return files;
}
export const proccessReelsData = async () => {
  const pool = await getPool();
  const conn = await pool.getConnection();
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
        console.log(paymentType, doesSymbolExistsRow[0]);
        const doesSymbolExists = +doesSymbolExistsRow[0].cant > 0;
        if (!doesSymbolExists) {
          const [result] = await conn.query(`
            insert into symbol(payment_type, texture_url)
                values(
                    "${paymentType}",
                    "http://wopidom.homelinux.com/public/assets/symbols/food/${paymentType}.png")
            `);
          const [eee] = await conn.query(`
                select * from symbol
            `);
          console.log('detalle', eee);
          const symbolId = result.insertId;
          reels.forEach(async (_reel) => {
            const reelId = _reel.id;
            await conn.query('insert into reel_symbol(reel_id, symbol_id) values(?,?)',
              [reelId, symbolId]);
          });
        }
      }
    }
    await conn.query('COMMIT');
    await conn.release()
    return { status: 'ok' };
  } catch (error) {
    console.log('error', error);
    await conn.query('ROLLBACK')
    await conn.release()
    return { status: 'error' };
  }
};

export const gameInit = async () => {
  const pool = await getPool();
  const conn = await pool.getConnection();
  const resp = { reelsData: [] };
  try {
    const [reels] = await conn.query('select * from reel');
    for (const _reel of reels) {
      const [symbols] = await conn.query(`
            SELECT s.payment_type AS paymentType, s.texture_url AS textureUrl FROM reel_symbol rs
            INNER JOIN reel r ON rs.reel_id = r.id AND r.id = ${_reel.id}
            INNER JOIN symbol s ON rs.symbol_id = s.id
        `)
      const symbolsData = [];
      for (const _symbol of symbols) {
        symbolsData.push(_symbol)
      }
      resp.reelsData.push({ symbolsData })
    }
    console.log('sy', resp.reelsData);
    conn.release()
    return resp;
  } catch (error) {
    conn.release();
    console.log('error', error);
    return { status: 'error' }
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
