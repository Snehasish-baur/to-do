document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const colorThemeBtn = document.getElementById('color-theme-btn');
    const body = document.body;


    // --- THEME & MODE SWITCHER LOGIC ---


    // --- Dark/Light Mode Logic ---
    const applyMode = () => {
        const savedMode = localStorage.getItem('mode') || 'light';
        if (savedMode === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = savedMode === 'light' ? '🌙' : '☀️';
            themeToggleBtn.setAttribute('aria-label', savedMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
        }
    };


    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newMode = body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('mode', newMode);
            applyMode();
        });
    }


    // --- Color Theme Logic ---
    const allThemeClasses = ['theme-ocean', 'theme-forest']; // Amethyst is default (no class)
    const themeCycleOrder = ['theme-amethyst', 'theme-ocean', 'theme-forest'];
    const themeIcons = {
        'theme-amethyst': '🎨',
        'theme-ocean': '🌊',
        'theme-forest': '🌲'
    };


    const applyColorTheme = (themeName) => {
        body.classList.remove(...allThemeClasses);
        if (themeName !== 'theme-amethyst') {
            body.classList.add(themeName);
        }
        localStorage.setItem('colorTheme', themeName);
        if (colorThemeBtn) {
            colorThemeBtn.innerHTML = themeIcons[themeName] || '🎨';
        }
    };


    if (colorThemeBtn) {
        colorThemeBtn.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('colorTheme') || 'theme-amethyst';
            const currentIndex = themeCycleOrder.indexOf(currentTheme);
            const nextTheme = themeCycleOrder[(currentIndex + 1) % themeCycleOrder.length];
            applyColorTheme(nextTheme);
        });
    }


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
        if (todo.details === undefined) { // Add details property if it doesn't exist
            todo.details = '';
        }
        if (todo.isEditing === undefined) { // Add editing property
            todo.isEditing = false;
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


    // Helper function to find and convert URLs in text to clickable links
    const autoLinkUrls = (html) => {
        const urlPattern = /((?:https?:\/\/|www\.)[^\s<>"'.,!?;:]+)/gi;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;


        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        // Collect all text nodes that are not already inside a link
        while (walker.nextNode()) {
            if (!walker.currentNode.parentElement.closest('a')) {
                textNodes.push(walker.currentNode);
            }
        }


        textNodes.forEach(node => {
            const text = node.nodeValue;
            // Use replace with a function to create the link
            const newHtml = text.replace(urlPattern, (match) => {
                const url = match.startsWith('www.') ? `https://${match}` : match;
                // Use rel="noopener noreferrer" for security
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
            });
            // If the content changed, replace the text node with a new fragment
            if (newHtml !== text) {
                const replacementFragment = document.createRange().createContextualFragment(newHtml);
                node.replaceWith(replacementFragment);
            }
        });
        return tempDiv.innerHTML;
    };
    // Function to render todos to the DOM
    const renderTodos = () => {
        todoList.innerHTML = ''; // Clear the list first
        if (todos.length === 0) {
            // Use a class for styling the empty message, defined in CSS
            todoList.innerHTML = '<li class="todo-item empty-list-message">No to-dos yet!</li>';
            return;
        }
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = todo.text;


            // Base class for all items.
            li.className = `todo-item status-${todo.status}`; // Add status class for CSS styling
            li.dataset.index = index;




            // Create status icon based on todo status
            const statusIcon = document.createElement('span');
            statusIcon.className = 'status-icon';
            // Set icon text content based on status. Colors are now handled by CSS.
            switch (todo.status) {
                case 'completed':
                    statusIcon.textContent = '✓';
                    break;
                case 'work-in-progress':
                    statusIcon.textContent = '--';
                    break;
                case 'yet-to-start':
                default:
                    statusIcon.textContent = '✗';
                    break;
            }


            // Create a container for the text and time info
            const textContainer = document.createElement('div');
            textContainer.className = 'todo-text-container';


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


            if (todo.isEditing) {
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.className = 'edit-input';
                editInput.value = todo.text;
                textContainer.appendChild(editInput);
                // Auto-focus and select text
                setTimeout(() => {
                    editInput.focus();
                    editInput.select();
                }, 0);
            } else {
                textContainer.appendChild(span);


                // Create element for time info
                const timeInfo = document.createElement('div');
                timeInfo.className = 'time-info';
                const startTimeFormatted = new Date(todo.startTime).toLocaleString();
                const duration = formatDuration(Date.now() - todo.startTime);
                timeInfo.textContent = `Started: ${startTimeFormatted} | Duration: ${duration}`;
                textContainer.appendChild(timeInfo);
                textContainer.appendChild(statusSelect);
            }
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&#128465;'; // Dustbin icon
            deleteBtn.title = 'Delete Task'; // Accessibility tooltip


            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            if (todo.isEditing) {
                editBtn.innerHTML = '✓'; // Save icon
                editBtn.title = 'Save Task';
            } else {
                editBtn.innerHTML = '✏️'; // Edit icon (pen)
                editBtn.title = 'Edit Task';
            }


            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'details-btn';
            if (todo.isDetailsOpen) {
                detailsBtn.textContent = '−'; // Minus sign
                detailsBtn.title = 'Close Details';
            } else {
                detailsBtn.textContent = '+';
                detailsBtn.title = 'Open Details';
            }
            li.appendChild(statusIcon);
            li.appendChild(textContainer);
            li.appendChild(editBtn);
            li.appendChild(detailsBtn);
            li.appendChild(deleteBtn);


            // If details view is open for this todo, render the editor
            if (todo.isDetailsOpen) {
                const detailsContainer = document.createElement('div');
                detailsContainer.className = 'details-inline-container';


                // --- Create Toolbar ---
                const toolbar = document.createElement('div');
                toolbar.className = 'details-toolbar';


                const createToolbarButton = (command, title, content) => {
                    const button = document.createElement('button');
                    button.className = 'toolbar-btn';
                    button.title = title;
                    button.dataset.command = command; // Add command for state checking
                    button.innerHTML = content;
                    button.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // Prevent editor from losing focus
                        if (command === 'createLink') {
                            const url = prompt('Enter the URL:', 'https://');
                            if (url) {
                                document.execCommand(command, false, url);
                            }
                        } else {
                            document.execCommand(command, false, null);
                        }
                        updateToolbar(); // Re-check state after executing a command
                    });
                    return button;
                };


                toolbar.appendChild(createToolbarButton('bold', 'Bold', '<b>B</b>'));
                toolbar.appendChild(createToolbarButton('italic', 'Italic', '<i>I</i>'));
                toolbar.appendChild(createToolbarButton('underline', 'Underline', '<u>U</u>'));
                toolbar.appendChild(createToolbarButton('createLink', 'Add Link', '🔗'));


                // --- Create Editor ---
                const detailsEditor = document.createElement('div');
                detailsEditor.className = 'details-editor';
                detailsEditor.contentEditable = true;
                detailsEditor.innerHTML = todo.details || '';


                // --- Toolbar State Update Logic ---
                const updateToolbar = () => {
                    const buttons = toolbar.querySelectorAll('.toolbar-btn');
                    buttons.forEach(btn => {
                        // Only check commands that have a state (e.g., not 'createLink')
                        if (btn.dataset.command !== 'createLink') {
                            const isActive = document.queryCommandState(btn.dataset.command);
                            btn.classList.toggle('is-active', isActive);
                        }
                    });
                };


                detailsEditor.addEventListener('keyup', updateToolbar);
                detailsEditor.addEventListener('mouseup', updateToolbar);
                detailsEditor.addEventListener('focus', updateToolbar);


                detailsContainer.appendChild(toolbar);
                detailsContainer.appendChild(detailsEditor);
                li.appendChild(detailsContainer);
            }
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
                startTime: Date.now(),
                details: '',
                isEditing: false
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
        const target = e.target;


        // Handle delete button clicks
        if (target.classList.contains('delete-btn')) {
            const li = target.closest('.todo-item');
            if (!li || !li.dataset.index) return;
            const index = parseInt(li.dataset.index, 10);
            const taskText = todos[index].text;


            // Add a confirmation dialog before deleting
            if (confirm(`Are you sure you want to delete this task:\n"${taskText}"`)) {
                li.classList.add('removing'); // Add class to trigger animation


                // Wait for animation to finish before removing from data and re-rendering
                li.addEventListener('animationend', () => {
                    todos.splice(index, 1);
                    saveTodos();
                    renderTodos();
                }, { once: true }); // Use { once: true } to auto-remove listener
            }
        }
        // Handle details button clicks to toggle the editor
        else if (target.classList.contains('details-btn')) {
            const li = e.target.closest('.todo-item');
            if (!li || !li.dataset.index) return;
            const clickedIndex = parseInt(li.dataset.index, 10);


            // Find if there's a currently open details section
            const openIndex = todos.findIndex(t => t.isDetailsOpen);


            // If a section is open, save its content before doing anything else.
            // This ensures data is not lost when switching between detail views.
            if (openIndex !== -1) {
                const openLi = todoList.querySelector(`.todo-item[data-index='${openIndex}']`);
                if (openLi) {
                    // Changed from textarea to the contenteditable div
                    const editor = openLi.querySelector('.details-editor');
                    if (editor) {
                        let content = editor.innerHTML.trim();
                        content = autoLinkUrls(content); // Autolink the content
                        todos[openIndex].details = content;
                    }
                }
            }


            // Determine the new state. If we clicked the button of an already
            // open item, we are closing it. Otherwise, we are opening a new one.
            const isOpeningNew = (openIndex !== clickedIndex);


            // Close all detail views in the data model
            todos.forEach(t => t.isDetailsOpen = false);


            // If we are opening a new one, set its state to open
            if (isOpeningNew) {
                todos[clickedIndex].isDetailsOpen = true;
            }
            saveTodos(); // Save any detail changes and the new open/closed states
            renderTodos(); // Re-render the UI
        }
        // Handle edit button clicks
        else if (target.classList.contains('edit-btn')) {
            const li = target.closest('.todo-item');
            if (!li || !li.dataset.index) return;
            const clickedIndex = parseInt(li.dataset.index, 10);


            // Find and save any other item that is currently being edited
            const currentlyEditingIndex = todos.findIndex(t => t.isEditing);
            if (currentlyEditingIndex !== -1 && currentlyEditingIndex !== clickedIndex) {
                const currentlyEditingLi = todoList.querySelector(`.todo-item[data-index='${currentlyEditingIndex}']`);
                const input = currentlyEditingLi.querySelector('.edit-input');
                if (input && input.value.trim()) {
                    todos[currentlyEditingIndex].text = input.value.trim();
                }
                todos[currentlyEditingIndex].isEditing = false;
            }


            // Find and save any open details section
            const openDetailsIndex = todos.findIndex(t => t.isDetailsOpen);
            if (openDetailsIndex !== -1) {
                const openDetailsLi = todoList.querySelector(`.todo-item[data-index='${openDetailsIndex}']`);
                const editor = openDetailsLi.querySelector('.details-editor');
                if (editor) {
                    let content = editor.innerHTML.trim();
                    content = autoLinkUrls(content); // Autolink the content
                    todos[openDetailsIndex].details = content;
                }
                todos[openDetailsIndex].isDetailsOpen = false;
            }


            // Toggle the editing state for the clicked item
            const wasEditing = todos[clickedIndex].isEditing;
            todos[clickedIndex].isEditing = !wasEditing;


            // If we just finished editing, save the new text from the input
            if (wasEditing) {
                const input = li.querySelector('.edit-input');
                if (input && input.value.trim()) {
                    todos[clickedIndex].text = input.value.trim();
                }
            }
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


    // Event listener for Enter/Escape keys in edit mode
    todoList.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('edit-input')) {
            const li = e.target.closest('.todo-item');
            if (!li || !li.dataset.index) return;
            const index = parseInt(li.dataset.index, 10);


            if (e.key === 'Enter') {
                const newText = e.target.value.trim();
                if (newText) {
                    todos[index].text = newText;
                }
                todos[index].isEditing = false;
                saveTodos();
                renderTodos();
            } else if (e.key === 'Escape') {
                todos[index].isEditing = false;
                // Don't save, just re-render to cancel
                renderTodos();
            }
        }
    });


    // Auto-refresh durations every minute
    setInterval(() => {
        renderTodos();
    }, 60000);


    // --- Initial Setup on Page Load ---
    const savedColorTheme = localStorage.getItem('colorTheme') || 'theme-amethyst';
    applyColorTheme(savedColorTheme); // Apply saved color theme
    applyMode(); // Apply the saved dark/light mode
    renderTodos();
});



