let choice1 = null;
let choice2 = null;

let discovered = [];
let currentPage = 0;
const stickersPerPage = 8;

// Sounds
const popSound = document.getElementById("popSound");
const dingSound = document.getElementById("dingSound");

// Recipes
const recipes = {
  "Fire+Water": "☁️ Steam Cloud!",
  "Water+Air": "☁️ Big Cloud!",
  "Water+Leaf": "🌿 A Plant!",
  "Fire+Leaf": "⚫ Ash!",
  "Air+Leaf": "🍃 Flying Leaf!",
  "Fire+Fire": "🔥 Big Flame!",
  "Water+Water": "🌊 Splash!",
  "Sun+Rain": "🌈 Rainbow!",
  "Ice+Fire": "💧 Melted Water!",
  "Ice+Water": "❄️ Snow!",
  "Rain+Leaf": "🌱 Growing Plant!",
  "Sun+Leaf": "🌻 Sunflower!"
};

// Sticker Book Render
function renderStickerPage() {
  const pageDiv = document.getElementById("stickerPage");
  pageDiv.innerHTML = "";

  let start = currentPage * stickersPerPage;
  let pageStickers = discovered.slice(start, start + stickersPerPage);

  pageStickers.forEach(st => {
    let div = document.createElement("div");
    div.className = "sticker";
    div.textContent = st;
    pageDiv.appendChild(div);
  });

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage + 1}`;
}

// Tap element
document.querySelectorAll(".element").forEach(el => {
  el.addEventListener("click", () => {

    popSound.currentTime = 0;
    popSound.play();

    let name = el.dataset.name;
    let icon = el.innerHTML.split("<")[0];

    if (!choice1) {
      choice1 = name;
      document.getElementById("slot1").textContent = icon;
    }
    else if (!choice2) {
      choice2 = name;
      document.getElementById("slot2").textContent = icon;
    }
  });
});

// Mix Button
document.getElementById("mixBtn").addEventListener("click", () => {

  if (!choice1 || !choice2) {
    alert("Pick two things first 😊");
    return;
  }

  let key1 = choice1 + "+" + choice2;
  let key2 = choice2 + "+" + choice1;

  let result =
    recipes[key1] ||
    recipes[key2] ||
    "🎉 Surprise Mix!";

  // Play sound
  dingSound.currentTime = 0;
  dingSound.play();

  // Animate result box
  let box = document.getElementById("resultBox");
  box.textContent = result;
  box.classList.add("mix-animate");

  setTimeout(() => {
    box.classList.remove("mix-animate");
  }, 600);

  // Add sticker
  let emoji = result.split(" ")[0];
  if (!discovered.includes(emoji)) {
    discovered.push(emoji);
  }

  renderStickerPage();

  // Reset slots
  choice1 = null;
  choice2 = null;
  document.getElementById("slot1").textContent = "?";
  document.getElementById("slot2").textContent = "?";
});

// Page Buttons
document.getElementById("nextPage").addEventListener("click", () => {
  if ((currentPage + 1) * stickersPerPage < discovered.length) {
    currentPage++;
    renderStickerPage();
  }
});

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    renderStickerPage();
  }
});
