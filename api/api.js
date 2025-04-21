const API_KEY = "968470055c717530c2f304df9e76a976";
const BASE_URL = "https://api.themoviedb.org/3";
const LANGUAGE = "fr-FR";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

// Fetch générique avec gestion d'erreur
const fetchAPI = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("language", LANGUAGE);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Erreur API (${endpoint}): ${response.status} ${response.statusText}`
      );
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de l'appel à l'API (${endpoint}):`, error);
    return { results: [], error: true };
  }
};

// Générateur de carte (film ou série)
const createCard = (item, type) => {
  if (!item.poster_path) {
    // Exclure les éléments sans affiche
    return null;
  }

  const title = item.title || item.name || "Titre inconnu";
  const imageUrl = `${IMAGE_BASE_URL}w500${item.poster_path}`;

  // Vérifiez si l'élément est déjà dans les favoris
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const isFavorite = favorites.some(
    (fav) => fav.id === item.id && fav.media_type === type
  );

  const card = document.createElement("div");
  card.className =
    "min-w-[180px] bg-white shadow-lg rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer";
  card.innerHTML = `
    <img src="${imageUrl}" alt="${title}" class="w-full h-56 object-cover" />
    <div class="p-4">
      <h3 class="text-lg font-bold mb-2">${title}</h3>
      <span class="text-xs px-2 py-1 bg-gray-200 rounded-full">${
        type === "movie" ? "Film" : "Série"
      }</span>
      <button class="add-fav-btn ${
        isFavorite ? "active" : ""
      }" style="float:right;" title="Ajouter aux favoris">♥</button>
    </div>
  `;

  // Modal au clic (hors bouton favoris)
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("add-fav-btn")) openModal(item, type);
  });

  // Ajout ou suppression des favoris
  card.querySelector(".add-fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target;
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFavorite = favorites.some(
      (fav) => fav.id === item.id && fav.media_type === type
    );

    if (isFavorite) {
      // Supprimer des favoris
      const updatedFavorites = favorites.filter(
        (fav) => !(fav.id === item.id && fav.media_type === type)
      );
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      btn.classList.remove("active");
      showNotification("Retiré des favoris", "info");
    } else {
      // Ajouter aux favoris
      const newFavorite = {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        media_type: type,
        vote_average: item.vote_average,
        overview: item.overview,
        added_at: new Date().toISOString(),
      };
      const updatedFavorites = [...favorites, newFavorite];
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      btn.classList.add("active");
      showNotification("Ajouté aux favoris !", "success");
    }

    // Mettre à jour la liste des favoris
    fetchFavorites();
  });

  return card;
};

// --- FAVORIS ---
const fetchFavorites = () => {
  const container =
    document.getElementById("favorites-container") ||
    document.getElementById("favorites-grid") ||
    document.getElementById("favorites-carousel");
  if (!container) return;
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  container.innerHTML = "";
  if (favorites.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center py-8">Aucun favori enregistré</div>`;
    return;
  }
  favorites.forEach((item) => {
    container.appendChild(createCard(item, item.media_type));
  });
};

const addToFavorites = async (id, type) => {
  try {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.some((item) => item.id === id && item.media_type === type)) {
      showNotification("Déjà dans vos favoris", "info");
      return;
    }
    const response = await fetchAPI(`/${type}/${id}`);
    if (response.error) throw new Error("Erreur API");
    const newFavorite = {
      id: response.id,
      title: response.title || response.name,
      poster_path: response.poster_path,
      media_type: type,
      vote_average: response.vote_average,
      overview: response.overview,
      added_at: new Date().toISOString(),
    };
    const updatedFavorites = [...favorites, newFavorite];
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    showNotification("Ajouté aux favoris !", "success");
    fetchFavorites();
  } catch (error) {
    console.error("Erreur ajout favori:", error);
    showNotification("Erreur lors de l'ajout aux favoris", "error");
  }
};

const showNotification = (message, type = "success") => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };
  const notification = document.createElement("div");
  notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-md shadow-lg z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add(
      "opacity-0",
      "transition-opacity",
      "duration-300"
    );
    setTimeout(() => notification.remove(), 300);
  }, 2000);
};

