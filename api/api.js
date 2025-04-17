const API_KEY = "968470055c717530c2f304df9e76a976";
const BASE_URL = "https://api.themoviedb.org/3";
const LANGUAGE = "fr-FR";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

// Fonction fetch sécurisée avec gestion d'erreur améliorée
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
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur API (${endpoint}):`, error);
    return { results: [], error: true };
  }
};

// Gestion des favoris améliorée
const fetchFavorites = () => {
  try {
    const container =
      document.getElementById("favorites-container") ||
      document.getElementById("favorites-grid") ||
      document.getElementById("favorites-carousel");

    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-10">
          <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <p class="mt-2 text-gray-500">Aucun favori enregistré</p>
        </div>
      `;
      return;
    }

    favorites.forEach((item) => {
      container.appendChild(createCard(item, item.media_type));
    });
  } catch (error) {
    console.error("Erreur chargement favoris:", error);
  }
};

// Fonction pour ajouter aux favoris avec vérification
const addToFavorites = async (id, type) => {
  try {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    // Vérifie si déjà dans les favoris
    if (favorites.some((item) => item.id === id && item.media_type === type)) {
      showNotification("Ce contenu est déjà dans vos favoris", "info");
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

// Notification stylée
const showNotification = (message, type = "success") => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  const notification = document.createElement("div");
  notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-md shadow-lg animate-fadeInOut`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add(
      "opacity-0",
      "transition-opacity",
      "duration-300"
    );
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Création de carte améliorée avec fallback
const createCard = (item, type) => {
  const card = document.createElement("div");
  card.className =
    "card group relative bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300";

  const title = item.title || item.name || "Titre inconnu";
  const imageUrl = item.poster_path
    ? `${IMAGE_BASE_URL}w500${item.poster_path}`
    : "assets/placeholder.jpg";

  card.innerHTML = `
    <div class="relative h-64 overflow-hidden">
      <img src="${imageUrl}" alt="${title}" 
           class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
        <h3 class="text-white font-bold truncate">${title}</h3>
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs px-2 py-1 rounded ${
              type === "movie" ? "bg-blue-500" : "bg-purple-500"
            } text-white">${type === "movie" ? "Film" : "Série"}</span>
            <span class="text-yellow-400 text-sm">${
              item.vote_average?.toFixed(1) || "N/A"
            }/10</span>
          </div>
          <button onclick="event.stopPropagation(); addToFavorites(${
            item.id
          }, '${type}')"
                  class="text-white bg-red-500 hover:bg-red-600 p-1 rounded-full transition">
            ♥
          </button>
        </div>
      </div>
    </div>
    <div class="p-3">
      <h3 class="font-semibold text-gray-800 truncate">${title}</h3>
    </div>
  `;

  card.addEventListener("click", () => openModal(item, type));
  return card;
};

// Chargement des films populaires avec gestion des erreurs
const fetchPopularMovies = async () => {
  const container = document.getElementById("popular-movies");
  if (!container) return;

  container.innerHTML =
    '<div class="col-span-full text-center py-10">Chargement...</div>';

  const data = await fetchAPI("/movie/popular");

  if (data.error || !data.results) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-red-500">
        Erreur de chargement des films
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  data.results.slice(0, 12).forEach((movie) => {
    container.appendChild(createCard(movie, "movie"));
  });
};

// Chargement des séries avec filtrage amélioré
const fetchPopularSeries = async () => {
  const container = document.getElementById("popular-series");
  if (!container) return;

  container.innerHTML =
    '<div class="col-span-full text-center py-10">Chargement...</div>';

  const data = await fetchAPI("/tv/popular");

  if (data.error || !data.results) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-red-500">
        Erreur de chargement des séries
      </div>
    `;
    return;
  }

  const filteredSeries = data.results.filter((serie) => {
    // Exclure les talk shows et émissions d'actualité
    const excludedGenres = [10767, 10763, 10764];
    const hasExcludedGenre = serie.genre_ids?.some((id) =>
      excludedGenres.includes(id)
    );

    return (
      !hasExcludedGenre &&
      (serie.number_of_seasons > 1 || serie.vote_count > 50)
    );
  });

  container.innerHTML = "";
  filteredSeries.slice(0, 12).forEach((serie) => {
    container.appendChild(createCard(serie, "tv"));
  });
};

