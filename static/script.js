document.addEventListener("DOMContentLoaded", () => {

  // --- Cached state & DOM nodes (reduces repeated lookups) ---
  let choice1 = null;
  let choice2 = null;
  let level = 1;
  // each element will be {name: '🌿 Plant', recipe: 'Water+Leaf'}
  let discovered = [];
  let goal = 0; // combos count
  const MAX_LEVEL = 10;
  const elementsGrid = document.getElementById("elementsGrid");
  const mixBtn = document.getElementById("mixBtn");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const slot1 = document.getElementById("slot1");
  const slot2 = document.getElementById("slot2");
  const resultBox = document.getElementById("resultBox");
  const levelText = document.getElementById("levelText");
  const popSound = document.getElementById("popSound");
  const dingSound = document.getElementById("dingSound");
  const wrongSound = document.getElementById("wrongSound");
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  // optimize audio: set volumes and kick off loading early
  if (popSound) {
    popSound.volume = 0.6;
    popSound.load();
  }
  if (dingSound) {
    dingSound.volume = 0.6;
    dingSound.load();
  }
  if (wrongSound) {
    wrongSound.volume = 0.7;
    wrongSound.load();
  }

  function playErrorSound() {
    if (wrongSound && typeof wrongSound.play === 'function') {
      wrongSound.currentTime = 0;
      wrongSound.play().catch(()=>{});
      return;
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(160, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // data
  const unlocks = {
    1: ["Fire", "Water"],
    2: ["Air", "Leaf"],
    3: ["Sun"],
    4: ["Ice"],
    5: ["Rain"],
    6: ["Metal"],
    7: ["Earth"],
    8: ["Lightning"],
    9: ["Spirit"],
    10: ["Ether"]
  };

  const icons = {
    Fire: "🔥",
    Water: "💧",
    Air: "🌬",
    Leaf: "🌱",
    Sun: "☀️",
    Ice: "🧊",
    Rain: "🌧",
    Metal: "⚙️",
    Earth: "🌎",
    Lightning: "⚡",
    Spirit: "✨",
    Ether: "🔮"
  };

  const levelRecipes = {
    1: { "Fire+Water": "☁️ Steam" },
    2: { "Fire+Air": "🔥🔥 Blaze", "Water+Leaf": "🌿 Plant" },
    3: { "Sun+Water": "🌈 Rainbow", "Sun+Leaf": "🌻 Sunflower" },
    4: { "Ice+Fire": "💧 Melt", "Ice+Water": "❄️ Snow" },
    5: { "Rain+Leaf": "🌱 Growing Plant", "Sun+Rain": "🌈 Big Rainbow" },
    6: { "Metal+Fire": "🔩 Forge", "Metal+Water": "🔧 Rust" },
    7: { "Earth+Water": "🪨 Mud", "Earth+Leaf": "🌾 Soil" },
    8: { "Lightning+Air": "⚡ Storm", "Lightning+Water": "🌩 Thundercloud" },
    9: { "Spirit+Sun": "✨ Aura", "Spirit+Leaf": "🪴 Spirit Plant" },
    10: { "Ether+Spirit": "🔮 Mystic", "Ether+Sun": "🌌 Nebula" }
  };

  // helper for computing total combos available up through current level
  function computeGoal() {
    let count = 0;
    for (let i = 1; i <= level; i++) {
      count += Object.keys(levelRecipes[i] || {}).length;
    }
    return count;
  }

  function getAvailableRecipes() {
    let all = {};
    for (let i = 1; i <= level; i++) Object.assign(all, levelRecipes[i] || {});
    return all;
  }

  function updateLevelText() {
    goal = computeGoal();
    const found = discovered.length;
    levelText.textContent = `Level ${level} (${found}/${goal} combos)`;
  }

  // --- rendering ---
  function renderElements() {
    // build fragment for fewer reflows
    const frag = document.createDocumentFragment();
    const available = [];
    for (let i = 1; i <= level; i++) if (unlocks[i]) available.push(...unlocks[i]);
    available.forEach(name => {
      const div = document.createElement('div');
      div.className = 'element';
      div.dataset.name = name;
      div.textContent = icons[name];
      div.setAttribute('draggable','true'); // allow drag & drop
      frag.appendChild(div);
    });
    elementsGrid.innerHTML = '';
    elementsGrid.appendChild(frag);
  }

  // sticker rendering removed; UI simplified

  function renderDiscovered() {
    const list = document.getElementById('discoveredList');
    if (!list) return;
    const frag = document.createDocumentFragment();
    discovered.forEach(item => {
      const d = document.createElement('div');
      d.className = 'discovered-item';
      // show how it came to be
      if (item.recipe) {
        d.textContent = `${item.name} (${item.recipe})`;
        d.title = `Created by mixing ${item.recipe.replace('+',' and ')}`; // tooltip
      } else {
        d.textContent = item.name;
      }
      frag.appendChild(d);
    });
    list.innerHTML = '';
    list.appendChild(frag);
  }

  function checkGoal() {
    if (discovered.length >= goal) {
      levelText.textContent = `Level ${level} (${discovered.length}/${goal} combos)`;
      nextLevelBtn.textContent = `Next Level (${level + 1})`;
      nextLevelBtn.style.display = 'block';
      nextLevelBtn.classList.add('showing');
      resultBox.textContent = 'Level complete. Tap Next to continue.';
      setTimeout(() => nextLevelBtn.classList.remove('showing'), 400);
    }
  }

  // common selection handler used by click and drop
  function handleSelection(name) {
    if (!name) return;
    if ((choice1 && choice1 === name) || (choice2 && choice2 === name)) {
      resultBox.textContent = 'Pick a different element';
      return;
    }
    if (popSound && typeof popSound.play === 'function') popSound.play().catch(()=>{});
    resultBox.textContent = `Selected: ${name}`;
    if (!choice1) { choice1 = name; slot1.textContent = icons[name]; }
    else if (!choice2) { choice2 = name; slot2.textContent = icons[name]; }
  }

  elementsGrid.addEventListener('click', (ev) => {
    const el = ev.target.closest('.element');
    if (!el) return;
    handleSelection(el.dataset.name);
  });

  elementsGrid.addEventListener('dragstart', (ev) => {
    const el = ev.target.closest('.element');
    if (!el) return;
    ev.dataTransfer.setData('text/plain', el.dataset.name);
  });

  [slot1, slot2].forEach(slot => {
    slot.addEventListener('dragover', ev => {
      ev.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', ev => {
      ev.preventDefault();
      slot.classList.remove('drag-over');
      const name = ev.dataTransfer.getData('text/plain');
      handleSelection(name);
    });
  });

  // mix button
  mixBtn.addEventListener('click', () => {
    if (!choice1 || !choice2) return;
    const recipes = getAvailableRecipes();
    const key1 = choice1 + '+' + choice2;
    const key2 = choice2 + '+' + choice1;
    const NO_MAGIC = 'No magic happens';
    const result = recipes[key1] || recipes[key2] || NO_MAGIC;
    if (result === NO_MAGIC) {
      playErrorSound();
      resultBox.textContent = NO_MAGIC;
    } else {
      if (dingSound && typeof dingSound.play === 'function') dingSound.play().catch(()=>{});
      resultBox.textContent = result;
    }
    // flash highlight
    resultBox.classList.add('new');
    setTimeout(() => resultBox.classList.remove('new'), 300);
    if (result !== NO_MAGIC) {
      const currentRecipes = levelRecipes[level] || {};
      if (Object.values(currentRecipes).includes(result)) {
        if (!discovered.find(d => d.name === result)) {
          // figure out the recipe that produced this result (key like "Fire+Air")
          let recipeKey = Object.keys(currentRecipes).find(k => currentRecipes[k] === result) || '';
          discovered.push({ name: result, recipe: recipeKey });
          updateLevelText();
          resultBox.innerHTML = `<span class="discovery-message">New Discovery: ${result}</span>`;
          resultBox.classList.add('discovery');
          setTimeout(() => resultBox.classList.remove('discovery'), 1500);
        }
      }
    }
    renderDiscovered();
    checkGoal();
    choice1 = null; choice2 = null; slot1.textContent = '?'; slot2.textContent = '?';
  });

  nextLevelBtn.addEventListener('click', () => {
    if (level >= MAX_LEVEL) {
      resultBox.textContent = 'All levels completed.';
      return;
    }
    level++;
    // keep discovered items across levels
    nextLevelBtn.style.display = 'none';
    resultBox.textContent = 'New level unlocked.';
    updateLevelText(); renderElements(); renderDiscovered();
  });

  // INIT
  updateLevelText(); renderElements(); renderDiscovered();
});
 
