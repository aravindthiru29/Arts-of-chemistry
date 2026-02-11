document.addEventListener("DOMContentLoaded", () => {

  let choice1 = null;
  let choice2 = null;

  let level = 1;
  let stickers = [];
  let goal = 1;
  // Make game easier: fewer max levels and slower goal growth
  const MAX_LEVEL = 6;

  // Mascot
  const mascot = document.getElementById("mascot");
  const mascotText = document.getElementById("mascotText");

  function mascotReact(msg, cls) {
    mascotText.textContent = msg;
    const emojiSpan = document.getElementById("mascotEmoji") || mascot;

    const map = {
      happy: "😄",
      celebrate: "🏆",
      surprise: "😲",
      wink: "😉",
      default: "🐰"
    };

    // set expression
    emojiSpan.textContent = map[cls] || map.default;

    // clear animation classes then re-add to retrigger
    mascot.classList.remove("happy", "celebrate", "shake");
    void mascot.offsetWidth;
    if (cls) mascot.classList.add(cls);

    const timeout = cls === "celebrate" ? 1400 : 700;
    setTimeout(() => {
      if (cls) mascot.classList.remove(cls);
      emojiSpan.textContent = map.default;
    }, timeout);
  }

  // Sounds
  const popSound = document.getElementById("popSound");
  const dingSound = document.getElementById("dingSound");

  // Elements unlocked per level
  const unlocks = {
    1: ["Fire", "Water"],
    2: ["Air", "Leaf"],
    3: ["Sun"],
    4: ["Ice"],
    5: ["Rain"]
  };

  // Additional levels
  unlocks[6] = ["Metal"];
  unlocks[7] = ["Earth"];
  unlocks[8] = ["Lightning"];
  unlocks[9] = ["Spirit"];
  unlocks[10] = ["Ether"];

  // Icons
  const icons = {
    Fire: "🔥",
    Water: "💧",
    Air: "🌬",
    Leaf: "🌱",
    Sun: "☀️",
    Ice: "🧊",
    Rain: "🌧"
  };

  icons.Metal = "⚙️";
  icons.Earth = "🌎";
  icons.Lightning = "⚡";
  icons.Spirit = "✨";
  icons.Ether = "🔮";

  // Recipes unlocked gradually
  const levelRecipes = {
    1: {
      "Fire+Water": "☁️ Steam"
    },
    2: {
      "Water+Air": "☁️ Cloud",
      "Water+Leaf": "🌿 Plant"
    },
    3: {
      "Sun+Water": "🌈 Rainbow",
      "Sun+Leaf": "🌻 Sunflower"
    },
    4: {
      "Ice+Fire": "💧 Melt",
      "Ice+Water": "❄️ Snow"
    },
    5: {
      "Rain+Leaf": "🌱 Growing Plant",
      "Sun+Rain": "🌈 Big Rainbow"
    }
  };

  // Recipes for higher levels
  levelRecipes[6] = {
    "Metal+Fire": "🔩 Forge",
    "Metal+Water": "🔧 Rust"
  };
  levelRecipes[7] = {
    "Earth+Water": "🪨 Mud",
    "Earth+Leaf": "🌾 Soil"
  };
  levelRecipes[8] = {
    "Lightning+Air": "⚡ Storm",
    "Lightning+Water": "🌩 Thundercloud"
  };
  levelRecipes[9] = {
    "Spirit+Sun": "✨ Aura",
    "Spirit+Leaf": "🪴 Spirit Plant"
  };
  levelRecipes[10] = {
    "Ether+Spirit": "🔮 Mystic",
    "Ether+Sun": "🌌 Nebula"
  };

  // Build recipes up to current level
  function getAvailableRecipes() {
    let all = {};
    for (let i = 1; i <= level; i++) {
      Object.assign(all, levelRecipes[i]);
    }
    return all;
  }

  // Update UI
  function updateLevelText() {
    document.getElementById("levelText").textContent =
      `Level ${level} ⭐ (Find ${goal} Stickers)`;
  }

  // Render Elements
  function renderElements() {
    const grid = document.getElementById("elementsGrid");
    grid.innerHTML = "";

    let available = [];
    for (let i = 1; i <= level; i++) {
      if (unlocks[i]) available.push(...unlocks[i]);
    }

    available.forEach(name => {
      let div = document.createElement("div");
      div.className = "element";
      div.textContent = icons[name];

      div.onclick = () => {
        popSound.play();
        mascotReact("Nice pick!", "happy");

        if (!choice1) {
          choice1 = name;
          document.getElementById("slot1").textContent = icons[name];
        } else if (!choice2) {
          choice2 = name;
          document.getElementById("slot2").textContent = icons[name];
        }
      };

      grid.appendChild(div);
    });
  }

  // Render Stickers
  function renderStickers() {
    const box = document.getElementById("stickerBox");
    box.innerHTML = "";

    stickers.forEach(s => {
      let div = document.createElement("div");
      div.className = "sticker";
      div.textContent = s;
      box.appendChild(div);
    });
  }

  // Check Goal
  function checkGoal() {
    if (stickers.length >= goal) {
      document.getElementById("nextLevelBtn").style.display = "block";
      mascotReact("🎉 Level Complete!", "celebrate");
    }
  }

  // Mix Button
  document.getElementById("mixBtn").onclick = () => {

    if (!choice1 || !choice2) return;

    const recipes = getAvailableRecipes();

    let key1 = choice1 + "+" + choice2;
    let key2 = choice2 + "+" + choice1;

    const NO_MAGIC = "No magic happens";

    let result = recipes[key1] || recipes[key2] || NO_MAGIC;

    if (result === NO_MAGIC) {
      popSound.play();
      mascotReact("No magic happens", "shake");
    } else {
      dingSound.play();
      mascotReact("WOW! Magic Mix!", "happy");
    }

    document.getElementById("resultBox").textContent = result;

    if (result !== NO_MAGIC) {
      let emoji = result.split(" ")[0];
      if (!stickers.includes(emoji)) stickers.push(emoji);
    }

    renderStickers();
    checkGoal();

    // Reset
    choice1 = null;
    choice2 = null;
    document.getElementById("slot1").textContent = "?";
    document.getElementById("slot2").textContent = "?";
  };

  // Next Level Button
  document.getElementById("nextLevelBtn").onclick = () => {
    if (level >= MAX_LEVEL) {
      mascotReact("🏆 You finished all levels!", "celebrate");
      return;
    }

    level++;
    // increase goal by 1 to keep progression easier
    goal += 1;
    stickers = [];

    document.getElementById("nextLevelBtn").style.display = "none";
    document.getElementById("resultBox").textContent =
      "🎉 New Level Unlocked!";

    mascotReact("New Level!", "celebrate");

    updateLevelText();
    renderElements();
    renderStickers();
  };

  // INIT
  updateLevelText();
  renderElements();
  renderStickers();

});

