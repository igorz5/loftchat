import { createElementEx, formatParticipants, truncateText } from "./utils";
import userBasePhoto from "./assets/user.png";
import { format } from "date-fns";

const WS_URL = process.env.WS_URL;

const chat = document.querySelector(".chat");
const login = document.querySelector(".login");
const loginNameInput = login.querySelector(".login__input");
const loginEnterBtn = login.querySelector(".login__enter-btn");
const loginInputs = login.querySelector(".login__inputs");
const loginError = login.querySelector(".login__error");
const loginLoader = login.querySelector(".lds-roller");
const chatUsersList = chat.querySelector(".chat-users-list");
const participants = chat.querySelector(".chat-header__participants");
const content = chat.querySelector(".chat-content");
const contentList = chat.querySelector(".chat-content-list");

const photoLoader = document.querySelector(".profile-photo-loader");
const closePhotoLoaderBtn = photoLoader.querySelector(".close-btn");
const photoLoaderFileInput = photoLoader.querySelector("#profile-photo-file");
const photoLoaderImage = photoLoader.querySelector(
  ".profile-photo-loader__image"
);
const photoLoaderName = photoLoader.querySelector(
  ".profile-photo-loader__name"
);

const photoPreview = document.querySelector(".profile-photo-preview");
const photoPreviewImage = document.querySelector(
  ".profile-photo-preview__image"
);
const photoPreviewCancelBtn = document.querySelector(
  ".profile-photo-preview__cancel-btn"
);
const photoPreviewSaveBtn = document.querySelector(
  ".profile-photo-preview__save-btn"
);

const messageInput = chat.querySelector(".chat-message-input");
const sendBtn = chat.querySelector(".chat-send-btn");

const handlers = {};
let users = {};
let username = "";
let localUser = null;
let lastMessageElem;
let lastMessageId;
let ws;

function init() {
  loginEnterBtn.addEventListener("click", () => {
    const name = loginNameInput.value;
    if (name.length === 0) return;

    loginInputs.style.display = "none";
    loginLoader.style.display = "block";
    loginError.textContent = "";

    connectToServer();
    registerHandlers();

    username = name;
  });

  const onSend = () => {
    const message = messageInput.value;
    if (message.length === 0) return;

    sendToServer("send_message", { message });

    messageInput.value = "";
  };

  sendBtn.addEventListener("click", onSend);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onSend();
    }
  });

  closePhotoLoaderBtn.addEventListener("click", () => {
    closePhotoLoader();
  });

  photoPreviewCancelBtn.addEventListener("click", () => {
    closePhotoPreview();
  });

  photoPreviewSaveBtn.addEventListener("click", () => {
    closePhotoPreview();

    sendToServer("update_profile_photo", { imgData: photoPreviewImage.src });
  });

  photoLoaderFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      closePhotoLoader();
      openPhotoPreview(reader.result);
    });

    reader.readAsDataURL(file);
  });
}

function registerHandlers() {
  addHandler("init", ({ id }) => {
    localUser = { id, name: username, profilePhoto: null };

    users[id] = localUser;
    sendToServer("auth", { name: username });
  });

  addHandler("auth", ({ usersData }) => {
    hideLogin();

    for (const id of Object.keys(usersData)) {
      if (id !== localUser.id) {
        users[id] = usersData[id];
      }
    }

    renderUsersList();
    updateParticipants();
  });

  addHandler("user_connect", ({ id, userData }) => {
    appendInfoMessage(`${userData.name} вошел в комнату`);

    if (id !== localUser.id) {
      users[id] = userData;

      renderUsersList();
      updateParticipants();
    }
  });

  addHandler("user_disconnect", ({ id }) => {
    const user = users[id];
    if (!user) return;

    appendInfoMessage(`${user.name} вышел из комнаты`);

    delete users[id];

    renderUsersList();
    updateParticipants();
  });

  addHandler("send_message", ({ id, message }) => {
    appendUserMessage(id, message);
    setUserLastMessage(id, message);
  });

  addHandler("update_profile_photo", ({ id, imgData }) => {
    updateUserProfilePhoto(id, imgData);
  });
}

function connectToServer() {
  ws = new WebSocket(WS_URL);

  ws.addEventListener("message", handleWSMessage);
  ws.addEventListener("close", onDisconnected);
  ws.addEventListener("error", onError);
}

function handleWSMessage(e) {
  let data;
  try {
    data = JSON.parse(e.data);
  } catch (error) {
    console.error(error, e.data);
  }

  if (data && data._type) {
    runHandler(data._type, data.data);
  }
}

function resetContent() {
  content.innerHTML = "";
}

function showLogin() {
  login.style.display = null;
  loginLoader.style.display = "none";
  loginInputs.style.display = null;

  resetContent();
  closePhotoLoader();
  closePhotoPreview();
}

function hideLogin() {
  login.style.display = "none";
}

function onDisconnected() {
  users = {};
  localUser = null;

  showLogin();
}

