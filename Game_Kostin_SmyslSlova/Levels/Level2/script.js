const PROFESSIONS = [
    { id: 'doctor',    name: 'Врач',      emoji: '👨‍⚕️' },
    { id: 'builder',   name: 'Строитель', emoji: '👷' },
    { id: 'teacher',   name: 'Учитель',   emoji: '👩‍🏫' },
    { id: 'cook',      name: 'Повар',     emoji: '👨‍🍳' },
    { id: 'artist',    name: 'Художник',  emoji: '👨‍🎨' },
    { id: 'driver',    name: 'Водитель',  emoji: '🚗' },
    { id: 'fireman',   name: 'Пожарный',  emoji: '🧑‍🚒' },
    { id: 'farmer',    name: 'Фермер',    emoji: '🧑‍🌾' },
    { id: 'scientist', name: 'Учёный',    emoji: '🧑‍🔬' },
    { id: 'musician',  name: 'Музыкант',  emoji: '🎵' },
];

const TOOLS = [
    { id: 'stethoscope', name: 'Стетоскоп',   emoji: '🩺',  professions: ['doctor']             },
    { id: 'trowel',      name: 'Мастерок',     emoji: '🧱',  professions: ['builder']            },
    { id: 'chalk',       name: 'Мел',          emoji: '✏️',  professions: ['teacher', 'artist']  },
    { id: 'knife',       name: 'Нож повара',   emoji: '🔪',  professions: ['cook']               },
    { id: 'brush',       name: 'Кисть',        emoji: '🖌️', professions: ['artist', 'builder']  },
    { id: 'keys',        name: 'Ключи',        emoji: '🔑',  professions: ['driver']             },
    { id: 'extinguish',  name: 'Огнетушитель', emoji: '🧯',  professions: ['fireman']            },
    { id: 'rake',        name: 'Грабли',       emoji: '🌾',  professions: ['farmer']             },
    { id: 'microscope',  name: 'Микроскоп',    emoji: '🔬',  professions: ['scientist', 'doctor']},
    { id: 'guitar',      name: 'Гитара',       emoji: '🎸',  professions: ['musician']           },
    { id: 'ruler',       name: 'Линейка',      emoji: '📏',  professions: ['teacher', 'builder'] },
    { id: 'bandage',     name: 'Бинт',         emoji: '🩹',  professions: ['doctor', 'fireman']  },
];

const ROUND_TIMES_L2 = [20, 17, 14, 11, 8];

const ZONE_W = 114;
const ZONE_H = 120;

