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

  // Activer la modal
  modalContainer.classList.add("active");

  modalContainer.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal">
      <button id="closeModalBtn" class="absolute top-4 right-4 text-3xl text-red-600 hover:text-red-800">
        &times;
      </button>
      <div id="modal-content" class="p-6"></div>
    </div>
  `;

  // Gestion de la fermeture
  document.getElementById("closeModalBtn").onclick = closeModal;
  document.querySelector(".modal-overlay").onclick = closeModal;

  function closeModal() {
    modalContainer.classList.remove("active");
    // Retirer la modal après l'animation
    setTimeout(() => {
      modalContainer.innerHTML = "";
    }, 300);
  }

  try {
    // Récupération des détails complets
    const details = await fetchAPI(`/${type}/${item.id}`, {
      append_to_response: 'credits,videos,similar'
    });

    // Récupération des commentaires de l'API TMDB
    const reviewsData = await fetchAPI(`/${type}/${item.id}/reviews`);
    const reviews = reviewsData.results || [];

    // Récupération des commentaires locaux
    const commentsKey = `comments_${type}_${item.id}`;
    const localComments = JSON.parse(localStorage.getItem(commentsKey)) || [];

    // Combinaison des commentaires
    const allComments = [
      ...reviews.map(review => ({
        name: review.author,
        text: review.content,
        date: review.created_at,
        source: 'tmdb'
      })),
      ...localComments.map(comment => ({
        ...comment,
        source: 'local'
      }))
    ];

    // Tri des commentaires par date (les plus récents en premier)
    allComments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Récupération des éléments similaires
    const similarItems = details.similar?.results?.slice(0, 4) || [];

    // Construction du HTML de la modal
    const modalHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne de gauche - Affiche et informations de base -->
        <div class="lg:col-span-1">
          <img src="${
            details.poster_path 
              ? IMAGE_BASE_URL + 'w500' + details.poster_path 
              : 'assets/placeholder.jpg'
          }" alt="${details.title || details.name}" class="w-full rounded-lg shadow-md">
          
          <div class="mt-4">
            <h2 class="text-2xl font-bold mb-2">${details.title || details.name}</h2>
            <div class="flex items-center mt-2">
              <span class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                ${type === 'movie' ? 'Film' : 'Série'}
              </span>
              <span class="ml-2 text-gray-600">
                ${type === 'movie' 
                  ? details.release_date?.substring(0, 4) 
                  : details.first_air_date?.substring(0, 4)}
              </span>
              ${details.runtime ? `
                <span class="ml-2 text-gray-600">
                  ${Math.floor(details.runtime / 60)}h ${details.runtime % 60}min
                </span>
              ` : ''}
            </div>
            
            <div class="mt-4 flex items-center">
              <span class="text-yellow-500 text-xl font-bold">
                ${details.vote_average?.toFixed(1) || 'N/A'}
              </span>
              <span class="text-gray-500 ml-1">/10</span>
              <span class="text-gray-500 ml-2">(${details.vote_count} votes)</span>
            </div>
            
            <button class="add-fav-btn mt-4 px-4 py-2 rounded-full ${
              JSON.parse(localStorage.getItem('favorites'))?.some(
                fav => fav.id === item.id && fav.media_type === type
              ) ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }">
              ♥ ${JSON.parse(localStorage.getItem('favorites'))?.some(
                fav => fav.id === item.id && fav.media_type === type
              ) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
          </div>
        </div>
        
        <!-- Colonne centrale - Détails -->
        <div class="lg:col-span-2">
          <div class="mb-6">
            <h3 class="text-xl font-bold mb-2">Synopsis</h3>
            <div class="text-gray-700 whitespace-pre-line">${
              details.overview || 'Aucune description disponible.'
            }</div>
          </div>
          
          <!-- Section commentaires -->
          <div class="mb-6">
            <h3 class="text-xl font-bold mb-2">Commentaires</h3>
            <div id="commentsList" class="space-y-4 mb-4">
              ${allComments.length ? allComments.map(comment => `
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="flex justify-between items-start">
                    <div>
                      <strong class="${comment.source === 'tmdb' ? 'text-blue-600' : 'text-red-600'}">
                        ${comment.name}
                      </strong>
                      <span class="text-xs text-gray-500 ml-2">
                        ${new Date(comment.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    ${comment.source === 'tmdb' ? `
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        TMDB
                      </span>
                    ` : ''}
                  </div>
                  <p class="mt-2 text-gray-700">${comment.text}</p>
                </div>
              `).join('') : '<p class="text-gray-500">Aucun commentaire pour le moment.</p>'}
            </div>
            
            <form id="commentForm" class="bg-gray-100 p-4 rounded-lg">
              <h4 class="font-bold mb-3">Ajouter un commentaire</h4>
              <div class="grid grid-cols-1 gap-3 mb-3">
                <input type="text" id="commentName" placeholder="Votre nom" required 
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-300">
                <textarea id="commentText" placeholder="Votre commentaire" required rows="3"
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-300"></textarea>
              </div>
              <button type="submit" 
                class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                Publier
              </button>
            </form>
          </div>

          <!-- Section contenus similaires -->
          <div class="mb-6">
            <h3 class="text-xl font-bold mb-2">Contenus similaires</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              ${similarItems.map(similar => `
                <div class="cursor-pointer hover:scale-105 transition-transform" 
                  onclick="openModal(${JSON.stringify(similar)}, '${type}')">
                  <img src="${
                    similar.poster_path 
                      ? IMAGE_BASE_URL + 'w300' + similar.poster_path 
                      : 'assets/placeholder.jpg'
                  }" alt="${similar.title || similar.name}" 
                  class="w-full h-40 object-cover rounded-lg shadow">
                  <p class="mt-2 font-medium text-sm truncate">${similar.title || similar.name}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("modal-content").innerHTML = modalHTML;

    // Gestion du bouton favori
    document.querySelector('.add-fav-btn').addEventListener('click', function(e) {
      e.preventDefault();
      const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      const isFavorite = favorites.some(fav => fav.id === item.id && fav.media_type === type);
      
      if (isFavorite) {
        const updatedFavorites = favorites.filter(
          fav => !(fav.id === item.id && fav.media_type === type)
        );
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        this.innerHTML = '♥ Ajouter aux favoris';
        this.classList.remove('bg-red-600', 'text-white');
        this.classList.add('bg-gray-200', 'hover:bg-gray-300');
        showNotification('Retiré des favoris', 'info');
      } else {
        const newFavorite = {
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          media_type: type,
          vote_average: item.vote_average,
          overview: item.overview,
          added_at: new Date().toISOString()
        };
        const updatedFavorites = [...favorites, newFavorite];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        this.innerHTML = '♥ Retirer des favoris';
        this.classList.remove('bg-gray-200', 'hover:bg-gray-300');
        this.classList.add('bg-red-600', 'text-white');
        showNotification('Ajouté aux favoris !', 'success');
      }
      
      // Mettre à jour la liste des favoris sur toutes les pages
      fetchFavorites();
    });

    // Gestion du formulaire de commentaire
    document.getElementById("commentForm").onsubmit = function(e) {
      e.preventDefault();
      const name = document.getElementById("commentName").value.trim();
      const text = document.getElementById("commentText").value.trim();
      
      if (!name || !text) return;
      
      const newComment = {
        name,
        text,
        date: new Date().toISOString()
      };
      
      const newComments = [...localComments, newComment];
      localStorage.setItem(commentsKey, JSON.stringify(newComments));
      
      // Ajouter le nouveau commentaire à la liste
      const commentsList = document.getElementById("commentsList");
      const commentDiv = document.createElement("div");
      commentDiv.className = "bg-gray-50 p-4 rounded-lg";
      commentDiv.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <strong class="text-red-600">${name}</strong>
            <span class="text-xs text-gray-500 ml-2">
              ${new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
        <p class="mt-2 text-gray-700">${text}</p>
      `;
      
      if (commentsList.firstChild?.textContent === 'Aucun commentaire pour le moment.') {
        commentsList.innerHTML = '';
      }
      
      commentsList.prepend(commentDiv);
      this.reset();
    };

  } catch (error) {
    console.error("Erreur lors du chargement de la modal:", error);
    document.getElementById("modal-content").innerHTML = `
      <div class="text-center py-10 text-red-500">
        Une erreur est survenue lors du chargement des détails.
      </div>
    `;
  }
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