function onError() {
  showLogin();

  loginError.textContent = "Сбой соединения";
}

function renderUsersList() {
  chatUsersList.innerHTML = "";

  for (const id of Object.keys(users)) {
    const user = users[id];
    const item = createElementEx("li", "chat-users-list__item");
    const img = createElementEx("img", "chat-users-list__item-user-img");

    if (user.id === localUser.id) {
      const link = createElementEx("a", "chat-users-list__item-link");
      link.href = "#";

      link.addEventListener("click", (e) => {
        e.preventDefault();

        openPhotoLoader();
      });

      link.append(img);
      item.append(link);
    } else {
      item.append(img);
    }
    const right = createElementEx("div", "chat-users-list__item-right", item);
    const title = createElementEx("div", "chat-users-list__item-title", right);
    const message = createElementEx(
      "p",
      "chat-users-list__item-message",
      right
    );

    title.textContent = user.name;

    img.alt = "User photo";
    img.src = getUserProfilePhoto(id);

    if (user.lastMessage) {
      message.textContent = truncateText(user.lastMessage, 20, "...");
    }

    chatUsersList.append(item);
  }
}

function updateParticipants() {
  participants.textContent = formatParticipants(Object.keys(users).length);
}

function adjustContentScroll() {
  content.scrollTop = content.scrollHeight;
}

function appendUserMessage(id, message) {
  const item = createElementEx("li", "message__list-item");

  const text = createElementEx("p", "message__text", item);
  text.textContent = message;

  const time = createElementEx("div", "message__time", item);
  time.textContent = format(Date.now(), "KK:mm");

  let root = lastMessageElem;
  if (lastMessageId !== id || !lastMessageElem) {
    const contentItem = createElementEx("li", "chat-content-list__item");
    contentItem.dataset.id = id;

    if (id === localUser.id) {
      contentItem.classList.add("chat-content-list__item--align-right");
    }

    root = createElementEx("div", "message", contentItem);

    const inner = createElementEx("div", "message__inner", root);

    const block = createElementEx("div", "message__block", inner);
    const name = createElementEx("div", "message__name", block);
    name.textContent = getUsername(id);

    const img = createElementEx("img", "message__img", item);
    img.src = getUserProfilePhoto(id);
    img.alt = "User photo";

    const wrap = createElementEx("div", "message__wrap", block);

    createElementEx("ul", "message__list", wrap);

    lastMessageElem = root;

    contentList.append(contentItem);
  }

  const list = root.querySelector(".message__list");
  list.append(item);

  lastMessageId = id;
  adjustContentScroll();
}

function appendInfoMessage(message) {
  const contentItem = createElementEx("li", "chat-content-list__item");

  const messageElem = createElementEx("div", "message", contentItem);
  const text = createElementEx("p", "message__info-text", messageElem);
  text.textContent = message;

  contentList.append(contentItem);
  adjustContentScroll();
}

function openPhotoLoader() {
  photoLoader.classList.add("profile-photo-loader--active");
  photoLoaderName.textContent = localUser.name;

  if (localUser.profilePhoto) {
    photoLoaderImage.src = localUser.profilePhoto;
    photoLoaderImage.style.display = "block";
  }
}

function closePhotoLoader() {
  photoLoader.classList.remove("profile-photo-loader--active");
}

function openPhotoPreview(imgData) {
  photoPreview.classList.add("profile-photo-preview--active");

  photoPreviewImage.src = imgData;
}

function closePhotoPreview() {
  photoPreview.classList.remove("profile-photo-preview--active");
}

function getUsername(id) {
  const user = users[id];
  return user ? user.name : "Unknown";
}

function getUserProfilePhoto(id) {
  const user = users[id];
  if (!user) return userBasePhoto;

  return user.profilePhoto ? user.profilePhoto : userBasePhoto;
}

function updateUserProfilePhoto(id, imgData) {
  const user = users[id];
  if (!user) return userBasePhoto;

  user.profilePhoto = imgData;

  renderUsersList();
  updateChatContent();
}

function updateChatContent() {
  const items = contentList.querySelectorAll(".chat-content-list__item");
  items.forEach((item) => {
    if (!item.dataset.id) return;

    const user = users[item.dataset.id];
    if (!user) return;

    const messageImg = item.querySelector(".message__img");
    messageImg.src = getUserProfilePhoto(item.dataset.id);
  });
}

function setUserLastMessage(id, message) {
  const user = users[id];
  if (!user) return;

  user.lastMessage = message;

  renderUsersList();
}

function sendToServer(type, data) {
  if (!localUser || !localUser.id) {
    throw Error("Not logged in");
  }

  ws.send(JSON.stringify({ _type: type, _id: localUser.id, data }));
}

function addHandler(type, handler) {
  handlers[type] = handler;
}

function runHandler(type, data = {}) {
  const handler = handlers[type];
  if (!handler) return;

  handler(data);
}

export default { init };
