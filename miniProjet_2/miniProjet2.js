// Sélection des éléments
const addForm = document.querySelector('.add');
const todoList = document.querySelector('.todos');
const searchInput = document.querySelector('.search input');

// Ajouter une tâche
addForm.addEventListener('submit', e => {
    e.preventDefault();
    const todoText = addForm.add.value.trim();
    if (todoText) {
        todoList.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${todoText}</span>
                <i class="far fa-trash-alt delete"></i>
            </li>
        `;
        addForm.reset();
    }
});

// Supprimer une tâche
todoList.addEventListener('click', e => {
    if (e.target.classList.contains('delete')) {
        e.target.parentElement.remove();
    }
});

// Filtrer les tâches
searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    Array.from(todoList.children).forEach(todo => {
        const todoText = todo.querySelector('span').textContent.toLowerCase();
        todo.classList.toggle('hidden', !todoText.includes(term));
    });
});