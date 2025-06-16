// Configuração de Conexão com o MySQL

const mysql = require('mysql2/promise'); // Estou usando a versão com Promises para facilitar o async/await

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'checklist_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;