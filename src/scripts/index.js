/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { 
  getUserInfo, 
  setUserInfo, 
  updateAvatar, 
  getCardList, 
  addCard, 
  deleteCard, 
  changeLikeCardStatus,
  isCardOwner,
  isCardLikedByUser,
  getLikesCount
} from "./components/api.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";

console.log('Версия проекта: Release 1.0.2'); // Используется для проверки актуальности github pages

enableValidation({
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible'
});

// Глобальная переменная для хранения ID текущего пользователя
let currentUserId = null;

// DOM узлы
const logo = document.querySelector(".header__logo");

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalUserList = cardInfoModalWindow.querySelector(".popup__list");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const usersStatsModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const usersStatsModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const usersStatsModalUserList = cardInfoModalWindow.querySelector(".popup__list");
const usersStatsModalText = cardInfoModalWindow.querySelector(".popup__text");

// DOM элементы для удаления
const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");
let cardToDeleteId = null;
let cardToDeleteElement = null;

// ========== ОБРАБОТЧИКИ ДЛЯ КАРТОЧЕК ==========

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeClick = (cardId, likeButton, likeCountElement, isLiked) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      // Обновляем состояние лайка
      const newIsLiked = isCardLikedByUser(updatedCard, currentUserId);
      
      // Меняем иконку лайка
      if (newIsLiked) {
        likeButton.classList.add("card__like-button_is-active");
      } else {
        likeButton.classList.remove("card__like-button_is-active");
      }
      
      // Обновляем счётчик лайков
      likeCountElement.textContent = getLikesCount(updatedCard);
    })
    .catch((err) => {
      console.log("Ошибка при изменении лайка:", err);
    });
};

const handleDeleteCardClick = (cardId, cardElement) => {
  cardToDeleteId = cardId;
  cardToDeleteElement = cardElement;
  openModalWindow(removeCardModalWindow);
};

