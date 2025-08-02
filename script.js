document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');

    // Load todos from local storage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // Function to save todos to local storage
    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    // Function to render todos to the DOM
    const renderTodos = () => {
        todoList.innerHTML = ''; // Clear the list first
        if (todos.length === 0) {
            todoList.innerHTML = '<li class="todo-item" style="justify-content: center; color: #888;">No to-dos yet!</li>';
            return;
        }
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.index = index;

            const span = document.createElement('span');
            span.textContent = todo.text;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';

            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    };

    // Function to add a new todo
    const addTodo = () => {
        const todoText = todoInput.value.trim();
        if (todoText !== '') {
            todos.push({ text: todoText, completed: false });
            todoInput.value = '';
            saveTodos();
            renderTodos();
        }
    };

    // Event listener for the add button
    addBtn.addEventListener('click', addTodo);

    // Event listener for pressing Enter in the input field
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // Event listener for clicks on the todo list (for completing and deleting)
    todoList.addEventListener('click', (e) => {
        const target = e.target;
        const li = target.closest('.todo-item');
        if (!li || !li.dataset.index) return; // Ignore clicks on the "empty" message

        const index = parseInt(li.dataset.index, 10);

        if (target.classList.contains('delete-btn')) {
            todos.splice(index, 1);
        } else if (target.tagName === 'SPAN') {
            todos[index].completed = !todos[index].completed;
        }

        saveTodos();
        renderTodos();
    });

    // Initial render
    renderTodos();
});