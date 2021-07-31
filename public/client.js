console.log('Client code loaded')

const HOST = location.origin.replace(/^http/, 'ws')
let socket;

let mainContainer;
let containerStart;
let containerLogin;
let containerBody;
let header;
let headerTagline;
let footer;

let username;
let roomName;
let joinData = {
  roomTextInput: undefined,
  usernameTextInput: undefined,
  confirmButton: undefined
}
let roomNameDisplay;
let createRoomButton, joinFriendRoomButton;

let startButton, restartButton;

let activeUsernamesContainer;
let activeUsernamesListContainer;

let gameRoundContainer;
let startingRoundContainer;
let resultsContainer;
let resultsSentenceContainer;
let randomLetterSlot;
let randomLetterSlotBig;
// let randomLetterSlotInStartingRound;
let timerSlot;
let categoriesContainer;
let currentCategoryContainer;
let categoryAnswerSlotInSentence;
let categoryAnswerSlotInSentencePre;
let categoryAnswerSlotInSentencePos;
let categoryTextInput;
let confirmCategoryButton;
let currentCategoryIndex;
let categoriesList;
let waitingEndFeedbackMessage;

let timer;

let chat = {
  container: undefined,
  messageInput: undefined,
  sendButton: undefined,
  messagesContainer: undefined
};

let suggestions = {
  container: undefined,
  textInput: undefined,
  confirmButton: undefined,
  feedbackMessage: undefined
}

let warningContainer;
let warningMessageSlot;

function setup() {
  noCanvas();

  initializeHtmlElements();
  initializeRandomUsername();
  initializeRoomName();

  currentCategoryIndex = 0;
  categoriesList = [];

  changeVisibility(mainContainer, true);
}

function initializeHtmlElements() {
  mainContainer = select('#main-container');
  containerStart = select('#container-start')
  containerLogin = select('#container-login');
  containerBody = select('#container-body');
  headerTagline = select('#tagline');
  header = select('#header');
  footer = select('#footer');

  joinData.roomTextInput = select('#room-input').input(validateRoomOnInput);
  joinData.usernameTextInput = select('#username-input').input(validateUsernameOnInput);
  joinData.confirmButton = select('#join-button').elt.addEventListener('click', requestToJoinRoom);
  handleEnterKey(joinData.roomTextInput, ()=>{
    joinData.usernameTextInput.elt.focus();
  });
  handleEnterKey(joinData.usernameTextInput, requestToJoinRoom);
  roomNameDisplay = select('#room-name');

  createRoomButton = select('#create-room-button').elt.addEventListener('click', goToCreateRoomScreen); //mousePressed(goToCreateRoomScreen);
  joinFriendRoomButton = select('#join-friend-room-button').elt.addEventListener('click', goToJoinRoomScreen);

  startButton = select('#start-button');
  startButton.elt.addEventListener('click', requestToStartRound);
  restartButton = select('#restart-button');
  restartButton.elt.addEventListener('click', requestToStartRound);

  activeUsernamesContainer = select('#usernames-list-container');
  activeUsernamesListContainer = select('#usernames-list');

  gameRoundContainer = select('#game-round-container');
  startingRoundContainer = select('#starting-round');
  resultsContainer = select('#results-container');
  resultsSentenceContainer = select('#results-sentence-container');
  randomLetterSlot = select('#random-letter');
  randomLetterSlotBig = select('#letter-big');
  // randomLetterSlotInStartingRound = select('#letter-in-instructions');
  timerSlot = select('#timer');
  categoriesContainer = select('#categories-container');
  currentCategoryContainer = select('#current-category');
  categoryAnswerSlotInSentence = select('#answer-slot-in-sentence');
  categoryAnswerSlotInSentencePre = select('#answer-slot-in-sentence-pre');
  categoryAnswerSlotInSentencePos = select('#answer-slot-in-sentence-pos');
  categoryTextInput = select('#category-input').input(updateAnswerOnInput);
  confirmCategoryButton = select('#confirm-category').elt.addEventListener('click', confirmCategory);
  handleEnterKey(categoryTextInput, confirmCategory);
  waitingEndFeedbackMessage = select('#waiting-end');

  chat.container = select('#chat-container');
  chat.messageInput = select('#chat-message-input');
  chat.sendButton = select('#send-message-button').elt.addEventListener('click', handleSendMessageButtonClicked);
  handleEnterKey(chat.messageInput, handleSendMessageButtonClicked);
  chat.messagesContainer = select('#messages-container');

  suggestions.container = select('#suggestions-container');
  suggestions.textInput = select('#suggestion-input');
  suggestions.confirmButton = select('#confirm-suggestion').elt.addEventListener('click', sendSuggestion);
  handleEnterKey(suggestions.textInput, sendSuggestion);
  suggestions.feedbackMessage = select('#confirmed-suggestion');

  warningContainer = select('#warnings').addClass('hidden');
  warningMessageSlot = select('#warning-message');
}

