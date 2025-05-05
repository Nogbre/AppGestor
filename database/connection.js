import sql from 'mssql';

// Definimos los parámetros de la base de datos
// const dbSettings = {
//     user : "sa",
//     password : "yourStrong#Password",
//     server : "localhost",
//     database : "Inventario",
//     options: {
//         encrypt:false,
//         trustServerCertificate: true
//     }
// }

const dbSettings = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };


// Función para obtener la conexión a la base de datos
export const getConnection = async () => {
    try {
        // Intentamos conectarnos a la base de datos
        const pool = await sql.connect(dbSettings);
        console.log("✅ Conectado a SQL Server");
        return pool;
    } catch (error) {
        // Si ocurre un error de conexión, lo mostramos
        console.error("❌ Error connecting to SQL Server:", error);
        return null;
    }
};