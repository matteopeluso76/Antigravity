document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    const STATE = {
        mode: 'free', // 'free' | 'challenge'
        lang: 'it',
        currentScore: 0, // In free run: stars. In challenge: calculated score.
        currentQuestion: 0,
        totalQuestions: 10,
        correctAnswers: 0,
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,

        // Setup
        playerName: '',
        difficulty: 20, // maxNumber

        // Question Data
        num1: 0,
        num2: 0,
        answer: 0,
        operator: '+',
        inputBuffer: ''
    };

    // --- TRANSLATIONS ---
    const TRANSLATIONS = {
        en: {
            title: "Math Fun!",
            selectMode: "Select Mode:",
            modeFree: "Free Run 🏃",
            modeChallenge: "Challenge 🏆",
            viewLeaderboard: "View Leaderboard 🏅",
            setupTitle: "Challenge Setup",
            enterName: "Your Name:",
            selectQuestions: "Questions:",
            selectDifficulty: "Select Difficulty:",
            diffEasy: "Easy (20)",
            diffMedium: "Medium (50)",
            diffHard: "Hard (100)",
            enableTimer: "Enable Timer ⏱️",
            stars: "Stars:",
            time: "Time:",
            backToMenu: "Menu",
            resultsTitle: "Challenge Complete!",
            correctAnswers: "Correct:",
            totalTime: "Time:",
            score: "Score:",
            newHighScore: "NEW HIGH SCORE!",
            leaderboardTitle: "Top 10",
            colName: "Name",
            colScore: "Score",
            noScores: "No scores yet!",
            feedbackCorrect: ["Awesome!", "Great Job!", "Correct!", "Super!", "Math Wizard!"],
            feedbackWrong: "Oops, try again!"
        },
        it: {
            title: "Matematica!",
            selectMode: "Scegli Modalità:",
            modeFree: "Allenamento 🏃",
            modeChallenge: "Sfida 🏆",
            viewLeaderboard: "Classifica 🏅",
            setupTitle: "Configura Sfida",
            enterName: "Tuo Nome:",
            selectQuestions: "Domande:",
            selectDifficulty: "Scegli Difficoltà:",
            diffEasy: "Facile (20)",
            diffMedium: "Medio (50)",
            diffHard: "Difficile (100)",
            enableTimer: "Abilita Timer ⏱️",
            stars: "Stelle:",
            time: "Tempo:",
            backToMenu: "Menu",
            resultsTitle: "Sfida Completata!",
            correctAnswers: "Corrette:",
            totalTime: "Tempo:",
            score: "Punteggio:",
            newHighScore: "NUOVO RECORD!",
            leaderboardTitle: "Top 10",
            colName: "Nome",
            colScore: "Punti",
            noScores: "Nessun record!",
            feedbackCorrect: ["Fantastico!", "Bravissimo!", "Corretto!", "Super!", "Mago della Matematica!"],
            feedbackWrong: "Ops, riprova!"
        }
    };

    // --- AUDIO CONTEXT ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = new AudioContext();

    // --- SCREEN ELEMENTS ---
    const screens = {
        menu: document.getElementById('menu-screen'),
        setup: document.getElementById('setup-screen'),
        game: document.getElementById('game-screen'),
        results: document.getElementById('results-screen'),
        leaderboard: document.getElementById('leaderboard-screen')
    };

    // --- DOM ELEMENTS ---
    const els = {
        langBtns: document.querySelectorAll('.lang-btn'),
        btnFree: document.getElementById('btn-free-run'),
        btnChallenge: document.getElementById('btn-challenge'),
        btnLeaderboard: document.getElementById('btn-show-leaderboard'),

        // Setup
        inputName: document.getElementById('player-name'),
        toggleBtns: document.querySelectorAll('.toggle-btn'),
        diffBtns: document.querySelectorAll('.diff-btn'),
        btnSetupBack: document.getElementById('btn-setup-back'),

        // Game
        scoreLabel: document.getElementById('score-label'),
        scoreVal: document.getElementById('score'),
        scoreIcon: document.getElementById('score-icon'),
        timerDisplay: document.getElementById('timer-display'),
        timeVal: document.getElementById('time-val'),
        progressDisplay: document.getElementById('progress-display'),
        progressVal: document.getElementById('progress-val'),
        btnBack: document.getElementById('btn-back'),
        timerToggle: document.getElementById('timer-toggle'),

        // Question
        num1: document.getElementById('num1'),
        num2: document.getElementById('num2'),
        operator: document.getElementById('operator'),
        answerPlaceholder: document.getElementById('answer-placeholder'),
        feedback: document.getElementById('feedback'),
        feedbackText: document.getElementById('feedback-text'),
        numpad: document.querySelectorAll('.num-btn'),
        gameArea: document.querySelector('.question-box'),

        // Results
        resCorrect: document.getElementById('res-correct'),
        resTime: document.getElementById('res-time'),
        resScore: document.getElementById('res-score'),
        highScoreMsg: document.getElementById('high-score-msg'),
        btnResMenu: document.getElementById('btn-results-menu'),
        btnResLb: document.getElementById('btn-results-leaderboard'),

        // Leaderboard
        lbTableBody: document.querySelector('#leaderboard-table tbody'),
        lbEmpty: document.getElementById('leaderboard-empty'),
        btnLbBack: document.getElementById('btn-leaderboard-back')
    };

    // --- INITIALIZATION ---
    attachEvents();
    updateLanguage('it');

    // --- EVENT LISTENERS ---
    function attachEvents() {
        // Lang
        els.langBtns.forEach(btn => btn.addEventListener('click', () => updateLanguage(btn.dataset.lang)));

        // Menu
        els.btnFree.addEventListener('click', () => startFreeRunSetup());
        els.btnChallenge.addEventListener('click', () => showScreen('setup'));
        els.btnLeaderboard.addEventListener('click', () => showLeaderboard());

        // Setup
        els.btnSetupBack.addEventListener('click', () => showScreen('menu'));
        els.toggleBtns.forEach(btn => btn.addEventListener('click', (e) => {
            els.toggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            STATE.totalQuestions = parseInt(e.target.dataset.count);
        }));
        els.diffBtns.forEach(btn => btn.addEventListener('click', (e) => {
            STATE.difficulty = parseInt(e.target.dataset.level);
            if (STATE.mode === 'challenge') {
                startChallenge();
            } else {
                startFreeRunGame();
            }
        }));

        // Game
        els.btnBack.addEventListener('click', () => {
            stopTimer();
            showScreen('menu');
        });

        els.numpad.forEach(btn => {
            btn.addEventListener('click', () => handleInput(btn));
        });

        // Results
        els.btnResMenu.addEventListener('click', () => showScreen('menu'));
        els.btnResLb.addEventListener('click', () => showLeaderboard());

        // Leaderboard
        els.btnLbBack.addEventListener('click', () => showScreen('menu'));
    }

    // --- NAVIGATION & FLOW ---
    function showScreen(screenName) {
        Object.values(screens).forEach(el => el.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    }

    function startFreeRunSetup() {
        STATE.mode = 'free';
        // Reuse setup screen logic or jump straight to difficulty?
        // Let's use the buttons on menu screen for free run difficulty if needed,
        // but current implementation has difficulty on Setup.
        // To simplify: Free run re-uses the difficulty buttons on Menu if we had them,
        // but since we moved them to Setup, let's just go to Setup but hide the details?
        // OR: User click "Free Run" -> goes to a mode where we just pick difficulty.
        // Let's repurpose logic: 
        // 1. Hide difficulty buttons on Menu (we did that).
        // 2. Click "Free Run" -> Show Setup screen but HIDE "Questions count" and "Name".

        showScreen('setup');
        screens.setup.querySelector('.setup-group:nth-child(2)').classList.add('hidden'); // Hide Name
        screens.setup.querySelector('.setup-group:nth-child(3)').classList.add('hidden'); // Hide Count
    }

    // Fix: restore the "Show setup for challenge"
    els.btnChallenge.addEventListener('click', () => {
        STATE.mode = 'challenge';
        showScreen('setup');
        screens.setup.querySelector('.setup-group:nth-child(2)').classList.remove('hidden');
        screens.setup.querySelector('.setup-group:nth-child(3)').classList.remove('hidden');
        STATE.playerName = els.inputName.value || 'Player';
    });

    function startFreeRunGame() {
        STATE.mode = 'free';
        STATE.currentScore = 0;
        els.scoreLabel.dataset.i18n = 'stars';
        els.scoreIcon.textContent = '⭐';
        updateLanguage(STATE.lang); // Refresh text

        els.progressDisplay.classList.add('hidden');
        // Check toggle for timer
        if (els.timerToggle.checked) {
            els.timerDisplay.classList.remove('hidden');
        } else {
            els.timerDisplay.classList.add('hidden');
        }

        showScreen('game');
        generateQuestion();
    }

    function startChallenge() {
        STATE.mode = 'challenge';
        STATE.playerName = els.inputName.value.trim() || 'Player';
        STATE.currentQuestion = 0;
        STATE.correctAnswers = 0;
        STATE.startTime = Date.now();
        STATE.elapsedTime = 0;

        // UI Setup
        els.scoreLabel.textContent = ''; // Hide "stars" label
        els.scoreIcon.textContent = '';
        els.scoreVal.textContent = ''; // Hide score during challenge (or show 0/10)

        els.progressDisplay.classList.remove('hidden');
        els.timerDisplay.classList.remove('hidden'); // Always show timer in challenge

        showScreen('game');
        nextChallengeQuestion();
        startTimer();
    }

    // --- GAME LOGIC ---
    function generateQuestion() {
        // Randomly choose addition or subtraction
        const isAddition = Math.random() > 0.5;
        STATE.operator = isAddition ? '+' : '-';
        els.operator.textContent = STATE.operator;
        let max = STATE.difficulty;

        if (isAddition) {
            STATE.num1 = Math.floor(Math.random() * (max + 1));
            STATE.num2 = Math.floor(Math.random() * (max - STATE.num1 + 1));
            STATE.answer = STATE.num1 + STATE.num2;
        } else {
            STATE.num1 = Math.floor(Math.random() * (max + 1));
            STATE.num2 = Math.floor(Math.random() * (STATE.num1 + 1));
            STATE.answer = STATE.num1 - STATE.num2;
        }

        els.num1.textContent = STATE.num1;
        els.num2.textContent = STATE.num2;
        STATE.inputBuffer = '';
        updateInputDisplay();
    }

    function nextChallengeQuestion() {
        STATE.currentQuestion++;
        if (STATE.currentQuestion > STATE.totalQuestions) {
            endChallenge();
            return;
        }

        els.progressVal.textContent = `${STATE.currentQuestion}/${STATE.totalQuestions}`;
        generateQuestion();
    }

    function handleInput(btn) {
        const val = btn.dataset.value;
        if (btn.id === 'btn-clear') {
            STATE.inputBuffer = '';
            updateInputDisplay();
        } else if (btn.id === 'btn-check') {
            checkAnswer();
        } else {
            if (STATE.inputBuffer.length < 3) {
                STATE.inputBuffer += val;
                updateInputDisplay();
            }
        }
    }

    function updateInputDisplay() {
        els.answerPlaceholder.textContent = STATE.inputBuffer === '' ? '?' : STATE.inputBuffer;
        if (STATE.inputBuffer !== '') {
            els.answerPlaceholder.style.color = '#2C3E50';
            els.answerPlaceholder.style.borderBottomStyle = 'solid';
        } else {
            els.answerPlaceholder.style.color = 'var(--primary-color)';
            els.answerPlaceholder.style.borderBottomStyle = 'dashed';
        }
    }

    function checkAnswer() {
        if (STATE.inputBuffer === '') return;
        const userAns = parseInt(STATE.inputBuffer);

        if (userAns === STATE.answer) {
            handleCorrect();
        } else {
            handleWrong();
        }
    }

    function handleCorrect() {
        playSound('win');

        if (STATE.mode === 'free') {
            STATE.currentScore += 10;
            els.scoreVal.textContent = STATE.currentScore;
        } else {
            STATE.correctAnswers++;
        }

        showFeedback(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        setTimeout(() => {
            hideFeedback();
            if (STATE.mode === 'challenge') {
                nextChallengeQuestion();
            } else {
                generateQuestion();
            }
        }, 1200);
    }

    function handleWrong() {
        playSound('lose'); // Optional: small buzz
        showFeedback(false);
        els.gameArea.classList.add('shake');

        if (STATE.mode === 'challenge') {
            // Move on anyway? Or force correct?
            // Typcially kids games force correct answer or try again.
            // Prompt mentions "correct answers" count, implies we can just move on or retry.
            // Let's enforce Retry for learning? 
            // BUT: if we retry, time goes up. 
            // Let's stick to: Wrong answer -> Shake -> Try again.
            setTimeout(() => {
                els.gameArea.classList.remove('shake');
                hideFeedback();
                STATE.inputBuffer = '';
                updateInputDisplay();
            }, 1000);
        } else {
            // Free run
            setTimeout(() => {
                els.gameArea.classList.remove('shake');
                hideFeedback();
                STATE.inputBuffer = '';
                updateInputDisplay();
            }, 1000);
        }
    }

    // --- END GAME & SCORING ---
    function endChallenge() {
        stopTimer();
        const now = Date.now();
        STATE.elapsedTime = (now - STATE.startTime) / 1000;

        // Score Formula: (Correct * 100) - Time
        let score = (STATE.correctAnswers * 100) - Math.floor(STATE.elapsedTime);
        if (score < 0) score = 0;

        showScreen('results');

        els.resCorrect.textContent = `${STATE.correctAnswers}/${STATE.totalQuestions}`;
        els.resTime.textContent = `${STATE.elapsedTime.toFixed(1)}s`;
        els.resScore.textContent = score;

        checkHighScore(STATE.playerName, score);
    }

    function checkHighScore(name, score) {
        const key = 'mathGame_scores';
        let scores = JSON.parse(localStorage.getItem(key)) || [];

        // Add current
        scores.push({ name, score, date: new Date().toISOString() });
        // Sort DESC
        scores.sort((a, b) => b.score - a.score);
        // Keep top 10
        scores = scores.slice(0, 10);

        localStorage.setItem(key, JSON.stringify(scores));

        // Check if we are in the top list and if it's a good score (simple check: is score > 0 and is it the best for this user currently? or just show Happy Animation if high enough)
        // Let's check if this specific score instance is in the saved top 10
        const isHigh = scores.some(s => s.score === score && s.name === name); // weak check but ok

        if (isHigh && score > 0) {
            els.highScoreMsg.classList.remove('hidden');
            playSound('highscore');
            confetti({ particleCount: 200, spread: 100 });
        } else {
            els.highScoreMsg.classList.add('hidden');
        }
    }

    function showLeaderboard() {
        const key = 'mathGame_scores';
        const scores = JSON.parse(localStorage.getItem(key)) || [];

        els.lbTableBody.innerHTML = '';

        if (scores.length === 0) {
            els.lbEmpty.classList.remove('hidden');
        } else {
            els.lbEmpty.classList.add('hidden');
            scores.forEach((s, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${idx + 1}</td><td>${escapeHtml(s.name)}</td><td>${s.score}</td>`;
                els.lbTableBody.appendChild(tr);
            });
        }

        showScreen('leaderboard');
    }

    // --- UTILITIES ---
    function updateLanguage(lang) {
        STATE.lang = lang;
        els.langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (TRANSLATIONS[lang][key]) {
                if (el.tagName === 'INPUT') {
                    // Placeholder?
                } else if (!el.children.length || key.startsWith('diff') || key.startsWith('mode')) {
                    el.textContent = TRANSLATIONS[lang][key];
                } else {
                    // Complex elements like "Score: <span>0</span>" handled manually
                }
            }
        });

        // HACK: Restore content for specific complex elements
        if (TRANSLATIONS[lang].stars) els.scoreLabel.textContent = TRANSLATIONS[lang].stars;
        if (TRANSLATIONS[lang].time) els.timerDisplay.firstChild.textContent = TRANSLATIONS[lang].time;
    }

    function showFeedback(isCorrect) {
        const msgs = TRANSLATIONS[STATE.lang].feedbackCorrect;
        const msg = isCorrect ? msgs[Math.floor(Math.random() * msgs.length)] : TRANSLATIONS[STATE.lang].feedbackWrong;

        els.feedbackText.textContent = msg;
        els.feedback.className = `feedback-message visible ${isCorrect ? 'positive' : 'negative'}`;
        els.feedback.style.color = isCorrect ? 'var(--success-color)' : 'var(--error-color)';
    }

    function hideFeedback() {
        els.feedback.classList.remove('visible');
    }

    function startTimer() {
        STATE.startTime = Date.now();
        els.timeVal.textContent = '0.0';
        STATE.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - STATE.startTime) / 1000;
            els.timeVal.textContent = elapsed.toFixed(1);
        }, 100);
    }

    function stopTimer() {
        clearInterval(STATE.timerInterval);
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text.replace(/[&<>"']/g, "");
    }

    // --- AUDIO ---
    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'highscore') {
            // Arpeggio
            ['triangle', 'triangle'].forEach((w, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.type = w;
                o.frequency.setValueAtTime(400 + (i * 200), now);
                o.frequency.exponentialRampToValueAtTime(800 + (i * 200), now + 0.5);
                g.gain.setValueAtTime(0.2, now);
                g.gain.linearRampToValueAtTime(0, now + 1.0);
                o.start(now + i * 0.1);
                o.stop(now + 1.2);
            });
        }
    }
});
