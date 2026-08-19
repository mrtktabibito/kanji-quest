(() => {
  'use strict';

  const DATA = window.KANJI_DATA || [];
  const STORAGE_KEY = 'kanjiQuestV01'; // V01.3の記録をそのまま引き継ぐ
  const QUIZ_LENGTH = 10;
  const BOSS_MAX_HP = 100;
  const BOSS_DAMAGE = 10;

  const STAGES = [
    { id:'s1', label:'1-1', title:'かずのどうくつ', icon:'1', kanji:'一二三四五六七八九十' },
    { id:'s2', label:'1-2', title:'しぜんのもり', icon:'木', kanji:'山川木林森花草竹石土' },
    { id:'s3', label:'1-3', title:'そらといろ', icon:'空', kanji:'日月火水雨天空夕青赤' },
    { id:'s4', label:'1-4', title:'からだとひと', icon:'人', kanji:'人女子男口目耳手足力' },
    { id:'b1', label:'BOSS', title:'もじモンスター', icon:'👾', boss:true, pool:'一二三四五六七八九十山川木林森花草竹石土日月火水雨天空夕青赤人女子男口目耳手足力' },
    { id:'s5', label:'2-1', title:'ばしょとむき', icon:'右', kanji:'右左上下中田町村入出' },
    { id:'s6', label:'2-2', title:'くらしのまち', icon:'車', kanji:'犬虫貝車糸玉金円王音' },
    { id:'s7', label:'2-3', title:'がっこう', icon:'学', kanji:'学校本文字名年生先正' },
    { id:'s8', label:'2-4', title:'レベルアップ', icon:'大', kanji:'休千大小早気白百立見' },
    { id:'b2', label:'BOSS', title:'かんじドラゴン', icon:'🐲', boss:true, pool:'一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六' }
  ];

  // V03 冒険マップの座標（各ワールド5ステージ）。
  const WORLD_LAYOUTS = [
    [
      {x:14,y:80},{x:38,y:62},{x:70,y:72},{x:78,y:40},{x:48,y:16}
    ],
    [
      {x:16,y:80},{x:42,y:62},{x:76,y:72},{x:70,y:40},{x:44,y:16}
    ]
  ];

  const WORLD_INFO = [
    { title:'WORLD 1　むらさきの森', sub:'かず・しぜん・そら・からだ', icon:'🌙' },
    { title:'WORLD 2　ほしぞらの町', sub:'ばしょ・くらし・がっこう・まとめ', icon:'⭐' }
  ];

  // 絵だけで意味を取り違えにくい漢字に限定する。
  // 林・森は木の本数で区別し、川・空など曖昧になりやすい絵は出題しない。
  const PICTURES = {
    '山':'🏔️','木':'🌳','林':'🌳🌳','森':'🌳🌳🌳','花':'🌸','草':'🌱','竹':'🎋','石':'🪨','雨':'🌧️',
    '日':'☀️','月':'🌙','火':'🔥','水':'💧','犬':'🐶','虫':'🐛','貝':'🐚','車':'🚗','糸':'🧵',
    '目':'👁️','耳':'👂','手':'✋','足':'🦶','口':'👄','金':'💴','王':'👑','音':'🎵','本':'📖'
  };

  const OPPOSITES = {
    '上':'下','下':'上','左':'右','右':'左','大':'小','小':'大','入':'出','出':'入','男':'女','女':'男'
  };

  // 小学1年生の配当漢字だけで作る熟語。level 3 は後半・最終ボス向け。
  const COMPOUNDS = [
    {w:'学校',r:'がっこう',level:1},{w:'学生',r:'がくせい',level:1},{w:'先生',r:'せんせい',level:1},
    {w:'小学校',r:'しょうがっこう',level:2},{w:'小学生',r:'しょうがくせい',level:2},{w:'一年生',r:'いちねんせい',level:2},
    {w:'大人',r:'おとな',level:1},{w:'火山',r:'かざん',level:1},{w:'花火',r:'はなび',level:1},{w:'青空',r:'あおぞら',level:1},
    {w:'森林',r:'しんりん',level:2},{w:'竹林',r:'ちくりん',level:2},{w:'草木',r:'くさき',level:1},{w:'水田',r:'すいでん',level:2},
    {w:'天気',r:'てんき',level:1},{w:'空気',r:'くうき',level:2},{w:'人気',r:'にんき',level:2},
    {w:'入口',r:'いりぐち',level:1},{w:'出口',r:'でぐち',level:1},{w:'出入口',r:'でいりぐち',level:2},
    {w:'左右',r:'さゆう',level:2},{w:'上下',r:'じょうげ',level:2},{w:'男女',r:'だんじょ',level:2},{w:'大小',r:'だいしょう',level:2},
    {w:'中学',r:'ちゅうがく',level:2},{w:'正月',r:'しょうがつ',level:1},{w:'日本',r:'にほん',level:1},{w:'日本人',r:'にほんじん',level:2},
    {w:'本文',r:'ほんぶん',level:2},{w:'文字',r:'もじ',level:1},{w:'名人',r:'めいじん',level:2},{w:'本名',r:'ほんみょう',level:2},
    {w:'年上',r:'としうえ',level:1},{w:'年下',r:'としした',level:1},{w:'左手',r:'ひだりて',level:1},{w:'右手',r:'みぎて',level:1},
    {w:'手足',r:'てあし',level:1},{w:'足音',r:'あしおと',level:1},{w:'目玉',r:'めだま',level:1},{w:'白目',r:'しろめ',level:2},
    {w:'赤字',r:'あかじ',level:2},{w:'青虫',r:'あおむし',level:1},{w:'火口',r:'かこう',level:2},{w:'上空',r:'じょうくう',level:2},
    {w:'水中',r:'すいちゅう',level:2},{w:'空中',r:'くうちゅう',level:2},{w:'車中',r:'しゃちゅう',level:2},
    {w:'人力',r:'じんりき',level:2},{w:'水力',r:'すいりょく',level:2},{w:'火力',r:'かりょく',level:2},
    {w:'休日',r:'きゅうじつ',level:2},{w:'見学',r:'けんがく',level:2},{w:'早口',r:'はやくち',level:1},{w:'月日',r:'つきひ',level:1},
    {w:'先月',r:'せんげつ',level:2},{w:'先日',r:'せんじつ',level:2},{w:'本日',r:'ほんじつ',level:3},{w:'年中',r:'ねんじゅう',level:2},
    {w:'生年月日',r:'せいねんがっぴ',level:3}
  ];

  const COLLECTIONS = [
    { id:'egg', need:0, icon:'🥚', name:'まほうのたまご', desc:'ぼうけんの はじまり' },
    { id:'cat', need:15, icon:'🐱', name:'むらさきねこ', desc:'⭐15こで なかま' },
    { id:'owl', need:35, icon:'🦉', name:'ものしりふくろう', desc:'⭐35こで なかま' },
    { id:'unicorn', need:65, icon:'🦄', name:'ほしのユニコーン', desc:'⭐65こで なかま' },
    { id:'wizard', need:100, icon:'🧙', name:'かんじのまどうし', desc:'⭐100こで なかま' },
    { id:'dragon', need:150, icon:'🐉', name:'ドラゴンのともだち', desc:'⭐150こで なかま' }
  ];

  const defaultState = () => ({
    stars: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    sound: true,
    stats: {},
    history: [],
    stageScores: {}
  });

  let state = loadState();
  let selectedMode = 'mix';
  let quiz = [];
  let quizIndex = 0;
  let sessionCorrect = 0;
  let sessionStars = 0;
  let sessionCombo = 0;
  let maxCombo = 0;
  let answered = false;
  let bossHp = BOSS_MAX_HP;
  let starsAtStart = state.stars;
  let currentContext = { type:'free' };
  let lastContext = { type:'free' };
  let reactionTimer = null;
  let pendingMapMove = null;

  const $ = (id) => document.getElementById(id);
  const views = ['homeView','stageView','quizView','resultView','collectionView','recordView'];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        stageScores: parsed.stageScores || {}
      };
    } catch (_) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showView(id) {
    views.forEach(v => $(v).classList.toggle('active', v === id));
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 画面に同じ選択肢が2つ出ないことを保証する。
  function makeUniqueOptions(answer, candidates, count = 3) {
    const unique = [];
    const seen = new Set([String(answer)]);
    for (const value of shuffle(candidates)) {
      const label = String(value);
      if (seen.has(label)) continue;
      seen.add(label);
      unique.push(value);
      if (unique.length >= count - 1) break;
    }
    return shuffle([answer, ...unique]);
  }

  function getItem(k) {
    return DATA.find(x => x.k === k);
  }

  function itemsFromString(chars) {
    return [...chars].map(getItem).filter(Boolean);
  }

  function getStat(k) {
    if (!state.stats[k]) state.stats[k] = { c:0, w:0 };
    return state.stats[k];
  }

  function getWeakItems() {
    return DATA
      .filter(item => (state.stats[item.k]?.w || 0) > 0)
      .sort((a,b) => {
        const sa = state.stats[a.k] || { c:0, w:0 };
        const sb = state.stats[b.k] || { c:0, w:0 };
        const ra = sa.w / Math.max(1, sa.c + sa.w);
        const rb = sb.w / Math.max(1, sb.c + sb.w);
        return (rb - ra) || (sb.w - sa.w);
      });
  }

  function ratingFromCorrect(correct) {
    if (correct === 10) return 3;
    if (correct >= 8) return 2;
    if (correct >= 6) return 1;
    return 0;
  }

  function starText(rating) {
    return `${'★'.repeat(rating)}${'☆'.repeat(3 - rating)}`;
  }

  function isStageUnlocked(index) {
    if (index === 0) return true;
    const prev = STAGES[index - 1];
    return (state.stageScores[prev.id]?.rating || 0) >= 1;
  }

  function getNextStageIndex() {
    for (let i = 0; i < STAGES.length; i++) {
      if (!isStageUnlocked(i)) return Math.max(0, i - 1);
      if ((state.stageScores[STAGES[i].id]?.rating || 0) < 1) return i;
    }
    return STAGES.length - 1;
  }

  function getUnlockedCollections(stars = state.stars) {
    return COLLECTIONS.filter(c => stars >= c.need);
  }

  function renderCompanions() {
    const unlocked = getUnlockedCollections();
    const visible = unlocked.filter(c => c.id !== 'egg');
    const party = visible.length ? visible.slice(-4) : unlocked.filter(c => c.id === 'egg');
    const html = party.map(c => `<span class="companion-chip" title="${c.name}">${c.icon}</span>`).join('');
    const q = $('companionParty');
    if (q) q.innerHTML = html ? `<b>なかま</b>${html}` : '';
    const r = $('resultCompanions');
    if (r) r.innerHTML = html ? `<span>いっしょに ぼうけん</span>${html}` : '';
  }

  function knownCharsForStage(stageIndex) {
    const chars = new Set();
    STAGES.slice(0, stageIndex + 1).forEach(stage => {
      const src = stage.boss ? stage.pool : stage.kanji;
      [...(src || '')].forEach(k => { if (getItem(k)) chars.add(k); });
    });
    return chars;
  }

  function compoundSettings() {
    if (currentContext.type === 'weak') return { count:0, level:1, chars:new Set() };
    if (currentContext.type === 'free') return { count:selectedMode === 'mix' ? 2 : 0, level:2, chars:new Set(DATA.map(x => x.k)) };
    if (currentContext.type !== 'stage') return { count:0, level:1, chars:new Set() };
    const i = currentContext.stageIndex;
    const counts = [0,0,1,1,2,2,2,3,3,4];
    return { count:counts[i] || 0, level:i >= 8 ? 3 : i >= 3 ? 2 : 1, chars:knownCharsForStage(i) };
  }

  function usableCompounds(settings) {
    return COMPOUNDS.filter(c => c.level <= settings.level && [...c.w].every(k => settings.chars.has(k)));
  }

  function makeCompoundQuestion(compound, pool) {
    const readingType = Math.random() < 0.5;
    const other = pool.filter(x => x.w !== compound.w);
    const statKeys = [...new Set([...compound.w])].filter(k => !!getItem(k));
    if (readingType) {
      return {
        item:getItem(statKeys[0]) || DATA[0], statKeys, type:'compoundReading', difficulty:compound.level,
        prompt:compound.w, answer:compound.r,
        options:makeUniqueOptions(compound.r, other.map(x => x.r))
      };
    }
    return {
      item:getItem(statKeys[0]) || DATA[0], statKeys, type:'compoundKanji', difficulty:compound.level,
      prompt:compound.r, answer:compound.w,
      options:makeUniqueOptions(compound.w, other.map(x => x.w))
    };
  }

  function updateHome() {
    $('starCount').textContent = state.stars;
    const weak = getWeakItems();
    $('weakCount').textContent = weak.length ? `${weak.length}もじ` : 'まだ 0もじ';
    const acc = state.totalAnswered ? Math.round(state.totalCorrect / state.totalAnswered * 100) : 0;
    $('accuracyMini').textContent = `せいかい ${acc}%`;
    $('soundBtn').classList.toggle('off', !state.sound);
    $('soundBtn').textContent = state.sound ? '♪' : '×';
    $('collectionMini').textContent = `${getUnlockedCollections().length} / ${COLLECTIONS.length}`;
    renderCompanions();

    const idx = getNextStageIndex();
    const stage = STAGES[idx];
    $('nextStageName').textContent = `${stage.label} ${stage.title}`;
    $('adventureStars').textContent = starText(state.stageScores[stage.id]?.rating || 0);
  }

  function bunnyInner() {
    return `
      <span class="bunny-wing wing-l"></span><span class="bunny-wing wing-r"></span>
      <span class="bunny-ear ear-l"></span><span class="bunny-ear ear-r"></span>
      <span class="bunny-hood"></span>
      <span class="bunny-face"><i class="eye eye-l"></i><i class="eye eye-r"></i><i class="mouth"></i><i class="tear tear-l"></i><i class="tear tear-r"></i><i class="cheek cheek-l"></i><i class="cheek cheek-r"></i></span>
      <span class="bunny-ribbon"></span><span class="bunny-skull"><i></i><b></b></span>
      <span class="bunny-body"><i class="heart"></i></span>`;
  }

  function bunnyMarkup(extra = '') {
    return `<div class="goth-bunny ${extra}">${bunnyInner()}</div>`;
  }

  function decorateMascots() {
    document.querySelectorAll('.goth-bunny').forEach(el => {
      if (!el.dataset.decorated) {
        el.innerHTML = bunnyInner();
        el.dataset.decorated = '1';
      }
    });
  }

  function stagePosition(index) {
    const world = Math.floor(index / 5);
    const local = index % 5;
    return { world, ...(WORLD_LAYOUTS[world]?.[local] || {x:50,y:50}) };
  }

  function renderStageMap(move = null) {
    const map = $('stageMap');
    map.innerHTML = '';
    const currentIndex = move?.to ?? getNextStageIndex();

    for (let world = 0; world < 2; world++) {
      const board = document.createElement('section');
      board.className = `world-board world-${world+1}`;
      board.dataset.world = world;
      board.innerHTML = `
        <div class="world-title"><span>${WORLD_INFO[world].icon}</span><div><strong>${WORLD_INFO[world].title}</strong><small>${WORLD_INFO[world].sub}</small></div></div>
        <svg class="world-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="${world === 0 ? 'M14 80 C24 69 30 62 38 62 S60 74 70 72 S81 55 78 40 S58 22 48 16' : 'M16 80 C27 70 34 62 42 62 S65 73 76 72 S78 54 70 40 S54 23 44 16'}" />
        </svg>
        <div class="world-deco d1">✦</div><div class="world-deco d2">♡</div><div class="world-deco d3">★</div>`;

      for (let local = 0; local < 5; local++) {
        const index = world * 5 + local;
        const stage = STAGES[index];
        const pos = WORLD_LAYOUTS[world][local];
        const unlocked = isStageUnlocked(index);
        const score = state.stageScores[stage.id] || { rating:0, best:0 };
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `map-node${stage.boss ? ' boss' : ''}${unlocked ? '' : ' locked'}${index === currentIndex ? ' current' : ''}`;
        btn.style.left = `${pos.x}%`;
        btn.style.top = `${pos.y}%`;
        btn.setAttribute('aria-label', `${stage.label} ${stage.title}${unlocked ? '' : ' ロック中'}`);
        btn.innerHTML = `<span class="map-node-icon">${unlocked ? stage.icon : '🔒'}</span>
          <span class="map-node-label"><strong>${stage.label}</strong><small>${stage.title}</small><b>${unlocked ? starText(score.rating || 0) : 'LOCK'}</b></span>`;
        if (unlocked) btn.addEventListener('click', () => startStage(index));
        board.appendChild(btn);
      }

      map.appendChild(board);
    }

    const targetPos = stagePosition(currentIndex);
    const targetBoard = map.querySelector(`[data-world="${targetPos.world}"]`);
    if (targetBoard) {
      const anchor = document.createElement('div');
      anchor.id = 'mapMascotAnchor';
      anchor.className = 'map-mascot-anchor';
      anchor.innerHTML = bunnyMarkup('map-bunny idle');
      const startPos = move ? stagePosition(move.from) : targetPos;
      const canWalk = move && startPos.world === targetPos.world;
      const initial = canWalk ? startPos : targetPos;
      anchor.style.left = `${initial.x}%`;
      anchor.style.top = `${initial.y}%`;
      targetBoard.appendChild(anchor);

      if (canWalk) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          anchor.classList.add('moving');
          const bunny = anchor.querySelector('.goth-bunny');
          bunny?.classList.remove('idle');
          bunny?.classList.add('walk');
          anchor.style.left = `${targetPos.x}%`;
          anchor.style.top = `${targetPos.y}%`;
          setTimeout(() => {
            anchor.classList.remove('moving');
            bunny?.classList.remove('walk');
            bunny?.classList.add('celebrate');
            setTimeout(() => { bunny?.classList.remove('celebrate'); bunny?.classList.add('idle'); }, 850);
          }, 1050);
        }));
      } else if (move) {
        anchor.classList.add('arrive');
        const bunny = anchor.querySelector('.goth-bunny');
        bunny?.classList.remove('idle');
        bunny?.classList.add('celebrate');
        setTimeout(() => { bunny?.classList.remove('celebrate'); bunny?.classList.add('idle'); }, 900);
      }
    }
  }

  function setMascotReaction(type, text = '') {
    const mascot = $('quizMascot');
    const scene = $('questScene');
    const party = $('companionParty');
    if (!mascot) return;
    clearTimeout(reactionTimer);
    if (party) {
      party.classList.remove('party-cheer','party-sad');
      party.classList.add(type === 'sad' ? 'party-sad' : 'party-cheer');
    }
    mascot.className = `goth-bunny ${type}`;
    if (scene) {
      scene.classList.remove('fx-happy','fx-celebrate','fx-attack','fx-sad');
      if (type === 'happy') scene.classList.add('fx-happy');
      else if (type === 'celebrate' || type === 'victory') scene.classList.add('fx-celebrate');
      else if (type === 'attack') scene.classList.add('fx-attack');
      else if (type === 'sad') scene.classList.add('fx-sad');
    }
    if ($('reactionText')) $('reactionText').textContent = text || (type === 'sad' ? 'つぎは だいじょうぶ！' : 'やった！');
    clearFx(scene);
    if (type === 'happy') spawnFx(scene, 'happy', 12);
    else if (type === 'celebrate' || type === 'victory') spawnFx(scene, 'celebrate', 20);
    else if (type === 'attack') spawnFx(scene, 'attack', 14);
    else if (type === 'sad') spawnFx(scene, 'sad', 8);
    reactionTimer = setTimeout(() => {
      mascot.className = 'goth-bunny idle';
      if (scene) scene.classList.remove('fx-happy','fx-celebrate','fx-attack','fx-sad');
      if (party) party.classList.remove('party-cheer','party-sad');
      if ($('reactionText')) $('reactionText').textContent = 'いっしょに がんばろう！';
    }, type === 'attack' ? 1100 : type === 'celebrate' ? 1200 : 980);
  }

  function clearFx(container) {
    if (!container) return;
    container.querySelectorAll('.fx-particle,.boss-hit-burst,.boss-ko').forEach(el => el.remove());
  }

  function spawnFx(container, kind = 'happy', count = 12) {
    if (!container) return;
    const glyphs = {
      happy:['★','✦','♥','✧'],
      celebrate:['★','♥','✦','◆','✧'],
      sad:['💧','•','💧'],
      attack:['✦','⚡','★'],
      boss:['★','✦','⚡','◆'],
      ko:['★','✦','♥','◆','✧']
    }[kind] || ['✦'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      el.className = `fx-particle fx-${kind}`;
      el.textContent = glyphs[i % glyphs.length];
      const angle = (Math.PI * 2 * i / count) + (Math.random() * .35);
      const distance = 28 + Math.random() * 52;
      el.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      el.style.setProperty('--rot', `${-90 + Math.random() * 180}deg`);
      el.style.setProperty('--delay', `${Math.random() * .12}s`);
      container.appendChild(el);
      setTimeout(() => el.remove(), 1050);
    }
  }

  function animateBossDamage(defeated = false) {
    const panel = $('bossPanel');
    const avatar = $('bossAvatar');
    if (!panel || panel.classList.contains('hidden')) return;
    clearFx(panel);
    panel.classList.remove('boss-hit','boss-defeated');
    avatar?.classList.remove('boss-avatar-hit','boss-avatar-ko');
    void panel.offsetWidth;
    panel.classList.add(defeated ? 'boss-defeated' : 'boss-hit');
    avatar?.classList.add(defeated ? 'boss-avatar-ko' : 'boss-avatar-hit');
    const burst = document.createElement('div');
    burst.className = defeated ? 'boss-ko' : 'boss-hit-burst';
    burst.textContent = defeated ? 'KO! ★' : `💥 -${BOSS_DAMAGE}`;
    panel.appendChild(burst);
    spawnFx(panel, defeated ? 'ko' : 'boss', defeated ? 22 : 12);
    setTimeout(() => {
      panel.classList.remove('boss-hit');
      avatar?.classList.remove('boss-avatar-hit');
      if (!defeated) burst.remove();
    }, 900);
  }

  function updateJourney(animate = true) {
    const pct = Math.max(0, Math.min(100, (sessionCorrect / QUIZ_LENGTH) * 100));
    const anchor = $('quizMascotAnchor');
    const fill = $('journeyFill');
    if (!anchor || !fill) return;
    if (!animate) {
      anchor.style.transition = 'none';
      fill.style.transition = 'none';
    }
    anchor.style.left = `${pct}%`;
    fill.style.width = `${pct}%`;
    if (!animate) requestAnimationFrame(() => {
      anchor.style.transition = '';
      fill.style.transition = '';
    });
  }

  function chooseType(item, sourceItems, mode = selectedMode) {
    if (mode === 'reading') return 'reading';
    if (mode === 'kanji') return 'kanji';

    const candidates = ['reading','kanji'];
    if (PICTURES[item.k]) candidates.push('picture');
    if (OPPOSITES[item.k] && sourceItems.some(x => x.k === OPPOSITES[item.k])) candidates.push('opposite');
    return shuffle(candidates)[0];
  }

  function makeQuestion(item, sourceItems, mode = selectedMode) {
    let type = chooseType(item, sourceItems, mode);
    const sameReadingCount = DATA.filter(x => x.r === item.r).length;
    if (type === 'kanji' && sameReadingCount > 1) type = 'reading';

    if (type === 'reading') {
      const pool = DATA.filter(x => x.k !== item.k && x.r !== item.r);
      const distractors = shuffle(pool).slice(0,2);
      return { item, type, prompt:item.k, answer:item.r, options:makeUniqueOptions(item.r, pool.map(x => x.r)) };
    }

    if (type === 'kanji') {
      const pool = DATA.filter(x => x.k !== item.k && x.r !== item.r);
      const distractors = shuffle(pool).slice(0,2);
      return { item, type, prompt:item.r, answer:item.k, options:makeUniqueOptions(item.k, pool.map(x => x.k)) };
    }

    if (type === 'picture') {
      const pictureItems = DATA.filter(x => x.k !== item.k && PICTURES[x.k]);
      const distractors = shuffle(pictureItems).slice(0,2);
      return { item, type, prompt:PICTURES[item.k], answer:item.k, options:makeUniqueOptions(item.k, pictureItems.map(x => x.k)) };
    }

    const opposite = OPPOSITES[item.k];
    const pool = DATA.filter(x => x.k !== item.k && x.k !== opposite);
    const distractors = shuffle(pool).slice(0,2);
    return { item, type:'opposite', prompt:item.k, answer:opposite, options:makeUniqueOptions(opposite, pool.map(x => x.k)) };
  }

  function buildQuiz(sourceItems, mode = selectedMode) {
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
    const result = picked.map(item => makeQuestion(item, sourceItems, mode));

    const settings = compoundSettings();
    const cpool = usableCompounds(settings);
    if (settings.count > 0 && cpool.length >= 3) {
      const chosen = shuffle(cpool).slice(0, Math.min(settings.count, cpool.length));
      const positions = shuffle([...Array(QUIZ_LENGTH).keys()]).slice(0, chosen.length);
      chosen.forEach((c, n) => { result[positions[n]] = makeCompoundQuestion(c, cpool); });
    }
    return result;
  }

  function resetSession() {
    quizIndex = 0;
    sessionCorrect = 0;
    sessionStars = 0;
    sessionCombo = 0;
    maxCombo = 0;
    answered = false;
    bossHp = BOSS_MAX_HP;
    starsAtStart = state.stars;
    $('sessionStars').textContent = '0';
    $('comboCount').textContent = '0';
    $('comboBanner').classList.add('hidden');
    if ($('reactionText')) $('reactionText').textContent = 'いっしょに がんばろう！';
    if ($('quizMascot')) $('quizMascot').className = 'goth-bunny idle';
    updateJourney(false);
  }

  function startFreeQuiz() {
    currentContext = { type:'free', mode:selectedMode };
    lastContext = { ...currentContext };
    resetSession();
    quiz = buildQuiz(DATA, selectedMode);
    $('bossPanel').classList.add('hidden');
    showView('quizView');
    renderQuestion();
  }

  function startWeakQuiz() {
    const weakItems = getWeakItems();
    if (!weakItems.length) {
      openModal('にがてれんしゅう', '<p>まだ にがてな かんじは ありません。<br>まずは ぼうけんか フリークイズを やってみよう！</p>');
      return;
    }
    currentContext = { type:'weak' };
    lastContext = { ...currentContext };
    resetSession();
    quiz = buildQuiz(weakItems, 'mix');
    $('bossPanel').classList.add('hidden');
    showView('quizView');
    renderQuestion();
  }

  function startStage(index) {
    if (!isStageUnlocked(index)) return;
    const stage = STAGES[index];
    currentContext = { type:'stage', stageIndex:index, stageId:stage.id };
    lastContext = { ...currentContext };
    resetSession();
    const source = itemsFromString(stage.boss ? stage.pool : stage.kanji);
    quiz = buildQuiz(source, 'mix');
    if (stage.boss) {
      $('bossName').textContent = stage.title;
      if ($('bossAvatar')) $('bossAvatar').textContent = stage.icon;
      $('bossHp').textContent = bossHp;
      $('bossBar').style.width = '100%';
      $('bossPanel').classList.remove('boss-hit','boss-defeated');
      $('bossAvatar')?.classList.remove('boss-avatar-hit','boss-avatar-ko');
      clearFx($('bossPanel'));
      $('bossPanel').classList.remove('hidden');
    } else {
      $('bossPanel').classList.add('hidden');
    }
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
    $('comboBanner').classList.add('hidden');
    $('questionVisual').classList.add('hidden');
    $('questionMain').className = 'question-main';

    if (q.type === 'reading') {
      $('questionKind').textContent = 'よみかた';
      $('questionLead').textContent = 'この かんじは なんて よむ？';
      $('questionMain').textContent = q.prompt;
      $('questionSub').textContent = 'ひとつ えらんでね';
    } else if (q.type === 'kanji') {
      $('questionKind').textContent = 'かんじ';
      $('questionLead').textContent = 'この よみかたの かんじは どれ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').classList.add('reading-prompt');
      $('questionSub').textContent = 'ひとつ えらんでね';
    } else if (q.type === 'picture') {
      $('questionKind').textContent = 'えクイズ';
      $('questionLead').textContent = 'この えに あう かんじは どれ？';
      $('questionVisual').textContent = q.prompt;
      $('questionVisual').classList.remove('hidden');
      $('questionMain').textContent = '';
      $('questionSub').textContent = 'ひとつ えらんでね';
    } else if (q.type === 'compoundReading') {
      $('questionKind').textContent = `じゅくご ★${q.difficulty >= 3 ? '★★' : q.difficulty >= 2 ? '★' : ''}`;
      $('questionLead').textContent = 'この じゅくごは なんて よむ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').classList.add('compound-prompt');
      $('questionSub').textContent = 'むずかしい もんだい！';
    } else if (q.type === 'compoundKanji') {
      $('questionKind').textContent = `じゅくご ★${q.difficulty >= 3 ? '★★' : q.difficulty >= 2 ? '★' : ''}`;
      $('questionLead').textContent = 'この よみかたの じゅくごは どれ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').classList.add('reading-prompt','compound-reading-prompt');
      $('questionSub').textContent = 'むずかしい もんだい！';
    } else {
      $('questionKind').textContent = 'はんたいことば';
      $('questionLead').textContent = 'はんたいの いみの かんじは どれ？';
      $('questionMain').textContent = q.prompt;
      $('questionMain').classList.add('opposite-prompt');
      $('questionSub').textContent = 'ひとつ えらんでね';
    }

    const answers = $('answers');
    answers.innerHTML = '';
    answers.classList.remove('answer-grid-3','answer-grid-2');
    const maxOptionLen = Math.max(...q.options.map(x => [...String(x)].length));
    if (maxOptionLen <= 3) answers.classList.add('answer-grid-3');
    else if (maxOptionLen <= 5) answers.classList.add('answer-grid-2');
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
    const statKeys = q.statKeys?.length ? q.statKeys : [q.item.k];
    state.totalAnswered += 1;

    const buttons = [...$('answers').querySelectorAll('.answer-btn')];
    buttons.forEach(btn => {
      if (btn.textContent === q.answer) btn.classList.add('correct');
      else btn.classList.add('dim');
      btn.disabled = true;
    });

    if (correct) {
      statKeys.forEach(k => { getStat(k).c += 1; });
      state.totalCorrect += 1;
      state.stars += 1;
      sessionCorrect += 1;
      sessionStars += 1;
      sessionCombo += 1;
      maxCombo = Math.max(maxCombo, sessionCombo);
      clickedBtn.classList.remove('dim');

      let bonus = 0;
      if (sessionCombo > 0 && sessionCombo % 5 === 0) {
        bonus = 1;
        state.stars += 1;
        sessionStars += 1;
        $('comboBanner').textContent = `🔥 ${sessionCombo}コンボ！ ⭐ボーナス！`;
        $('comboBanner').classList.remove('hidden');
      }

      $('feedback').textContent = bonus ? `○ せいかい！ ⭐ +2` : '○ せいかい！ ⭐ +1';
      $('feedback').className = 'feedback good';
      playTone(true);
      updateJourney(true);

      const isBossNow = currentContext.type === 'stage' && STAGES[currentContext.stageIndex]?.boss;
      if (isBossNow) setMascotReaction('attack', 'こうげき！ ドーン！');
      else if (sessionCombo > 0 && sessionCombo % 5 === 0) setMascotReaction('celebrate', `${sessionCombo}コンボ！ だいせいこう！`);
      else setMascotReaction('happy', 'せいかい！ やったー！ ★');

      if (currentContext.type === 'stage') {
        const stage = STAGES[currentContext.stageIndex];
        if (stage.boss) {
          bossHp = Math.max(0, bossHp - BOSS_DAMAGE);
          $('bossHp').textContent = bossHp;
          $('bossBar').style.width = `${(bossHp / BOSS_MAX_HP) * 100}%`;
          animateBossDamage(bossHp === 0);
        }
      }
    } else {
      statKeys.forEach(k => { getStat(k).w += 1; });
      sessionCombo = 0;
      clickedBtn.classList.remove('dim');
      clickedBtn.classList.add('wrong');
      const explanations = {
        reading:`おしい！ 「${q.item.k}」は「${q.item.r}」だよ`,
        kanji:`おしい！ 「${q.item.r}」は「${q.item.k}」だよ`,
        picture:`おしい！ この えは「${q.item.k}」だよ`,
        compoundReading:`おしい！ 「${q.prompt}」は「${q.answer}」と よむよ`,
        compoundKanji:`おしい！ 「${q.prompt}」は「${q.answer}」だよ`,
        opposite:`おしい！ 「${q.item.k}」の はんたいは「${q.answer}」だよ`
      };
      $('feedback').textContent = explanations[q.type] || 'おしい！';
      $('feedback').className = 'feedback bad';
      playTone(false);
      setMascotReaction('sad', 'おしい！ なみだ… つぎは きっとできる！');
    }

    $('comboCount').textContent = sessionCombo;
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

  function contextLabel() {
    if (currentContext.type === 'weak') return 'にがて';
    if (currentContext.type === 'stage') return STAGES[currentContext.stageIndex].label;
    return selectedMode;
  }

  function finishQuiz() {
    const now = new Date();
    state.history.unshift({
      d:`${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`,
      c:sessionCorrect,
      m:contextLabel()
    });
    state.history = state.history.slice(0,16);

    let rating = null;
    let stage = null;
    let nextUnlocked = false;

    if (currentContext.type === 'stage') {
      stage = STAGES[currentContext.stageIndex];
      rating = ratingFromCorrect(sessionCorrect);
      const old = state.stageScores[stage.id] || { rating:0, best:0 };
      const oldRating = old.rating || 0;
      state.stageScores[stage.id] = {
        rating: Math.max(oldRating, rating),
        best: Math.max(old.best || 0, sessionCorrect)
      };
      nextUnlocked = rating >= 1 && oldRating < 1 && currentContext.stageIndex < STAGES.length - 1;
    }

    saveState();
    updateHome();

    $('resultCorrect').textContent = sessionCorrect;
    $('resultStars').textContent = sessionStars;
    $('resultCombo').textContent = maxCombo;
    $('resultWeak').textContent = getWeakItems().length;
    $('resultClearStars').classList.toggle('hidden', rating === null);
    $('resultEyebrow').textContent = stage ? `${stage.label} ${stage.title}` : 'けっか';

    if (rating !== null) {
      $('resultClearStars').textContent = starText(rating);
      $('resultMedal').textContent = stage.boss ? (rating ? '👑' : '👾') : '★';
      $('resultMessage').textContent = rating === 3 ? 'パーフェクト！ ★★★' : rating === 2 ? 'すごい！ ★★ クリア！' : rating === 1 ? 'クリア！ つぎへ すすめるよ！' : 'あと すこし！ 6もん せいかいで クリア！';
    } else {
      $('resultMedal').textContent = '★';
      $('resultMessage').textContent = sessionCorrect >= 9 ? 'すごい！ かんじはかせ！' : sessionCorrect >= 7 ? 'とっても よくできました！' : sessionCorrect >= 5 ? 'いいちょうし！ もういっかい やってみよう' : 'だいじょうぶ。すこしずつ おぼえよう！';
    }

    const newly = COLLECTIONS.filter(c => starsAtStart < c.need && state.stars >= c.need);
    const unlockBox = $('unlockBox');
    if (newly.length) {
      unlockBox.innerHTML = `<strong>🎁 あたらしい なかま！</strong><span>${newly.map(c => `${c.icon} ${c.name}`).join('・')}</span>`;
      unlockBox.classList.remove('hidden');
    } else if (nextUnlocked) {
      unlockBox.innerHTML = '<strong>🗺 つぎのステージ かいほう！</strong><span>ぼうけんマップに あたらしい ステージが でたよ</span>';
      unlockBox.classList.remove('hidden');
    } else {
      unlockBox.classList.add('hidden');
    }

    const nextBtn = $('nextStageBtn');
    if (stage && rating >= 1 && currentContext.stageIndex < STAGES.length - 1) {
      nextBtn.classList.remove('hidden');
      nextBtn.textContent = 'マップへ すすむ';
    } else {
      nextBtn.classList.add('hidden');
    }

    const resultMascot = $('resultMascot');
    if (resultMascot) {
      const cleared = rating === null ? sessionCorrect >= 7 : rating >= 1;
      resultMascot.className = `goth-bunny result-bunny ${cleared ? 'victory' : 'sad'}`;
    }

    showView('resultView');
  }

  function retryCurrent() {
    if (lastContext.type === 'stage') startStage(lastContext.stageIndex);
    else if (lastContext.type === 'weak') startWeakQuiz();
    else {
      selectedMode = lastContext.mode || 'mix';
      document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === selectedMode));
      startFreeQuiz();
    }
  }

  function renderCollection() {
    const grid = $('collectionGrid');
    grid.innerHTML = COLLECTIONS.map(c => {
      const unlocked = state.stars >= c.need;
      return `<article class="collection-card${unlocked ? '' : ' locked'}">
        <div class="collection-icon">${unlocked ? c.icon : '❔'}</div>
        <strong>${unlocked ? c.name : '？？？'}</strong>
        <small>${unlocked ? c.desc : `<span class="need">あと ⭐${Math.max(0, c.need - state.stars)}</span>`}</small>
      </article>`;
    }).join('');
  }

  function renderRecords() {
    $('totalAnswered').textContent = state.totalAnswered;
    $('totalCorrect').textContent = state.totalCorrect;
    $('totalAccuracy').textContent = state.totalAnswered ? `${Math.round(state.totalCorrect / state.totalAnswered * 100)}%` : '0%';
    $('recordStars').textContent = state.stars;

    const sr = $('stageRecordList');
    const playedStages = STAGES.filter(s => state.stageScores[s.id]);
    if (!playedStages.length) {
      sr.className = 'stage-record-list empty';
      sr.textContent = 'まだ ありません';
    } else {
      sr.className = 'stage-record-list';
      sr.innerHTML = playedStages.map(s => {
        const x = state.stageScores[s.id];
        return `<div class="stage-record-row"><span>${s.label} ${s.title}</span><span>${starText(x.rating || 0)}</span><strong>${x.best || 0}/10</strong></div>`;
      }).join('');
    }

    const weak = getWeakItems().slice(0,10);
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
      const label = { mix:'まぜこぜ', reading:'よみ', kanji:'かんじ', 'にがて':'にがて' };
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

  $('adventureBtn').addEventListener('click', () => { pendingMapMove = null; renderStageMap(); showView('stageView'); });
  $('stageBackBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });
  $('freeBtn').addEventListener('click', startFreeQuiz);
  $('weakBtn').addEventListener('click', startWeakQuiz);
  $('collectionBtn').addEventListener('click', () => { renderCollection(); showView('collectionView'); });
  $('collectionBackBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });
  $('recordBtn').addEventListener('click', () => { renderRecords(); showView('recordView'); });
  $('recordBackBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });

  $('nextBtn').addEventListener('click', nextQuestion);
  $('quitBtn').addEventListener('click', () => {
    openModal('クイズを やめる？', '<p>いまのクイズを おわって ホームにもどります。</p><button id="confirmQuit" class="secondary-wide" type="button">ホームにもどる</button>');
    setTimeout(() => {
      const b = $('confirmQuit');
      if (b) b.addEventListener('click', () => { closeModal(); updateHome(); showView('homeView'); });
    },0);
  });

  $('retryBtn').addEventListener('click', retryCurrent);
  $('nextStageBtn').addEventListener('click', () => {
    if (lastContext.type !== 'stage') return;
    const from = lastContext.stageIndex;
    const to = Math.min(STAGES.length - 1, from + 1);
    pendingMapMove = { from, to };
    renderStageMap(pendingMapMove);
    showView('stageView');
    pendingMapMove = null;
  });
  $('homeBtn').addEventListener('click', () => { updateHome(); showView('homeView'); });

  $('soundBtn').addEventListener('click', () => {
    state.sound = !state.sound;
    saveState();
    updateHome();
    if (state.sound) playTone(true);
  });

  $('helpBtn').addEventListener('click', () => openModal(
    'iPhoneでホーム画面に追加',
    '<ol><li>Safariで かんじクエストを ひらく</li><li>共有メニューを ひらく</li><li>「ホーム画面に追加」を えらぶ</li><li>「Webアプリとして開く」をONにして追加</li></ol><p>GitHub PagesのURLは、そのままブックマークしてもつかえます。</p>'
  ));

  $('modalCloseBtn').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

  $('resetBtn').addEventListener('click', () => {
    openModal('きろくを けす？', '<p>⭐、ステージ、にがて、きろくが ぜんぶ 0にもどります。</p><button id="confirmReset" class="secondary-wide" type="button">ぜんぶ けす</button>');
    setTimeout(() => {
      const b = $('confirmReset');
      if (b) b.addEventListener('click', () => {
        state = defaultState();
        saveState();
        closeModal();
        renderRecords();
        updateHome();
      });
    },0);
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }

  decorateMascots();
  updateHome();
})();
