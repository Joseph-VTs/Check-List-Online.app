-- Cria o banco de dados se ele não existir
CREATE DATABASE IF NOT EXISTS checklist_db;

USE checklist_db;

-- Cria a tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    `order` INT DEFAULT 0, -- Adicionado para a ordenação drag-and-drop
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);