// Chargement par genre optimisé
const fetchByGenre = async (type, genreId, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    '<div class="col-span-full text-center py-4">Chargement...</div>';

  const data = await fetchAPI(`/discover/${type}`, { with_genres: genreId });

  if (data.error || !data.results) {
    container.innerHTML = `
      <div class="col-span-full text-center py-4 text-red-500">
        Erreur de chargement
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  data.results.slice(0, 10).forEach((item) => {
    container.appendChild(createCard(item, type));
  });
};

// Modal amélioré avec plus d'informations
async function openModal(item, type) {
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;

  // Afficher un loader pendant le chargement
  modalContainer.innerHTML = `
    <div class="modal-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md w-full">
        <p class="text-center">Chargement en cours...</p>
      </div>
    </div>
  `;
  modalContainer.classList.remove("hidden");

  try {
    const details = await fetchAPI(`/${type}/${item.id}`, {
      append_to_response: "credits,similar",
    });
    if (details.error) throw new Error("Erreur API");

    const commentsKey = `comments_${type}_${item.id}`;
    const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];

    // Formatage de la date pour les films
    const releaseDate = details.release_date || details.first_air_date;
    const formattedDate = releaseDate
      ? new Date(releaseDate).toLocaleDateString(LANGUAGE, {
          year: "numeric",
          month: "long",
        })
      : "Date inconnue";

    // Extraction des principaux acteurs
    const mainActors =
      details.credits?.cast
        ?.slice(0, 5)
        .map((actor) => actor.name)
        .join(", ") || "Non disponible";

    modalContainer.innerHTML = `
      <div class="modal-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div class="modal bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-2xl font-bold text-gray-900">${
                details.title || details.name
              }</h2>
              <button id="closeModalBtn" class="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6">
              <div class="w-full md:w-1/3">
                <img src="${IMAGE_BASE_URL}w500${details.poster_path}" 
                     alt="${details.title || details.name}"
                     class="w-full rounded-lg shadow-md">
              </div>
              
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <span class="bg-red-500 text-white px-2 py-1 rounded text-sm">
                    ${type === "movie" ? "Film" : "Série"}
                  </span>
                  <span class="text-yellow-500">${
                    details.vote_average?.toFixed(1) || "N/A"
                  }/10</span>
                  <span class="text-gray-600 text-sm">${formattedDate}</span>
                  ${
                    type === "tv"
                      ? `<span class="text-gray-600 text-sm">${details.number_of_seasons} saisons</span>`
                      : ""
                  }
                </div>
                
                <div class="mb-4">
                  <h3 class="font-semibold text-gray-900 mb-2">Synopsis</h3>
                  <p class="text-gray-700">${
                    details.overview || "Aucune description disponible."
                  }</p>
                </div>
                
                <div class="mb-4">
                  <h3 class="font-semibold text-gray-900 mb-2">Acteurs principaux</h3>
                  <p class="text-gray-700">${mainActors}</p>
                </div>
                
                <button onclick="addToFavorites(${details.id}, '${type}')"
                        class="mb-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition">
                  Ajouter aux favoris
                </button>
                
                <div class="border-t pt-4">
                  <h3 class="font-semibold text-gray-900 mb-2">Commentaires</h3>
                  <div id="commentsList" class="space-y-3 mb-4">
                    ${
                      comments.length
                        ? comments
                            .map(
                              (c) => `
                      <div class="bg-gray-100 p-3 rounded-lg">
                        <strong class="text-red-600">${c.name}</strong>
                        <p class="text-gray-700">${c.text}</p>
                      </div>
                    `
                            )
                            .join("")
                        : '<p class="text-gray-500">Aucun commentaire</p>'
                    }
                  </div>
                  
                  <form id="commentForm" class="space-y-3">
                    <div>
                      <label for="commentName" class="block text-sm font-medium text-gray-700 mb-1">Votre nom</label>
                      <input type="text" id="commentName" required
                             class="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500">
                    </div>
                    <div>
                      <label for="commentText" class="block text-sm font-medium text-gray-700 mb-1">Votre commentaire</label>
                      <textarea id="commentText" required rows="3"
                                class="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"></textarea>
                    </div>
                    <button type="submit" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition">
                      Publier
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Gestion fermeture modal
    document.getElementById("closeModalBtn").addEventListener("click", () => {
      modalContainer.classList.add("hidden");
    });

    // Gestion formulaire commentaire
    document.getElementById("commentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("commentName").value.trim();
      const text = document.getElementById("commentText").value.trim();

      if (name && text) {
        const newComments = [
          ...comments,
          { name, text, date: new Date().toISOString() },
        ];
        localStorage.setItem(commentsKey, JSON.stringify(newComments));

        document.getElementById("commentsList").innerHTML = newComments
          .map(
            (c) => `
            <div class="bg-gray-100 p-3 rounded-lg">
              <strong class="text-red-600">${c.name}</strong>
              <p class="text-gray-700">${c.text}</p>
            </div>
          `
          )
          .join("");

        e.target.reset();
        showNotification("Commentaire ajouté !", "success");
      }
    });
  } catch (error) {
    console.error("Erreur ouverture modal:", error);
    modalContainer.innerHTML = `
      <div class="modal-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg max-w-md w-full text-center">
          <p class="text-red-500">Erreur lors du chargement des détails</p>
          <button onclick="document.getElementById('modal-container').classList.add('hidden')"
                  class="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Fermer
          </button>
        </div>
      </div>
    `;
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  // Chargement principal
  fetchPopularMovies();
  fetchPopularSeries();
  fetchFavorites();

  // Films par genre
  fetchByGenre("movie", 35, "comedy-carousel");
  fetchByGenre("movie", 28, "action-carousel");
  fetchByGenre("movie", 10749, "romantic-carousel");
  fetchByGenre("movie", 27, "horror-carousel");

  // Séries par genre
  fetchByGenre("tv", 18, "drama-series");
  fetchByGenre("tv", 10765, "scifi-series");
});

// Exposer les fonctions globalement pour les événements HTML
window.addToFavorites = addToFavorites;
window.openModal = openModal;
