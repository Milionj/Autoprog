//  utilisation de mysql2/promise pour écrire du async/await propre

const mysql = require("mysql2/promise");

// createPool = une "piscine" de connexions réutilisables
const pool =mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_password,
    database: process.env.DB_NAME,

    // options de confort/stabilité
    waitForConnections: true,   // si toutes les connexions sont prises, on attend
    connectionLimit: 10,        // max 10 connexions ouvertes dans le pool
    namedPlaceholders: true     // permet :email dans les requêtes SQL
});

module.exports = { pool };