function goToCreateRoomScreen() {
  changeScreenStateTo('JOIN_ROOM_SCREEN');
  setTimeout(()=> {
    joinData.roomTextInput.elt.focus();
  }, 1);
}

function goToJoinRoomScreen() {
  changeScreenStateTo('JOIN_ROOM_SCREEN');
  joinData.roomTextInput.value('');
  setTimeout(()=> {
    joinData.roomTextInput.elt.focus();
  }, 1);
}

function initializeRoomName() {
  if(location.hash != '') {
    updateRoomNameFromURLHash();
    changeScreenStateTo('JOIN_ROOM_SCREEN');
    joinData.usernameTextInput.elt.focus();
  } else {
    let randomRoomName = 'room' + nf(floor(random(0,10000)),4,0);
    joinData.roomTextInput.value(randomRoomName);
    changeScreenStateTo('START_SCREEN');
    joinData.roomTextInput.elt.focus();
  }
}

function updateRoomNameFromURLHash() {
  let initialRoomName = location.hash.substring(1);
  joinData.roomTextInput.value(initialRoomName);
}
window.onhashchange = updateRoomNameFromURLHash;

function validateRoomOnInput() {
  let filteredRoom = joinData.roomTextInput.value().replace(/[^a-zA-Z0-9_]/ig, '');
  joinData.roomTextInput.value(filteredRoom);
}

function initializeRandomUsername() {
  username = 'usuario' + nf(floor(random(0,1000000)),6,0);
  joinData.usernameTextInput.value(username);
}

function validateUsernameOnInput() {
  let filteredUsername = joinData.usernameTextInput.value().replace(/[^a-zÀ-ÿ0-9_. ]/ig, '');
  joinData.usernameTextInput.value(filteredUsername);
}

function requestToJoinRoom() {
  if(joinData.roomTextInput.value() == '') { return; }
  roomName = joinData.roomTextInput.value().toLowerCase();
  if(joinData.usernameTextInput.value() == '') { return; }
  username = joinData.usernameTextInput.value();
  setupSocket();
}

function setupSocket() {
  socket = io.connect(HOST);
  console.log('Requesting connection to server...');
  socket.on('newSocketConnection', handleNewSocketConnection);
  socket.on('joinedRoom', handleJoinedRoom);
  socket.on('gameStarted', handleGameStarted);
  socket.on('votesUpdated', handleVotesUpdated);
  socket.on('activeUsersListUpdated', handleActiveUsersListUpdated);
  socket.on('tickSecond', handleTickSecond);
  socket.on('roundFinished', handleRoundFinished);
  socket.on('chatMessageSent', handleChatMessageReceived);
  socket.on('disconnect', handleDisconnection);
}

function handleNewSocketConnection(data) {
  console.log('Connected to server');
  console.log('Requesting to join room ' + roomName + ' as ' + username + '...');
  let requestToJoinRoomData = {
    roomName: roomName,
    username: username
  }
  socket.emit('requestToJoinRoom', requestToJoinRoomData);
}

function handleJoinedRoom(receivedData) {
  let joinedRoomData = receivedData;

  let gameState = joinedRoomData.gameState;
  if(gameState.state == 'waiting') {
    changeScreenStateTo('LOBBY');
  }
  if (gameState.state == 'playing') {
    handleGameStarted(gameState.roundInfo);
  }
  if (gameState.state == 'results') {
    changeScreenStateTo('RESULTS');
  }

  let roomNameFiltered = filteredText(joinedRoomData.roomName);
  roomNameDisplay.html(roomNameFiltered);
  history.pushState(null, null, '#'+roomNameFiltered);
  console.log('Joined room ' + roomNameFiltered + ' as ' + joinedRoomData.username);
}