// Обработчик подтверждения удаления
const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Удаление...";
  submitButton.disabled = true;
  
  deleteCard(cardToDeleteId)
    .then(() => {
      cardToDeleteElement.remove();
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => {
      // Здесь можно показать ошибку пользователю, но без console.log
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const handleInfoClick = (cardId) => {
  // Получаем актуальный список карточек с сервера
  getCardList()
    .then((cards) => {
      // Находим нужную карточку по ID
      const cardData = cards.find(card => card._id === cardId);
      
      if (!cardData) {
        throw new Error('Карточка не найдена');
      }
      
      // Очищаем предыдущие данные
      cardInfoModalInfoList.innerHTML = '';
      cardInfoModalUserList.innerHTML = '';
      
      // Устанавливаем заголовок
      cardInfoModalTitle.textContent = cardData.name;
      
      // Добавляем информацию о дате создания
      const createdDate = new Date(cardData.createdAt);
      const formattedDate = formatDate(createdDate);
      cardInfoModalInfoList.appendChild(
        createInfoItem("Дата создания:", formattedDate)
      );
      
      // Добавляем информацию о количестве лайков
      const likesCount = cardData.likes.length;
      cardInfoModalInfoList.appendChild(
        createInfoItem("Количество лайков:", likesCount.toString())
      );
      
      // Добавляем информацию об авторе
      cardInfoModalInfoList.appendChild(
        createInfoItem("Автор:", cardData.owner.name)
      );
      
      // Добавляем список пользователей, лайкнувших карточку
      if (likesCount > 0) {
        cardInfoModalText.textContent = "Лайкнули:";
        cardData.likes.forEach(user => {
          cardInfoModalUserList.appendChild(createUserBadge(user));
        });
      } else {
        cardInfoModalText.textContent = "Пока никто не лайкнул";
      }
      
      // Открываем модальное окно
      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.error("Ошибка при загрузке информации о карточке:", err);
    });
};

const handleLogoClick = () => {
  // Получаем актуальный список карточек с сервера
  getCardList()
    .then((cards) => {
      if (cards.length === 0) {
        // Если нет карточек, показываем сообщение
        usersStatsModalTitle.textContent = "Статистика пользователей";
        usersStatsModalInfoList.innerHTML = '';
        usersStatsModalUserList.innerHTML = '';
        usersStatsModalText.textContent = "Нет созданных карточек";
        openModalWindow(cardInfoModalWindow);
        return;
      }
      
      // Очищаем предыдущие данные
      usersStatsModalInfoList.innerHTML = '';
      usersStatsModalUserList.innerHTML = '';
      
      // Устанавливаем заголовок
      usersStatsModalTitle.textContent = "Статистика пользователей";
      
      // Сортируем карточки по дате создания (от старых к новым)
      const sortedCards = [...cards].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      const oldestCard = sortedCards[0];      // Самая старая карточка
      const newestCard = sortedCards[sortedCards.length - 1]; // Самая новая карточка
      
      // Общая статистика
      usersStatsModalInfoList.appendChild(
        createStatItem("Всего карточек:", cards.length.toString())
      );
      
      usersStatsModalInfoList.appendChild(
        createStatItem("Всего пользователей:", getUniqueUsersCount(cards).toString())
      );
      
      usersStatsModalInfoList.appendChild(
        createStatItem("Первая создана:", formatDate(new Date(oldestCard.createdAt)))
      );
      
      usersStatsModalInfoList.appendChild(
        createStatItem("Последняя создана:", formatDate(new Date(newestCard.createdAt)))
      );
      
      // Подсчет активности пользователей
      const userActivity = getUserActivity(cards);
      
      // Находим самого активного пользователя
      const mostActiveUser = getMostActiveUser(userActivity);
      if (mostActiveUser) {
        usersStatsModalInfoList.appendChild(
          createStatItem("Самый активный:", `${mostActiveUser.name} (${mostActiveUser.count} карточек)`)
        );
      }
      
      // Список всех пользователей, создавших карточки
      usersStatsModalText.textContent = "Пользователи, создавшие карточки:";
      const uniqueUsers = getUniqueUsers(cards);
      uniqueUsers.forEach(user => {
        const userCardCount = userActivity[user._id] || 0;
        const badge = createUserStatBadge(user);
        // Добавляем количество карточек к имени
        const badgeElement = badge.querySelector(".popup__list-item");
        badgeElement.textContent = `${user.name} (${userCardCount} карточек)`;
        usersStatsModalUserList.appendChild(badge);
      });
      
      // Открываем модальное окно
      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.error("Ошибка при загрузке статистики:", err);
      usersStatsModalTitle.textContent = "Ошибка";
      usersStatsModalText.textContent = "Не удалось загрузить статистику";
      openModalWindow(cardInfoModalWindow);
    });
};

// Функция для отрисовки карточки
const renderCard = (cardData) => {
  const cardElement = createCardElement(
    cardData,
    {
      onPreviewPicture: handlePreviewPicture,
      onLikeClick: handleLikeClick,
      onDeleteClick: handleDeleteCardClick,
      onInfoClick: handleInfoClick,
    },
    currentUserId,
    isCardOwner(cardData, currentUserId),
    isCardLikedByUser(cardData, currentUserId)
  );
  placesWrap.append(cardElement);
};

// ========== ОБРАБОТЧИКИ ФОРМ ==========

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  // Меняем текст кнопки и блокируем её
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      // console.log("Ошибка при обновлении профиля:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;
  
  updateAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      // console.log("Ошибка при обновлении аватара:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Создание...";
  submitButton.disabled = true;
  
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCard) => {
      const cardElement = createCardElement(
        newCard,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeClick: handleLikeClick,
          onDeleteClick: handleDeleteCardClick,
        },
        currentUserId,
        isCardOwner(newCard, currentUserId),
        isCardLikedByUser(newCard, currentUserId)
      );
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      // console.log("Ошибка при добавлении карточки:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Загружаем данные пользователя и карточки параллельно, но ждём оба запроса
Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cards]) => {
    // 1. Сохраняем ID пользователя
    currentUserId = userData._id;
    
    // 2. Обновляем DOM профиля
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    
    if (profileAvatar) {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    }
    
    // 3. Теперь, когда currentUserId известен, отрисовываем карточки
    if (cards && cards.length > 0) {
      cards.forEach((card) => {
        renderCard(card);
      });
    } else {
      // Показываем сообщение, что карточек нет
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'Пока нет карточек. Добавьте первую!';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '40px';
      placesWrap.appendChild(emptyMessage);
    }
  })
  .catch(() => {
    // Обработка ошибок (без console.log)
    profileTitle.textContent = "Ошибка загрузки";
    profileDescription.textContent = "Не удалось загрузить профиль";
    
    const errorMessage = document.createElement('li');
    errorMessage.textContent = 'Не удалось загрузить карточки. Проверьте подключение.';
    errorMessage.style.color = 'red';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.padding = '40px';
    placesWrap.appendChild(errorMessage);
  });

