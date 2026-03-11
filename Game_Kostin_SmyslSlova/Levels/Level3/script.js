const ANTONYM_PAIRS = [
    { word: 'БОЛЬШОЙ',    antonym: 'МАЛЕНЬКИЙ',  distractors: ['ТЁПЛЫЙ',     'БЫСТРЫЙ',   'СВЕТЛЫЙ']   },
    { word: 'ГОРЯЧИЙ',    antonym: 'ХОЛОДНЫЙ',   distractors: ['ТИХИЙ',      'МЯГКИЙ',    'ВЫСОКИЙ']   },
    { word: 'БЫСТРЫЙ',    antonym: 'МЕДЛЕННЫЙ',  distractors: ['ХОЛОДНЫЙ',   'НИЗКИЙ',    'ТЁМНЫЙ']    },
    { word: 'ВЫСОКИЙ',    antonym: 'НИЗКИЙ',     distractors: ['БОЛЬШОЙ',    'ГОРЯЧИЙ',   'МЯГКИЙ']    },
    { word: 'СВЕТЛЫЙ',    antonym: 'ТЁМНЫЙ',     distractors: ['МЕДЛЕННЫЙ',  'ХОЛОДНЫЙ',  'МАЛЕНЬКИЙ'] },
    { word: 'ШИРОКИЙ',    antonym: 'УЗКИЙ',      distractors: ['ТЯЖЁЛЫЙ',    'СЛАДКИЙ',   'ГРОМКИЙ']   },
    { word: 'СТАРЫЙ',     antonym: 'МОЛОДОЙ',    distractors: ['ДЛИННЫЙ',    'КРЕПКИЙ',   'ОСТРЫЙ']    },
    { word: 'ТВЁРДЫЙ',    antonym: 'МЯГКИЙ',     distractors: ['ХОЛОДНЫЙ',   'КОРОТКИЙ',  'ТИХИЙ']     },
    { word: 'ГРОМКИЙ',    antonym: 'ТИХИЙ',      distractors: ['СВЕТЛЫЙ',    'УЗКИЙ',     'ШИРОКИЙ']   },
    { word: 'ДЛИННЫЙ',    antonym: 'КОРОТКИЙ',   distractors: ['СТАРЫЙ',     'МОКРЫЙ',    'ТЁМНЫЙ']    },
    { word: 'СУХОЙ',      antonym: 'МОКРЫЙ',     distractors: ['ТЁПЛЫЙ',     'ЛЁГКИЙ',    'ТИХИЙ']     },
    { word: 'ТЯЖЁЛЫЙ',    antonym: 'ЛЁГКИЙ',     distractors: ['ГОРЯЧИЙ',    'УЗКИЙ',     'ДЛИННЫЙ']   },
    { word: 'ДОБРЫЙ',     antonym: 'ЗЛОЙ',       distractors: ['ТИХИЙ',      'МЯГКИЙ',    'ТЁПЛЫЙ']    },
    { word: 'УМНЫЙ',      antonym: 'ГЛУПЫЙ',     distractors: ['БЫСТРЫЙ',    'ВЫСОКИЙ',   'ОСТРЫЙ']    },
    { word: 'ЧИСТЫЙ',     antonym: 'ГРЯЗНЫЙ',    distractors: ['СУХОЙ',      'ЛЁГКИЙ',    'НОВЫЙ']     },
    { word: 'НОВЫЙ',      antonym: 'СТАРЫЙ',     distractors: ['ГРОМКИЙ',    'МЯГКИЙ',    'ТЁМНЫЙ']    },
    { word: 'СМЕЛЫЙ',     antonym: 'ТРУСЛИВЫЙ',  distractors: ['СИЛЬНЫЙ',    'БЫСТРЫЙ',   'ДОБРЫЙ']    },
    { word: 'ПОЛНЫЙ',     antonym: 'ПУСТОЙ',     distractors: ['ТЯЖЁЛЫЙ',    'БОЛЬШОЙ',   'ШИРОКИЙ']   },
    { word: 'ОСТРЫЙ',     antonym: 'ТУПОЙ',      distractors: ['ТВЁРДЫЙ',    'ТОНКИЙ',    'КОРОТКИЙ']  },
    { word: 'БОГАТЫЙ',    antonym: 'БЕДНЫЙ',     distractors: ['УМНЫЙ',      'ДОБРЫЙ',    'СЧАСТЛИВЫЙ']},
    { word: 'СЧАСТЛИВЫЙ', antonym: 'ГРУСТНЫЙ',   distractors: ['ДОБРЫЙ',     'ТИХИЙ',     'СМЕЛЫЙ']    },
    { word: 'СИЛЬНЫЙ',    antonym: 'СЛАБЫЙ',     distractors: ['БОЛЬШОЙ',    'ТЯЖЁЛЫЙ',   'ТВЁРДЫЙ']   },
];

