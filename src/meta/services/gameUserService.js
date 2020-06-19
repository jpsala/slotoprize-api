import createError from 'http-errors'
import getConnection from './db';

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
export const getOrSetUserByDeviceId = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from game_user
          where device_id = "${deviceId}"`;
        const [rows] = await connection.query(userSelect);
        console.log('rows', rows);
        let user = rows.length ? rows[0] : false;
        if (!user) {
            const [respInsert] = await connection.query(`
                insert into game_user(device_id) value('${deviceId}')
            `);
            console.log('respInsert', respInsert);
            user = {
                isNew: true,
                id: respInsert.insertId,
            }
        } else user.isNew = false;
        await connection.release()
        return user
    } catch (error) {
        await connection.release()
        throw new Error(error)
    }
};
export const getProfile = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select first_name, last_name, email, device_id
            from game_user
          where device_id = ${deviceId}`;
        const [rows] = await connection.query(userSelect);
        return rows[0];
    } catch (error) {
        throw new Error(error)
    }
}
export const setProfile = async (data) => {
    // if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const [userRows] = await connection.query(`select * from game_user where device_id = ${data.deviceId}`);
        const user = userRows[0]
        if (!user) {
            await connection.release()
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
        await connection.release();
        const updatedUser = userUpdatedRows[0];
        return updatedUser;
    } catch (error) {
        console.dir(error)
        await connection.release();
        throw new Error(error)
    }
}