// --- FILMS POPULAIRES ---
const fetchPopularMovies = async () => {
  const container = document.getElementById("popular-movies"); // Changé de "movies-list" à "popular-movies"
  if (!container) return;
  container.innerHTML = '<div class="text-center py-10">Chargement...</div>';
  const data = await fetchAPI("/movie/popular");
  if (data.error || !data.results) {
    container.innerHTML = `<div class="text-center py-10 text-red-500">Erreur de chargement des films</div>`;
    return;
  }
  container.innerHTML = "";
  data.results.slice(0, 10).forEach((movie) => {
    const card = createCard(movie, "movie");
    if (card) {
      // Ajout d'une vérification pour éviter les erreurs si card est null
      container.appendChild(card);
    }
  });
};
// --- SÉRIES POPULAIRES ---
const fetchPopularSeries = async () => {
  const container = document.getElementById("popular-series");
  if (!container) return;
  container.innerHTML = '<div class="text-center py-10">Chargement...</div>';
  const data = await fetchAPI("/tv/popular");
  if (data.error || !data.results) {
    container.innerHTML = `<div class="text-center py-10 text-red-500">Erreur de chargement des séries</div>`;
    return;
  }
  container.innerHTML = "";
  data.results.slice(0, 10).forEach((serie) => {
    const card = createCard(serie, "tv");
    if (card) {
      // Vérifiez si la carte n'est pas null
      container.appendChild(card);
    }
  });
};

// --- SÉRIES TENDANCES ---
const fetchTrendingSeries = async (period = "day") => {
  const container = document.getElementById("trending-series");
  if (!container) return;
  container.innerHTML = '<div class="text-center py-10">Chargement...</div>';
  const data = await fetchAPI(`/trending/tv/${period}`);
  if (data.error || !data.results) {
    container.innerHTML = `<div class="text-center py-10 text-red-500">Erreur de chargement des séries tendances</div>`;
    return;
  }
  container.innerHTML = "";
  data.results.slice(0, 10).forEach((serie) => {
    container.appendChild(createCard(serie, "tv"));
  });
};

// --- FILMS PAR GENRE ---
const fetchByGenre = async (type, genreId, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<div class="text-center py-4">Chargement...</div>';
  const data = await fetchAPI(`/discover/${type}`, { with_genres: genreId });
  if (data.error || !data.results) {
    container.innerHTML = `<div class="text-center py-4 text-red-500">Erreur de chargement</div>`;
    return;
  }
  container.innerHTML = "";
  data.results.slice(0, 10).forEach((item) => {
    container.appendChild(createCard(item, type));
  });
};

// --- MODAL DÉTAILS + COMMENTAIRES ---
async function openModal(item, type) {
  let modalContainer = document.getElementById("modalContainer");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "modalContainer";
    document.body.appendChild(modalContainer);
  }
  modalContainer.innerHTML = `
    <div class="modal-overlay" style="position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:1000;"></div>
    <div class="modal" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;color:#222;z-index:1001;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,0.3);padding:2em;max-width:500px;width:95vw;">
      <div id="modal-content">Chargement...</div>
      <button id="closeModalBtn" style="position:absolute;right:18px;top:12px;background:none;border:none;font-size:2em;color:#f800b4;cursor:pointer;">&times;</button>
    </div>
  `;
  document.getElementById("closeModalBtn").onclick = () =>
    (modalContainer.innerHTML = "");

  // Récupère les détails
  let details = item;
  if (!item.overview) {
    const url = type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
    details = await fetchAPI(url);
  }

  // Récupère les reviews de TMDb
  const reviewsData = await fetchAPI(`/${type}/${item.id}/reviews`);
  console.log("Reviews récupérées :", reviewsData); // Ajoutez ce log
  const reviews = reviewsData.results || [];

  // Récupère les commentaires locaux
  const commentsKey = `comments_${type}_${item.id}`;
  const localComments = JSON.parse(localStorage.getItem(commentsKey)) || [];

  // Combine les reviews TMDb et les commentaires locaux
  const allComments = [
    ...reviews.map((review) => ({
      name: review.author,
      text: review.content,
    })),
    ...localComments,
  ];
  console.log("Commentaires combinés :", allComments); // Ajoutez ce log

  // Affiche les détails et les commentaires
  document.getElementById("modal-content").innerHTML = `
    <img src="${
      details.poster_path
        ? IMAGE_BASE_URL + "w300" + details.poster_path
        : "assets/placeholder.jpg"
    }" alt="${
    details.title || details.name
  }" style="float:left;max-width:120px;margin-right:16px;border-radius:10px;">
    <h2>${details.title || details.name}</h2>
    <p><strong>${type === "movie" ? "Film" : "Série"}</strong></p>
    <p><em>${details.overview || "Aucune description disponible."}</em></p>
    <hr>
    <h3>Commentaires</h3>
    <div id="commentsList">
      ${
        allComments.length
          ? allComments
              .map(
                (c) =>
                  `<div class="comment" style="background:#f3f3f3;color:#222;margin-bottom:0.5em;padding:0.5em 1em;border-radius:8px;"><b>${c.name}</b> : ${c.text}</div>`
              )
              .join("")
          : "<em>Aucun commentaire.</em>"
      }
    </div>
    <form id="commentForm" style="margin-top:1em;display:flex;gap:0.5em;flex-wrap:wrap;">
      <input type="text" id="commentName" placeholder="Votre nom" required style="width:40%;margin-right:1em;">
      <input type="text" id="commentText" placeholder="Votre commentaire" required style="width:40%;">
      <button type="submit">Ajouter</button>
    </form>
  `;
  document.getElementById("commentsList").innerHTML = allComments.length
    ? allComments
        .map(
          (c) =>
            `<div class="comment" style="background:#f3f3f3;color:#222;margin-bottom:0.5em;padding:0.5em 1em;border-radius:8px;"><b>${c.name}</b> : ${c.text}</div>`
        )
        .join("")
    : "<em>Aucun commentaire.</em>";
  document.getElementById("commentForm").onsubmit = function (e) {
    e.preventDefault();
    const name = document.getElementById("commentName").value.trim();
    const text = document.getElementById("commentText").value.trim();
    if (!name || !text) return;
    const newComments = [...localComments, { name, text }];
    localStorage.setItem(commentsKey, JSON.stringify(newComments));
    document.getElementById("commentsList").innerHTML = newComments
      .map(
        (c) =>
          `<div class="comment" style="background:#f3f3f3;color:#222;margin-bottom:0.5em;padding:0.5em 1em;border-radius:8px;"><b>${c.name}</b> : ${c.text}</div>`
      )
      .join("");
    this.reset();
  };
}

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
  fetchPopularMovies();
  fetchPopularSeries();
  fetchTrendingSeries("day"); // "day" ou "week"
  fetchFavorites();
});

