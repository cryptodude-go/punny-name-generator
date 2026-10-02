(() => {
  'use strict';

  const DATA = window.NAME_LAB_DATA;
  const PUNS = window.PUNNY_PHONETIC_DATA;
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
      rogue:['Rogue','Assassin','Kradec','Bandit','Senka','Lockpicker'], mage:['Mage','Wizard','Warlock','Sorcerer','Enchanter','Nekromant'],
      warrior:['Tank','Warrior','Vitez','Berserker','Cuvar','Borec'], scifi:['Pilot','Inzener','Android','Gunner','Haker','Cyborg'], casual:['Farmer','Gotvac','Pekar','Sobirac','Ribar','Gradinar']
    }
  };

  const DIRECT_TRAITS = {
    en:['Always Late','Has Low Mana','Has No Aim','Is Too Lucky','Needs Loot','Never Blocks','Misses Crits','Steals Potions','Hates Quests','Runs From Bosses','Picks Every Lock','Talks To NPCs','Breaks Stealth','Pulls Early','Forgets Cooldowns','Needs A Map','Has One HP','Queues Alone','Farms At Midnight','Loots Everything'],
    mk:['Sekogas Docni','Nema Mana','Nema Aim','Ima Premnogu Sreka','Bara Loot','Nikogas Ne Blokira','Gi Promasuva Critovite','Kradi Potions','Ne Saka Questovi','Bega Od Boss','Go Otvora Sekoj Chest','Zbori So NPC','Go Krshi Stealthot','Pulla Prerano','Gi Zaborava Cooldownite','Mu Treba Mapa','Ima Eden HP','Queue-a Sam','Farma Na Polnokj','Loota Se']
  };

  const PHRASES = {
    en: {
      noPlan:['No Plan','One HP','Bad WiFi','Tiny Boots','Big Dreams','No Map','Extra Snacks','Zero Mana','Too Much Loot','One Cooldown'],
      places:['Basement','Dungeon','Lobby','Back Row','Spawn Point','Moon','Void','Couch','Kitchen','Guild Hall','Last Checkpoint']
    },
    mk: {
      noPlan:['Bez Plan','So Eden HP','So Los WiFi','So Mali Cizmi','So Golemi Sonishta','Bez Mapa','So Ekstra Gricki','Bez Mana','So Premnogu Loot','So Eden Cooldown'],
      places:['Podrum','Dungeon','Lobby','Posledna Klupa','Spawn Point','Mesec','Void','Kauc','Kujna','Guild Sala','Posleden Checkpoint']
    }
  };

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
  const L = () => DATA.lexicon[state.lang];
  const T = () => DATA.i18n[state.lang];

  function uniqueVocabularyCount() {
    const all = [];
    for (const lang of ['en','mk']) for (const arr of Object.values(DATA.lexicon[lang])) all.push(...arr);
    return new Set(all.map(x => x.toLowerCase())).size;
  }

  function phoneticRuleCount() {
    return new Set(PUNS[state.lang].map(x => x.rule)).size;
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
  function title() { return pick(pool('titles')); }

  // Punny mode is deliberately different from the other generators.
  // It never joins random vocabulary. Every candidate must be a verified sound-alike
  // (word, phrase or game phrase) stored in pun-data.js.
  function phoneticUniverse() {
    return PUNS[state.lang].map(x => ({
      name: x.name,
      meaning: x.sound,
      rule: x.rule,
      tags: x.tags || ['any'],
      kind: x.kind || 'word',
      template: 'phonetic',
      quality: 16 + ((x.strength || 2) * 4)
    }));
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
    return {name:`${cap(adjective())} ${cap(themedNoun())}`, meaning: state.lang==='mk'?'Aliteracija':'Alliteration-style name', template:'alliteration', quality:3};
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

  function scorePhonetic(item, history) {
    let score = item.quality;
    if (isRecent(item.name, history)) score -= 100;
    if (lengthOK(item.name)) score += 4; else score -= 12;

    // Theme is a preference, never a hard filter: a good pun always beats a bad themed pun.
    if (state.theme !== 'any') {
      if (item.tags.includes(state.theme)) score += 4;
      else if (item.tags.includes('any')) score += 1;
    }

    if (state.vibe === 'clean') {
      if (item.kind === 'word') score += 4;
      if ((item.quality || 0) >= 28) score += 3;
      if (item.kind === 'game') score -= 1;
    } else if (state.vibe === 'silly') {
      if (item.kind === 'phrase') score += 5;
    } else if (state.vibe === 'epic') {
      if (item.kind === 'game') score += 7;
      if (item.tags.some(t => ['fantasy','rogue','mage','warrior','scifi'].includes(t))) score += 3;
    }

    score += randomInt(1000) / 1000;
    return score;
  }

  function generatePunnyBatch(count, history) {
    const items = phoneticUniverse();
    const scored = items.map(item => ({...item, score: scorePhonetic(item, history)})).sort((a,b)=>b.score-a.score);
    const out = [];
    const ruleUse = new Map();
    const soundUse = new Set();

    for (const item of scored) {
      if (out.length >= count) break;
      if (!lengthOK(item.name) && scored.length > count * 2) continue;
      const soundKey = normalize(item.meaning);
      if (soundUse.has(soundKey)) continue;
      const used = ruleUse.get(item.rule) || 0;
      const maxPerRule = count >= 20 ? 2 : 1;
      if (used >= maxPerRule) continue;
      out.push(item);
      soundUse.add(soundKey);
      ruleUse.set(item.rule, used + 1);
    }

    // If a language/theme/length combination is too restrictive, relax only diversity,
    // never phonetic quality. We still pull exclusively from verified sound-alikes.
    for (const item of scored) {
      if (out.length >= count) break;
      if (out.some(x => normalize(x.name) === normalize(item.name))) continue;
      out.push(item);
    }

    return out.slice(0, count);
  }

  function scoreCandidate(item, history) {
    let score = item.quality || 0;
    if (isRecent(item.name, history)) score -= 50;
    if (lengthOK(item.name)) score += 3; else score -= 8;
    const low = item.name.toLowerCase();
    if (state.theme !== 'any') {
      const themedWords = themePool().slice(0,300).map(w => w.toLowerCase());
      if (themedWords.some(w => w.length > 3 && low.includes(w))) score += 3;
    }
    score += randomInt(7) / 10;
    return score;
  }

  function candidateForMode() {
    if (state.mode === 'funny') return makeFunny();
    if (state.mode === 'alliteration') return makeAlliteration();
    if (state.mode === 'aristocrat') return makeAristocrat();
    return makeDirect();
  }

  function generateBatch(count=20) {
    const history = getHistory();

    if (state.mode === 'punny') {
      state.lastBatch = generatePunnyBatch(count, history);
      saveHistory(state.lastBatch);
      render();
      return;
    }

    const candidateMap = new Map();
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
      if (tUse >= 3) continue;
      const lead = normalize(item.name.split(/\s+/)[0]);
      if ((leadingUse.get(lead)||0) >= 2) continue;
      out.push(item);
      templateUse.set(item.template,tUse+1);
      leadingUse.set(lead,(leadingUse.get(lead)||0)+1);
    }

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
    $('#templateStat').textContent=phoneticRuleCount();
  }

  function render() {
    const tr=T();
    $('#resultTitle').textContent=tr.modes[state.mode];
    $('#resultCount').textContent=`${state.lastBatch.length} ${tr.fresh}`;
    const results=$('#results'); results.innerHTML='';
    state.lastBatch.forEach((item,i)=>{
      const row=document.createElement('article'); row.className='name-row';
      row.innerHTML=`<div class="name-wrap"><div class="name"></div><div class="meaning"></div><div class="meta"></div></div><button class="copy-btn" data-index="${i}"></button>`;
      const nameEl = row.querySelector('.name');
      const meaningEl = row.querySelector('.meaning');
      const metaEl = row.querySelector('.meta');

      if (state.mode === 'punny') {
        nameEl.textContent = `${item.name} (${item.meaning})`;
        meaningEl.hidden = true;
        metaEl.textContent = PUNS.labels[state.lang][item.kind] || PUNS.labels[state.lang].pun;
      } else {
        nameEl.textContent=item.name;
        meaningEl.hidden = false;
        meaningEl.textContent=item.meaning;
        metaEl.textContent=tr.meta[item.template] || tr.meta.wordplay;
      }

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
