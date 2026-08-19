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


  // 代表読みだけではなく、1年生配当漢字が持つ一般的な音訓も使って
  // 「せん → 千 / 川 / 先」のような複数正解になり得る選択肢を除外する。
  const READING_ALIASES = {
    '一':['いち','いつ','ひと','ひとつ'],'右':['う','ゆう','みぎ'],'雨':['う','あめ','あま'],'円':['えん','まる'],'王':['おう'],
    '音':['おん','いん','おと','ね'],'下':['か','げ','した','しも','もと','さげる','くだる'],'火':['か','ひ','ほ'],'花':['か','はな'],'貝':['かい'],
    '学':['がく','まなぶ'],'気':['き','け'],'九':['きゅう','く','ここの'],'休':['きゅう','やすむ'],'玉':['ぎょく','たま'],
    '金':['きん','こん','かね','かな'],'空':['くう','そら','あく','から'],'月':['げつ','がつ','つき'],'犬':['けん','いぬ'],'見':['けん','みる'],
    '五':['ご','いつ'],'口':['こう','く','くち'],'校':['こう'],'左':['さ','ひだり'],'三':['さん','み','みつ'],
    '山':['さん','やま'],'子':['し','す','こ'],'四':['し','よ','よん'],'糸':['し','いと'],'字':['じ'],
    '耳':['じ','みみ'],'七':['しち','なな'],'車':['しゃ','くるま'],'手':['しゅ','て'],'十':['じゅう','じっ','とお'],
    '出':['しゅつ','でる','だす'],'女':['じょ','にょ','おんな'],'小':['しょう','ちいさい','こ'],'上':['じょう','しょう','うえ','かみ'],'森':['しん','もり'],
    '人':['じん','にん','ひと'],'水':['すい','みず'],'正':['せい','しょう','ただしい'],'生':['せい','しょう','いきる','うまれる','なま'],'青':['せい','しょう','あお'],
    '夕':['せき','ゆう'],'石':['せき','しゃく','こく','いし'],'赤':['せき','しゃく','あか'],'千':['せん','ち'],'川':['せん','かわ'],
    '先':['せん','さき'],'早':['そう','さ','はやい'],'草':['そう','くさ'],'足':['そく','あし','たる'],'村':['そん','むら'],
    '大':['だい','たい','おおきい'],'男':['だん','なん','おとこ'],'竹':['ちく','たけ'],'中':['ちゅう','なか'],'虫':['ちゅう','むし'],
    '町':['ちょう','まち'],'天':['てん','あま','あめ'],'田':['でん','た'],'土':['ど','と','つち'],'二':['に','ふた'],
    '日':['にち','じつ','ひ','か'],'入':['にゅう','はいる','いる'],'年':['ねん','とし'],'白':['はく','びゃく','しろ'],'八':['はち','や','よう'],
    '百':['ひゃく','びゃく'],'文':['ぶん','もん','ふみ'],'木':['ぼく','もく','き'],'本':['ほん','もと'],'名':['めい','みょう','な'],
    '目':['もく','ぼく','め'],'立':['りつ','りゅう','たつ'],'力':['りょく','りき','ちから'],'林':['りん','はやし'],'六':['ろく','む','むい']
  };

  function kanjiHasReading(kanji, reading) {
    const item = DATA.find(x => x.k === kanji);
    const aliases = READING_ALIASES[kanji] || [];
    return (item?.r === reading) || aliases.includes(reading);
  }

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
  {
    "id": "egg",
    "name": "まほうのたまご",
    "rarity": "ノーマル",
    "age": "？",
    "type": "ふしぎなたまご",
    "personality": "ちょっぴり はずかしがりや。しずかに みんなを おうえんしている。",
    "skill": "キラキラをみつけること",
    "favorite": "ほしのひかり",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "しずかだけど、ここぞというときは ぴかっと ひかるよ。",
    "art": "egg",
    "species": "egg",
    "accent": "#ef9bc8",
    "accent2": "#f7d8e9",
    "tone": "#8552a5",
    "mark": "✦"
  },
  {
    "id": "cat",
    "name": "むらさきねこ",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "いたずらねこ",
    "personality": "げんきいっぱいで いたずらずき。せいかいすると すぐに ぴょん！と よろこぶ。",
    "skill": "すばやく こたえを みつけること",
    "favorite": "ピンクのリボン",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "げんきで ちょっぴり おちゃめな ねこ。",
    "art": "creature",
    "species": "cat",
    "accent": "#f09cc9",
    "accent2": "#ffd7ea",
    "tone": "#8552a5",
    "mark": "♪"
  },
  {
    "id": "owl",
    "name": "ものしりふくろう",
    "rarity": "ノーマル",
    "age": "9さい",
    "type": "ものしりはかせ",
    "personality": "おちついていて とっても ものしり。むずかしい じゅくごが だいすき。",
    "skill": "よみかたの ヒントを かんがえること",
    "favorite": "ほんと よるのもり",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ほんを よむのが だいすきな ふくろう。",
    "art": "creature",
    "species": "owl",
    "accent": "#dba7ef",
    "accent2": "#f7d7ff",
    "tone": "#6d4d86",
    "mark": "本"
  },
  {
    "id": "unicorn",
    "name": "ほしのユニコーン",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "ゆめみるユニコーン",
    "personality": "やさしくて ゆめみがち。コンボが つづくと ほしの ちからで おうえんしてくれる。",
    "skill": "コンボおうえん",
    "favorite": "ほしと つき",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "きらきら ひかる ほしの こ。",
    "art": "creature",
    "species": "unicorn",
    "accent": "#efa7d7",
    "accent2": "#fff0fb",
    "tone": "#8552a5",
    "mark": "★"
  },
  {
    "id": "wizard",
    "name": "かんじのまどうし",
    "rarity": "ノーマル",
    "age": "10さい",
    "type": "ちいさなまほうつかい",
    "personality": "けんきゅうねっしんで ちょっと ふしぎ。しらない ことばを見ると すぐに しらべたくなる。",
    "skill": "かんじのヒントづくり",
    "favorite": "まほうのつえ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "かんじの ひみつを しっている まほうつかい。",
    "art": "creature",
    "species": "wizard",
    "accent": "#ef9bc8",
    "accent2": "#f7d7ff",
    "tone": "#6e4a86",
    "mark": "✦"
  },
  {
    "id": "dragon",
    "name": "ドラゴンのともだち",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "つよがりドラゴン",
    "personality": "みためは つよそうだけど じつは てれや。ボスせんになると ぐっと たのもしくなる。",
    "skill": "ボスせんの おうえん",
    "favorite": "むらさきの ほうせき",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ボスせんで もりあがる ちいさなドラゴン。",
    "art": "creature",
    "species": "dragon",
    "accent": "#ef9bc8",
    "accent2": "#cab8ff",
    "tone": "#8552a5",
    "mark": "炎"
  },
  {
    "id": "fox",
    "name": "こぎつね こはる",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "やさしいきつね",
    "personality": "すばしっこくて おせわずき。まちがえても そっと はげましてくれる。",
    "skill": "みちあんない",
    "favorite": "あかい はっぱ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "しっぽを ふりながら ぼうけんする こぎつね。",
    "art": "creature",
    "species": "fox",
    "accent": "#f3b08d",
    "accent2": "#ffe0cc",
    "tone": "#8552a5",
    "mark": "葉"
  },
  {
    "id": "bear",
    "name": "くままる",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "のんびりくま",
    "personality": "のんびりやだけど ちからもち。がんばったら だいきく うなずいて よろこんでくれる。",
    "skill": "にもつはこび",
    "favorite": "はちみつ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ほっとする えがおの くま。",
    "art": "creature",
    "species": "bear",
    "accent": "#d9a77a",
    "accent2": "#ffe3c3",
    "tone": "#8552a5",
    "mark": "蜜"
  },
  {
    "id": "sheep",
    "name": "ふわりひつじ",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "ふわふわひつじ",
    "personality": "おっとりしていて やさしい。なみだの ときは もこもこ ひつじぐもで つつんでくれる。",
    "skill": "おひるね",
    "favorite": "わたぐも",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "もこもこ ふわふわの ひつじさん。",
    "art": "creature",
    "species": "sheep",
    "accent": "#e9c7ff",
    "accent2": "#fff7ff",
    "tone": "#8552a5",
    "mark": "雲"
  },
  {
    "id": "penguin",
    "name": "ぺんた",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "しっかりペンギン",
    "personality": "れいせいで しっかりもの。クイズの まえには しずかに しゅうちゅうポーズ。",
    "skill": "きれいに ならぶこと",
    "favorite": "つめたいジュース",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "きりっと した めつきの ペンギン。",
    "art": "creature",
    "species": "penguin",
    "accent": "#8ec6ff",
    "accent2": "#e4f5ff",
    "tone": "#5d5d8a",
    "mark": "氷"
  },
  {
    "id": "bat",
    "name": "こうもりミミ",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "よぞらのこうもり",
    "personality": "よるが だいすきで ちょっぴり こわがり。だけど みんなのためなら すぐに とんでくる。",
    "skill": "くらやみで みつけること",
    "favorite": "よるの ほし",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "よぞらを くるくる とぶ こうもり。",
    "art": "creature",
    "species": "bat",
    "accent": "#a47de8",
    "accent2": "#f7d8ff",
    "tone": "#5a416f",
    "mark": "月"
  },
  {
    "id": "panda",
    "name": "ぱんだまる",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "のんびりパンダ",
    "personality": "たべるのが だいすきな まったりパンダ。がんばりやさんには おおきな まるを くれる。",
    "skill": "おうえんの まるしるし",
    "favorite": "ささだんご",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ぽてっと かわいい パンダさん。",
    "art": "creature",
    "species": "panda",
    "accent": "#c6b0ff",
    "accent2": "#fff",
    "tone": "#505070",
    "mark": "○"
  },
  {
    "id": "squirrel",
    "name": "りすぴ",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "おてんばリス",
    "personality": "てきぱきしていて げんきいっぱい。ひらめくと しっぽが ぴーんと たつ。",
    "skill": "どんぐりあつめ",
    "favorite": "クッキー",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ぴょこぴょこ うごく りす。",
    "art": "creature",
    "species": "squirrel",
    "accent": "#efb07f",
    "accent2": "#ffe4c7",
    "tone": "#8552a5",
    "mark": "実"
  },
  {
    "id": "hamster",
    "name": "はむち",
    "rarity": "ノーマル",
    "age": "5さい",
    "type": "まるまるハムスター",
    "personality": "ちいさいけれど すごく がんばりや。せいかいすると くるっと まわって よろこぶ。",
    "skill": "くるくるダンス",
    "favorite": "ひまわりのたね",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ころころ かわいい ハムスター。",
    "art": "creature",
    "species": "hamster",
    "accent": "#f3c081",
    "accent2": "#fff0d6",
    "tone": "#8552a5",
    "mark": "花"
  },
  {
    "id": "chick",
    "name": "ぴよぴよ",
    "rarity": "ノーマル",
    "age": "5さい",
    "type": "げんきなひよこ",
    "personality": "ちいさな こえで いっしょうけんめい おうえんしてくれる。",
    "skill": "あさの あいさつ",
    "favorite": "とうもろこし",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ぴよっと とびはねる ひよこ。",
    "art": "creature",
    "species": "chick",
    "accent": "#ffd861",
    "accent2": "#fff3a8",
    "tone": "#8552a5",
    "mark": "♪"
  },
  {
    "id": "frog",
    "name": "けろり",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "ジャンプがとくいなカエル",
    "personality": "テンポよく ぽんぽん こたえたいタイプ。まちがえても すぐに きりかえる。",
    "skill": "ジャンプ",
    "favorite": "あまつぶ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "あめのひが だいすきな カエル。",
    "art": "creature",
    "species": "frog",
    "accent": "#8ed68a",
    "accent2": "#e5ffe4",
    "tone": "#6e5b7d",
    "mark": "雨"
  },
  {
    "id": "dolphin",
    "name": "るるか",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "うみのイルカ",
    "personality": "さわやかで ひとなつっこい。せいかいすると きらっと しぶきを あげる。",
    "skill": "はやおよぎ",
    "favorite": "ひかる うみ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "きらきら しぶきの イルカ。",
    "art": "creature",
    "species": "dolphin",
    "accent": "#82cdf2",
    "accent2": "#dff7ff",
    "tone": "#5b6f8a",
    "mark": "波"
  },
  {
    "id": "tiger",
    "name": "とらまる",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "ちいさなトラ",
    "personality": "きあいじゅうぶんで まけずぎらい。ボスのHPが へると いちばん もりあがる。",
    "skill": "きあいの かけごえ",
    "favorite": "しましまクッション",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "きりっと した しましまタイガー。",
    "art": "creature",
    "species": "tiger",
    "accent": "#ffbb66",
    "accent2": "#fff0d0",
    "tone": "#8552a5",
    "mark": "虎"
  },
  {
    "id": "lion",
    "name": "ししまる",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "おうさまライオン",
    "personality": "どっしりしていて たよりになる。ピンチの ときも あわてず どーんと かまえる。",
    "skill": "みんなを まとめること",
    "favorite": "きんいろの ほし",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ゆうかんな ほしの ライオン。",
    "art": "creature",
    "species": "lion",
    "accent": "#ffc96e",
    "accent2": "#fff2cf",
    "tone": "#8552a5",
    "mark": "王"
  },
  {
    "id": "ghost",
    "name": "おばけのしろう",
    "rarity": "ノーマル",
    "age": "？",
    "type": "びっくりおばけ",
    "personality": "ひょいっと あらわれる いたずらずき。でも なみだを みると すぐに やさしくなる。",
    "skill": "こっそり しのびこむこと",
    "favorite": "まっしろ シーツ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ふわっと あらわれる おばけ。",
    "art": "creature",
    "species": "ghost",
    "accent": "#e6d9ff",
    "accent2": "#ffffff",
    "tone": "#6a5d7a",
    "mark": "！"
  },
  {
    "id": "robot",
    "name": "かなロボ",
    "rarity": "ノーマル",
    "age": "3さい",
    "type": "べんきょうロボット",
    "personality": "ぴこぴこ かんがえる しっかりロボ。せいかいりつを みるのが だいすき。",
    "skill": "データせいり",
    "favorite": "でんきの ほし",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ぴかっと ひかる おべんきょうロボ。",
    "art": "creature",
    "species": "robot",
    "accent": "#8dd1ff",
    "accent2": "#eff9ff",
    "tone": "#5a6b85",
    "mark": "数"
  },
  {
    "id": "fairy",
    "name": "ほしのフェアリー",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "ちいさなようせい",
    "personality": "くるくる とびまわる おうえんやさん。せいかいすると ほしのこなを ふらせる。",
    "skill": "きらきらまほう",
    "favorite": "ほしのこな",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "きらきらひかる ほしの ようせい。",
    "art": "creature",
    "species": "fairy",
    "accent": "#f3a8ff",
    "accent2": "#fff1ff",
    "tone": "#8552a5",
    "mark": "✦"
  },
  {
    "id": "ninja",
    "name": "しのぶ",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "こっそりにんじゃ",
    "personality": "しずかで すばやい にんじゃ。むずかしい もんだいの ときほど しゅうちゅうする。",
    "skill": "しゅぎょう",
    "favorite": "むらさきの マフラー",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "しゅっと きめる ちいさな にんじゃ。",
    "art": "creature",
    "species": "ninja",
    "accent": "#c195ff",
    "accent2": "#f5e8ff",
    "tone": "#5f5173",
    "mark": "忍"
  },
  {
    "id": "mermaid",
    "name": "まりりん",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "うみのマーメイド",
    "personality": "うたうのが だいすきで えがおが すてき。よろこぶと ひれが ひらひら ひかる。",
    "skill": "うたで おうえん",
    "favorite": "かいがら",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "うみの きらめきを はこぶ マーメイド。",
    "art": "creature",
    "species": "mermaid",
    "accent": "#7ad6d2",
    "accent2": "#defeff",
    "tone": "#5d6c86",
    "mark": "貝"
  },
  {
    "id": "alpaca",
    "name": "あるぱ",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "ふわふわアルパカ",
    "personality": "ゆっくりだけど まじめ。コツコツ がんばる ひとを ちゃんと ほめてくれる。",
    "skill": "ふわふわ いやし",
    "favorite": "ラベンダー",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ふわもこ えがおの アルパカ。",
    "art": "creature",
    "species": "alpaca",
    "accent": "#f2d2ff",
    "accent2": "#fff8ff",
    "tone": "#8552a5",
    "mark": "花"
  },
  {
    "id": "raccoon",
    "name": "ぽんきち",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "たぬきのぽんきち",
    "personality": "おしゃべりで たのしい ムードメーカー。はずれでも すぐに げんきを くれる。",
    "skill": "おもしろリアクション",
    "favorite": "どんぐり",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ぽんぽこ たのしい たぬき。",
    "art": "creature",
    "species": "raccoon",
    "accent": "#c9a27f",
    "accent2": "#ffe6d1",
    "tone": "#8552a5",
    "mark": "♪"
  },
  {
    "id": "hedgehog",
    "name": "はりぃ",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "ちいさなハリネズミ",
    "personality": "はじめは ひかえめ。でも なかよくなると とっても あまえんぼう。",
    "skill": "かくれんぼ",
    "favorite": "りんご",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "ころっと まるい ハリネズミ。",
    "art": "creature",
    "species": "hedgehog",
    "accent": "#c59678",
    "accent2": "#ffe4cf",
    "tone": "#8552a5",
    "mark": "実"
  },
  {
    "id": "deer",
    "name": "しかこ",
    "rarity": "ノーマル",
    "age": "7さい",
    "type": "もりのしか",
    "personality": "ていねいで おしとやか。せいかいすると ぴんと せすじを のばして おじぎする。",
    "skill": "きれいな おじぎ",
    "favorite": "はなのかんむり",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "やさしく ほほえむ しかさん。",
    "art": "creature",
    "species": "deer",
    "accent": "#d7a989",
    "accent2": "#ffe8d8",
    "tone": "#8552a5",
    "mark": "花"
  },
  {
    "id": "wolf",
    "name": "ルナウルフ",
    "rarity": "ノーマル",
    "age": "8さい",
    "type": "つきよのオオカミ",
    "personality": "クールだけど なかまおもい。しゅうちゅうしたい ときに そっと そばに いてくれる。",
    "skill": "よぞらの みはり",
    "favorite": "まんげつ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "つきを みあげる クールな オオカミ。",
    "art": "creature",
    "species": "wolf",
    "accent": "#a3a8d8",
    "accent2": "#eef0ff",
    "tone": "#6a607d",
    "mark": "月"
  },
  {
    "id": "bee",
    "name": "はちみつビー",
    "rarity": "ノーマル",
    "age": "6さい",
    "type": "ちいさなミツバチ",
    "personality": "せっせと はたらく しっかりもの。はやい てんぽの クイズが だいすき。",
    "skill": "ブンブン ダッシュ",
    "favorite": "はちみつ",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "くるくる とぶ ちいさな ハチ。",
    "art": "creature",
    "species": "bee",
    "accent": "#ffd464",
    "accent2": "#fff2ba",
    "tone": "#8552a5",
    "mark": "蜜"
  },
  {
    "id": "mochi",
    "name": "もちまる",
    "rarity": "ノーマル",
    "age": "5さい",
    "type": "まんまるもち",
    "personality": "ほっぺの よく のびる おだやかな こ。みんなが リラックスできる ふんいきを つくる。",
    "skill": "もっちり いやし",
    "favorite": "さくらもち",
    "join": "ステージを 10もん せいかいで クリアすると ランダムに であえるよ",
    "blurb": "もちもち まんまるな おともだち。",
    "art": "creature",
    "species": "mochi",
    "accent": "#f6c1df",
    "accent2": "#fff3fa",
    "tone": "#8552a5",
    "mark": "○"
  },
  {
    "id": "iroha",
    "name": "いろは",
    "rarity": "レア",
    "age": "7さい",
    "type": "うめぼしがだいすきなおんなのこ",
    "personality": "ものしりになりたくて かんじを べんきょうちゅう。レアキャラだから いつでてくるか わからない。",
    "skill": "てつぼう",
    "favorite": "うめぼし、えをかくこと",
    "join": "レアキャラだから いつでてくるか わからない",
    "blurb": "うめぼしが だいすきな げんきっこ。",
    "art": "iroha",
    "species": "iroha",
    "accent": "#f08fbe",
    "accent2": "#ffe2ef",
    "tone": "#8552a5",
    "mark": "梅"
  }
];
  const CHARACTER_BY_ID = Object.fromEntries(COLLECTIONS.map(c => [c.id, c]));

  function isCharacterUnlocked(c) {
    return Array.isArray(state.unlockedCharacters) && state.unlockedCharacters.includes(c.id);
  }

  function companionProfile(id) {
    return CHARACTER_BY_ID[id] || CHARACTER_BY_ID.egg;
  }

  function rarityClass(rarity) {
    return rarity === 'レア' ? 'rare' : 'normal';
  }

  function creatureFaceSvg(c) {
    const line = c.tone || '#8552a5';
    const accent = c.accent || '#ef9bc8';
    const accent2 = c.accent2 || '#fff0fa';
    const species = c.species || 'cat';
    const outer = { penguin:'#e8f4ff', seal:'#edf7ff', robot:'#eef7ff', crystal:'#f2fbff', mochi:'#fff6fb', bee:'#fff8dd' }[species] || '#fff8fd';
    const badge = { penguin:'#d8ecff', seal:'#dfeeff', robot:'#dceeff', crystal:'#d9f4ff', bee:'#ffef9a', tiger:'#ffd391', lion:'#ffe2a1', fox:'#ffd1ae', bear:'#e5c2a4', squirrel:'#ffd8b8', hedgehog:'#e4c6b0', deer:'#f6d5c4', peach:'#ffd5df', frog:'#d4f7cc', mermaid:'#ccf7ff', dolphin:'#cdefff', wolf:'#d8ddff' }[species] || '#f5e9f8';
    const mark = c.mark || '★';
    let ears = '';
    if (['cat','fox','wolf','raccoon','tiger'].includes(species)) ears = `<path d="M24 33 18 14l16 12" fill="${accent}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/><path d="M72 33 78 14 62 26" fill="${accent}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`;
    if (['alpaca'].includes(species)) ears = `<rect x="23" y="10" width="12" height="28" rx="7" fill="${accent}" stroke="${line}" stroke-width="4"/><rect x="61" y="10" width="12" height="28" rx="7" fill="${accent}" stroke="${line}" stroke-width="4"/>`;
    if (['bear','panda','koala','mochi','hamster'].includes(species)) ears = `<circle cx="28" cy="24" r="9" fill="${accent}" stroke="${line}" stroke-width="4"/><circle cx="68" cy="24" r="9" fill="${accent}" stroke="${line}" stroke-width="4"/>`;
    if (['owl','bee'].includes(species)) ears = `<path d="M28 26c4-8 10-10 16-4" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M68 26c-4-8-10-10-16-4" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
    if (species === 'frog') ears = `<circle cx="30" cy="23" r="8" fill="${accent}" stroke="${line}" stroke-width="4"/><circle cx="66" cy="23" r="8" fill="${accent}" stroke="${line}" stroke-width="4"/>`;
    if (species === 'penguin') ears = `<path d="M26 28c3-9 9-13 16-11" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M70 28c-3-9-9-13-16-11" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
    if (species === 'seal') ears = `<path d="M24 30c5-5 10-6 14-2" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M72 30c-5-5-10-6-14-2" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
    let addon = '';
    if (species === 'unicorn') addon += `<path d="M48 10 56 28 40 28Z" fill="${accent2}" stroke="${line}" stroke-width="3"/>`;
    if (species === 'wizard') addon += `<path d="M48 8 69 28H27Z" fill="${accent}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`;
    if (species === 'dragon') addon += `<path d="M22 52 10 44l7 16" fill="${accent}" stroke="${line}" stroke-width="3"/><path d="M74 52 86 44l-7 16" fill="${accent}" stroke="${line}" stroke-width="3"/>`;
    if (species === 'fairy') addon += `<circle cx="48" cy="14" r="6" fill="${accent2}" stroke="${line}" stroke-width="3"/><path d="M24 50c-8-5-10-11-7-17 7 2 13 7 14 14M72 50c8-5 9-11 7-17-7 2-13 7-14 14" fill="${accent2}" stroke="${line}" stroke-width="3"/>`;
    if (species === 'ninja') addon += `<path d="M28 23h40" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
    if (species === 'mermaid') addon += `<path d="M18 60c7-6 11-6 17 0M78 60c-7-6-11-6-17 0" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
    if (species === 'deer') addon += `<path d="M28 20c2-10 6-14 11-16M28 20c-4-5-7-6-12-6M68 20c-2-10-6-14-11-16M68 20c4-5 7-6 12-6" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`;
    if (species === 'lion') addon += `<circle cx="48" cy="44" r="29" fill="${accent2}" opacity=".45"/>`;
    if (species === 'ghost') addon += `<path d="M22 66c0-23 12-38 26-38s26 15 26 38v10l-9-5-7 5-10-5-10 5-7-5-9 5Z" fill="${badge}" stroke="${line}" stroke-width="4"/>`;
    if (species === 'robot') addon += `<rect x="28" y="12" width="40" height="10" rx="5" fill="${accent}" stroke="${line}" stroke-width="3"/><path d="M48 4v8" stroke="${line}" stroke-width="3"/><circle cx="48" cy="4" r="3" fill="${accent2}" stroke="${line}" stroke-width="2"/>`;
    if (species === 'crystal') addon += `<path d="M48 10 60 26 48 42 36 26Z" fill="${accent2}" stroke="${line}" stroke-width="3"/>`;
    if (species === 'bee') addon += `<path d="M23 46c-7-5-9-10-7-17 8 1 13 5 16 12M73 46c7-5 9-10 7-17-8 1-13 5-16 12" fill="${accent2}" stroke="${line}" stroke-width="3"/>`;
    const whiskers = ['cat','fox','raccoon'].includes(species) ? `<path d="M29 55h-8M29 59h-9M67 55h8M67 59h9" stroke="${line}" stroke-width="2.4" stroke-linecap="round"/>` : '';
    const faceBase = species === 'ghost' ? `<circle cx="48" cy="45" r="23" fill="#fff8fd" stroke="${line}" stroke-width="4"/>` : `<circle cx="48" cy="46" r="26" fill="${badge}" stroke="${line}" stroke-width="4"/><ellipse cx="48" cy="48" rx="21" ry="18" fill="${outer}"/>`;
    const eyes = ['owl'].includes(species) ? `<circle cx="38" cy="44" r="6" fill="${line}"/><circle cx="58" cy="44" r="6" fill="${line}"/><circle cx="40" cy="42" r="1.4" fill="#fff"/><circle cx="60" cy="42" r="1.4" fill="#fff"/>` : `<ellipse cx="39" cy="45" rx="3.5" ry="4.8" fill="${line}"/><ellipse cx="57" cy="45" rx="3.5" ry="4.8" fill="${line}"/><circle cx="40" cy="43" r="1.2" fill="#fff"/><circle cx="58" cy="43" r="1.2" fill="#fff"/>`;
    const cheeks = `<circle cx="32" cy="54" r="3.6" fill="#f4bdd8" opacity=".72"/><circle cx="64" cy="54" r="3.6" fill="#f4bdd8" opacity=".72"/>`;
    const mouth = `<path d="M43 55c3 3 7 3 10 0" fill="none" stroke="${line}" stroke-width="2.6" stroke-linecap="round"/>`;
    const body = species === 'ghost' ? '' : `<path d="M30 74c4-14 11-20 18-20s14 6 18 20v7H30Z" fill="${line}" opacity=".95"/><path d="M42 66l6-7 6 7-6 8Z" fill="${accent}"/>`;
    return `<svg viewBox="0 0 96 96" class="companion-svg ${rarityClass(c.rarity)}" aria-hidden="true"><circle cx="48" cy="48" r="42" fill="#fff"/>${ears}${addon}${faceBase}${eyes}${whiskers}${mouth}${cheeks}${body}<circle cx="48" cy="79" r="11" fill="#ffffff" opacity=".94" stroke="${line}" stroke-width="2"/><text x="48" y="83" text-anchor="middle" font-size="11" font-weight="900" fill="${line}" font-family="sans-serif">${mark}</text></svg>`;
  }

  function irohaSvg() {
    return `<svg viewBox="0 0 96 96" class="companion-svg rare" aria-hidden="true"><circle cx="48" cy="48" r="42" fill="#fff"/><path d="M24 78c3-16 13-24 24-24s21 8 24 24v6H24Z" fill="#8552a5" opacity=".95"/><circle cx="48" cy="40" r="24" fill="#ffeef6" stroke="#5d376d" stroke-width="4"/><path d="M28 38c0-15 10-27 24-27 10 0 18 6 22 15-5 0-9 6-9 13v4H28Z" fill="#5a2f68"/><path d="M54 15c9 0 15 8 15 17-5 0-8 5-8 11" fill="none" stroke="#5a2f68" stroke-width="8" stroke-linecap="round"/><circle cx="69" cy="22" r="6" fill="#e572a7" stroke="#7b3d7f" stroke-width="2"/><circle cx="63" cy="18" r="5" fill="#f6a6c9" stroke="#7b3d7f" stroke-width="2"/><circle cx="44" cy="41" r="4" fill="#5d376d"/><circle cx="56" cy="41" r="4" fill="#5d376d"/><circle cx="45" cy="39" r="1.2" fill="#fff"/><circle cx="57" cy="39" r="1.2" fill="#fff"/><path d="M43 51c3 2 7 2 10 0" fill="none" stroke="#5d376d" stroke-width="2.6" stroke-linecap="round"/><circle cx="36" cy="49" r="3.5" fill="#f7bfd7"/><circle cx="60" cy="49" r="3.5" fill="#f7bfd7"/><path d="M47 58l-6 6 6 6 6-6Z" fill="#ef8dbc"/><circle cx="28" cy="63" r="8" fill="#d85d8b" stroke="#7b3d7f" stroke-width="2"/><path d="M24 63c3-2 5-2 8 0" fill="none" stroke="#fff0f6" stroke-width="2" stroke-linecap="round"/><circle cx="74" cy="74" r="12" fill="#fff" opacity=".95" stroke="#7b3d7f" stroke-width="2"/><text x="74" y="79" text-anchor="middle" font-size="12" font-weight="900" fill="#7b3d7f" font-family="sans-serif">梅</text></svg>`;
  }

  function companionArt(id) {
    const c = companionProfile(id);
    if (!c) return '';
    if (c.art === 'iroha') return irohaSvg();
    if (c.art === 'egg') return `<svg viewBox="0 0 96 96" class="companion-svg" aria-hidden="true"><circle cx="48" cy="48" r="42" fill="#fff"/><path d="M48 12c17 0 30 24 30 43 0 18-12 29-30 29S18 73 18 55C18 36 31 12 48 12Z" fill="#7d4a90" stroke="#2d2233" stroke-width="5"/><path d="M48 19c11 0 21 19 21 35 0 13-8 21-21 21s-21-8-21-21c0-16 10-35 21-35Z" fill="#ef9bc8" opacity=".92"/><path d="M35 49l9-8 6 7 9-9 5 6-15 16Z" fill="#fff7fc" stroke="#5b3567" stroke-width="3" stroke-linejoin="round"/><circle cx="45" cy="51" r="2.5" fill="#5b3567"/><circle cx="54" cy="48" r="2.5" fill="#5b3567"/><path d="M45 58c3 2 5 2 8 0" fill="none" stroke="#5b3567" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    return creatureFaceSvg(c);
  }

  function bossArt(stage) {
    if (stage?.id === 'b2') return `<div class="boss-art boss-dragon-art">${companionArt('dragon')}</div>`;
    return `<div class="boss-art boss-monster-art"><span class="boss-monster-face">👾</span><i class="boss-horn h1"></i><i class="boss-horn h2"></i></div>`;
  }

  const defaultState = () => ({
    stars: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    sound: true,
    stats: {},
    history: [],
    stageScores: {},
    unlockedCharacters: [],
    collectionVersion: 'v071'
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
  let sessionWrong = 0;
  let attemptFailed = false;
  let sessionCompanionIds = [];
  let currentSourceItems = [];
  let currentQuizMode = 'mix';
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
      const merged = {
        ...defaultState(),
        ...parsed,
        stageScores: parsed.stageScores || {},
        unlockedCharacters: Array.isArray(parsed.unlockedCharacters) ? parsed.unlockedCharacters : []
      };

      // V7以前からの移行：10/10を取ったステージだけを「クリア済み」として残す。
      // 旧スター条件で大量に表示された仲間は引き継がず、クリア済みステージ1つにつき1体に戻す。
      if (parsed.collectionVersion !== 'v071') {
        const migratedScores = {};
        let cleared = 0;
        for (const stage of STAGES) {
          const old = parsed.stageScores?.[stage.id];
          if (old && (old.best || 0) >= 10) {
            migratedScores[stage.id] = {
              rating: Math.max(1, old.rating || 1),
              best: 10,
              clears: Math.max(1, old.clears || 1)
            };
            cleared += 1;
          }
        }
        merged.stageScores = migratedScores;
        const normalIds = COLLECTIONS.filter(c => c.rarity !== 'レア').map(c => c.id);
        merged.unlockedCharacters = normalIds.slice(0, Math.min(cleared, normalIds.length));
        merged.collectionVersion = 'v071';
      }

      const valid = new Set(COLLECTIONS.map(c => c.id));
      merged.unlockedCharacters = [...new Set(merged.unlockedCharacters)].filter(id => valid.has(id));
      return merged;
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

  function ratingFromAttempt(correct, wrong = 0) {
    if (correct < 10) return 0;
    if (wrong === 0) return 3;
    if (wrong <= 2) return 2;
    return 1;
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

  function getClearedStageCount() {
    let count = 0;
    for (const stage of STAGES) {
      if ((state.stageScores[stage.id]?.rating || 0) >= 1) count += 1;
      else break;
    }
    return count;
  }

  function getUnlockedCollections() {
    const owned = new Set(Array.isArray(state.unlockedCharacters) ? state.unlockedCharacters : []);
    return COLLECTIONS.filter(c => owned.has(c.id));
  }

  function stagePartyLimit() {
    if (currentContext.type === 'stage') return Math.min(6, Math.max(0, currentContext.stageIndex || 0));
    return 3;
  }

  function pickSessionCompanions() {
    const ownedIds = getUnlockedCollections().map(c => c.id);
    sessionCompanionIds = shuffle(ownedIds).slice(0, Math.min(stagePartyLimit(), ownedIds.length));
  }

  function unlockRandomCharacter() {
    if (!Array.isArray(state.unlockedCharacters)) state.unlockedCharacters = [];
    const owned = new Set(state.unlockedCharacters);
    const rare = COLLECTIONS.find(c => c.id === 'iroha');
    const lockedNormals = COLLECTIONS.filter(c => c.rarity !== 'レア' && !owned.has(c.id));

    let chosen = null;
    if (rare && !owned.has('iroha') && Math.random() < 0.07) {
      chosen = rare;
    } else if (lockedNormals.length) {
      chosen = shuffle(lockedNormals)[0];
    } else if (rare && !owned.has('iroha')) {
      // ノーマルを全部集めたあとも、いろははレア抽選のまま。
      chosen = null;
    }

    if (chosen) {
      state.unlockedCharacters.push(chosen.id);
      state.unlockedCharacters = [...new Set(state.unlockedCharacters)];
    }
    return chosen;
  }

  function renderCompanions() {
    const party = sessionCompanionIds.map(id => companionProfile(id)).filter(Boolean);
    const chipHtml = party.map(c => `<button type="button" class="companion-chip art companion-open" data-companion-id="${c.id}" aria-label="${c.name}を大きく見る" title="${c.name}">${companionArt(c.id)}</button>`).join('');
    const stageHtml = party.map(c => `<button type="button" class="companion-stage-card art-${c.id} companion-open" data-companion-id="${c.id}" aria-label="${c.name}のしょうかいを見る" title="${c.name}"><span class="companion-art-frame">${companionArt(c.id)}</span><small>${c.name}</small></button>`).join('');
    const q = $('companionParty');
    if (q) q.innerHTML = chipHtml ? `<b>なかま</b>${chipHtml}` : '';
    const s = $('companionStage');
    if (s) {
      s.className = `companion-stage party-count-${Math.max(1, party.length)}`;
      s.innerHTML = stageHtml ? `<div class="companion-stage-title">いっしょに ぼうけん！ <span>タップで しょうかい</span></div><div class="companion-stage-row">${stageHtml}</div>` : '';
    }
    const r = $('resultCompanions');
    if (r) r.innerHTML = chipHtml ? `<span>いっしょに ぼうけん</span>${chipHtml}` : '';
  }

  function openCompanionProfile(id) {
    const profile = companionProfile(id);
    if (!profile) return;
    const hero = profile.id === 'iroha' ? `<div class="iroha-card-wrap"><img class="iroha-card-preview" src="assets/iroha-card.png" alt="いろはのキャラカード" loading="lazy"></div>` : `<div class="companion-profile-art art-${id}">${companionArt(id)}</div>`;
    openModal(profile.name, `
      <div class="companion-profile">
        ${hero}
        <div class="companion-profile-head"><span class="companion-rarity ${rarityClass(profile.rarity)}">${profile.rarity}</span><div class="companion-profile-type">${profile.type}</div></div>
        <p class="companion-profile-personality">${profile.personality}</p>
        <div class="companion-profile-info">
          <div><span>ねんれい</span><strong>${profile.age}</strong></div>
          <div><span>とくい</span><strong>${profile.skill}</strong></div>
          <div><span>すき</span><strong>${profile.favorite}</strong></div>
          <div><span>しょうかい</span><strong>${profile.blurb}</strong></div>
          <div><span>なかま</span><strong>${profile.join}</strong></div>
        </div>
      </div>`);
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
    const partyStage = $('companionStage');
    if (!mascot) return;
    clearTimeout(reactionTimer);
    [party, partyStage].forEach(el => {
      if (!el) return;
      el.classList.remove('party-cheer','party-sad');
      el.classList.add(type === 'sad' ? 'party-sad' : 'party-cheer');
    });
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
      [party, partyStage].forEach(el => el?.classList.remove('party-cheer','party-sad'));
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
    burst.textContent = defeated ? 'KO! ★' : `💥 ${BOSS_DAMAGE}ダメージ！`;
    panel.appendChild(burst);
    spawnFx(panel, defeated ? 'ko' : 'boss', defeated ? 28 : 18);
    setTimeout(() => {
      panel.classList.remove('boss-hit');
      avatar?.classList.remove('boss-avatar-hit');
      if (!defeated) burst.remove();
    }, defeated ? 1250 : 1000);
  }

  function updateJourney(animate = true) {
    const pct = Math.max(0, Math.min(100, (sessionCorrect / QUIZ_LENGTH) * 100));
    const anchor = $('quizMascotAnchor');
    const fill = $('journeyFill');
    if (!anchor || !fill) return;
    // 主人公はゴール旗の少し手前で止め、10問目でも画面外へはみ出さない。
    const mobile = window.matchMedia('(max-width: 430px)').matches;
    const maxAnchor = mobile ? 88 : 92;
    const anchorPct = Math.min(maxAnchor, pct * (maxAnchor / 100));
    if (!animate) {
      anchor.style.transition = 'none';
      fill.style.transition = 'none';
    }
    anchor.style.left = `${anchorPct}%`;
    fill.style.width = `${pct}%`;
    anchor.classList.toggle('at-goal', pct >= 100);
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
      // 代表読みが違っても、その読みを持つ別漢字は選択肢から除外する。
      // 例: 「せん」なら 千 が正解のとき、川・先は候補にしない。
      const pool = DATA.filter(x => x.k !== item.k && !kanjiHasReading(x.k, item.r));
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

  function makeExtraQuestion() {
    const source = currentSourceItems.length ? currentSourceItems : DATA;
    const settings = compoundSettings();
    const cpool = usableCompounds(settings);
    const compoundChance = Math.min(0.4, (settings.count || 0) / 10);
    if (cpool.length >= 3 && Math.random() < compoundChance) {
      return makeCompoundQuestion(shuffle(cpool)[0], cpool);
    }
    return makeQuestion(shuffle(source)[0], source, currentQuizMode);
  }

  function updateProgressUi() {
    const isStage = currentContext.type === 'stage';
    const word = $('progressWord');
    const attempt = $('attemptNo');
    const wrongMini = $('wrongMini');
    if (isStage) {
      if (word) word.textContent = 'せいかい';
      $('questionNo').textContent = sessionCorrect;
      $('progressBar').style.width = `${Math.min(100, sessionCorrect * 10)}%`;
      if (attempt) attempt.textContent = `${quizIndex + 1}もんめ`;
      if ($('wrongCount')) $('wrongCount').textContent = sessionWrong;
      wrongMini?.classList.remove('hidden');
    } else {
      if (word) word.textContent = 'もんだい';
      $('questionNo').textContent = quizIndex + 1;
      $('progressBar').style.width = `${((quizIndex + 1) / QUIZ_LENGTH) * 100}%`;
      if (attempt) attempt.textContent = '';
      wrongMini?.classList.add('hidden');
    }
  }

  function resetSession() {
    quizIndex = 0;
    sessionCorrect = 0;
    sessionStars = 0;
    sessionCombo = 0;
    maxCombo = 0;
    sessionWrong = 0;
    attemptFailed = false;
    answered = false;
    bossHp = BOSS_MAX_HP;
    pickSessionCompanions();
    $('sessionStars').textContent = '0';
    $('comboCount').textContent = '0';
    $('comboBanner').classList.add('hidden');
    if ($('wrongCount')) $('wrongCount').textContent = '0';
    if ($('reactionText')) $('reactionText').textContent = 'いっしょに がんばろう！';
    if ($('quizMascot')) $('quizMascot').className = 'goth-bunny idle';
    updateJourney(false);
  }

  function startFreeQuiz() {
    currentContext = { type:'free', mode:selectedMode };
    lastContext = { ...currentContext };
    currentSourceItems = [...DATA];
    currentQuizMode = selectedMode;
    resetSession();
    quiz = buildQuiz(currentSourceItems, currentQuizMode);
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
    currentSourceItems = [...weakItems];
    currentQuizMode = 'mix';
    resetSession();
    quiz = buildQuiz(currentSourceItems, currentQuizMode);
    $('bossPanel').classList.add('hidden');
    showView('quizView');
    renderQuestion();
  }

  function startStage(index) {
    if (!isStageUnlocked(index)) return;
    const stage = STAGES[index];
    currentContext = { type:'stage', stageIndex:index, stageId:stage.id };
    lastContext = { ...currentContext };
    const source = itemsFromString(stage.boss ? stage.pool : stage.kanji);
    currentSourceItems = [...source];
    currentQuizMode = 'mix';
    resetSession();
    quiz = buildQuiz(currentSourceItems, currentQuizMode);
    if (stage.boss) {
      $('bossName').textContent = stage.title;
      if ($('bossAvatar')) $('bossAvatar').innerHTML = bossArt(stage);
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
    renderCompanions();
    answered = false;
    const q = quiz[quizIndex];
    updateProgressUi();
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
    let reactionType = '';
    let reactionMessage = '';

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
      if (isBossNow) { reactionType = 'attack'; reactionMessage = 'こうげき！ ドーン！'; }
      else if (sessionCombo > 0 && sessionCombo % 5 === 0) { reactionType = 'celebrate'; reactionMessage = `${sessionCombo}コンボ！ だいせいこう！`; }
      else { reactionType = 'happy'; reactionMessage = 'せいかい！ やったー！ ★'; }

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
      if (currentContext.type === 'stage') sessionWrong += 1;
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
      reactionType = 'sad';
      reactionMessage = currentContext.type === 'stage' && sessionWrong >= 5
        ? '5かい まちがえたので 1もんめから やりなおし！'
        : 'おしい！ なみだ… つぎは きっとできる！';

      if (currentContext.type === 'stage') {
        if (sessionWrong >= 5) {
          attemptFailed = true;
          $('feedback').textContent = '5かい まちがえたので、このステージを 1もんめから やりなおそう！';
        } else {
          // 1問まちがえるたびに追加問題を1問。10問正解するまで終わらない。
          quiz.push(makeExtraQuestion());
        }
      }
    }

    updateProgressUi();
    $('comboCount').textContent = sessionCombo;
    $('sessionStars').textContent = sessionStars;
    saveState();
    updateHome();
    if (reactionType) requestAnimationFrame(() => setMascotReaction(reactionType, reactionMessage));
    if (attemptFailed) $('nextBtn').textContent = '1もんめから やりなおす';
    else if (currentContext.type === 'stage' && sessionCorrect >= 10) $('nextBtn').textContent = 'けっかを みる';
    else if (currentContext.type !== 'stage' && quizIndex === QUIZ_LENGTH - 1) $('nextBtn').textContent = 'けっかを みる';
    else $('nextBtn').textContent = 'つぎへ';
    $('nextBtn').classList.remove('hidden');
  }

  function nextQuestion() {
    if (!answered) return;
    if (attemptFailed) {
      retryCurrent();
      return;
    }
    if (currentContext.type === 'stage') {
      if (sessionCorrect >= 10) {
        finishQuiz();
        return;
      }
      quizIndex += 1;
      if (!quiz[quizIndex]) quiz.push(makeExtraQuestion());
      renderQuestion();
      return;
    }
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
      rating = ratingFromAttempt(sessionCorrect, sessionWrong);
      const old = state.stageScores[stage.id] || { rating:0, best:0, clears:0 };
      const oldRating = old.rating || 0;
      state.stageScores[stage.id] = {
        rating: Math.max(oldRating, rating),
        best: Math.max(old.best || 0, sessionCorrect),
        clears: (old.clears || 0) + (sessionCorrect >= 10 ? 1 : 0)
      };
      nextUnlocked = rating >= 1 && oldRating < 1 && currentContext.stageIndex < STAGES.length - 1;
    }

    let newlyFound = null;
    if (stage && sessionCorrect >= 10) newlyFound = unlockRandomCharacter();

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
      $('resultMessage').textContent = rating === 3 ? '10もん ぜんぶ せいかい！ ★★★' : rating === 2 ? '10もん せいかい！ ★★ クリア！' : 'ねばりづよく 10もん せいかい！ ★ クリア！';
    } else {
      $('resultMedal').textContent = '★';
      $('resultMessage').textContent = sessionCorrect >= 9 ? 'すごい！ かんじはかせ！' : sessionCorrect >= 7 ? 'とっても よくできました！' : sessionCorrect >= 5 ? 'いいちょうし！ もういっかい やってみよう' : 'だいじょうぶ。すこしずつ おぼえよう！';
    }

    const unlockBox = $('unlockBox');
    if (newlyFound) {
      unlockBox.innerHTML = `<div class="character-reward ${newlyFound.rarity === 'レア' ? 'rare' : ''}"><div class="character-reward-art">${companionArt(newlyFound.id)}</div><div><strong>${newlyFound.rarity === 'レア' ? '✨ レアキャラ！' : '🎁 あたらしい なかま！'}</strong><span>${newlyFound.name} が なかまになった！</span></div></div>`;
      unlockBox.classList.remove('hidden');
    } else if (stage && sessionCorrect >= 10 && getUnlockedCollections().length < COLLECTIONS.length) {
      unlockBox.innerHTML = '<strong>🔎 こんかいは レアキャラに あえなかった！</strong><span>もういちど ステージを クリアして さがしてみよう</span>';
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
    const summary = $('collectionSummary');
    const unlockedIds = new Set(getUnlockedCollections().map(c => c.id));
    const rareCount = unlockedIds.has('iroha') ? 1 : 0;
    if (summary) {
      summary.innerHTML = `<div class="collection-summary-card"><div><span>あつめた なかま</span><strong>${unlockedIds.size} / ${COLLECTIONS.length}</strong></div><div><span>レア</span><strong>${rareCount} / 1</strong></div><div><span>あそびかた</span><strong>ステージで 10もん せいかいすると 1たい ランダムで なかまになるよ</strong></div></div>`;
    }
    grid.innerHTML = COLLECTIONS.map(c => {
      const unlocked = unlockedIds.has(c.id);
      return `<article class="collection-card ${unlocked ? 'companion-open' : 'locked'} rarity-${rarityClass(c.rarity)}" ${unlocked ? `data-companion-id="${c.id}" role="button" tabindex="0" aria-label="${c.name}のしょうかいを見る"` : ''}><span class="rarity-badge ${rarityClass(c.rarity)}">${c.rarity}</span><div class="collection-icon art">${unlocked ? companionArt(c.id) : '<span class="locked-silhouette">?</span>'}</div><strong>${unlocked ? c.name : '？？？'}</strong><small>${unlocked ? `${c.type}<br><b>タップで しょうかい</b>` : `<span class="need">${c.join}</span>`}</small></article>`;
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

  document.addEventListener('click', e => {
    const target = e.target.closest('[data-companion-id]');
    if (target) openCompanionProfile(target.dataset.companionId);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('[data-companion-id]');
    if (!target) return;
    e.preventDefault();
    openCompanionProfile(target.dataset.companionId);
  });

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
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js', { updateViaCache:'none' }).catch(() => {}));
  }

  decorateMascots();
  updateHome();
})();