const Level2 = {
    round: 0,
    totalRounds: 5,
    score: 0,
    correctCount: 0,
    totalTimeLeft: 90,
    shuffledTools: [],
    roundProfessions: [],
    currentTool: null,
    finished: false,

    _roundTimerId: null,
    _roundTimeLeft: 0,
    _roundTimeTotal: 0,
    _toolSelected: false,
    _keyHandler: null,
    _dragOver: null,

    init() {
        this.round = 0;
        this.score = 0;
        this.correctCount = 0;
        this.totalTimeLeft = 90;
        this.finished = false;
        this._toolSelected = false;

        this.shuffledTools = this._shuffle([...TOOLS]).slice(0, this.totalRounds);

        const profIds = [...new Set(this.shuffledTools.flatMap(t => t.professions))];
        this.roundProfessions = profIds
            .map(id => PROFESSIONS.find(p => p.id === id))
            .filter(Boolean);

        this._keyHandler = e => this._onKey(e);
        document.addEventListener('keydown', this._keyHandler);

        TimerManager.start(this.totalTimeLeft, (t) => {
            this.totalTimeLeft = t;
            this._el('timer-display').textContent = t;
            if (t <= 15) this._el('timer-display').style.color = 'var(--error)';
        }, () => {
            if (!this.finished) this.finish(false);
        });

        this._renderField();
        this._nextRound();
    },

    _renderField() {
        const field = this._el('game-field');
        field.innerHTML = '';

        const positions = this._generatePositions(
            this.roundProfessions.length,
            field.offsetWidth  || 720,
            field.offsetHeight || 380
        );

        this.roundProfessions.forEach((prof, i) => {
            const zone = document.createElement('div');
            zone.className = 'profession-zone';
            zone.dataset.id = prof.id;
            zone.style.left = positions[i].x + 'px';
            zone.style.top  = positions[i].y + 'px';
            zone.style.animationDelay = (i * 0.07) + 's';
            zone.innerHTML = `
                <span class="key-num">${i + 1}</span>
                <div class="profession-emoji">${prof.emoji}</div>
                <div class="profession-name">${prof.name}</div>
            `;

            zone.addEventListener('dragover', e => {
                e.preventDefault();
                if (this._dragOver !== zone) {
                    if (this._dragOver) this._dragOver.classList.remove('drag-over');
                    this._dragOver = zone;
                    zone.classList.add('drag-over');
                }
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
                if (this._dragOver === zone) this._dragOver = null;
            });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                this._dragOver = null;
                this._tryAnswer(prof.id, zone);
            });

            zone.addEventListener('click', () => {
                if (this._toolSelected) this._tryAnswer(prof.id, zone);
            });
            zone.addEventListener('mouseenter', () => {
                if (this._toolSelected) zone.classList.add('click-hover');
            });
            zone.addEventListener('mouseleave', () => {
                zone.classList.remove('click-hover');
            });

            field.appendChild(zone);
        });

        const hint = document.querySelector('.event-hint');
        if (hint) {
            hint.innerHTML = `Drag&amp;Drop &nbsp;|&nbsp; Клик по инструменту → клик по профессии &nbsp;|&nbsp; Клавиши 1–${this.roundProfessions.length}`;
        }
    },

    _nextRound() {
        clearInterval(this._roundTimerId);
        this._toolSelected = false;

        if (this.round >= this.totalRounds) {
            this.finish(true);
            return;
        }

        this.currentTool = this.shuffledTools[this.round];
        this.round++;
        this._el('round-display').textContent = `Раунд ${this.round} / ${this.totalRounds}`;
        this._updateScore();
        this._renderTool();
        this._startRoundTimer();
    },

    _renderTool() {
        const area = this._el('tool-area');
        area.innerHTML = '';
        const tool = this.currentTool;
        const isMulti = tool.professions.length > 1;

        const card = document.createElement('div');
        card.className = 'tool-card';
        card.draggable = true;
        card.id = 'current-tool';
        card.innerHTML = `
            <div class="tool-emoji">${tool.emoji}</div>
            <div class="tool-name">${tool.name}</div>
            ${isMulti ? '<div class="tool-multi">Подходит нескольким профессиям</div>' : ''}
            <div class="tool-hint">Перетащите или кликните</div>
        `;

        card.addEventListener('dragstart', e => {
            const ghost = document.createElement('div');
            ghost.style.cssText = `
                position: fixed; top: -200px; left: 0;
                width: 64px; height: 64px;
                display: flex; align-items: center; justify-content: center;
                font-size: 2.2rem; background: var(--card-bg);
                border: 2px solid var(--primary); border-radius: 12px;
            `;
            ghost.textContent = tool.emoji;
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 32, 32);
            setTimeout(() => ghost.remove(), 0);

            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
            this._toolSelected = false;
            card.classList.remove('selected');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        card.addEventListener('click', () => {
            this._toolSelected = !this._toolSelected;
            card.classList.toggle('selected', this._toolSelected);
        });

        area.appendChild(card);
    },

    _startRoundTimer() {
        const total = ROUND_TIMES_L2[this.round - 1] || 8;
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

    _onKey(e) {
        if (this.finished) return;
        const num = parseInt(e.key);
        if (num >= 1 && num <= this.roundProfessions.length) {
            const zones = document.querySelectorAll('.profession-zone');
            const zone = zones[num - 1];
            if (zone) this._tryAnswer(zone.dataset.id, zone);
        }
    },

    _tryAnswer(professionId, zoneEl) {
        if (this.finished || !this.currentTool) return;

        document.querySelectorAll('.profession-zone').forEach(z => z.classList.remove('click-hover'));

        const isCorrect = this.currentTool.professions.includes(professionId);

        if (isCorrect) {
            this.score += 15;
            this.correctCount++;
            zoneEl.classList.add('correct');
            SoundManager.success();
            this._toolSelected = false;
            const toolCard = document.getElementById('current-tool');
            if (toolCard) toolCard.classList.remove('selected');

            if (this.correctCount % 2 === 0) {
                NotificationManager.show('Отличная скорость! ⚡', 'info', 700);
            }
            this._updateScore();
            clearInterval(this._roundTimerId);

            setTimeout(() => {
                zoneEl.classList.remove('correct');
                this._nextRound();
            }, 600);
        } else {
            this.score = Math.max(0, this.score - 5);
            zoneEl.classList.add('wrong');
            SoundManager.error();
            this._toolSelected = false;
            const toolCard = document.getElementById('current-tool');
            if (toolCard) toolCard.classList.remove('selected');
            this._updateScore();
            setTimeout(() => zoneEl.classList.remove('wrong'), 450);
        }
    },

    _generatePositions(count, fieldW, fieldH) {
        const cols  = Math.ceil(Math.sqrt(count));
        const rows  = Math.ceil(count / cols);
        const cellW = fieldW / cols;
        const cellH = fieldH / rows;
        const indices = this._shuffle([...Array(count).keys()]);

        return indices.map((idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = col * cellW + Math.random() * Math.max(0, cellW - ZONE_W - 4) + 2;
            const y = row * cellH + Math.random() * Math.max(0, cellH - ZONE_H - 4) + 2;
            return {
                x: Math.max(2, Math.min(x, fieldW - ZONE_W - 2)),
                y: Math.max(2, Math.min(y, fieldH - ZONE_H - 2)),
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
            const timeBonus = this.totalTimeLeft * 2;
            const result = UserManager.addScore(2, this.score, timeBonus);
            UserManager.updateBestTime(2, 90 - this.totalTimeLeft);
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
    Level2.init();
});
