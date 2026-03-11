const ANIMALS = [
    { id: 'cat',     name: 'Кот',      emoji: '🐱', legs: 4, fur: true,  swims: false, feathers: false, jumps: false, flies: false, pet: true,  eggs: false },
    { id: 'dog',     name: 'Собака',   emoji: '🐶', legs: 4, fur: true,  swims: false, feathers: false, jumps: false, flies: false, pet: true,  eggs: false },
    { id: 'chicken', name: 'Курица',   emoji: '🐔', legs: 2, fur: false, swims: false, feathers: true,  jumps: false, flies: false, pet: false, eggs: true  },
    { id: 'fish',    name: 'Рыба',     emoji: '🐟', legs: 0, fur: false, swims: true,  feathers: false, jumps: false, flies: false, pet: true,  eggs: true  },
    { id: 'snake',   name: 'Змея',     emoji: '🐍', legs: 0, fur: false, swims: false, feathers: false, jumps: false, flies: false, pet: false, eggs: true  },
    { id: 'rabbit',  name: 'Кролик',   emoji: '🐰', legs: 4, fur: true,  swims: false, feathers: false, jumps: true,  flies: false, pet: true,  eggs: false },
    { id: 'frog',    name: 'Лягушка',  emoji: '🐸', legs: 4, fur: false, swims: true,  feathers: false, jumps: true,  flies: false, pet: false, eggs: true  },
    { id: 'bird',    name: 'Птица',    emoji: '🐦', legs: 2, fur: false, swims: false, feathers: true,  jumps: false, flies: true,  pet: true,  eggs: true  },
    { id: 'turtle',  name: 'Черепаха', emoji: '🐢', legs: 4, fur: false, swims: true,  feathers: false, jumps: false, flies: false, pet: true,  eggs: true  },
];

const QUESTIONS = [
    { text: 'У кого 4 ноги?',                       correct: ['cat', 'dog', 'rabbit', 'frog', 'turtle'] },
    { text: 'У кого есть перья?',                    correct: ['chicken', 'bird'] },
    { text: 'Кто умеет плавать?',                    correct: ['fish', 'frog', 'turtle'] },
    { text: 'У кого совсем нет ног?',                correct: ['fish', 'snake'] },
    { text: 'У кого есть шерсть?',                   correct: ['cat', 'dog', 'rabbit'] },
    { text: 'Кто является домашним питомцем?',       correct: ['cat', 'dog', 'rabbit', 'fish', 'bird', 'turtle'] },
    { text: 'Кто умеет высоко прыгать?',             correct: ['rabbit', 'frog'] },
    { text: 'У кого 2 ноги?',                        correct: ['chicken', 'bird'] },
    { text: 'Кто живёт в воде?',                     correct: ['fish', 'frog', 'turtle'] },
    { text: 'У кого нет шерсти и нет перьев?',       correct: ['fish', 'snake', 'frog', 'turtle'] },
    { text: 'Кто умеет летать?',                     correct: ['bird'] },
    { text: 'Кто откладывает яйца?',                 correct: ['chicken', 'fish', 'snake', 'frog', 'bird', 'turtle'] },
    { text: 'У кого есть перья или крылья?',         correct: ['chicken', 'bird'] },
    { text: 'Кто не может плавать?',                 correct: ['cat', 'dog', 'chicken', 'snake', 'rabbit', 'bird'] },
    { text: 'У кого нет ног вообще?',                correct: ['fish', 'snake'] },
    { text: 'Кто живёт в панцире?',                  correct: ['turtle'] },
    { text: 'Кто умеет и прыгать, и плавать?',       correct: ['frog'] },
    { text: 'Кто не является домашним питомцем?',    correct: ['chicken', 'snake', 'frog'] },
    { text: 'У кого 4 ноги и есть шерсть?',         correct: ['cat', 'dog', 'rabbit'] },
    { text: 'Кто не откладывает яйца?',              correct: ['cat', 'dog', 'rabbit'] },
];

const ROUND_TIMES = [18, 15, 12, 9, 6];

const CARD_W = 100;
const CARD_H = 110;