const QUESTION_TIMES = [25, 20, 15, 10, 7];

const CARD_W = 194;
const CARD_H = 60;

const Level3 = {
    round: 0,
    totalRounds: 5,
    score: 0,
    totalTimeLeft: 120,
    shuffledPairs: [],
    currentPair: null,
    currentOptions: [],
    answerLocked: false,
    finished: false,

    _roundTimerId: null,
    _roundTimeLeft: 0,
    _roundTimeTotal: 0,

    _keyHandler: null,
    _kbIndex: -1,

    init() {
        this.round = 0;
        this.score = 0;
        this.totalTimeLeft = 120;
        this.finished = false;
        this.answerLocked = false;
        this._kbIndex = -1;
        this.shuffledPairs = this._shuffle([...ANTONYM_PAIRS]);

        this._keyHandler = e => this._onKey(e);
        document.addEventListener('keydown', this._keyHandler);

        TimerManager.start(this.totalTimeLeft, (t) => {
            this.totalTimeLeft = t;
            this._el('timer-display').textContent = t;
            if (t <= 20) this._el('timer-display').style.color = 'var(--error)';
        }, () => {
            if (!this.finished) this.finish(false);
        });

        this._nextRound();
    },

    _nextRound() {
        clearInterval(this._roundTimerId);
        this.answerLocked = false;
        this._kbIndex = -1;

        if (this.round >= this.totalRounds) {
            this.finish(true);
            return;
        }
        this.currentPair = this.shuffledPairs[this.round];
        this.round++;
        this._el('round-display').textContent = `Раунд ${this.round} / ${this.totalRounds}`;
        this._updateScore();
        this._renderQuestion();
        this._startRoundTimer();
    },

    _renderQuestion() {
        const pair = this.currentPair;

        const wordEl = this._el('word-display');
        wordEl.textContent = pair.word;
        wordEl.classList.remove('urgent');

        this.currentOptions = this._shuffle([pair.antonym, ...pair.distractors]);

        const field = this._el('game-field');
        field.innerHTML = '';

        const positions = this._generatePositions(
            this.currentOptions.length,
            field.offsetWidth  || 640,
            field.offsetHeight || 270
        );

        this.currentOptions.forEach((text, i) => {
            const card = document.createElement('div');
            card.className = 'answer-card';
            card.dataset.idx = i;
            card.style.left = positions[i].x + 'px';
            card.style.top  = positions[i].y + 'px';
            card.style.animationDelay = (i * 0.07) + 's';
            card.innerHTML = `
                <div class="answer-index">${i + 1}</div>
                <div class="answer-text">${text}</div>
            `;

            card.addEventListener('dblclick', () => this._onAnswer(text, card));
            card.addEventListener('click', () => this._onAnswer(text, card));

            field.appendChild(card);
        });
    },

    _startRoundTimer() {
        const total = QUESTION_TIMES[this.round - 1] || 7;
        this._roundTimeTotal = total;
        this._roundTimeLeft  = total;
        this._updateRoundBar(1);
        this._el('round-timer-display').textContent = total + 'с';

        this._roundTimerId = setInterval(() => {
            this._roundTimeLeft--;
            const ratio = this._roundTimeLeft / this._roundTimeTotal;
            this._updateRoundBar(ratio);
            this._el('round-timer-display').textContent = this._roundTimeLeft + 'с';

            if (ratio < 0.4) this._el('word-display').classList.add('urgent');

            if (this._roundTimeLeft <= 0) {
                clearInterval(this._roundTimerId);
                if (!this.finished) {
                    this.score = Math.max(0, this.score - 10);
                    this._updateScore();
                    NotificationManager.show('Время вопроса истекло! −10', 'error', 700);
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

    _onKey(e) {
        if (this.finished || this.answerLocked) return;
        const cards = Array.from(document.querySelectorAll('.answer-card'));
        const count = cards.length;
        if (!count) return;

        const num = parseInt(e.key);
        if (num >= 1 && num <= count) {
            e.preventDefault();
            const card = cards[num - 1];
            this._onAnswer(this.currentOptions[num - 1], card);
            return;
        }

        if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            this._kbIndex = (this._kbIndex + 1) % count;
            this._highlightKb(cards);
            return;
        }
        if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            this._kbIndex = (this._kbIndex - 1 + count) % count;
            this._highlightKb(cards);
            return;
        }

        if (e.key === 'Enter' && this._kbIndex >= 0) {
            e.preventDefault();
            const card = cards[this._kbIndex];
            this._onAnswer(this.currentOptions[this._kbIndex], card);
        }
    },

    _highlightKb(cards) {
        cards.forEach((c, i) => c.classList.toggle('kb-focus', i === this._kbIndex));
    },

    _onAnswer(text, cardEl) {
        if (this.finished || this.answerLocked) return;
        this.answerLocked = true;
        this._kbIndex = -1;

        SoundManager.click();
        const isCorrect = text === this.currentPair.antonym;

        if (isCorrect) {
            this.score += 20;
            cardEl.classList.add('correct');
            document.querySelectorAll('.answer-card').forEach(c => c.classList.add('disabled'));
            SoundManager.success();
            this._updateScore();
            clearInterval(this._roundTimerId);
            setTimeout(() => this._nextRound(), 700);
        } else {
            this.score = Math.max(0, this.score - 10);
            cardEl.classList.add('wrong');
            SoundManager.error();
            this._updateScore();
            setTimeout(() => {
                cardEl.classList.remove('wrong');
                this.answerLocked = false;
            }, 450);
        }
    },

    _generatePositions(count, fieldW, fieldH) {
        const cols  = 2;
        const rows  = Math.ceil(count / cols);
        const cellW = fieldW / cols;
        const cellH = fieldH / rows;
        const indices = this._shuffle([...Array(count).keys()]);

        return indices.map(idx => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = col * cellW + Math.random() * Math.max(0, cellW - CARD_W - 6) + 3;
            const y = row * cellH + Math.random() * Math.max(0, cellH - CARD_H - 6) + 3;
            return {
                x: Math.max(3, Math.min(x, fieldW - CARD_W - 3)),
                y: Math.max(3, Math.min(y, fieldH - CARD_H - 3)),
            };
        });
    },

    _updateScore() {
        this._el('score-display').textContent = this.score;
    },

    _el(id) { return document.getElementById(id); },

    finish(success) {
        if (this.finished) return;
        this.finished = true;
        clearInterval(this._roundTimerId);
        TimerManager.stop();
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);

        if (success) {
            const timeBonus = this.totalTimeLeft * 3;
            const result = UserManager.addScore(3, this.score, timeBonus);
            UserManager.updateBestTime(3, 120 - this.totalTimeLeft);
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
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        this.finished = false;
        this.init();
    },

    quit() {
        clearInterval(this._roundTimerId);
        TimerManager.stop();
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
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
    Level3.init();
});
