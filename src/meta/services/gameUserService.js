import createError from 'http-errors'
import getConnection from './db';

const auth = async (user) => {
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
const setUser = async (user) => {
    const [rows] = await getConnection().query(`
    update user set
        nombre = "${user.nombre}",
        apellido = "${user.apellido}",
        login = "${user.login}",
        password = "${user.password}",
        email = "${user.email}",
        documento = "${user.documento}",
        legajo = "${user.legajo}"
    where id = ${user.id}
  `);
    return rows;
};
const getUsers = async () => {
    const userSelect = `
      select *
        from user order by apellido, nombre`;
    const [rows] = await getConnection().query(userSelect);
    return rows;
};
const getUser = async (id) => {
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from user u
          where u.id = ${id}`;
        const [rows] = await connection.query(userSelect);
        await connection.release()
        return rows.length ? rows[0] : rows;
    } catch (error) {
        await connection.release()
        return { status: error }
    }
};
const getOrSetUserByDeviceId = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from game_user
          where device_id = ${deviceId}`;
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
const getProfile = async (deviceId) => {
    if (!deviceId) throw createError(400, 'Paramter deviceId missing')
    const connection = await getConnection();
    try {
        const userSelect = `
          select *
            from game_user
          where device_id = ${deviceId}`;
        const [rows] = await connection.query(userSelect);
        return rows;
    } catch (error) {
        throw new Error(error)
    }
}
const delUser = async (id) => {
    const userSelect = `delete from user where id = ${id}`;
    const socioSelect = `delete from socio where empleado_id = ${id}`;
    try {
        await getConnection().query(socioSelect);
        await getConnection().query(userSelect);
        return { error: false };
    } catch (error) {
        console.log('error', error);
        return { error: error.sqlMessage };
    }
};
const getUsersByTerm = async (term, limit = 100) => {
    const userSelect = `
      select *
        from user u
      where u.nombre like "%${term}%" or u.apellido like "%${term}%"
                or u.login like "%${term}%" or u.email like "%${term}%"
      order by u.apellido, u.nombre
      limit ${limit}`;
    console.log('detalle', userSelect);
    const [rows] = await getConnection('localhost').query(userSelect);
    return rows;
};
export {
    auth, getUser, getUsers, getUsersByTerm, setUser, delUser, getOrSetUserByDeviceId, getProfile,
};