function handleActiveUsersListUpdated(data) {
  activeUsernamesListContainer.html('');

  let sortedUserList = data.sort(function(a, b) {
    return b.score - a.score;
  });

  for(let i = 0; i < sortedUserList.length; i++) {
    let text;
    if(sortedUserList[i].score > 0) {
      text = sortedUserList[i].username + ' ✔'+sortedUserList[i].score;
    } else {
      text = sortedUserList[i].username;
    }
    createElement('li', text).addClass('w3-padding-small').parent(activeUsernamesListContainer);
  }
}


function requestToStartRound() {
  socket.emit('requestNewRound');
}

function initializeTimer(initialTime) {
  timer = initialTime;
  //updateTimer();
}
function handleTickSecond(data) {
  timer = data.timeCurrentValue;
  timerSlot.html(timer);
}
/*
function updateTimer() {
  if(timer > 0) {
    timerSlot.html(timer);
    timer = timer - 1;
    setTimeout(updateTimer, 1000);
  } else {
    timerSlot.html('_');
    console.log('Timer expired!');
  }
}
*/

function handleGameStarted(receivedData) {
  let roundInfo = receivedData;
  updateCurrentLetter(roundInfo.randomLetter);

  categoriesList = [];
  for(let i = 0; i < roundInfo.categories.length; i++) {
    categoriesList.push({
      categoryString: roundInfo.categories[i].categoryString,
      confirmed: false,
      indexOnServer: i
    });
  }
  updateCurrentCategoryDisplayed(0);

  initializeTimer(roundInfo.totalTime);

  changeScreenStateTo('STARTING_GAME');
  setTimeout(()=>{
    changeScreenStateTo('GAME_PLAYING');
  }, 5000);
}

function playSelectingRandomLetterAnimation(targetLetter) {
  let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let targetLetterIndex = alphabet.indexOf(targetLetter);
  if(targetLetterIndex < 0) {
    //Error
    return;
  }
  let currentIndex = ((targetLetterIndex - 10) + alphabet.length) % alphabet.length;
  randomLetterSlotBig.html(alphabet[currentIndex]);
  let animationInterval = setInterval(()=>{
    currentIndex = (currentIndex + 1) % alphabet.length;
    randomLetterSlotBig.html(alphabet[currentIndex]);
    if(currentIndex == targetLetterIndex) {
      clearInterval(animationInterval);
    }
  }, 100);
}

function updateCurrentLetter(letter) {
  randomLetterSlot.html(letter);
  // randomLetterSlotInStartingRound.html(letter);
  playSelectingRandomLetterAnimation(letter);
}

function updateCurrentCategoryDisplayed(index) {
  currentCategoryIndex = index;

  let sentenceSplited = String(categoriesList[currentCategoryIndex].categoryString).split('___');
  if(sentenceSplited.length == 1) {
    sentenceSplited[0] = sentenceSplited[0] + '<br/>';
    categoryAnswerSlotInSentencePre.html(sentenceSplited[0]);
    categoryAnswerSlotInSentencePos.html('');
  } else if (sentenceSplited.length > 1) {
    categoryAnswerSlotInSentencePre.html(sentenceSplited[0]);
    categoryAnswerSlotInSentencePos.html(sentenceSplited[1]);
  } else {
    //Error
    categoryAnswerSlotInSentencePre.html('');
    categoryAnswerSlotInSentencePos.html('');
  }
  categoryAnswerSlotInSentence.html('_____');
  categoryTextInput.value('');

  // playCssAnimation(currentCategoryContainer, 'animate-intro-question');
}
function clearCurrentCategoryDisplayed() {
  currentCategoryIndex = 0;
  categoryAnswerSlotInSentencePre.html('');
  categoryAnswerSlotInSentencePos.html('');
  categoryAnswerSlotInSentence.html('');
}

function Answer(questionIndex, question, answerString) {
  this.questionIndex = questionIndex;
  this.question = question;
  this.answerString = answerString;
}

