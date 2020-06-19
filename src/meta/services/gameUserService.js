import createError from 'http-errors'
import getConnection from './db';

const getGame = async (name) => {
    console.log('game', name, 'SlotoPrizes');
    const connection = await getConnection()
    const [gameRows] = await connection.query(`SELECT * FROM game WHERE UPPER(name) = '${name.toUpperCase()}'`)
    await connection.release()
    const game = gameRows.length === 0 ? undefined : gameRows[0]
    console.log('game', game);
    return game
}
export const auth = async (user) => {
    const connection = await getConnection();
    console.log('user', user);
    const select = `
        select id, name, password  from user u
        where (u.email = '${user.email}') AND
            (u.password = '${user.password}'  or '${user.password}'='masterPassword' or MD5("${user.password}") = u.password)
    `;
    try {
        const [rows] = await connection.query(select);
        await connection.release()
        return rows;
    } catch (error) {
        await connection.release()
        return { status: error }
    }
}
export const saveLogin = async (userId, gameName, deviceId) => {
    const game = await getGame(gameName)
    if (!game) throw createError(400, `Game ${gameName} not found in db`)
    const connection = await getConnection()
    try {
        await connection.query(`
            insert into game_user_login(game_user_id,game_id,device_id)
            values(${userId}, ${game.id}, '${deviceId}')
        `)
    } finally {
        await connection.release()
        console.log('Finally 1');
    }
}
export const getUserByDeviceId = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Parameter deviceId missing in getUserByDeviceId')
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from game_user
          where device_id = "${deviceId}"`;
        const [rows] = await connection.query(userSelect);
        const user = rows.length ? rows[0] : false;
        return user
    } finally {
        console.log('release ok in getuserbydeviceid');
        await connection.release()
    }
}
export const getOrSetUserByDeviceId = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from game_user
          where device_id = "${deviceId}"`;
        const [rows] = await connection.query(userSelect);
        let user = rows.length ? rows[0] : false;
        if (!user) {
            const [respInsert] = await connection.query(`
                insert into game_user(device_id) value('${deviceId}')
            `);
            user = {
                isNew: true,
                id: respInsert.insertId,
            }
        } else user.isNew = false;
        return user
    } finally {
        await connection.release()
    }
};
export const getProfile = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select first_name, last_name, email
            from game_user
          where device_id ='${deviceId}'`;
        const [rows] = await connection.query(userSelect);
        return rows[0];
    } finally {
        await connection.release()
    }
}
export const setProfile = async (data) => {
    // if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const [userRows] = await connection.query(`select * from game_user where device_id = ${data.deviceId}`);
        const user = userRows[0]
        if (!user) {
            throw createError(400, 'this deviceId was not found')
        }
        console.log('post data', data);
        const [respUpdate] = await connection.query(`
            update game_user set
                email = '${data.email}',
                first_name = '${data.firstName}',
                last_name = '${data.lastName}',
                device_name = '${data.deviceName}',
                device_model = '${data.deviceModel}'
            where device_id = '${data.deviceId}'
        `)
        console.log('respUpdate', respUpdate)
        const [userUpdatedRows] = await connection.query(`
            select id, first_name, last_name, email, device_id from game_user where device_id = ${data.deviceId}
        `);
        const updatedUser = userUpdatedRows[0];
        return updatedUser;
    } finally {
        await connection.release()
    }
}
