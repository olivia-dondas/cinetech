# 🎬 Bingerz

Bingerz est une bibliothèque web de films et de séries, inspirée des grandes plateformes de streaming, mais avec une touche personnelle. Ce projet a été réalisé dans le cadre de ma formation à La Plateforme à Marseille, et il représente mon **premier projet centré sur l’utilisation d’API REST et la manipulation du DOM avec JavaScript**.

---

## 🌟 Objectif du projet

Le but de Bingerz est de créer une interface dynamique et responsive permettant aux utilisateurs de :

- Explorer des films et séries populaires via **The Movie Database API** (TMDB)
- Afficher les détails complets de chaque œuvre
- Gérer une **liste de favoris** via le `localStorage`
- Lire et publier des **commentaires** (stockés localement)
- Effectuer des recherches grâce à une **barre avec autocomplétion asynchrone**
- Naviguer facilement grâce à une pagination adaptée

---

## 🧠 Compétences mises en pratique

- Utilisation d’événements JavaScript
- Manipulation fine du **DOM**
- Requêtes asynchrones avec `fetch()`
- Traitement et affichage de données API
- Utilisation du **localStorage**
- Responsive design (mobile & desktop)

---

## 🖥️ Pages disponibles

### 🏠 Accueil
Sélection de films et séries populaires mise en avant dès l’ouverture du site.

### 🎥 Page Films
Liste paginée de films issus de TMDB avec filtres par genre.

### 📺 Page Séries
Même principe que la page Films, avec toutes les séries proposées.

### ℹ️ Page Détail
Pour chaque film ou série :
- Informations : réalisateur, genres, résumé, pays, acteurs…
- Suggestions de contenus similaires
- Section commentaires (affichage + ajout)
- Ajout aux favoris

### ❤️ Page Favoris
Gestion de la liste personnalisée de favoris (films & séries).

### 🔍 Barre de recherche
Recherche intelligente avec **autocomplétion en JS asynchrone** directement intégrée au header.

---

## 🛠️ Stack technique

- HTML5 / CSS3
- JavaScript ES6
- API TMDB
- LocalStorage
- Design inspiré de Netflix, Disney+… avec une direction artistique **colorée et vivante**

---

## 📌 Notes importantes

- **Aucune authentification** n’est implémentée, tout est en local
- L’API TMDB est utilisée uniquement pour la récupération de données
- Les commentaires et favoris sont **stockés en local (localStorage)** pour rester dans un cadre simple et pédagogique

---

## 📚 En résumé

Bingerz, c’est le terrain d’expérimentation idéal pour moi afin de découvrir en profondeur les **API REST** et l’interaction utilisateur en JavaScript. J’ai appris à structurer une application, à réfléchir à l’expérience utilisateur, et à écrire un code plus propre et réutilisable.

---

## ✨ À venir ?

- Filtres avancés par genre, année, pays
- Système de vote local
- Animation des éléments à l’aide de bibliothèques JS
- Ajout d’un mode sombre 🌙

---

> 💡 *Bingerz est un projet vivant, tout comme ma passion pour le code et le cinéma. Stay tuned !*
