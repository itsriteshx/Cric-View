
let allMatches = [];

async function getMatches() {
  const container = document.getElementById("matches");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=cd64aa3e-ac94-44dc-9180-b28cb0fe7cd4");
    const data = await res.json();

    console.log(data);
    if (data.status === "failure") {
      container.innerHTML = `<p class="no-data">${data.reason}</p>`;
      return;
    }

    allMatches = data.data.filter(match => match && match.name);
    displayMatches(allMatches);

  } catch (err) {
    container.innerHTML = "Error loading data";
  }
}

function displayMatches(matches) {
  const container = document.getElementById("matches");
  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = "<p class='no-data'>No Matches Found</p>";
    return;
  }

  matches.map(match => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${match.name}</h3>
      <p class="status">${match.status || "N/A"}</p>
      <p>Type: ${match.matchType || "N/A"}</p>
      <p>${match.teams ? match.teams.join(" vs ") : "N/A"}</p>
    `;

    container.appendChild(div);
  });
}

function applyFilters() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const type = document.getElementById("typeFilter").value;

  let filtered = [...allMatches];


  if (keyword) {
    filtered = filtered.filter(match =>
      match.name.toLowerCase().includes(keyword)
    );
  }

  if (type !== "all") {
    filtered = filtered.filter(match =>
      match.matchType &&
      match.matchType.toLowerCase().includes(type)
    );
  }

  displayMatches(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("typeFilter").addEventListener("change", applyFilters);
document.getElementById("refreshBtn").addEventListener("click", getMatches);

window.onload = getMatches;