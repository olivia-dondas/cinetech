// series.js

// --- Variables d'état ---
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let currentGenre = "";
let currentYear = "";
let currentSort = "popularity.desc";
let genresList = [];

// --- DOM Elements ---
const seriesList = document.getElementById("series-list");
const pagination = document.getElementById("pagination");
const searchForm = document.getElementById("series-search-form");
const searchInput = document.getElementById("search-query");
const genreFilter = document.getElementById("genre-filter");
const yearFilter = document.getElementById("year-filter");
const sortFilter = document.getElementById("sort-filter");

// --- Initialisation ---
document.addEventListener("DOMContentLoaded", async () => {
  await initGenres();
  initYears();
  fetchFavoriteSeriesCarousel();
  loadSeries();

  // Gestion du formulaire de recherche/filtres
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    currentGenre = genreFilter.value;
    currentYear = yearFilter.value;
    currentSort = sortFilter.value;
    currentPage = 1;
    loadSeries();
  });

  // Changement de filtre = nouvelle recherche
  genreFilter.addEventListener("change", () => {
    currentGenre = genreFilter.value;
    currentPage = 1;
    loadSeries();
  });
  yearFilter.addEventListener("change", () => {
    currentYear = yearFilter.value;
    currentPage = 1;
    loadSeries();
  });
  sortFilter.addEventListener("change", () => {
    currentSort = sortFilter.value;
    currentPage = 1;
    loadSeries();
  });
});

// --- Charger et injecter les genres des séries ---
async function initGenres() {
  const data = await fetchAPI("/genre/tv/list");
  genresList = data.genres || [];
  genreFilter.innerHTML =
    `<option value="">Tous</option>` +
    genresList
      .map((g) => `<option value="${g.id}">${g.name}</option>`)
      .join("");
}

// --- Générer les années (2000 à année courante) ---
function initYears() {
  const current = new Date().getFullYear();
  let options = `<option value="">Toutes</option>`;
  for (let y = current; y >= 1950; y--) {
    options += `<option value="${y}">${y}</option>`;
  }
  yearFilter.innerHTML = options;
}

// --- Charger les séries (avec recherche/filtres/pagination) ---
async function loadSeries() {
  seriesList.innerHTML =
    '<div class="col-span-full text-center py-10">Chargement...</div>';
  pagination.innerHTML = "";

  // Choix de l'endpoint et des paramètres
  let endpoint, params;
  if (currentQuery) {
    endpoint = "/search/tv";
    params = {
      query: currentQuery,
      page: currentPage,
      sort_by: currentSort,
      with_genres: currentGenre,
      first_air_date_year: currentYear,
      include_adult: false,
    };
  } else {
    endpoint = "/discover/tv";
    params = {
      page: currentPage,
      sort_by: currentSort,
      with_genres: currentGenre,
      first_air_date_year: currentYear,
      include_adult: false,
    };
  }

  const data = await fetchAPI(endpoint, params);

  if (data.error || !data.results) {
    seriesList.innerHTML =
      '<div class="col-span-full text-center py-10 text-red-500">Erreur de chargement des séries</div>';
    return;
  }

  totalPages = data.total_pages || 1;
  seriesList.innerHTML = "";

  if (data.results.length === 0) {
    seriesList.innerHTML =
      '<div class="col-span-full text-center py-10 text-gray-500">Aucune série trouvée.</div>';
    return;
  }

  data.results.forEach((serie) => {
    seriesList.appendChild(createCard(serie, "tv"));
  });

  renderPagination();
}

// --- Pagination (identique à movies.js) ---
function renderPagination() {
  pagination.innerHTML = "";

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  // Bouton Précédent
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Précédent";
  prevBtn.className =
    "px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 mx-1 disabled:opacity-50";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadSeries();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  pagination.appendChild(prevBtn);

  // Boutons de pages
  if (start > 1) {
    addPageBtn(1);
    if (start > 2) pagination.appendChild(ellipsis());
  }
  for (let i = start; i <= end; i++) {
    addPageBtn(i);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pagination.appendChild(ellipsis());
    addPageBtn(totalPages);
  }

  // Bouton Suivant
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Suivant →";
  nextBtn.className =
    "px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 mx-1 disabled:opacity-50";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadSeries();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  pagination.appendChild(nextBtn);

  function addPageBtn(page) {
    const btn = document.createElement("button");
    btn.textContent = page;
    btn.className =
      "px-3 py-1 rounded mx-1 " +
      (page === currentPage
        ? "bg-red-600 text-white font-bold"
        : "bg-gray-200 hover:bg-gray-300");
    btn.disabled = page === currentPage;
    btn.onclick = () => {
      currentPage = page;
      loadSeries();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    pagination.appendChild(btn);
  }
  function ellipsis() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "mx-1 text-gray-400";
    return span;
  }
}

// --- Carrousel des favoris (version séries) ---
function fetchFavoriteSeriesCarousel() {
  const container = document.getElementById("favorites-carousel");
  if (!container) return;
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const seriesFavorites = favorites.filter((item) => item.media_type === "tv");
  container.innerHTML = "";
  if (seriesFavorites.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">Aucune série favorite enregistrée</div>`;
    return;
  }
  seriesFavorites.forEach((item) => {
    const card = createCard(item, "tv");
    card.classList.add("min-w-[180px]", "max-w-[200px]", "flex-shrink-0");
    container.appendChild(card);
  });
}

// --- Navigation carrousel favoris ---
document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("favorites-carousel");
  const prevBtn = document.getElementById("fav-prev");
  const nextBtn = document.getElementById("fav-next");

  function scrollByAmount(amount) {
    if (carousel) carousel.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (prevBtn && nextBtn && carousel) {
    prevBtn.onclick = () => scrollByAmount(-carousel.offsetWidth * 0.8);
    nextBtn.onclick = () => scrollByAmount(carousel.offsetWidth * 0.8);

    const updateButtons = () => {
      prevBtn.style.display = carousel.scrollLeft > 5 ? "block" : "none";
      nextBtn.style.display =
        carousel.scrollLeft + carousel.offsetWidth < carousel.scrollWidth - 5
          ? "block"
          : "none";
    };
    carousel.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);
    setTimeout(updateButtons, 300);
  }
});