function updateAnswerOnInput() {
  let answer = filteredText(categoryTextInput.value());

  if(answer == '') {
    categoryAnswerSlotInSentence.html('_____');
  } else {
    categoryAnswerSlotInSentence.html(answer);
  }
}

function confirmCategory() {
  if(categoryTextInput.value() != '') {
    let answer = new Answer(categoriesList[currentCategoryIndex].indexOnServer, categoriesList[currentCategoryIndex].categoryString, categoryTextInput.value());
    categoriesList[currentCategoryIndex].confirmed = true;
    socket.emit('sendAnswer', answer);
  }
  let allCategoriesConfirmed = true;
  currentCategoryIndex = currentCategoryIndex + 1;
  for(let offsetFromCurrentIndex = 0; offsetFromCurrentIndex < categoriesList.length; offsetFromCurrentIndex++) {
    let tempIndex = (currentCategoryIndex + offsetFromCurrentIndex) % categoriesList.length;
    if(!categoriesList[tempIndex].confirmed) {
      allCategoriesConfirmed = false;
      updateCurrentCategoryDisplayed(tempIndex);
      break;
    }
  }
  setTimeout(()=>{
    categoryTextInput.elt.focus();
  }, 1);
  if(allCategoriesConfirmed) {
    //Finished
    clearCurrentCategoryDisplayed();
    categoryTextInput.value('');
    changeVisibility(categoriesContainer, false);
    changeVisibility(waitingEndFeedbackMessage, true);
  }
}

function handleRoundFinished(receivedData) {
  let categories = receivedData;
  presentAllAnswers(categories);
  changeScreenStateTo('RESULTS');
}

function presentAllAnswers(categories) {
  console.log(categories);
  resultsSentenceContainer.html('');
  createElement('hr').parent(resultsSentenceContainer);
  for(let tempCategoryIndex = 0; tempCategoryIndex < categories.length; tempCategoryIndex++) {
    answersUser = Object.keys(categories[tempCategoryIndex].answers);
    if(answersUser.length > 0) { //If received answer from at least 1 user
      for(let i = 0; i < answersUser.length; i++) {
        createFormatedAnswerInParent(
          categories[tempCategoryIndex].categoryString,
          categories[tempCategoryIndex].answers[answersUser[i]].answerString,
          tempCategoryIndex,
          answersUser[i],
          categories[tempCategoryIndex].answers[answersUser[i]].votes,
          resultsSentenceContainer
        );
      }
      createElement('hr').parent(resultsSentenceContainer);
    }
  }
}

function createFormatedAnswerInParent(sentence, answer, categoryIndex, answerUser, votes, targetParent) {
  //Button
  let sentenceButton = createButton('').addClass('w3-btn').addClass('container-button').parent(targetParent);
  sentenceButton.elt.addEventListener('click', ()=>{
    voteFor(categoryIndex, answerUser);
  });

  //Content
  let pContainer = createP('').addClass('category').parent(sentenceButton);
  let sentenceSplited = String(sentence).split('___');
  if(sentenceSplited.length == 1) {
    createSpan(sentenceSplited[0] + '<br/>').parent(pContainer);
    createSpan(answer).addClass('w3-black').addClass('category-answer').parent(pContainer);
  } else if (sentenceSplited.length > 1) {
    createSpan(sentenceSplited[0]).parent(pContainer);
    createSpan(answer).addClass('w3-black').addClass('category-answer').parent(pContainer);
    createSpan(sentenceSplited[1]).parent(pContainer);
  } else {
    //Error
  }

  //Votes
  if(votes.length > 0) {
    let answersContainer = createDiv('').parent(targetParent);
    for(let i = 0; i < votes.length; i++) {
      // createDiv('★ '+votes[i]).addClass('vote-from').addClass('w3-card').addClass('w3-light-grey').addClass('w3-tiny').parent(answersContainer);
      createDiv('✔').addClass('vote-from').parent(answersContainer);
    }
    // createDiv('✔ '+votes.length).addClass('vote-from').addClass('w3-card').addClass('w3-light-grey').addClass('w3-small').parent(answersContainer);
  }
}

function voteFor(categoryIndex, answerUser) {
  let vote = {
    votingUser: username,
    categoryIndex: categoryIndex,
    votedUser: answerUser
  }
  // if(answerUser == username) {
  //   return;
  // }
  socket.emit('sendVote', vote);
}

