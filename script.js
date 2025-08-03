document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');


    // Load todos from local storage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];


    // --- MIGRATION LOGIC ---
    // This ensures that tasks from previous versions of the app are compatible.
    todos.forEach(todo => {
        // Migrate from old format (boolean `completed`)
        if (typeof todo.completed === 'boolean') {
            todo.status = todo.completed ? 'completed' : 'yet-to-start';
            delete todo.completed;
        }
        // Add startTime to older tasks that don't have it
        if (!todo.startTime) {
            todo.startTime = Date.now();
        }
        if (!todo.status) { // Ensure all todos have a status for robustness
            todo.status = 'yet-to-start';
        }
    });


    // Function to save todos to local storage
    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };


    // Helper function to format duration from milliseconds to a readable string
    const formatDuration = (ms) => {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);


        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);


        // If duration is less than a minute, show "Just now"
        if (parts.length === 0) return 'Just now';


        return parts.join(' ');
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
            li.className = `todo-item ${todo.status}`; // Use status for class
            li.dataset.index = index;


            const span = document.createElement('span');
            span.textContent = todo.text;


            // Create a container for the text and time info
            const textContainer = document.createElement('div');
            textContainer.className = 'todo-text-container';


            // Create element for time info
            const timeInfo = document.createElement('div');
            timeInfo.className = 'time-info';


            const startTimeFormatted = new Date(todo.startTime).toLocaleString();
            const duration = formatDuration(Date.now() - todo.startTime);
            timeInfo.textContent = `Started: ${startTimeFormatted} | Duration: ${duration}`;


            textContainer.appendChild(span);
            textContainer.appendChild(timeInfo);


            // Create the status dropdown
            const statusSelect = document.createElement('select');
            statusSelect.className = 'status-select';
            const statuses = {
                'yet-to-start': 'Yet to start',
                'work-in-progress': 'Work in progress',
                'completed': 'Completed'
            };


            for (const [value, text] of Object.entries(statuses)) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                if (todo.status === value) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            }


            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';


            li.appendChild(textContainer);
            li.appendChild(statusSelect);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    };


    // Function to add a new todo
    const addTodo = () => {
        const todoText = todoInput.value.trim();
        if (todoText !== '') {
            todos.push({
                text: todoText,
                status: 'yet-to-start',
                startTime: Date.now()
            });
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
        // Handle only delete button clicks
        if (e.target.classList.contains('delete-btn')) {
            const li = e.target.closest('.todo-item');
            if (!li || !li.dataset.index) return;


            const index = parseInt(li.dataset.index, 10);
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }
    });


    // Event listener for status changes
    todoList.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('status-select')) {
            const li = target.closest('.todo-item');
            if (!li || !li.dataset.index) return;
            const index = parseInt(li.dataset.index, 10);
            todos[index].status = target.value;
            saveTodos();
            renderTodos();
        }
    });


    // Auto-refresh durations every minute
    setInterval(() => {
        renderTodos();
    }, 60000);


    // Initial render
    renderTodos();
});

