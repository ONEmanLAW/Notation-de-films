////////////////////////////////////////////////////////////////////////////////
// API                                                                        //
//////////////////////////////////////////////////////////////////////////////// 

const apiBaseUrl = 'https://europe-west3-gobelins-9079b.cloudfunctions.net/api/v1';


////////////////////////////////////////////////////////////////////////////////
// Récupérer et afficher la liste des films depuis l'API                      //
////////////////////////////////////////////////////////////////////////////////

const fetchAndDisplayMovies = async (sortBy, sortOrder, searchTerm) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/movies`);
    let movies = response.data;

    if (sortBy && sortOrder) {
      movies = movies.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
    }

    if (searchTerm) {
      movies = movies.filter((movie) =>
        movie.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    displayMovies(movies);
  } catch (error) {
    console.error('Erreur lors du chargement des films', error);
  }
};


////////////////////////////////////////////////////////////////////////////////
// Filtrer par autheur et like                                                //
////////////////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
  updateSearchFilter();

  fetchAndPopulateCategories();

  // Récupérer les options de tri depuis le localStorage (si elles existent)
  const authorSortOption = localStorage.getItem('authorSortOption') || 'sortAZAuthor';
  const likesSortOption = localStorage.getItem('likesSortOption') || 'sortLikesDesc';

  applySortOption('sortAuthor', authorSortOption);
  applySortOption('sortLikes', likesSortOption);
});

document.getElementById('sortAuthor').addEventListener('change', (event) => {
  const selectedOption = event.target.value;

  // Sauvegarder l'option de tri dans le localStorage
  localStorage.setItem('authorSortOption', selectedOption);

  applySortOption('sortAuthor', selectedOption);
});

document.getElementById('sortLikes').addEventListener('change', (event) => {
  const selectedOption = event.target.value;

  // Sauvegarder l'option de tri dans le localStorage
  localStorage.setItem('likesSortOption', selectedOption);

  applySortOption('sortLikes', selectedOption);
});

const applySortOption = (sortDropdownId, selectedOption) => {
  const searchTerm = document.getElementById('searchInput').value;

  switch (sortDropdownId) {
    case 'sortAuthor':
      if (selectedOption === 'default') {
        fetchAndDisplayMovies(null, null, searchTerm);
      } else {
        fetchAndDisplayMovies('author', selectedOption === 'sortAZAuthor' ? 'asc' : 'desc', searchTerm);
      }
      break;
    case 'sortLikes':
      if (selectedOption === 'default') {
        fetchAndDisplayMovies(null, null, searchTerm);
      } else {
        fetchAndDisplayMovies('likes', selectedOption === 'sortLikesAsc' ? 'desc' : 'asc', searchTerm);
      }
      break;
    default:
      break;
  }
};


////////////////////////////////////////////////////////////////////////////////
// Afficher les films dans le Dom                                             //
////////////////////////////////////////////////////////////////////////////////

const displayMovies = (movies) => {
  const movieListContainer = document.getElementById('movieList');
  const noMoviesMessage = document.getElementById('noMoviesMessage');

  if (noMoviesMessage) {
    noMoviesMessage.style.display = movies.length === 0 ? 'block' : 'none';
  }
  movieListContainer.innerHTML = '';


  movies.forEach((movie) => {
    if (categoryFilter !== 'all' && movie.category !== categoryFilter) {
      return;
    }

    const movieContainer = document.createElement('div');
    movieContainer.classList.add('movieContainer');

    const movieImage = document.createElement('img');
    movieImage.classList.add('movieImage');
    movieImage.src = movie.img;

    const movieName = document.createElement('p');
    movieName.classList.add('movieName');
    movieName.textContent = movie.name;

    const settingsIcon = document.createElement('img');
    settingsIcon.classList.add('settingsIcon');
    settingsIcon.src = 'Images/icon3.png';

    movieContainer.appendChild(movieImage);
    movieContainer.appendChild(movieName);
    movieContainer.appendChild(settingsIcon);
    movieListContainer.appendChild(movieContainer);

     movieImage.addEventListener('click', () => {
      window.location.href = `movie.html?id=${movie.id}`;
    });


    // Si on clique sur L'icône Settings du film
    settingsIcon.addEventListener('click', (event) => {
      event.stopPropagation();

      const modal = document.getElementById('deleteEditModal');
      const modalMessage = document.getElementById('modalMessage');
      const confirmDeleteButton = document.getElementById('confirmDelete');
      const confirmYesButton = document.getElementById('confirmYes');
      const confirmNoButton = document.getElementById('confirmNo');

      confirmYesButton.style.display = 'none';
      confirmNoButton.style.display = 'none';
      confirmDeleteButton.style.display = 'inline-block';

      modalMessage.textContent = `Voulez-vous supprimer ${movie.name} ?`;

      confirmDeleteButton.onclick = () => {
        modalMessage.textContent = `Êtes-vous sûr de vouloir supprimer ${movie.name} ?`;

        confirmYesButton.style.display = 'inline-block';
        confirmNoButton.style.display = 'inline-block';
        confirmDeleteButton.style.display = 'none';
      };

      confirmYesButton.onclick = () => {
        modal.style.display = 'none';
        deleteMovie(movie.id);
      };

      confirmNoButton.onclick = () => {
        modal.style.display = 'none';
      };

      document.getElementById('closeDeleteEditModal').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.style.display = 'block';
    });
  });
  updateSearchMessage(movies);
};


////////////////////////////////////////////////////////////////////////////////
// Supprimer un film                                                          //
////////////////////////////////////////////////////////////////////////////////

const deleteMovie = async (movieId) => {
  try {
    const response = await axios.delete(`${apiBaseUrl}/movies/${movieId}`);
    console.log('Réponse après suppression :', response.data);

    fetchAndDisplayMovies();

    const updatedMovies = await axios.get(`${apiBaseUrl}/movies`);

    updateSearchMessage(updatedMovies.data);
  } catch (error) {
    console.error('Erreur lors de la suppression du film :', error.message);
  }
};



////////////////////////////////////////////////////////////////////////////////
// Pour récupérer et remplir la liste des catégories depuis l'API             //
////////////////////////////////////////////////////////////////////////////////

const fetchAndPopulateCategories = async () => {
  try {
    const categorySelect = document.getElementById('category');
    const genreDropdown = document.getElementById('genreDropdown');

    const response = await axios.get(`${apiBaseUrl}/categories`);
    const categories = response.data;

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;

      categorySelect.appendChild(option);

      const genreOption = document.createElement('option');
      genreOption.value = category.id;
      genreOption.textContent = category.name;
      genreDropdown.appendChild(genreOption);
    });

    categorySelect.addEventListener('change', () => {
    const selectedCategory = categorySelect.value;
    filterMoviesByCategory(selectedCategory, true);
});

    genreDropdown.addEventListener('change', () => {
      const selectedCategory = genreDropdown.value;
      filterMoviesByCategory(selectedCategory,);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des catégories', error);
  }
};


////////////////////////////////////////////////////////////////////////////////
// Pour filitrer avec la barre de recherche                                   //
////////////////////////////////////////////////////////////////////////////////

const updateSearchFilter = () => {
  const searchFilterContainer = document.getElementById('searchFilterContainer');
  const searchTerm = document.getElementById('searchInput').value;

  if (searchTerm.trim() !== '') {
    searchFilterContainer.innerHTML = `Search: ${searchTerm}`;
  } else {
    searchFilterContainer.innerHTML = '';
  }
};

const updateSearchMessage = (movies) => {
  const searchMessage = document.getElementById('searchMessage');
  searchMessage.textContent = `Nombre de résultats : ${movies.length}`;
};


////////////////////////////////////////////////////////////////////////////////
// Pour rechercher les films par nom avec la barre de recherche               //
////////////////////////////////////////////////////////////////////////////////

const searchMoviesByName = async (searchTerm) => {
  try {
    let movies;

    const cachedMovies = localStorage.getItem('cachedMovies');
    if (cachedMovies) {
      movies = JSON.parse(cachedMovies);
    } else {
      const response = await axios.get(`${apiBaseUrl}/movies`);
      movies = response.data;

      localStorage.setItem('cachedMovies', JSON.stringify(movies));
    }

    const filteredMovies = movies.filter((movie) =>
      movie.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    displayMovies(filteredMovies);

    const searchMessage = document.getElementById('searchMessage');
    searchMessage.textContent = `Nombre de résultats : ${filteredMovies.length}`;

  } catch (error) {
    console.error('Erreur lors de la recherche des films par nom', error);
  }
};

const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.trim();
  fetchAndDisplayMovies('yourSortBy', 'yourSortOrder', searchTerm);
});


////////////////////////////////////////////////////////////////////////////////
// Pour filitrer avec le filtre des catégorie                                 //
////////////////////////////////////////////////////////////////////////////////
let categoryFilter = 'all';

const filterMoviesByCategory = async (category, fromForm = false) => {
  try {
    if (fromForm) {
      return;
    }

    categoryFilter = category;
    let url = `${apiBaseUrl}/movies`;

    if (categoryFilter !== 'all') {
      url += `?category=${categoryFilter}`;
    }

    const response = await axios.get(url);
    const movies = response.data;

    displayMovies(movies);
  } catch (error) {
    console.error('Erreur lors du filtrage des films par catégorie', error);
  }
};
document.getElementById('searchInput').addEventListener('keydown', (event) => {
  if (event.code === 'Enter') {
    event.preventDefault();

    const searchTerm = document.getElementById('searchInput').value;

    searchMoviesByName(searchTerm);
  }
});


////////////////////////////////////////////////////////////////////////////////
// Formulmaire pour ajouter un film                                           //
////////////////////////////////////////////////////////////////////////////////

const addFilmButton = document.getElementById('addFilmButton');
const closeButton = document.getElementById('closeAddFilmModal');
const filmForm = document.getElementById('filmForm');
const modal = document.getElementById('addFilmModal');

const handleAddFilmButtonClick = () => {
  modal.style.display = 'block';
  filmForm.style.display = 'block';
};

const handleCloseButtonClick = (event) => {
    event.preventDefault();

    modal.style.display = 'none';
    filmForm.style.display = 'none';
};

addFilmButton.addEventListener('click', handleAddFilmButtonClick);
closeButton.addEventListener('click', handleCloseButtonClick);

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        filmForm.style.display = 'none';
    }
};

filmForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
      const formData = new FormData(event.target);

      const newMovie = {
          name: formData.get('name'),
          author: formData.get('author'),
          img: formData.get('img'),
          category: formData.get('category'),
          description: formData.get('description'),
          video: formData.get('trailerUrl'),
      };

      console.log('Nouveau film à ajouter :', newMovie);

      const response = await axios.post(`${apiBaseUrl}/movies`, newMovie);
      console.log('Film ajouté avec succès', response.data);

      modal.style.display = 'none';
      filmForm.style.display = 'none';

      const updatedMovies = await axios.get(`${apiBaseUrl}/movies`);

      displayMovies(updatedMovies.data);
  } catch (error) {
      console.error('Erreur lors de l\'ajout du film :', error.message);
  }
});


////////////////////////////////////////////////////////////////////////////////
// Ajouter une catégorie                                                      //
////////////////////////////////////////////////////////////////////////////////

document.getElementById('categorySelector').addEventListener('change', (event) => {
  const selectedOption = event.target.value;

  switch (selectedOption) {
    case 'addCategory':
      openAddCategoryModal();
      break;
    case 'updateCategory':
      break;
    case 'deleteCategory':
      break;
    default:
      break;
  }
});

const openAddCategoryModal = () => {
  const addCategoryModal = document.getElementById('addCategoryModal');
  addCategoryModal.style.display = 'block';
};

const closeAddCategoryModal = () => {
  const addCategoryModal = document.getElementById('addCategoryModal');
  addCategoryModal.style.display = 'none';
};

const addCategoryFromModal = async () => {
  const newCategoryNameInput = document.getElementById('newCategoryName');
  const newCategoryName = newCategoryNameInput.value.trim();

  if (newCategoryName !== '') {
    try {
      const response = await axios.post(`${apiBaseUrl}/categories`, { name: newCategoryName });

      const newCategory = response.data;

      console.log('New category added:', newCategory);

      closeAddCategoryModal();

      newCategoryNameInput.value = '';

      await populateExistingCategoriesDropdown();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie', error);
    }
  }
};

const addCategory = async (categoryName) => {
  try {
    const response = await axios.post(`${apiBaseUrl}/categories`, { name: categoryName });
    console.log('Catégorie ajoutée avec succès', response.data);

    await fetchAndPopulateCategories();
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la catégorie', error);
  }
};


////////////////////////////////////////////////////////////////////////////////
// Modifier une catégorie                                                      //
////////////////////////////////////////////////////////////////////////////////

document.getElementById('categorySelector').addEventListener('change', (event) => {
  const selectedOption = event.target.value;

  switch (selectedOption) {
    case 'updateCategory':
      openModifyCategoryModal();
      break;
    default:
      break;
  }
});

const openModifyCategoryModal = async () => {
  console.log('Ouverture du modal de modification de catégorie');
  const modifyCategoryModal = document.getElementById('modifyCategoryModal');
  modifyCategoryModal.style.display = 'block';

  await populateExistingCategoriesDropdown();
};

const closeModifyCategoryModal = () => {
  console.log('Closing Modify Category Modal');
  const modifyCategoryModal = document.getElementById('modifyCategoryModal');
  modifyCategoryModal.style.display = 'none';
};

const modifyCategoryFromModal = async () => {
  const categorySelect = document.getElementById('categorySelect');
  const modifiedCategoryNameInput = document.getElementById('modifiedCategoryName');
  const selectedCategoryId = categorySelect.value;
  const modifiedCategoryName = modifiedCategoryNameInput.value.trim();

  if (selectedCategoryId !== 'all' && modifiedCategoryName !== '') {
    try {
      await axios.put(`${apiBaseUrl}/categories/${selectedCategoryId}`, { name: modifiedCategoryName });

      console.log(`Category ${selectedCategoryId} modified:`, modifiedCategoryName);

      closeModifyCategoryModal();

      modifiedCategoryNameInput.value = '';

      categorySelect.value = 'all';

      await populateExistingCategoriesDropdown();

      const selectedCategory = categoryFilter === 'all' ? 'all' : modifiedCategoryName;
      await filterMoviesByCategory(selectedCategory);
    } catch (error) {
      console.error('Error modifying category:', error.message);
    }
  }
};

const populateExistingCategoriesDropdown = async () => {
  const categorySelect = document.getElementById('categorySelect');

  try {
    const response = await axios.get(`${apiBaseUrl}/categories`);
    const categories = response.data;

    categorySelect.innerHTML = '';

    const fixedOption = document.createElement('option');
    fixedOption.value = 'all';
    fixedOption.textContent = 'Catégorie to Change';
    categorySelect.appendChild(fixedOption);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching categories:', error.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  populateExistingCategoriesDropdown();
});


////////////////////////////////////////////////////////////////////////////////
// Supprimer une catégorie                                                      //
////////////////////////////////////////////////////////////////////////////////

// Ajoutez un gestionnaire d'événements "change" au sélecteur de catégorie
document.getElementById('categorySelector').addEventListener('change', (event) => {
  const selectedOption = event.target.value;

  switch (selectedOption) {
    case 'addCategory':
      openAddCategoryModal();
      break;
    case 'updateCategory':
      openModifyCategoryModal();
      break;
    case 'deleteCategory':
      openDeleteCategoryModal();
      break;
    default:
      break;
  }
});

const openDeleteCategoryModal = async () => {
  console.log('Ouverture du modal de suppression de catégorie');
  const deleteCategoryModal = document.getElementById('deleteCategoryModal');
  deleteCategoryModal.style.display = 'block';

  await populateCategoriesForDeletion();
};

const closeDeleteCategoryModal = () => {
  console.log('Fermeture du modal de suppression de catégorie');
  const deleteCategoryModal = document.getElementById('deleteCategoryModal');
  deleteCategoryModal.style.display = 'none';
};

const deleteCategory = async () => {
  const categorySelectForDeletion = document.getElementById('categorySelectForDeletion');
  const selectedCategoryId = categorySelectForDeletion.value;

  if (selectedCategoryId !== 'all') {
    try {
      const isCategoryInUse = isCategoryUsed(selectedCategoryId);

      if (isCategoryInUse) {
        alert('La catégorie est associée à un film et ne peut pas être supprimée.');
      } else {
        await axios.delete(`${apiBaseUrl}/categories/${selectedCategoryId}`);

        console.log(`Catégorie ${selectedCategoryId} supprimée avec succès`);

        closeDeleteCategoryModal();

        await populateExistingCategoriesDropdown();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error.message);
    }
  }
};

const populateCategoriesForDeletion = async () => {
  const categorySelectForDeletion = document.getElementById('categorySelectForDeletion');

  try {
    const response = await axios.get(`${apiBaseUrl}/categories`);
    const categories = response.data;

    categorySelectForDeletion.innerHTML = '';

    const fixedOption = document.createElement('option');
    fixedOption.value = 'all';
    fixedOption.textContent = 'Select Category';
    categorySelectForDeletion.appendChild(fixedOption);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelectForDeletion.appendChild(option);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories pour la suppression:', error.message);
  }
};




// Fonction pour vérifier si une catégorie est associée à un film dans le DOM
const isCategoryUsed = (categoryId) => {
  const filmElements = document.querySelectorAll('.film');

  for (const filmElement of filmElements) {
    const filmCategory = filmElement.dataset.category;

    if (filmCategory === categoryId) {
      return true;
    }
  }

  return false;
};

fetchAndDisplayMovies();
fetchAndPopulateCategories();