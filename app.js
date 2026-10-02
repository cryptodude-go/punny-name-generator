(() => {
  'use strict';

  const DATA = window.NAME_LAB_DATA;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const state = {
    lang: localStorage.getItem('nameLabLang') || 'en',
    mode: 'punny', theme: 'any', vibe: 'balanced', length: 'any', lastBatch: []
  };

  const THEME_HINTS = {
    fantasy: ['fantasy','gameTerms'], rogue: ['gameTerms','fantasy'], mage: ['fantasy','gameTerms'],
    warrior: ['gameTerms','fantasy'], scifi: ['scifi','gameTerms'], casual: ['casual','objects','creatures'],
    any: ['gameTerms','fantasy','scifi','casual','objects','creatures']
  };

  const ROLE_BY_THEME = {
    en: {
      any:['Rogue','Mage','Tank','Healer','Bard','Hunter','Knight','Wizard','Pilot','Engineer','Paladin','Ranger'],
      fantasy:['Rogue','Mage','Bard','Knight','Druid','Wizard','Paladin','Ranger','Warlock','Cleric'],
      rogue:['Rogue','Assassin','Lockpicker','Bandit','Shadow','Thief'], mage:['Mage','Wizard','Warlock','Sorcerer','Enchanter','Necromancer'],
      warrior:['Tank','Warrior','Knight','Berserker','Guardian','Fighter'], scifi:['Pilot','Engineer','Android','Gunner','Hacker','Cyborg'], casual:['Farmer','Cook','Baker','Collector','Fisher','Gardener']
    },
    mk: {
      any:['Rogue','Mage','Tank','Healer','Bard','Lovec','Vitez','Wizard','Pilot','Inzener','Paladin','Ranger'],
      fantasy:['Rogue','Mage','Bard','Vitez','Druid','Wizard','Paladin','Ranger','Warlock','Klerik'],
      rogue:['Rogue','Assassin','Kradec','Bandit','Senka','Lockpicker'], mage:['Mage','Wizard','Warlock','Sorcerer','Enchant-er','Nekromant'],
      warrior:['Tank','Warrior','Vitez','Berserker','Cuvar','Borec'], scifi:['Pilot','Inzener','Android','Gunner','Haker','Cyborg'], casual:['Farmer','Gotvac','Pekar','Sobirac','Ribar','Gradinar']
    }
  };

  const DIRECT_TRAITS = {
    en:['Always Late','Has Low Mana','Has No Aim','Is Too Lucky','Needs Loot','Never Blocks','Misses Crits','Steals Potions','Hates Quests','Runs From Bosses','Picks Every Lock','Talks To NPCs','Breaks Stealth','Pulls Early','Forgets Cooldowns','Needs A Map','Has One HP','Queues Alone','Farms At Midnight','Loots Everything'],
    mk:['Sekogas Docni','Nema Mana','Nema Aim','Ima Premnogu Sreka','Bara Loot','Nikogas Ne Blokira','Gi Promasuva Critovite','Kradi Potions','Ne Saka Questovi','Bega Od Boss','Go Otvora Sekoj Chest','Zbori So NPC','Go Krshi Stealthot','Pull-a Prerano','Gi Zaborava Cooldownite','Mu Treba Mapa','Ima Eden HP','Queue-a Sam','Farma Na Polnokj','Looota Se']
  };

  const PHRASES = {
    en: {
      noPlan:['No Plan','One HP','Bad WiFi','Tiny Boots','Big Dreams','No Map','Extra Snacks','Zero Mana','Too Much Loot','One Cooldown'],
      connectors:['of the','from the','with the','without the','and the','versus the'],
      places:['Basement','Dungeon','Lobby','Back Row','Spawn Point','Moon','Void','Couch','Kitchen','Guild Hall','Last Checkpoint'],
      actions:['Again','By Night','For Days','To Win','Or Never','As Usual','On Cooldown','Before Breakfast','After Respawn','Without Context'],
      descriptors:['Collector','Dealer','Bandit','Magnet','Gremlin','Machine','Goblin','Whisperer','Inspector','Manager','Enjoyer','Technician']
    },
    mk: {
      noPlan:['Bez Plan','So Eden HP','So Los WiFi','So Mali Cizmi','So Golemi Sonishta','Bez Mapa','So Ekstra Gricki','Bez Mana','So Premnogu Loot','So Eden Cooldown'],
      connectors:['od','od kaj','so','bez','i','protiv'],
      places:['Podrum','Dungeon','Lobby','Posledna Klupa','Spawn Point','Mesec','Void','Kauc','Kujna','Guild Sala','Posleden Checkpoint'],
      actions:['Pak','Nokje','Cel Den','Za Pobeda','Ili Nikogas','Kako Sekogas','Na Cooldown','Pred Dorucek','Po Respawn','Bez Kontekst'],
      descriptors:['Sobirac','Diler','Bandit','Magnet','Gremlin','Masina','Goblin','Shepotac','Inspektor','Menadzer','Uzhivatel','Tehnicar']
    }
  };

  // 48 distinct pun/wordplay construction templates. Some are language-aware frames,
  // some are phonetic/name transforms, and some are constrained game-term jokes.
  const PUN_TEMPLATES = [
    'curated','title_root_suffix','first_game_surname','game_casual','game_creature','adj_game','game_descriptor','role_no_plan',
    'root_actions','title_game_action','game_of_noun','lord_of_plural','resting_game_face','no_game_sherlock','game_me_maybe','ctrl_alt_game',
    'game_before_greed','fast_and_game','raiders_lost_game','game_against_machine','game_club','game_floyd','game_skywalker','obi_game_kenobi',
    'darth_game','harry_game','gandalf_game','sherlock_creature','creature_mercy','game_you_next','game_del_rey','back_game_band',
    'imp_my_noun','noun_park','gameifer','need_before_game','doctor_game','professor_game','captain_game','sir_game',
    'split_name','slavic_game_name','game_ovski','maalo_role','food_role','tool_role','game_na_rati','game_do_plafon'
  ];

  function randomInt(max) {
    if (max <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1); crypto.getRandomValues(arr); return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  const pick = (arr) => arr[randomInt(arr.length)];
  const cap = (s) => String(s).replace(/\b[a-z]/g, c => c.toUpperCase());
  const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'');
  const pluralize = (w) => /s$/i.test(w) ? w : /y$/i.test(w) ? w.slice(0,-1)+'ies' : w+'s';
  const L = () => DATA.lexicon[state.lang];
  const T = () => DATA.i18n[state.lang];

  function uniqueVocabularyCount() {
    const all = [];
    for (const lang of ['en','mk']) for (const arr of Object.values(DATA.lexicon[lang])) all.push(...arr);
    return new Set(all.map(x => x.toLowerCase())).size;
  }

  function pool(category) { return L()[category] || []; }
  function themePool() {
    const cats = THEME_HINTS[state.theme] || THEME_HINTS.any;
    return cats.flatMap(c => pool(c));
  }
  function themedGameWord() {
    if (state.theme === 'scifi') return pick(pool('scifi'));
    if (state.theme === 'casual') return pick(pool('casual'));
    if (state.theme === 'fantasy') return pick(pool('fantasy'));
    if (state.theme === 'mage') return pick(['mana','spell','rune','hex','wand','arcane','frost','ember','curse','cast']);
    if (state.theme === 'rogue') return pick(['stealth','crit','dagger','shadow','backstab','lock','smoke','loot','dodge','ambush']);
    if (state.theme === 'warrior') return pick(['tank','block','parry','armor','shield','charge','crit','rage','axe','slam']);
    return pick(pool('gameTerms'));
  }
  function themedNoun() { return pick(themePool()); }
  function role() { return pick(ROLE_BY_THEME[state.lang][state.theme] || ROLE_BY_THEME[state.lang].any); }
  function adjective() { return pick(pool('adjectives')); }
  function casual() { return pick(pool('casual')); }
  function creature() { return pick(pool('creatures')); }
  function object() { return pick(pool('objects')); }
  function title() { return pick(pool('titles')); }
  function firstName() { return pick(pool('firstNames')); }
  function suffix() { return pick(pool('suffixes')); }

  function curatedCandidate() {
    const all = DATA.curated[state.lang];
    let candidates = all.filter(x => x[2] === 'any' || state.theme === 'any' || x[2] === state.theme);
    if (!candidates.length) candidates = all;
    const [name, meaning] = pick(candidates);
    return {name, meaning, template:'curated', quality:12};
  }

  function makePun(template) {
    const g = themedGameWord(); const n = themedNoun(); const c = casual(); const cr = creature();
    const a = adjective(); const r = role(); const p = PHRASES[state.lang];
    const mk = state.lang === 'mk';
    let name = '', meaning = mk ? 'Igra so zborovi' : 'Structured game wordplay';

    switch (template) {
      case 'curated': return curatedCandidate();
      case 'title_root_suffix': name = `${title()} ${cap(g)}${suffix()}`; break;
      case 'first_game_surname': name = `${firstName()} ${cap(g)}${pick(mk?['ovski','evski','ov','ev','ski']:['son','ton','ford','well','wood','man'])}`; break;
      case 'game_casual': name = `${cap(g)} ${cap(c)}`; break;
      case 'game_creature': name = `${cap(g)} ${cap(cr)}`; break;
      case 'adj_game': name = `${cap(a)} ${cap(g)}`; break;
      case 'game_descriptor': name = `${cap(g)} ${pick(p.descriptors)}`; break;
      case 'role_no_plan': name = `${r} ${mk?'So':'With'} ${pick(p.noPlan)}`.replace(/So So /,'So '); break;
      case 'root_actions': name = `${cap(g)} ${pick(p.actions)}`; break;
      case 'title_game_action': name = `${title()} ${cap(g)} ${pick(mk?['Pak','Na Smenu','Bez Plan','Od Maalo']:['Again','On Duty','No Plan','From Spawn'])}`; break;
      case 'game_of_noun': name = mk ? `${cap(g)} Na ${cap(n)}` : `${cap(g)} of ${cap(n)}`; break;
      case 'lord_of_plural': name = mk ? `Gospodar Na ${cap(g)}` : `Lord of the ${cap(pluralize(g))}`; break;
      case 'resting_game_face': name = mk ? `${cap(g)} Faca Na Odmor` : `Resting ${cap(g)} Face`; break;
      case 'no_game_sherlock': name = mk ? `Ne E ${cap(g)}, Sherlock` : `No ${cap(g)} Sherlock`; break;
      case 'game_me_maybe': name = mk ? `${cap(g)} Me Mozebi` : `${cap(g)} Me Maybe`; break;
      case 'ctrl_alt_game': name = `Ctrl Alt ${cap(g)}`; break;
      case 'game_before_greed': name = mk ? `${cap(g)} Pred Greed` : `${cap(g)} Before Greed`; break;
      case 'fast_and_game': name = mk ? `Brzi I ${cap(g)}` : `The Fast and the ${cap(g)}ious`; break;
      case 'raiders_lost_game': name = mk ? `Lovci Na Izgubeniot ${cap(g)}` : `Raiders of the Lost ${cap(g)}`; break;
      case 'game_against_machine': name = `${cap(g)} Against the Machine`; break;
      case 'game_club': name = `${cap(g)} Club`; break;
      case 'game_floyd': name = `${cap(g)} Floyd`; break;
      case 'game_skywalker': name = `${cap(g)} Skywalker`; break;
      case 'obi_game_kenobi': name = `Obi ${cap(g)} Kenobi`; break;
      case 'darth_game': name = `Darth ${cap(g)}`; break;
      case 'harry_game': name = `Harry ${cap(g)}er`; break;
      case 'gandalf_game': name = `Gandalf the ${cap(g)}`; break;
      case 'sherlock_creature': name = `Sherlock ${cap(pluralize(cr))}`; break;
      case 'creature_mercy': name = mk ? `${cap(cr)} Bez Milost` : `${cap(cr)} Mercy`; break;
      case 'game_you_next': name = mk ? `${cap(g)} Ti Si Sleden` : `${cap(g)} You Next`; break;
      case 'game_del_rey': name = `${cap(g)} Del Rey`; break;
      case 'back_game_band': name = `${cap(g)} Sabbath`; break;
      case 'imp_my_noun': name = mk ? `Imp Mi Go ${cap(object())}` : `Imp My ${cap(object())}`; break;
      case 'noun_park': name = `${cap(n)} Park`; break;
      case 'gameifer': name = `${cap(g)}ifer`; break;
      case 'need_before_game': name = mk ? `Need Pred ${cap(g)}` : `Need Before ${cap(g)}`; break;
      case 'doctor_game': name = `${mk?'Doktor':'Doctor'} ${cap(g)}`; break;
      case 'professor_game': name = `${mk?'Profesor':'Professor'} ${cap(g)}`; break;
      case 'captain_game': name = `${mk?'Kapetan':'Captain'} ${cap(g)}`; break;
      case 'sir_game': name = `${mk?'Gospodin':'Sir'} ${cap(g)}`; break;
      case 'split_name': {
        const fn = firstName();
        const tail = pick(mk?['ko','che','ce','mir','slav','dan','jan']:['o','y','er','ton','son','man']);
        name = `${fn.slice(0, Math.max(2, Math.ceil(fn.length/2)))} ${cap(g)}${tail}`; break;
      }
      case 'slavic_game_name': name = mk ? `${cap(g)}${pick(['omir','oslav','ijan','ko','che','dan','jan'])}` : `${cap(g)}${pick(['bert','son','ley','ton','ford','man'])}`; break;
      case 'game_ovski': name = mk ? `${cap(g)} ${cap(g)}ovski` : `${cap(g)} Mc${cap(g)}`; break;
      case 'maalo_role': name = mk ? `${r} Od Maalo` : `${r} From The Block`; break;
      case 'food_role': name = `${cap(c)} ${r}`; break;
      case 'tool_role': name = `${cap(object())} ${r}`; break;
      case 'game_na_rati': name = mk ? `${cap(g)} Na Rati` : `${cap(g)} On Credit`; break;
      case 'game_do_plafon': name = mk ? `${cap(g)} Do Plafon` : `${cap(g)} Through The Roof`; break;
      default: name = `${cap(g)} ${cap(n)}`;
    }
    return {name: cap(name), meaning, template, quality: template.includes('game_') ? 6 : 5};
  }

  function makeFunny() {
    const mk = state.lang === 'mk';
    const formats = [
      () => `${cap(adjective())} ${cap(state.theme === 'casual' ? casual() : themedNoun())}`,
      () => `${cap(themedNoun())} ${mk?'So':'With'} ${pick(PHRASES[state.lang].noPlan)}`,
      () => `${pick(mk?['Kapetan','Doktor','Profesor','Major','Majstor']:['Captain','Doctor','Professor','Major','Mister'])} ${cap(themedNoun())}`,
      () => `${cap(themedGameWord())} ${cap(casual())}`,
      () => `${cap(casual())} ${role()}`,
      () => `${role()} ${mk?'Od':'of'} ${pick(PHRASES[state.lang].places)}`,
      () => `${cap(creature())} ${pick(mk?['So Plan','Bez Plan','Na Smenu','Vo Panika']:['With A Plan','Without A Plan','On Duty','In Panic'])}`
    ];
    return {name: pick(formats)(), meaning: mk?'Smeshen gejmerski nickname':'Comedic game-ready nickname', template:'funny', quality:4};
  }

  function makeAlliteration() {
    const candidatesA = pool('adjectives');
    for (let guard=0; guard<30; guard++) {
      const a = pick(candidatesA); const initial = a[0].toLowerCase();
      const nounPool = [...pool('fantasy'),...pool('casual'),...pool('creatures'),...pool('objects')].filter(w => w[0]?.toLowerCase() === initial);
      if (nounPool.length) return {name:`${cap(a)} ${cap(pick(nounPool))}`, meaning: state.lang==='mk'?`Aliteracija na ${initial.toUpperCase()}`:`${initial.toUpperCase()}-${initial.toUpperCase()} alliteration`, template:'alliteration', quality:5};
    }
    return {name:`${cap(adjective())} ${cap(themedNoun())}`, meaning:'Alliteration-style name', template:'alliteration', quality:3};
  }

  function makeAristocrat() {
    let last = pick(pool('fancyLast'));
    if (state.theme !== 'any' && randomInt(10) < 6) last = `${cap(themedGameWord())}${pick(state.lang==='mk'?['ovski','evski','ov','ski']:['ington','sworth','chester','wick','bury','croft'])}`;
    return {name:`${title()} ${pick(pool('fancyFirst'))} ${last}`, meaning: state.lang==='mk'?'Preterano grandiozno gejmersko ime':'Overly grand game aristocrat', template:'character', quality:4};
  }

  function makeDirect() {
    return {name:`${role()} ${state.lang==='mk'?'Sto':'Who'} ${pick(DIRECT_TRAITS[state.lang])}`, meaning: state.lang==='mk'?'Direkten gejmerski opis':'Exactly what it says on the tin', template:'description', quality:4};
  }

  function lengthOK(name) {
    if (state.length === 'any') return true;
    const n = name.replace(/[^A-Za-z0-9]/g,'').length;
    if (state.length === 'short') return n <= 14;
    if (state.length === 'medium') return n >= 11 && n <= 24;
    return true;
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('nameLabHistory') || '[]'); } catch { return []; }
  }
  function saveHistory(items) {
    const old = getHistory();
    const merged = [...items.map(x => normalize(`${state.lang}:${state.mode}:${x.name}`)), ...old];
    localStorage.setItem('nameLabHistory', JSON.stringify([...new Set(merged)].slice(0,800)));
  }
  function isRecent(name, history) { return history.includes(normalize(`${state.lang}:${state.mode}:${name}`)); }

  function scoreCandidate(item, history) {
    let score = item.quality || 0;
    if (isRecent(item.name, history)) score -= 50;
    if (lengthOK(item.name)) score += 3; else score -= 8;
    const low = item.name.toLowerCase();
    if (state.theme !== 'any') {
      const themedWords = themePool().slice(0,300).map(w => w.toLowerCase());
      if (themedWords.some(w => w.length > 3 && low.includes(w))) score += 3;
    }
    if (state.vibe === 'clean' && item.template === 'curated') score += 5;
    if (state.vibe === 'silly' && /casual|food_role|maalo_role|game_na_rati|game_do_plafon|funny/.test(item.template)) score += 4;
    if (state.vibe === 'epic' && /title|lord|darth|gandalf|raiders|character/.test(item.template)) score += 4;
    if (state.mode === 'punny' && item.template === 'curated') score += 4;
    score += randomInt(7) / 10; // tie-breaker only
    return score;
  }

  function candidateForMode() {
    if (state.mode === 'punny') {
      // Curated puns are deliberately frequent, while 47 generative frames provide breadth.
      const template = randomInt(100) < 36 ? 'curated' : pick(PUN_TEMPLATES.slice(1));
      return makePun(template);
    }
    if (state.mode === 'funny') return makeFunny();
    if (state.mode === 'alliteration') return makeAlliteration();
    if (state.mode === 'aristocrat') return makeAristocrat();
    return makeDirect();
  }

  function generateBatch(count=20) {
    const history = getHistory();
    const candidateMap = new Map();
    // Build a broad candidate set first, then score and diversify it.
    for (let i=0; i<720; i++) {
      const item = candidateForMode();
      if (!item?.name) continue;
      const key = normalize(item.name);
      if (!key || candidateMap.has(key)) continue;
      item.score = scoreCandidate(item, history);
      candidateMap.set(key, item);
    }

    const sorted = [...candidateMap.values()].sort((a,b) => b.score-a.score);
    const out = [], templateUse = new Map(), leadingUse = new Map();
    for (const item of sorted) {
      if (out.length >= count) break;
      if (!lengthOK(item.name) && sorted.length > count*2) continue;
      const tUse = templateUse.get(item.template)||0;
      if (tUse >= (item.template==='curated'?7:2)) continue;
      const lead = normalize(item.name.split(/\s+/)[0]);
      if ((leadingUse.get(lead)||0) >= 2) continue;
      out.push(item);
      templateUse.set(item.template,tUse+1);
      leadingUse.set(lead,(leadingUse.get(lead)||0)+1);
    }

    // Safety fallback for very restrictive filters.
    let guard=0;
    while (out.length<count && guard++<1000) {
      const item=candidateForMode(); const key=normalize(item.name);
      if (!out.some(x=>normalize(x.name)===key)) out.push(item);
    }

    state.lastBatch = out.slice(0,count);
    saveHistory(state.lastBatch);
    render();
  }

  function fillSelect(el, entries, selected) {
    el.innerHTML='';
    for (const [value,label] of entries) {
      const o=document.createElement('option'); o.value=value; o.textContent=label; o.selected=value===selected; el.appendChild(o);
    }
  }

  function applyLanguage() {
    const tr = T();
    document.documentElement.lang = state.lang === 'mk' ? 'mk-Latn' : 'en';
    $$('[data-i18n]').forEach(el => { const key=el.dataset.i18n; if (tr[key]) el.textContent=tr[key]; });
    $$('[data-i18n-html]').forEach(el => { const key=el.dataset.i18nHtml; if (tr[key]) el.innerHTML=tr[key]; });
    $$('.lang-btn').forEach(b => b.classList.toggle('is-active', b.dataset.lang===state.lang));
    fillSelect($('#theme'), tr.themes, state.theme);
    fillSelect($('#vibe'), tr.vibes, state.vibe);
    fillSelect($('#length'), tr.lengths, state.length);
    $('#resultTitle').textContent=tr.modes[state.mode];
    $('#vocabStat').textContent=uniqueVocabularyCount().toLocaleString()+'+';
    $('#templateStat').textContent=PUN_TEMPLATES.length;
  }

  function render() {
    const tr=T();
    $('#resultTitle').textContent=tr.modes[state.mode];
    $('#resultCount').textContent=`${state.lastBatch.length} ${tr.fresh}`;
    const results=$('#results'); results.innerHTML='';
    state.lastBatch.forEach((item,i)=>{
      const row=document.createElement('article'); row.className='name-row';
      row.innerHTML=`<div class="name-wrap"><div class="name"></div><div class="meaning"></div><div class="meta"></div></div><button class="copy-btn" data-index="${i}"></button>`;
      row.querySelector('.name').textContent=item.name;
      row.querySelector('.meaning').textContent=item.meaning;
      row.querySelector('.meta').textContent=tr.meta[item.template] || tr.meta.wordplay;
      row.querySelector('.copy-btn').textContent=tr.copy;
      row.querySelector('.copy-btn').setAttribute('aria-label',`${tr.copy}: ${item.name}`);
      results.appendChild(row);
    });
  }

  function showToast(text) {
    const toast=$('#toast'); toast.textContent=text; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1200);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  }

  $('#tabs').addEventListener('click', e => {
    const btn=e.target.closest('.tab'); if (!btn) return;
    state.mode=btn.dataset.mode; $$('.tab').forEach(b=>b.classList.toggle('is-active',b===btn)); generateBatch();
  });
  $$('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>{
    state.lang=btn.dataset.lang; localStorage.setItem('nameLabLang',state.lang); applyLanguage(); generateBatch();
  }));
  $('#theme').addEventListener('change',e=>{state.theme=e.target.value;generateBatch();});
  $('#vibe').addEventListener('change',e=>{state.vibe=e.target.value;generateBatch();});
  $('#length').addEventListener('change',e=>{state.length=e.target.value;generateBatch();});
  $('#generateBtn').addEventListener('click',()=>generateBatch());
  $('#resetHistory').addEventListener('click',()=>{localStorage.removeItem('nameLabHistory');showToast(T().historyReset);});
  $('#results').addEventListener('click',async e=>{ const btn=e.target.closest('.copy-btn'); if(!btn)return; const item=state.lastBatch[Number(btn.dataset.index)]; await copyText(item.name); showToast(`${T().copied}: ${item.name}`); });
  $('#copyAll').addEventListener('click',async()=>{await copyText(state.lastBatch.map(x=>x.name).join('\n'));showToast(T().allCopied);});

  applyLanguage();
  generateBatch();
})();
