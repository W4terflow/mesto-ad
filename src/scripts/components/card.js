export const likeCard = (likeButton, likeCountElement, isLiked) => {
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  } else {
    likeButton.classList.remove("card__like-button_is-active");
  }
};

export const deleteCard = (cardElement) => {
  cardElement.remove();
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeClick, onDeleteClick, onInfoClick },
  currentUserId,
  isOwner,
  isLiked
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  // Заполняем данные карточки
  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  
  // Устанавливаем количество лайков
  if (likeCountElement) {
    likeCountElement.textContent = data.likes ? data.likes.length : 0;
  }
  
  // Устанавливаем состояние лайка (активна ли иконка)
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }
  
  // Показываем/скрываем кнопку удаления в зависимости от владельца
  if (!isOwner) {
    deleteButton.style.display = "none";
  }

  if (onInfoClick) {
    infoButton.addEventListener("click", () => {
      onInfoClick(data._id);
    });
  }
  
  // Обработчик лайка
  if (onLikeClick) {
    likeButton.addEventListener("click", () => {
      const newIsLiked = likeButton.classList.contains("card__like-button_is-active");
      onLikeClick(data._id, likeButton, likeCountElement, newIsLiked);
    });
  }
  
  // Обработчик удаления
  if (onDeleteClick) {
    deleteButton.addEventListener("click", () => {
      onDeleteClick(data._id, cardElement);
    });
  }
  
  // Обработчик открытия картинки
  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({ name: data.name, link: data.link }));
  }
  
  return cardElement;
};