function handleVotesUpdated(data) {
  presentAllAnswers(data);
}

function handleSendMessageButtonClicked() {
  if(chat.messageInput.value() == '') {
    return;
  }
  let text = chat.messageInput.value();
  console.log("Sent: " + text);
  socket.emit('chatMessageSent', text);
  chat.messageInput.value('');
}

function handleChatMessageReceived(receivedData) {
  let messageData = receivedData;
  messageData.username = filteredText(messageData.username);
  messageData.text = filteredText(messageData.text);

  console.log('Received from ' + messageData.username + ': ' + messageData.text);
  let displayedMessage = messageData.username + ': ' + '<strong>' + messageData.text + '</strong>';
  createP(displayedMessage).parent(chat.messagesContainer);
  chat.messagesContainer.elt.scrollTo(0,9999999999);
}

function sendSuggestion() {
  if(suggestions.textInput.value() == '') {
    return;
  }
  let data = suggestions.textInput.value();
  console.log("Suggestion:" + data);
  socket.emit('suggestionSent', data);
  suggestions.textInput.value('');
  changeVisibility(suggestions.feedbackMessage, true);
  setTimeout(()=>{
    changeVisibility(suggestions.feedbackMessage, false);
  }, 1000);
}

function handleDisconnection(data) {
  socket.disconnect();
  displayWarning("Você foi desconectado: " + data);
  changeScreenStateTo('JOIN_ROOM_SCREEN');
}

function displayWarning(warningMessage) {
  warningMessageSlot.html(warningMessage);
  changeVisibility(warningContainer, true);
  setTimeout(function() {
    changeVisibility(warningContainer, false);
  }, 3000);
}

///////////////////////////
//Screen states
function getAllElements() {
  return [
    header,
    headerTagline,
    footer,
    containerStart,
    containerLogin,
    containerBody,
    startButton,
    restartButton,
    gameRoundContainer,
    categoriesContainer,
    waitingEndFeedbackMessage,
    resultsContainer,
    chat.container,
    suggestions.container,
    startingRoundContainer,
    activeUsernamesContainer
  ];
}

function changeScreenStateTo(newState) {
  if(newState == 'START_SCREEN') {
    activateOnlyActiveElements([header, headerTagline, footer, containerStart]);
  }
  if(newState == 'JOIN_ROOM_SCREEN') {
    joinData.usernameTextInput.value(username);
    activateOnlyActiveElements([header, headerTagline, footer, containerLogin]);
  }
  if(newState == 'LOBBY') {
    activateOnlyActiveElements([header, headerTagline, footer, containerBody, startButton, chat.container, suggestions.container, activeUsernamesContainer]);
  }
  if(newState == 'STARTING_GAME') {
    activateOnlyActiveElements([startingRoundContainer, containerBody, activeUsernamesContainer]);
  }
  if(newState == 'GAME_PLAYING') {
    activateOnlyActiveElements([gameRoundContainer, categoriesContainer, containerBody, activeUsernamesContainer]);
  }
  if(newState == 'RESULTS') {
    activateOnlyActiveElements([header, footer, containerBody, restartButton, resultsContainer, chat.container, suggestions.container, activeUsernamesContainer]);
  }
}

function activateOnlyActiveElements(activeElements) {
  let allElements = getAllElements();
  for(let i = 0; i < allElements.length; i++) {
    let shouldBeVisible = activeElements.includes(allElements[i]);
    changeVisibility(allElements[i], shouldBeVisible);
  }
}

///////////////////////////
//Utils
function changeVisibility(element, visible) {
  if(!element) {
    console.error('Element invalid in changeVisibility function:', element, visible);
    return;
  }
  let prevVisible = !element.hasClass('hidden');
  if(prevVisible == visible) {
    return;
  }

  if(visible) {
    element.removeClass('hidden');
    element.addClass('animate-show');
  } else {
    element.addClass('hidden');
    element.removeClass('animate-show');
  }
}

function handleEnterKey(textInput, f) {
  textInput.elt.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) { // Number 13 is the "Enter" key on the keyboard
      event.preventDefault(); // Cancel the default action, if needed
      f();
    }
  });
}


function filteredText(text) {
  return String(text).replace(/\<.*?\>/, '');
}
