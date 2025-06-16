// Este é o arquivo principal que inicializa o servidor Express e as rotas.

const express = require('express');
const path = require('path');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos (HTML, CSS, JS do front-end)
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Rotas da API
app.use('/api/tasks', tasksRouter);

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});