import * as store from './store';

import { renderTodos } from './utils';

const input = document.querySelector('input') as HTMLInputElement;
const button = document.querySelector('button') as HTMLButtonElement;
const destroy = document.querySelector('.unsubscribe') as HTMLButtonElement;
const todoList = document.querySelector('.todos') as HTMLLIElement;

const reducers = {
  todos: store.reducer,
};

const ToDOListStore = new store.Store(reducers);

button.addEventListener(
  'click',
  () => {
    if (!input.value.trim()) return;

    const todo = { label: input.value, complete: false };

    ToDOListStore.dispatch(new store.AddTodo(todo));

    input.value = '';
  },
  false
);

const unsubscribe = ToDOListStore.subscribe(state => {
  renderTodos(state.todos.data);
});

destroy.addEventListener('click', unsubscribe, false);

todoList.addEventListener('click', function(event) {
  const target = event.target as HTMLButtonElement;
  if (target.nodeName.toLowerCase() === 'button') {
    const todo = JSON.parse(target.getAttribute('data-todo') as any);
    ToDOListStore.dispatch(new store.RemoveTodo(todo));
  }
});

ToDOListStore.subscribe(state => console.log('The curent STATE TREE is', state));
