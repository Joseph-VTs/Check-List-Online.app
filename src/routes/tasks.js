// Este arquivo conterá as rotas para operações CRUD (Create, Read, Update, Delete) nas tarefas.

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para obter todas as tarefas (pendentes e resolvidas)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tasks ORDER BY completed ASC, `order` ASC, created_at ASC');
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar tarefas:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar tarefas.' });
    }
});

// Rota para adicionar uma nova tarefa
router.post('/', async (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ error: 'A descrição da tarefa é obrigatória.' });
    }

    try {
        // Encontra o maior 'order' para novas tarefas pendentes e adiciona +1
        const [maxOrderResult] = await db.execute('SELECT MAX(`order`) AS max_order FROM tasks WHERE completed = FALSE');
        const newOrder = (maxOrderResult[0].max_order || 0) + 1;

        const [result] = await db.execute(
            'INSERT INTO tasks (description, `order`) VALUES (?, ?)',
            [description, newOrder]
        );
        res.status(201).json({ id: result.insertId, description, completed: false, order: newOrder });
    } catch (err) {
        console.error('Erro ao adicionar tarefa:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar tarefa.' });
    }
});

// Rota para atualizar uma tarefa (marcar como concluída, atualizar descrição, ou ordem)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { description, completed, order } = req.body;

    try {
        let query = 'UPDATE tasks SET ';
        const params = [];
        const updates = [];

        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            params.push(completed);
        }
        if (order !== undefined) {
            updates.push('`order` = ?');
            params.push(order);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
        }

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.json({ message: 'Tarefa atualizada com sucesso.' });
    } catch (err) {
        console.error(`Erro ao atualizar tarefa ${id}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar tarefa.' });
    }
});

// Rota para deletar uma tarefa
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }
        res.json({ message: 'Tarefa excluída com sucesso.' });
    } catch (err) {
        console.error(`Erro ao deletar tarefa ${id}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor ao deletar tarefa.' });
    }
});

// Rota para reordenar tarefas (após drag-and-drop)
router.put('/reorder/:status', async (req, res) => {
    const { status } = req.params; // 'pending' ou 'completed'
    const { newOrderIds } = req.body; // Array de IDs na nova ordem

    if (!Array.isArray(newOrderIds) || newOrderIds.length === 0) {
        return res.status(400).json({ error: 'Array de IDs para reordenar é inválido.' });
    }

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        for (let i = 0; i < newOrderIds.length; i++) {
            const taskId = newOrderIds[i];
            const newOrderValue = i + 1; // Ordem começa de 1

            await connection.execute(
                'UPDATE tasks SET `order` = ? WHERE id = ? AND completed = ?',
                [newOrderValue, taskId, status === 'completed']
            );
        }

        await connection.commit();
        connection.release();
        res.json({ message: 'Tarefas reordenadas com sucesso.' });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Erro ao reordenar tarefas:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao reordenar tarefas.' });
    }
});

module.exports = router;