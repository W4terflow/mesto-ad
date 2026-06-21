// Объект с настройками валидации по умолчанию
const defaultConfig = {
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible'
};

// Показывает ошибку под полем ввода
export const showInputError = (formElement, inputElement, errorMessage, config) => {
  const errorElement = formElement.querySelector(`.${inputElement.id}-error`);
  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.classList.add(config.errorClass);
  }
  inputElement.classList.add(config.inputErrorClass);
};

// Скрывает ошибку под полем ввода
export const hideInputError = (formElement, inputElement, config) => {
  const errorElement = formElement.querySelector(`.${inputElement.id}-error`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove(config.errorClass);
  }
  inputElement.classList.remove(config.inputErrorClass);
};

// Проверяет валидность конкретного поля
export const checkInputValidity = (formElement, inputElement, config) => {
  const isValid = inputElement.validity.valid;
  
  // Дополнительная проверка для полей с именами и названиями
  if (inputElement.type === 'text' && 
      (inputElement.id === 'user-name' || 
       inputElement.id === 'place-name' || 
       inputElement.name === 'user-name' || 
       inputElement.name === 'place-name')) {
    
    const value = inputElement.value.trim();
    // Регулярное выражение: только латиница, кириллица, дефис и пробел
    const regex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
    
    if (value.length < 2) {
      showInputError(formElement, inputElement, 'Минимальная длина 2 символа', config);
      return false;
    }
    
    if (value.length > (inputElement.id === 'place-name' ? 30 : 40)) {
      const maxLength = inputElement.id === 'place-name' ? 30 : 40;
      showInputError(formElement, inputElement, `Максимальная длина ${maxLength} символов`, config);
      return false;
    }
    
    if (!regex.test(value)) {
      showInputError(formElement, inputElement, 'Разрешены только буквы, дефис и пробелы', config);
      return false;
    }
    
    if (isValid) {
      hideInputError(formElement, inputElement, config);
      return true;
    }
  }
  
  // Проверка для поля описания
  if (inputElement.id === 'user-description' || inputElement.name === 'user-description') {
    const value = inputElement.value.trim();
    
    if (value.length < 2) {
      showInputError(formElement, inputElement, 'Минимальная длина 2 символа', config);
      return false;
    }
    
    if (value.length > 200) {
      showInputError(formElement, inputElement, 'Максимальная длина 200 символов', config);
      return false;
    }
    
    if (isValid) {
      hideInputError(formElement, inputElement, config);
      return true;
    }
  }
  
  // Стандартная проверка для остальных полей
  if (!isValid) {
    // Если поле невалидно, показываем стандартное сообщение браузера
    const errorMessage = inputElement.validationMessage;
    showInputError(formElement, inputElement, errorMessage, config);
    return false;
  }
  
  hideInputError(formElement, inputElement, config);
  return true;
};

// Проверяет, есть ли хотя бы одно невалидное поле в форме
export const hasInvalidInput = (inputList) => {
  return inputList.some((inputElement) => {
    // Для полей с кастомной валидацией проверяем особо
    if (inputElement.id === 'user-name' || 
        inputElement.id === 'place-name' || 
        inputElement.id === 'user-description') {
      const value = inputElement.value.trim();
      const regex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
      
      if (inputElement.id === 'user-name') {
        return value.length < 2 || value.length > 40 || !regex.test(value);
      }
      
      if (inputElement.id === 'place-name') {
        return value.length < 2 || value.length > 30 || !regex.test(value);
      }
      
      if (inputElement.id === 'user-description') {
        return value.length < 2 || value.length > 200;
      }
    }
    
    // Для полей URL проверяем стандартную валидацию
    if (inputElement.type === 'url') {
      return !inputElement.validity.valid || inputElement.value.trim() === '';
    }
    
    return !inputElement.validity.valid;
  });
};

// Делает кнопку формы неактивной
export const disableSubmitButton = (buttonElement, config) => {
  buttonElement.classList.add(config.inactiveButtonClass);
  buttonElement.disabled = true;
};

// Делает кнопку формы активной
export const enableSubmitButton = (buttonElement, config) => {
  buttonElement.classList.remove(config.inactiveButtonClass);
  buttonElement.disabled = false;
};

// Переключает состояние кнопки в зависимости от валидности всех полей
export const toggleButtonState = (inputList, buttonElement, config) => {
  if (hasInvalidInput(inputList)) {
    disableSubmitButton(buttonElement, config);
  } else {
    enableSubmitButton(buttonElement, config);
  }
};

// Добавляет обработчики событий для всех полей формы
export const setEventListeners = (formElement, config) => {
  const inputList = Array.from(formElement.querySelectorAll(config.inputSelector));
  const buttonElement = formElement.querySelector(config.submitButtonSelector);
  
  // Сохраняем начальное состояние кнопки
  toggleButtonState(inputList, buttonElement, config);
  
  // Добавляем обработчики для каждого поля
  inputList.forEach((inputElement) => {
    inputElement.addEventListener('input', () => {
      checkInputValidity(formElement, inputElement, config);
      toggleButtonState(inputList, buttonElement, config);
    });
  });
};

// Очищает ошибки валидации формы и делает кнопку неактивной
export const clearValidation = (formElement, config) => {
  const inputList = Array.from(formElement.querySelectorAll(config.inputSelector));
  const buttonElement = formElement.querySelector(config.submitButtonSelector);
  
  inputList.forEach((inputElement) => {
    hideInputError(formElement, inputElement, config);
  });
  
  disableSubmitButton(buttonElement, config);
};

// Включает валидацию для всех форм на странице
export const enableValidation = (config = defaultConfig) => {
  const formList = Array.from(document.querySelectorAll('.popup__form'));
  
  formList.forEach((formElement) => {
    // Пропускаем форму удаления карточки (там только кнопка "Да")
    if (formElement.name === 'remove-card') {
      return;
    }
    
    formElement.addEventListener('submit', (evt) => {
      evt.preventDefault();
    });
    
    setEventListeners(formElement, config);
  });
};

// Экспорт по умолчанию
export default {
  enableValidation,
  clearValidation,
  showInputError,
  hideInputError,
  checkInputValidity,
  hasInvalidInput,
  disableSubmitButton,
  enableSubmitButton,
  toggleButtonState,
  setEventListeners
};
