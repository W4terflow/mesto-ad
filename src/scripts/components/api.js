const isDev = import.meta.env.DEV;

// Получаем токен и базовый URL
const baseUrl = isDev ? '/api' : import.meta.env.VITE_API_BASE_URL;
const token = import.meta.env.VITE_API_TOKEN;

const config = {
  baseUrl: baseUrl,
  headers: {
    authorization: token,
    "Content-Type": "application/json",
  },
};

const getResponseData = (res) => {
  if (!res.ok) {
    console.error('Ошибка ответа:', res.status, res.statusText);
    return Promise.reject(`Ошибка: ${res.status}`);
  }
  
  // Добавляем таймаут 10 секунд
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: ответ не получен за 10 секунд')), 10000);
  });
  
  return Promise.race([
    res.text(),
    timeoutPromise
  ])
    .then(text => {
      if (!text || text.trim() === '') {
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        console.error('[getResponseData] Ошибка парсинга JSON:', e);
        console.error('[getResponseData] Текст:', text);
        return [];
      }
    })
    .catch(err => {
      console.error('[getResponseData] Ошибка чтения:', err);
      return [];
    });
};

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЕМ ==========

export const getUserInfo = () => {
  return fetch(`${config.baseUrl}/users/me`, {
    headers: config.headers,
  }).then(getResponseData);
};

export const setUserInfo = ({ name, about }) => {
  return fetch(`${config.baseUrl}/users/me`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ name, about }),
  }).then(getResponseData);
};

export const updateAvatar = ({ avatar }) => {
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ avatar }),
  }).then(getResponseData);
};

// ========== РАБОТА С КАРТОЧКАМИ ==========

export const getCardList = () => {
  // Создаем AbortController для управления запросом
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[getCardList] Таймаут запроса');
    controller.abort();
  }, 10000); // 10 секунд таймаут
  
  return fetch(`${config.baseUrl}/cards`, {
    headers: config.headers,
    signal: controller.signal
  })
    .then(res => {
      clearTimeout(timeoutId);
      return res.json();
    })
    .then(data => {
      return Array.isArray(data) ? data : [];
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('[getCardList] Запрос прерван по таймауту');
      } else {
        console.error('[getCardList] Ошибка:', err);
      }
      return [];
    });
};

export const addCard = ({ name, link }) => {
  return fetch(`${config.baseUrl}/cards`, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({ name, link }),
  }).then(getResponseData);
};

export const deleteCard = (cardId) => {
  return fetch(`${config.baseUrl}/cards/${cardId}`, {
    method: "DELETE",
    headers: config.headers,
  }).then(getResponseData);
};

// ========== РАБОТА С ЛАЙКАМИ ==========

export const changeLikeCardStatus = (cardId, isLiked) => {
  const method = isLiked ? "DELETE" : "PUT";
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: method,
    headers: config.headers,
  }).then(getResponseData);
};

// ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

export const isCardOwner = (card, userId) => {
  return card.owner._id === userId;
};

export const isCardLikedByUser = (card, userId) => {
  return card.likes.some(like => like._id === userId);
};

export const getLikesCount = (card) => {
  return card.likes.length;
};

export default {
  getUserInfo,
  setUserInfo,
  updateAvatar,
  getCardList,
  addCard,
  deleteCard,
  changeLikeCardStatus,
  isCardOwner,
  isCardLikedByUser,
  getLikesCount,
};