// ========== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ ==========

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
logo.addEventListener("click", handleLogoClick);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, {
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
  });
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

// Настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const formatDate = (date) => {
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const createInfoItem = (term, description) => {
  const template = document.querySelector("#popup-info-definition-template");
  const infoItem = template.content.cloneNode(true);
  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;
  return infoItem;
};

// Функция создания элемента списка пользователей
const createUserBadge = (user) => {
  const template = document.querySelector("#popup-info-user-preview-template");
  const badge = template.content.cloneNode(true);
  const badgeElement = badge.querySelector(".popup__list-item");
  badgeElement.textContent = user.name;
  // Можно добавить аватар, если нужно
  // badgeElement.style.backgroundImage = `url(${user.avatar})`;
  return badge;
};

// Функция создания элемента списка информации
const createStatItem = (term, description) => {
  const template = document.querySelector("#popup-info-definition-template");
  const statItem = template.content.cloneNode(true);
  statItem.querySelector(".popup__info-term").textContent = term;
  statItem.querySelector(".popup__info-description").textContent = description;
  return statItem;
};

// Функция создания элемента списка пользователей
const createUserStatBadge = (user) => {
  const template = document.querySelector("#popup-info-user-preview-template");
  const badge = template.content.cloneNode(true);
  const badgeElement = badge.querySelector(".popup__list-item");
  badgeElement.textContent = user.name;
  // Можно добавить аватар, если нужно
  // badgeElement.style.backgroundImage = `url(${user.avatar})`;
  return badge;
};

// Получение уникальных пользователей из карточек
const getUniqueUsers = (cards) => {
  const usersMap = new Map();
  cards.forEach(card => {
    if (!usersMap.has(card.owner._id)) {
      usersMap.set(card.owner._id, card.owner);
    }
  });
  return Array.from(usersMap.values());
};

// Подсчет количества карточек у каждого пользователя
const getUserActivity = (cards) => {
  const activity = {};
  cards.forEach(card => {
    const userId = card.owner._id;
    if (!activity[userId]) {
      activity[userId] = {
        name: card.owner.name,
        count: 0
      };
    }
    activity[userId].count++;
  });
  return activity;
};

// Получение самого активного пользователя
const getMostActiveUser = (userActivity) => {
  let mostActive = null;
  let maxCount = 0;
  
  Object.values(userActivity).forEach(user => {
    if (user.count > maxCount) {
      maxCount = user.count;
      mostActive = user;
    }
  });
  
  return mostActive;
};

// Количество уникальных пользователей
const getUniqueUsersCount = (cards) => {
  const uniqueUsers = new Set();
  cards.forEach(card => {
    uniqueUsers.add(card.owner._id);
  });
  return uniqueUsers.size;
};
