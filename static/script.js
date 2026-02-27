document.addEventListener("DOMContentLoaded", () => {

  // --- Cached state & DOM nodes (reduces repeated lookups) ---
  let choice1 = null;
  let choice2 = null;
  let level = 1;
  let stickers = [];
  let goal = 0; // computed by current recipes
  const MAX_LEVEL = 10;

  // mascot removed; we now provide simpler text feedback via the result box

  const elementsGrid = document.getElementById("elementsGrid");
  const stickerBox = document.getElementById("stickerBox");
  const mixBtn = document.getElementById("mixBtn");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const slot1 = document.getElementById("slot1");
  const slot2 = document.getElementById("slot2");
  const resultBox = document.getElementById("resultBox");
  const levelText = document.getElementById("levelText");

  const popSound = document.getElementById("popSound");
  const dingSound = document.getElementById("dingSound");

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

  // --- helpers ---
  // helper for computing the number of unique combinations available
  function computeGoal() {
    // only the combinations introduced at the current level count toward the goal
    return Object.keys(levelRecipes[level] || {}).length;
  }

  function getAvailableRecipes() {
    let all = {};
    for (let i = 1; i <= level; i++) Object.assign(all, levelRecipes[i] || {});
    return all;
  }

  function updateLevelText() {
    goal = computeGoal();
    levelText.textContent = `Level ${level} ⭐ (find ${goal} new combos)`;
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
      frag.appendChild(div);
    });
    elementsGrid.innerHTML = '';
    elementsGrid.appendChild(frag);
  }

  function renderStickers() {
    const frag = document.createDocumentFragment();
    stickers.forEach(s => {
      const d = document.createElement('div');
      d.className = 'sticker';
      d.textContent = s;
      frag.appendChild(d);
    });
    stickerBox.innerHTML = '';
    stickerBox.appendChild(frag);
  }

  function checkGoal() {
    if (stickers.length >= goal) {
      nextLevelBtn.style.display = 'block';
      resultBox.textContent = '🎉 Level complete! Tap next to continue.';
    }
  }

  // --- event delegation for elements (single listener) ---
  elementsGrid.addEventListener('click', (ev) => {
    const el = ev.target.closest('.element');
    if (!el) return;
    const name = el.dataset.name;
    if (!name) return;
    // do not allow the user to pick the same element twice in one combination
    if ((choice1 && choice1 === name) || (choice2 && choice2 === name)) {
      resultBox.textContent = 'Pick a different element';
      return;
    }
    if (popSound && typeof popSound.play === 'function') popSound.play().catch(()=>{});
    resultBox.textContent = `Selected: ${name}`;
    if (!choice1) { choice1 = name; slot1.textContent = icons[name]; }
    else if (!choice2) { choice2 = name; slot2.textContent = icons[name]; }
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
      if (popSound) popSound.play().catch(()=>{});
      resultBox.textContent = NO_MAGIC;
    } else {
      if (dingSound) dingSound.play().catch(()=>{});
      resultBox.textContent = result;
    }
    if (result !== NO_MAGIC) {
      const emoji = result.split(' ')[0];
      const currentRecipes = levelRecipes[level] || {};
      if (Object.values(currentRecipes).includes(result)) {
        if (!stickers.includes(emoji)) stickers.push(emoji);
      }
    }
    renderStickers();
    checkGoal();
    choice1 = null; choice2 = null; slot1.textContent = '?'; slot2.textContent = '?';
  });

  nextLevelBtn.addEventListener('click', () => {
    if (level >= MAX_LEVEL) {
      resultBox.textContent = '🏆 You finished all levels!';
      return;
    }
    level++;
    stickers = [];
    nextLevelBtn.style.display = 'none';
    resultBox.textContent = '🎉 New level unlocked!';
    updateLevelText(); renderElements(); renderStickers();
  });

  // INIT
  updateLevelText(); renderElements(); renderStickers();
});
 