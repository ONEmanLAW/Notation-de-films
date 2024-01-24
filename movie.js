const apiBaseUrl = 'https://europe-west3-gobelins-9079b.cloudfunctions.net/api/v1';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');

  fetchMovieDetails(movieId);
});

const fetchMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/movies/${movieId}`);
    const movie = response.data;

    document.getElementById('movieTitle').textContent = movie.name;
    document.getElementById('movieImage').innerHTML = `<img src="${movie.img}" alt="${movie.name}">`;
    document.getElementById('movieAuthor').textContent = movie.author;

    const categoryResponse = await axios.get(`${apiBaseUrl}/categories/${movie.category}`);
    const categoryName = categoryResponse.data.name;

    document.getElementById('movieCategory').textContent = categoryName;

    document.getElementById('movieDescription').textContent = movie.description;
    document.getElementById('movieLikes').textContent = `Likes: ${movie.likes || 0}`;
    document.getElementById('movieDislikes').textContent = `Dislikes: ${movie.dislikes || 0}`;
    document.getElementById('movieVideoTitle').textContent = movie.videoTitle || '';

    disableOppositeButton(movie);

    document.getElementById('likeButton').addEventListener('click', () => addLike(movieId));
    document.getElementById('dislikeButton').addEventListener('click', () => addDislike(movieId));

    // Load movie details in edit mode initially
    loadEditForm(movie);
  } catch (error) {
    console.error('Erreur lors du chargement des détails du film', error);
  }
};

const disableOppositeButton = (movie) => {
  const likeButton = document.getElementById('likeButton');
  const dislikeButton = document.getElementById('dislikeButton');

  if (movie.userVote === 'like') {
    dislikeButton.disabled = true;
  } else if (movie.userVote === 'dislike') {
    likeButton.disabled = true;
  }
};

const enableEditMode = () => {
  const viewModeElements = document.querySelectorAll('[id^="movie"]');
  const editForm = document.getElementById('editForm');

  // Populate the edit form with current values
  viewModeElements.forEach((element) => {
    const editElement = document.getElementById(`edit${element.id.slice(5)}`);
    if (editElement) {
      editElement.value = element.textContent.trim();
    }
  });

  // Toggle visibility
  document.getElementById('movieDetails').style.display = 'none';
  editForm.style.display = 'block';
};

const cancelEdit = () => {
  // Toggle visibility
  document.getElementById('movieDetails').style.display = 'grid';
  document.getElementById('editForm').style.display = 'none';
};

const saveChanges = async (movieId) => {
  const updatedMovie = {
    name: document.getElementById('editTitle').value,
    author: document.getElementById('editAuthor').value,
    category: document.getElementById('editCategory').value,
    description: document.getElementById('editDescription').value,
    videoTitle: document.getElementById('editVideoTitle').value,
  };

  try {
    // Utilisez la méthode PATCH avec le bon endpoint
    await axios.patch(`${apiBaseUrl}/movies/${movieId}`, updatedMovie);

    // Mettez à jour les détails du film dans le DOM
    const viewModeElements = document.querySelectorAll('[id^="movie"]');
    viewModeElements.forEach((element) => {
      const property = element.id.slice(5); // Supprimez le préfixe 'movie'
      element.textContent = `${property.charAt(0).toUpperCase() + property.slice(1)}: ${updatedMovie[property]}`;
    });

    // Revenez au mode de vue
    cancelEdit();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des modifications', error);
  }
};

// Appelez la fonction avec movieId lorsque vous en avez besoin
// saveChanges(movieId);


const addLike = async (movieId) => {
  try {
    if (hasUserVoted(movieId)) {
      console.log('Vous avez déjà voté pour ce film.');
      return;
    }

    await axios.patch(`${apiBaseUrl}/movies/${movieId}/like`);

    const currentLikes = parseInt(document.getElementById('movieLikes').textContent.split(':')[1].trim());
    document.getElementById('movieLikes').textContent = `Likes: ${currentLikes + 1}`;

    document.getElementById('dislikeButton').disabled = true;

    saveUserVote(movieId, 'like');
  } catch (error) {
    console.error('Erreur lors de l\'ajout du like', error);
  }
};

const addDislike = async (movieId) => {
  try {
    if (hasUserVoted(movieId)) {
      console.log('Vous avez déjà voté pour ce film.');
      return;
    }

    await axios.patch(`${apiBaseUrl}/movies/${movieId}/dislike`);

    const currentDislikes = parseInt(document.getElementById('movieDislikes').textContent.split(':')[1].trim());
    document.getElementById('movieDislikes').textContent = `Dislikes: ${currentDislikes + 1}`;

    document.getElementById('likeButton').disabled = true;

    saveUserVote(movieId, 'dislike');
  } catch (error) {
    console.error('Erreur lors de l\'ajout du dislike', error);
  }
};

const hasUserVoted = (movieId) => {
  const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};

  return userVotes[movieId] !== undefined;
};

const saveUserVote = (movieId, vote) => {
  const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};

  userVotes[movieId] = vote;

  localStorage.setItem('userVotes', JSON.stringify(userVotes));
};