// Fonction d'autocomplétion globale
const setupGlobalSearch = () => {
  const searchInput = document.getElementById('global-search-input');
  const resultsContainer = document.getElementById('global-search-results');

  if (!searchInput || !resultsContainer) return;

  let timeoutId;

  // Fonction de recherche avec debounce
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    const query = e.target.value.trim();

    if (query.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        resultsContainer.innerHTML = '<div class="p-3 text-gray-500">Recherche en cours...</div>';
        resultsContainer.classList.remove('hidden');

        // Recherche multi-type (films + séries)
        const [movies, series] = await Promise.all([
          fetchAPI('/search/movie', { query, page: 1 }),
          fetchAPI('/search/tv', { query, page: 1 })
        ]);

        displayCombinedResults(movies.results, series.results, resultsContainer, searchInput.value);
      } catch (error) {
        console.error('Erreur recherche globale:', error);
        resultsContainer.innerHTML = '<div class="p-3 text-red-500">Erreur de recherche</div>';
      }
    }, 300); // Délai de 300ms
  });

  // Cacher les résultats quand on clique ailleurs
  document.addEventListener('click', (e) => {
    if (!resultsContainer.contains(e.target) && e.target !== searchInput) {
      resultsContainer.classList.add('hidden');
    }
  });
};

// Afficher les résultats combinés
function displayCombinedResults(movies = [], series = [], container, query) {
  if (movies.length === 0 && series.length === 0) {
    container.innerHTML = '<div class="p-3 text-gray-500">Aucun résultat trouvé</div>';
    return;
  }

  let html = '';

  // Films
  if (movies.length > 0) {
    html += `<div class="px-3 py-2 bg-gray-100 text-sm font-semibold">Films</div>`;
    movies.slice(0, 5).forEach(movie => {
      html += `
        <a href="#" class="block px-3 py-2 hover:bg-gray-100 flex items-center search-result-item" 
           data-id="${movie.id}" data-type="movie">
          <img src="${movie.poster_path ? IMAGE_BASE_URL + 'w92' + movie.poster_path : 'assets/placeholder.jpg'}" 
               alt="${movie.title}" 
               class="w-8 h-12 object-cover rounded mr-3">
          <span>${movie.title} (${movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})</span>
        </a>
      `;
    });
  }

  // Séries
  if (series.length > 0) {
    html += `<div class="px-3 py-2 bg-gray-100 text-sm font-semibold">Séries</div>`;
    series.slice(0, 5).forEach(show => {
      html += `
        <a href="#" class="block px-3 py-2 hover:bg-gray-100 flex items-center search-result-item" 
           data-id="${show.id}" data-type="tv">
          <img src="${show.poster_path ? IMAGE_BASE_URL + 'w92' + show.poster_path : 'assets/placeholder.jpg'}" 
               alt="${show.name}" 
               class="w-8 h-12 object-cover rounded mr-3">
          <span>${show.name} (${show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A'})</span>
        </a>
      `;
    });
  }

  container.innerHTML = html;

  // Ajouter des gestionnaires d'événements pour ouvrir la modal
  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = item.getAttribute('data-id');
      const type = item.getAttribute('data-type');
      const details = await fetchAPI(`/${type}/${id}`);
      openModal(details, type);
    });
  });
}

// N'oubliez pas d'appeler cette fonction dans votre initialisation
document.addEventListener('DOMContentLoaded', () => {
  // ... autres initialisations ...
  setupGlobalSearch();
});
