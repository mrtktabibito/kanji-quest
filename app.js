(() => {
  'use strict';

  const DATA = window.KANJI_DATA || [];
  const STORAGE_KEY = 'kanjiQuestV01';
  const QUIZ_LENGTH = 10;

  const defaultState = () => ({
    stars: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    sound: true,
    stats: {},
    history: []
  });

  let state = loadState();
  let selectedMode = 'mix';
  let quiz = [];
  let quizIndex = 0;
  let sessionCorrect = 0;
  let sessionStars = 0;
  let answered = false;
  let lastWasWeak = false;

  const $ = (id) => document.getElementById(id);
  const views = ['homeView', 'quizView', 'resultView', 'recordView'];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showView(id) {
    views.forEach(v => $(v).classList.toggle('active', v === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getStat(k) {
    if (!state.stats[k]) state.stats[k] = { c: 0, w: 0 };
    return state.stats[k];
  }

  function getWeakItems() {
    return DATA
      .filter(item => (state.stats[item.k]?.w || 0) > 0)
      .sort((a, b) => {
        const sa = state.stats[a.k] || { c: 0, w: 0 };
        const sb = state.stats[b.k] || { c: 0, w: 0 };
        const ra = sa.w / Math.max(1, sa.c + sa.w);
        const rb = sb.w / Math.max(1, sb.c + sb.w);
        return (rb - ra) || (sb.w - sa.w);
      });
  }

  function updateHome() {
    $('starCount').textContent = state.stars;
    const weak = getWeakItems();
    $('weakCount').textContent = weak.length ? `${weak.length}もじ` : 'まだ 0もじ';
    const acc = state.totalAnswered ? Math.round(state.totalCorrect / state.totalAnswered * 100) : 0;
    $('accuracyMini').textContent = `せいかい ${acc}%`;
    $('soundBtn').classList.toggle('off', !state.sound);
    $('soundBtn').textContent = state.sound ? '♪' : '×';
  }

  function chooseType() {
    if (selectedMode === 'reading') return 'reading';
    if (selectedMode === 'kanji') return 'kanji';
    return Math.random() < 0.5 ? 'reading' : 'kanji';
  }

  function makeQuestion(item) {
    let type = chooseType();
    const sameReadingCount = DATA.filter(x => x.r === item.r).length;
    // 同じ読みの漢字が複数ある場合は、逆引き問題を避けて曖昧さをなくす。
    if (type === 'kanji' && sameReadingCount > 1) type = 'reading';

    if (type === 'reading') {
      const pool = DATA.filter(x => x.k !== item.k && x.r !== item.r);
      const distractors = shuffle(pool).slice(0, 2);
      return {
        item,
        type,
        prompt: item.k,
        answer: item.r,
        options: shuffle([item.r, ...distractors.map(x => x.r)])
      };
    }

    const pool = DATA.filter(x => x.k !== item.k && x.r !== item.r);
    const distractors = shuffle(pool).slice(0, 2);
    return {
      item,
      type,
      prompt: item.r,
      answer: item.k,
      options: shuffle([item.k, ...distractors.map(x => x.k)])
    };
  }

  function buildQuiz(sourceItems) {
    let pool = [...sourceItems];
    if (!pool.length) pool = [...DATA];
    const picked = [];
    while (picked.length < QUIZ_LENGTH) {
      if (!pool.length) pool = [...sourceItems];
      if (!pool.length) pool = [...DATA];
      const next = shuffle(pool)[0];
      picked.push(next);
      pool = pool.filter(x => x.k !== next.k);
    }
    return picked.map(makeQuestion);
  }

  function startQuiz({ weak = false } = {}) {
    const weakItems = getWeakItems();
    if (weak && !weakItems.length) {
      openModal('にがてれんしゅう', '<p>まだ にがてな かんじは ありません。<br>まずは いつものクイズを やってみよう！</p>');
      return;
    }

    lastWasWeak = weak;
    const source = weak ? weakItems : DATA;
    quiz = buildQuiz(source);
    quizIndex = 0;
    sessionCorrect = 0;
    sessionStars = 0;
    answered = false;
    $('sessionStars').textContent = '0';
    showView('quizView');
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const q = quiz[quizIndex];
    $('questionNo').textContent = quizIndex + 1;
    $('progressBar').style.width = `${((quizIndex + 1) / QUIZ_LENGTH) * 100}%`;
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('nextBtn').classList.add('hidden');

    if (q.type === 'reading') {
      $('questionKind').textContent = 'よみかた';
      $('questionLead').textContent = 'この かんじは なんて よむ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').className = 'question-main';
      $('questionSub').textContent = 'ひとつ えらんでね';
    } else {
      $('questionKind').textContent = 'かんじ';
      $('questionLead').textContent = 'この よみかたの かんじは どれ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').className = 'question-main reading-prompt';
      $('questionSub').textContent = 'ひとつ えらんでね';
    }

    const answers = $('answers');
    answers.innerHTML = '';
    q.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.type = 'button';
      btn.textContent = option;
      btn.addEventListener('click', () => answerQuestion(option, btn));
      answers.appendChild(btn);
    });
  }

  function answerQuestion(option, clickedBtn) {
    if (answered) return;
    answered = true;

    const q = quiz[quizIndex];
    const correct = option === q.answer;
    const stat = getStat(q.item.k);
    state.totalAnswered += 1;

    const buttons = [...$('answers').querySelectorAll('.answer-btn')];
    buttons.forEach(btn => {
      if (btn.textContent === q.answer) btn.classList.add('correct');
      else btn.classList.add('dim');
      btn.disabled = true;
    });

    if (correct) {
      stat.c += 1;
      state.totalCorrect += 1;
      state.stars += 1;
      sessionCorrect += 1;
      sessionStars += 1;
      clickedBtn.classList.remove('dim');
      $('feedback').textContent = '○ せいかい！ ⭐ +1';
      $('feedback').className = 'feedback good';
      playTone(true);
    } else {
      stat.w += 1;
      clickedBtn.classList.remove('dim');
      clickedBtn.classList.add('wrong');
      $('feedback').textContent = q.type === 'reading'
        ? `おしい！ 「${q.item.k}」は「${q.item.r}」だよ`
        : `おしい！ 「${q.item.r}」は「${q.item.k}」だよ`;
      $('feedback').className = 'feedback bad';
      playTone(false);
    }

    $('sessionStars').textContent = sessionStars;
    saveState();
    updateHome();
    $('nextBtn').textContent = quizIndex === QUIZ_LENGTH - 1 ? 'けっかを みる' : 'つぎへ';
    $('nextBtn').classList.remove('hidden');
  }

  function nextQuestion() {
    if (!answered) return;
    if (quizIndex >= QUIZ_LENGTH - 1) {
      finishQuiz();
      return;
    }
    quizIndex += 1;
    renderQuestion();
  }

  function finishQuiz() {
    const now = new Date();
    state.history.unshift({
      d: `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`,
      c: sessionCorrect,
      m: lastWasWeak ? 'にがて' : selectedMode
    });
    state.history = state.history.slice(0, 12);
    saveState();

    $('resultCorrect').textContent = sessionCorrect;
    $('resultStars').textContent = sessionStars;
    $('resultWeak').textContent = getWeakItems().length;
    $('resultMessage').textContent = sessionCorrect >= 9 ? 'すごい！ かんじはかせ！' : sessionCorrect >= 7 ? 'とっても よくできました！' : sessionCorrect >= 5 ? 'いいちょうし！ もういっかい やってみよう' : 'だいじょうぶ。すこしずつ おぼえよう！';
    showView('resultView');
  }

  function renderRecords() {
    $('totalAnswered').textContent = state.totalAnswered;
    $('totalCorrect').textContent = state.totalCorrect;
    $('totalAccuracy').textContent = state.totalAnswered ? `${Math.round(state.totalCorrect / state.totalAnswered * 100)}%` : '0%';
    $('recordStars').textContent = state.stars;

    const weak = getWeakItems().slice(0, 10);
    const weakList = $('weakList');
    if (!weak.length) {
      weakList.className = 'kanji-list empty';
      weakList.textContent = 'まだ ありません';
    } else {
      weakList.className = 'kanji-list';
      weakList.innerHTML = weak.map(item => {
        const s = state.stats[item.k];
        return `<div class="kanji-chip"><strong>${item.k}</strong><small>× ${s.w}</small></div>`;
      }).join('');
    }

    const history = $('historyList');
    if (!state.history.length) {
      history.className = 'history-list empty';
      history.textContent = 'まだ ありません';
    } else {
      history.className = 'history-list';
      const label = { mix: 'まぜこぜ', reading: 'よみ', kanji: 'かんじ', 'にがて': 'にがて' };
      history.innerHTML = state.history.map(h => `<div class="history-row"><span>${h.d}</span><span>${label[h.m] || h.m}</span><strong>${h.c}/10</strong></div>`).join('');
    }
  }

  function openModal(title, bodyHtml) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = bodyHtml;
    $('modal').classList.remove('hidden');
  }

  function closeModal() {
    $('modal').classList.add('hidden');
  }

  function playTone(correct) {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = correct ? 660 : 210;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.24);
      if (correct) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.value = 880;
        gain2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.12); osc2.stop(ctx.currentTime + 0.34);
      }
    } catch (_) {}
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
    });
  });

  $('startBtn').addEventListener('click', () => startQuiz());
  $('weakBtn').addEventListener('click', () => startQuiz({ weak: true }));
  $('nextBtn').addEventListener('click', nextQuestion);
  $('quitBtn').addEventListener('click', () => {
    openModal('クイズを やめる？', '<p>いまのクイズを おわって ホームにもどります。</p><button id="confirmQuit" class="secondary-wide" type="button">ホームにもどる</button>');
    setTimeout(() => {
      const b = $('confirmQuit');
      if (b) b.addEventListener('click', () => { closeModal(); showView('homeView'); });
    }, 0);
  });
  $('retryBtn').addEventListener('click', () => startQuiz({ weak: lastWasWeak }));
  $('homeBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });
  $('recordBtn').addEventListener('click', () => { renderRecords(); showView('recordView'); });
  $('recordBackBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });
  $('soundBtn').addEventListener('click', () => { state.sound = !state.sound; saveState(); updateHome(); if (state.sound) playTone(true); });
  $('helpBtn').addEventListener('click', () => openModal('iPhoneでホーム画面に追加', '<ol><li>このアプリをSafariでひらく</li><li>画面下の「共有」をタップ</li><li>「ホーム画面に追加」をタップ</li><li>「追加」をタップ</li></ol><p>※ iPhoneでPWAとして使うには、HTTPSで公開したURLから開くのがおすすめです。</p>'));
  $('modalCloseBtn').addEventListener('click', closeModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
  $('resetBtn').addEventListener('click', () => {
    openModal('きろくを けす？', '<p>⭐や せいかいりつ、にがてな漢字を ぜんぶ けします。</p><button id="confirmReset" class="secondary-wide" type="button">ぜんぶ けす</button>');
    setTimeout(() => {
      const b = $('confirmReset');
      if (b) b.addEventListener('click', () => {
        state = defaultState(); saveState(); closeModal(); renderRecords(); updateHome();
      });
    }, 0);
  });

  updateHome();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();