const Level1 = {
    round: 0,
    totalRounds: 5,
    score: 0,
    correctCount: 0,
    totalTimeLeft: 60,
    shuffledQuestions: [],
    currentQuestion: null,
    foundInRound: [],
    finished: false,
    _visibleAnimalIds: null,

    _roundTimerId: null,
    _roundTimeLeft: 0,
    _roundTimeTotal: 0,

    init() {
        this.round = 0;
        this.score = 0;
        this.correctCount = 0;
        this.totalTimeLeft = 60;
        this.finished = false;
        this.shuffledQuestions = this._shuffle([...QUESTIONS]).slice(0, this.totalRounds);

        TimerManager.start(this.totalTimeLeft, (t) => {
            this.totalTimeLeft = t;
            this._el('timer-display').textContent = t;
            if (t <= 10) this._el('timer-display').style.color = 'var(--error)';
        }, () => {
            if (!this.finished) this.finish(false);
        });

        this._nextRound();
    },

    _nextRound() {
        clearInterval(this._roundTimerId);

        if (this.round >= this.totalRounds) {
            this.finish(true);
            return;
        }
        this.currentQuestion = this.shuffledQuestions[this.round];
        this.foundInRound = [];
        this.round++;
        this._render();
        this._startRoundTimer();
    },

    _render() {
        this._el('round-display').textContent = `Раунд ${this.round} / ${this.totalRounds}`;
        this._el('question-text').textContent = this.currentQuestion.text;
        this._updateScore();

        const field = this._el('game-field');
        field.innerHTML = '';

        const shuffled = this._shuffle([...ANIMALS]);
        const positions = this._generatePositions(
            shuffled.length,
            field.offsetWidth  || 680,
            field.offsetHeight || 320
        );

        const visible = shuffled.slice(0, positions.length);
        this._visibleAnimalIds = new Set(visible.map(a => a.id));

        visible.forEach((animal, i) => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.dataset.id = animal.id;
            card.style.left = positions[i].x + 'px';
            card.style.top  = positions[i].y + 'px';
            card.style.animationDelay = (i * 0.07) + 's';
            card.innerHTML = `
                <div class="animal-emoji">${animal.emoji}</div>
                <div class="animal-name">${animal.name}</div>
            `;

            card.addEventListener('click', () => this._onCardClick(animal, card));
            card.addEventListener('contextmenu', e => {
                e.preventDefault();
                this._showHint(animal, card);
            });

            field.appendChild(card);
        });
    },

    _startRoundTimer() {
        const total = ROUND_TIMES[this.round - 1] || 6;
        this._roundTimeTotal = total;
        this._roundTimeLeft  = total;
        this._updateRoundBar(1);
        this._el('round-timer-display').textContent = total + 'с';

        this._roundTimerId = setInterval(() => {
            this._roundTimeLeft--;
            const ratio = this._roundTimeLeft / this._roundTimeTotal;
            this._updateRoundBar(ratio);
            this._el('round-timer-display').textContent = this._roundTimeLeft + 'с';

            if (this._roundTimeLeft <= 0) {
                clearInterval(this._roundTimerId);
                if (!this.finished) {
                    this.score = Math.max(0, this.score - 5);
                    this._updateScore();
                    NotificationManager.show('Время раунда истекло! −5', 'error', 700);
                    SoundManager.warning();
                    setTimeout(() => this._nextRound(), 600);
                }
            }
        }, 1000);
    },

    _updateRoundBar(ratio) {
        const bar = this._el('round-bar');
        bar.style.width = Math.max(0, ratio * 100) + '%';
        bar.classList.toggle('urgent', ratio < 0.3);
    },

    _onCardClick(animal, card) {
        if (this.finished) return;
        if (card.classList.contains('correct') || card.classList.contains('disabled')) return;

        SoundManager.click();
        const isCorrect = this.currentQuestion.correct.includes(animal.id);

        if (isCorrect) {
            this.score += 10;
            this.correctCount++;
            this.foundInRound.push(animal.id);
            card.classList.add('correct');
            SoundManager.success();

            if (this.correctCount % 2 === 0) {
                this.totalTimeLeft = Math.min(this.totalTimeLeft + 2, 999);
                TimerManager.stop();
                TimerManager.start(this.totalTimeLeft,
                    (t) => {
                        this.totalTimeLeft = t;
                        this._el('timer-display').textContent = t;
                        if (t <= 10) this._el('timer-display').style.color = 'var(--error)';
                    },
                    () => { if (!this.finished) this.finish(false); }
                );
                NotificationManager.show('+2 сек к таймеру!', 'info', 700);
            }

            this._updateScore();

            const visibleCorrect = this.currentQuestion.correct.filter(id => this._visibleAnimalIds.has(id));
            const allFound = visibleCorrect.length > 0 &&
                visibleCorrect.every(id => this.foundInRound.includes(id));
            if (allFound) {
                clearInterval(this._roundTimerId);
                setTimeout(() => this._nextRound(), 600);
            }
        } else {
            this.score = Math.max(0, this.score - 5);
            card.classList.add('wrong');
            SoundManager.error();
            this._updateScore();
            setTimeout(() => card.classList.remove('wrong'), 450);
        }
    },

    _showHint(animal, card) {
        const lines = [];
        if (animal.legs > 0) lines.push(`${animal.legs} ноги`);
        else lines.push('нет ног');
        if (animal.fur)      lines.push('шерсть');
        if (animal.feathers) lines.push('перья');
        if (animal.swims)    lines.push('умеет плавать');
        if (animal.jumps)    lines.push('умеет прыгать');
        if (animal.flies)    lines.push('умеет летать');
        if (animal.eggs)     lines.push('откладывает яйца');
        if (animal.pet)      lines.push('домашний питомец');

        const old = card.querySelector('.hint-badge');
        if (old) old.remove();
        const badge = document.createElement('div');
        badge.className = 'hint-badge';
        badge.textContent = lines.join(' · ');
        card.appendChild(badge);
        setTimeout(() => badge.remove(), 2500);

        NotificationManager.show(`${animal.emoji} ${animal.name}: ${lines.join(', ')}`, 'info', 1800);
    },

    _generatePositions(count, fieldW, fieldH) {
        const jitter = 12;
        const gap    = 8;
        const pad    = 6;

        const cellW = CARD_W + 2 * jitter + gap;
        const cellH = CARD_H + 2 * jitter + gap;

        const cols = Math.max(1, Math.floor((fieldW - 2 * pad) / cellW));
        const rows = Math.max(1, Math.floor((fieldH - 2 * pad) / cellH));

        const cells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cells.push({ col: c, row: r });
            }
        }
        const picked = this._shuffle(cells).slice(0, count);

        return picked.map(({ col, row }) => {
            const baseX = pad + col * cellW + jitter;
            const baseY = pad + row * cellH + jitter;
            return {
                x: Math.max(pad, Math.min(baseX + (Math.random() * 2 - 1) * jitter, fieldW - CARD_W - pad)),
                y: Math.max(pad, Math.min(baseY + (Math.random() * 2 - 1) * jitter, fieldH - CARD_H - pad)),
            };
        });
    },

    _updateScore() {
        this._el('score-display').textContent   = this.score;
        this._el('correct-display').textContent = this.correctCount;
    },

    _el(id) { return document.getElementById(id); },

    finish(success) {
        if (this.finished) return;
        this.finished = true;
        clearInterval(this._roundTimerId);
        TimerManager.stop();

        if (success) {
            const timeBonus = this.totalTimeLeft * 2;
            const result = UserManager.addScore(1, this.score, timeBonus);
            UserManager.updateBestTime(1, 60 - this.totalTimeLeft);
            LeaderboardManager.updatePlayer(UserManager.user);
            SoundManager.success();
            NotificationManager.show(`Уровень пройден! 🎉 +${result.points} очков`, 'success', 3000);
        } else {
            SoundManager.error();
            NotificationManager.show('Время вышло! ⏰', 'error', 2500);
        }
        setTimeout(() => { window.location.href = '../../index.html'; }, 2500);
    },

    restart() {
        clearInterval(this._roundTimerId);
        TimerManager.stop();
        this.finished = false;
        this.init();
    },

    quit() {
        clearInterval(this._roundTimerId);
        TimerManager.stop();
        window.location.href = '../../index.html';
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('gameTheme') || 'light';
    document.body.className = `theme-${theme}`;
    if (!UserManager.user) { window.location.href = '../../index.html'; return; }
    Level1.init();
});
