// Define o URL base da API
// Em desenvolvimento, pode ser 'http://localhost:3000'
// Em produção no Vercel, será o URL do seu deployment de back-end
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://checklist-online-app.vercel.app/';

// ... dentro de fetchTasks() e outras funções ...
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`); // Use API_BASE_URL
        // ...
    } catch (error) {
        // ...
    }
}

// ... dentro de addTaskBtn.addEventListener ...
const response = await fetch(`${API_BASE_URL}/api/tasks`, { // Use API_BASE_URL
// ...
});


document.addEventListener('DOMContentLoaded', () => {
    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const pendingTasksList = document.getElementById('pendingTasksList');
    const completedTasksList = document.getElementById('completedTasksList');
    const pendingTasksCount = document.getElementById('pendingTasksCount');
    const completedTasksCount = document.getElementById('completedTasksCount');

    let draggedItem = null;

    // Função para buscar e exibir todas as tarefas
    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            alert('Não foi possível carregar as tarefas. Verifique a conexão com o servidor.');
        }
    }

    // Função para renderizar as tarefas nas listas apropriadas
    function renderTasks(tasks) {
        pendingTasksList.innerHTML = '';
        completedTasksList.innerHTML = '';
        let pendingCount = 0;
        let completedCount = 0;

        tasks.forEach(task => {
            const listItem = createTaskElement(task);
            if (task.completed) {
                completedTasksList.appendChild(listItem);
                completedCount++;
            } else {
                pendingTasksList.appendChild(listItem);
                pendingCount++;
            }
        });

        pendingTasksCount.textContent = pendingCount;
        completedTasksCount.textContent = completedCount;
    }

    // Função para criar um elemento de tarefa DOM
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.classList.add('task-item');
        li.setAttribute('data-id', task.id);
        li.setAttribute('draggable', true); // Torna o item arrastável

        if (task.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.description}</span>
            <button class="delete-btn">Excluir</button>
        `;

        // Event listener para o checkbox
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', async (event) => {
            const newCompletedStatus = event.target.checked;
            await updateTaskStatus(task.id, newCompletedStatus);
        });

        // Event listener para o botão de exclusão
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                await deleteTask(task.id);
            }
        });

        // Eventos Drag and Drop
        li.addEventListener('dragstart', () => {
            draggedItem = li;
            setTimeout(() => li.classList.add('dragging'), 0); // Adiciona classe após um pequeno delay para evitar glitch
        });

        li.addEventListener('dragend', () => {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        });

        return li;
    }

    // Funções para lidar com eventos de arrastar e soltar nas listas
    [pendingTasksList, completedTasksList].forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // Permite que o elemento seja solto
            const afterElement = getDragAfterElement(list, e.clientY);
            const currentItem = document.querySelector('.dragging');
            if (currentItem) {
                if (afterElement == null) {
                    list.appendChild(currentItem);
                } else {
                    list.insertBefore(currentItem, afterElement);
                }
            }
        });

        list.addEventListener('drop', async () => {
            if (draggedItem) {
                const taskId = draggedItem.getAttribute('data-id');
                const targetListStatus = list.getAttribute('data-status') === 'completed';
                const currentTaskStatus = draggedItem.querySelector('input[type="checkbox"]').checked;

                // Se a tarefa foi movida para uma lista diferente, atualiza seu status
                if (targetListStatus !== currentTaskStatus) {
                    await updateTaskStatus(taskId, targetListStatus);
                }

                // Atualiza a ordem visual e persistida
                await updateTaskOrder(list);
            }
        });
    });

    // Função auxiliar para determinar onde inserir o elemento arrastado
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: -Infinity }).element;
    }

    // --- Funções de interação com a API (Front-end -> Back-end) ---

    // Adicionar nova tarefa
    addTaskBtn.addEventListener('click', async () => {
        const description = newTaskInput.value.trim();
        if (description) {
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const newTask = await response.json();
                // Adiciona a nova tarefa diretamente na lista sem recarregar tudo
                const listItem = createTaskElement(newTask);
                pendingTasksList.appendChild(listItem);
                pendingTasksCount.textContent = parseInt(pendingTasksCount.textContent) + 1;
                newTaskInput.value = '';
            } catch (error) {
                console.error('Erro ao adicionar tarefa:', error);
                alert('Não foi possível adicionar a tarefa.');
            }
        } else {
            alert('Por favor, digite a descrição da tarefa.');
        }
    });

    // Atualizar status da tarefa (concluída/pendente)
    async function updateTaskStatus(id, completed) {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Mover o item entre as listas e aplicar/remover estilo
            const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskItem) {
                if (completed) {
                    taskItem.classList.add('completed');
                    completedTasksList.appendChild(taskItem);
                } else {
                    taskItem.classList.remove('completed');
                    pendingTasksList.appendChild(taskItem);
                }
                // Recalcula contadores
                pendingTasksCount.textContent = pendingTasksList.children.length;
                completedTasksCount.textContent = completedTasksList.children.length;

                // Atualiza a ordem da lista que recebeu o item
                const targetList = completed ? completedTasksList : pendingTasksList;
                await updateTaskOrder(targetList);

                 // Se o item foi movido de uma lista para outra, a lista de origem também pode ter sua ordem alterada
                 const originalList = completed ? pendingTasksList : completedTasksList;
                 await updateTaskOrder(originalList);
            }
        } catch (error) {
            console.error(`Erro ao atualizar tarefa ${id}:`, error);
            alert('Não foi possível atualizar a tarefa.');
        }
    }

    // Deletar tarefa
    async function deleteTask(id) {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Remove o item do DOM
            const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskItem) {
                taskItem.remove();
                // Recalcula contadores
                pendingTasksCount.textContent = pendingTasksList.children.length;
                completedTasksCount.textContent = completedTasksList.children.length;
            }
        } catch (error) {
            console.error(`Erro ao deletar tarefa ${id}:`, error);
            alert('Não foi possível excluir a tarefa.');
        }
    }

    // Atualizar a ordem das tarefas em uma lista específica no banco de dados
    async function updateTaskOrder(listElement) {
        const newOrderIds = Array.from(listElement.children).map(item => item.getAttribute('data-id'));
        const status = listElement.getAttribute('data-status');

        if (newOrderIds.length === 0) return; // Nenhuma tarefa na lista para reordenar

        try {
            const response = await fetch(`/api/tasks/reorder/${status}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOrderIds })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // console.log(`Ordem da lista ${status} atualizada com sucesso.`);
        } catch (error) {
            console.error(`Erro ao reordenar tarefas na lista ${status}:`, error);
            alert('Não foi possível salvar a nova ordem das tarefas.');
        }
    }

    // Carregar tarefas ao iniciar a página
    fetchTasks();
});