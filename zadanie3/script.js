// Массив фраз: [латинский, русский]
const originalPhrases = [
  ["Consuetudo est altera natura", "Привычка — вторая натура"],
  ["Nota bene", "Заметьте хорошо!"],
  ["Nulla calamitas sola", "Беда не приходит одна"],
  ["Per aspera ad astra", "Через тернии к звёздам"]
];

let phrases = [...originalPhrases]; // копия для перемешивания
let clickCount = 0; // счётчик нажатий
const phraseList = document.getElementById('phraseList');

// Функция перемешивания (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Перемешиваем фразы один раз при загрузке
phrases = shuffle(phrases);

document.getElementById('createBtn').addEventListener('click', () => {
  if (phrases.length === 0) {
    alert("Фразы закончились");
    return;
  }

  clickCount++;
  const [latin, russian] = phrases.pop(); // берём последнюю (случайную)

  // Определяем класс: чётное → class1, нечётное → class2
  const className = clickCount % 2 === 0 ? 'class1' : 'class2';

  // Создаём внешний <li>
  const outerItem = document.createElement('li');
  outerItem.textContent = `"${latin}"`;
  outerItem.className = className;

  // Вложенный список с переводом
  const innerList = document.createElement('ol');
  innerList.setAttribute('type', 'a');

  const innerItem = document.createElement('li');
  innerItem.textContent = `"${russian}"`;

  innerList.appendChild(innerItem);
  outerItem.appendChild(innerList);

  phraseList.appendChild(outerItem);
});

// Кнопка "Перекрасить" — делает чётные строки полужирными
document.getElementById('recolorBtn').addEventListener('click', () => {
  const items = phraseList.querySelectorAll('li'); // все <li>, включая вложенные
  // Берём только прямые дочерние элементы (внешние пункты)
  const outerItems = Array.from(items).filter(li => li.parentElement === phraseList);

  outerItems.forEach((item, index) => {
    // Индексация с 1: 1-й, 2-й, ...
    if ((index + 1) % 2 === 0) {
      item.style.fontWeight = 'bold';
    }
  });
});