
let allMatches = [];
let favorites = JSON.parse(localStorage.getItem("cricFavorites")) || [];

// PAGINATION (Milestone 4 Bonus)
const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let filteredCache = [];

async function getMatches() {
  const container = document.getElementById("matches");

  // MILESTONE 4: Loading spinner (replaces plain text)
  container.innerHTML = "";
  document.getElementById("loadingSpinner").style.display = "block";
  document.getElementById("statsBar").style.display = "none";
  document.getElementById("pagination").innerHTML = "";

  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.classList.add("spinning");

  try {
    const res = await fetch(
      "https://api.cricapi.com/v1/currentMatches?apikey=cd64aa3e-ac94-44dc-9180-b28cb0fe7cd4"
    );
    const data = await res.json();
    console.log(data);

    if (data.status === "failure") {
      document.getElementById("loadingSpinner").style.display = "none";
      container.innerHTML = `<p class="no-data">${data.reason}</p>`;
      return;
    }

    allMatches = data.data.filter((match) => match && match.name);
    document.getElementById("loadingSpinner").style.display = "none";
    applyFilters();
  } catch (err) {
    document.getElementById("loadingSpinner").style.display = "none";
    container.innerHTML = "<p class='no-data'>Error loading data. Please try again.</p>";
  } finally {
    refreshBtn.classList.remove("spinning");
  }
}

function displayMatches(matches) {
  const container = document.getElementById("matches");
  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = "<p class='no-data'>No Matches Found</p>";
    updateStats([]);
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = matches.slice(start, start + ITEMS_PER_PAGE);

  paginated.map((match) => {
    const div = document.createElement("div");
    div.className = "card";


    const statusText = (match.status || "").toLowerCase();
    let badgeClass = "upcoming";
    if (statusText.includes("live") || statusText.includes("in progress")) badgeClass = "live";
    else if (statusText.includes("won") || statusText.includes("result") || statusText.includes("over")) badgeClass = "result";

    // MILESTONE 3: Favorite button state
    const isFav = favorites.some((f) => f.id === match.id);

    div.innerHTML = `
      <h3>${match.name}</h3>
      <p class="status ${badgeClass}">${match.status || "N/A"}</p>
      <p>Type: ${match.matchType || "N/A"}</p>
      <p>${match.teams ? match.teams.join(" vs ") : "N/A"}</p>
      <div class="card-actions">
        <button class="btn-fav ${isFav ? "active" : ""}" onclick="toggleFavorite('${match.id}')">
          <i class="fa-${isFav ? "solid" : "regular"} fa-star"></i>
          ${isFav ? "Saved" : "Favorite"}
        </button>
        <button class="btn-view" onclick="viewMore('${match.id}')">
          <i class="fa-solid fa-eye"></i> View More
        </button>
      </div>
    `;
    container.appendChild(div);
  });

  updateStats(matches);
  renderPagination(matches.length);
}


function applyFilters() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const type = document.getElementById("typeFilter").value;

  // MILESTONE 3: Sort
  const sort = document.getElementById("sortFilter").value;

  let filtered = [...allMatches];

  if (keyword) {
    filtered = filtered.filter((match) =>
      match.name.toLowerCase().includes(keyword)
    );
  }

  if (type !== "all") {
    filtered = filtered.filter(
      (match) =>
        match.matchType && match.matchType.toLowerCase().includes(type)
    );
  }

  if (sort === "az") {
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "za") {
    filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === "type") {
    filtered = filtered.sort((a, b) =>
      (a.matchType || "").localeCompare(b.matchType || "")
    );
  }

  filteredCache = filtered;
  currentPage = 1;
  displayMatches(filtered);
}



function toggleFavorite(id) {
  const match = allMatches.find((m) => m.id === id);
  if (!match) return;

  const exists = favorites.some((f) => f.id === id);

  if (exists) {
    favorites = favorites.filter((f) => f.id !== id);
    showToast("❌ Removed from favorites");
  } else {
    favorites.push(match);
    showToast("⭐ Added to favorites!");
  }

  localStorage.setItem("cricFavorites", JSON.stringify(favorites));

  displayMatches(filteredCache.length ? filteredCache : allMatches);
  renderFavorites();
}

function viewMore(id) {
  const match = allMatches.find((m) => m.id === id);
  if (!match) return;

  const overlay = document.getElementById("modalOverlay");
  document.getElementById("modalTitle").textContent = match.name;
  document.getElementById("modalStatus").textContent = "Status: " + (match.status || "N/A");
  document.getElementById("modalType").textContent = "Match Type: " + (match.matchType || "N/A");
  document.getElementById("modalTeams").textContent = "Teams: " + (match.teams ? match.teams.join(" vs ") : "N/A");
  document.getElementById("modalDate").textContent = "Date: " + (match.date || "N/A");
  document.getElementById("modalVenue").textContent = "Venue: " + (match.venue || "N/A");
  overlay.classList.add("open");
}


function initTheme() {
  const saved = localStorage.getItem("cricTheme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  icon.className = theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
}

document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("cricTheme", next);
  updateThemeIcon(next);
  showToast(next === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode");
});


function renderFavorites() {
  const section = document.getElementById("favorites-section");
  const grid = document.getElementById("favoritesGrid");

  if (favorites.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  grid.innerHTML = "";
  favorites.map((match) => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.borderColor = "#facc15";
    div.innerHTML = `
      <h3>${match.name}</h3>
      <p class="status">${match.status || "N/A"}</p>
      <p>Type: ${match.matchType || "N/A"}</p>
      <p>${match.teams ? match.teams.join(" vs ") : "N/A"}</p>
      <div class="card-actions">
        <button class="btn-fav active" onclick="toggleFavorite('${match.id}')">
          <i class="fa-solid fa-star"></i> Remove
        </button>
      </div>
    `;
    grid.appendChild(div);
  });

  updateStats(filteredCache.length ? filteredCache : allMatches);
}

function renderPagination(total) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentPage = i;
      displayMatches(filteredCache.length ? filteredCache : allMatches);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    container.appendChild(btn);
  }
}


function updateStats(matches) {
  const statsBar = document.getElementById("statsBar");
  statsBar.style.display = "flex";

  const liveCount = matches.filter(
    (m) => m.status && (m.status.toLowerCase().includes("live") || m.status.toLowerCase().includes("progress"))
  ).length;

  document.getElementById("totalCount").textContent = `Total: ${matches.length}`;
  document.getElementById("liveCount").textContent = `🟢 Live: ${liveCount}`;
  document.getElementById("favCount").textContent = `⭐ Favorites: ${favorites.length}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

let debounceTimer;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, 300);
});

document.getElementById("typeFilter").addEventListener("change", applyFilters);
document.getElementById("sortFilter").addEventListener("change", applyFilters);
document.getElementById("refreshBtn").addEventListener("click", getMatches);

initTheme();
renderFavorites();
window.onload = getMatches;
