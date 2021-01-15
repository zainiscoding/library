const libraryContainer = document.querySelector('#libraryContainer');
const newBookBtn = document.querySelector('#newBookBtn');
const newBookPopUp = document.querySelector('#newBookPopUp');
const newBookSubmitBtn = document.querySelector('#newBookSubmitBtn');
const book = document.querySelector('.book');
const readButton = document.querySelector('#readButton');

let libraryArr = [];

function populateLibrary() {
  if (firebase.auth().currentUser !== null) {
    console.log(
      firebase
        .firestore()
        .collection('users')
        .doc(getUserId())
        .collection('library')
    );
  }
}

// Loads books and listens for new ones.
function loadBooks(user) {
  if (user) {
    //Create the query to load the books and listen for new ones.
    const query = firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('library');

    //Start listening to the query.
    query.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          libraryArr.push(change.doc.data());
          console.log(libraryArr);
        });
        render();
      },
      (error) => {
        console.log('Error:' + error);
      }
    );
  }
}

//Get DOM elements
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');

function signIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
  firebase.auth().onAuthStateChanged(loadBooks);
}

// Returns the signed-in user's profile pic URL.
function getProfilePicUrl() {
  return (
    firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png'
  );
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

function getUserId() {
  return firebase.auth().currentUser.uid;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
    // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');
  } else {
    // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

function saveBookToFirebase(book) {
  // Add a new book entry to the database.
  return firebase
    .firestore()
    .collection('users')
    .doc(getUserId())
    .collection('library')
    .doc(book.title)
    .set(book)
    .catch(function (error) {
      console.error('Error writing new book to database', error);
    });

  // return firebase
  //   .firestore()
  //   .collection('users')
  //   .doc(getUserId())
  //   .collection('library')
  //   .add(book)
  //   .catch(function (error) {
  //     console.error('Error writing new book to database', error);
  //   });
}

function deleteBookFromFirebase(title) {
  return firebase
    .firestore()
    .collection('users')
    .doc(getUserId())
    .collection('library')
    .doc(title)
    .delete()
    .then(function () {
      console.log('Document successfully deleted!');
    })
    .catch(function (error) {
      console.error('Error removing document: ', error);
    });
}

//  Original code
// function Book(title, author, pages, read) {
//     (this.title = title),
//         (this.author = "\n" + author),
//         (this.pages = "\n" + pages + " pg"),
//         (this.read = "\n" + read);
// }

// Book.prototype.changeReadStatus = function () {
//     //Changes the book at the OBJ level in the array
//     if (this.read.includes("Read")) {
//         this.read = this.read.replace("Read", "Unread");
//     } else if (this.read.includes("Unread")) {
//         this.read = this.read.replace("Unread", "Read");
//     }
//     libraryArr.splice(this, 1, this);
// };

// Book.prototype.addBookToLibArr = function () {
//     libraryArr.push(this);
// };

//Class version
class Book {
  constructor(title, author, pages, read) {
    this.title = title;
    this.author = '\n' + author;
    this.pages = '\n' + pages;
    this.read = '\n' + read;
  }

  changeReadStatus() {
    //Changes the book at the OBJ level in the array
    if (this.read.includes('Read')) {
      this.read = this.read.replace('Read', 'Unread');
    } else if (this.read.includes('Unread')) {
      this.read = this.read.replace('Unread', 'Read');
    }
    libraryArr.splice(this, 1, this);
  }

  saveBook() {
    saveBookToFirebase({ ...this });
  }
}

function render() {
  const library = document.createElement('div');
  library.setAttribute('id', 'library');
  libraryArr.forEach(function (book) {
    console.log(book);
    const libraryBook = document.createElement('div');
    libraryBook.setAttribute('class', 'book');

    const libraryBookRemoveBtn = document.createElement('button');
    libraryBookRemoveBtn.addEventListener('click', (e) => {
      // libraryArr.splice(libraryArr.indexOf(book), 1);
      // libraryBook.remove();
      deleteBookFromFirebase(book.title);
    });
    libraryBookRemoveBtn.setAttribute('id', 'libraryBookRemoveBtn');
    libraryBookRemoveBtn.textContent = 'X';
    libraryBook.append(libraryBookRemoveBtn);

    libraryBook.append(Object.values(book).join(''));

    let readButton = document.createElement('button');
    readButton.setAttribute('name', 'read');
    readButton.setAttribute('class', 'readButton');
    readButton.textContent = 'Toggle read';
    libraryBook.append(readButton);

    readButton.addEventListener('click', (e) => {
      book.changeReadStatus();
      libraryBook.textContent = '';
      libraryBook.append(libraryBookRemoveBtn);
      libraryBook.append(Object.values(book).join(''));
      libraryBook.append(readButton);
    });
    library.append(libraryBook);
  });
  libraryContainer.append(library);
}

signInButtonElement.addEventListener('click', signIn);
signOutButtonElement.addEventListener('click', signOut);

newBookBtn.addEventListener('click', (e) => {
  newBookPopUp.setAttribute('class', 'newBookPopUp');
  if (newBookPopUp.hasChildNodes()) {
    return;
  } else {
    let popUpHideBtn = document.createElement('button');
    popUpHideBtn.setAttribute('id', 'popUpHideBtn');
    popUpHideBtn.textContent = 'X';
    popUpHideBtn.addEventListener('click', (e) => {
      newBookPopUp.setAttribute('class', 'newBookPopUpHidden');
    });
    newBookPopUp.append(popUpHideBtn);
    let titleFieldLabel = document.createElement('label');
    titleFieldLabel.setAttribute('for', 'title');
    titleFieldLabel.textContent = 'Title';
    let titleField = document.createElement('input');
    titleField.setAttribute('type', 'text');
    titleField.setAttribute('name', 'title');
    titleField.setAttribute('class', 'inputField');
    titleField.setAttribute('placeholder', 'Enter title');

    let authorFieldLabel = document.createElement('label');
    authorFieldLabel.setAttribute('for', 'author');
    authorFieldLabel.textContent = 'Author';

    let authorField = document.createElement('input');
    authorField.setAttribute('type', 'text');
    authorField.setAttribute('name', 'author');
    authorField.setAttribute('class', 'inputField');
    authorField.setAttribute('placeholder', 'Enter author');

    let pagesFieldLabel = document.createElement('label');
    pagesFieldLabel.setAttribute('for', 'pages');
    pagesFieldLabel.textContent = 'Pages';

    let pagesField = document.createElement('input');
    pagesField.setAttribute('type', 'text');
    pagesField.setAttribute('name', 'pages');
    pagesField.setAttribute('class', 'inputField');
    pagesField.setAttribute('placeholder', 'Enter total pages');

    let readFieldLabel = document.createElement('label');
    readFieldLabel.setAttribute('for', 'read');
    readFieldLabel.textContent = 'Read?';

    let readField = document.createElement('input');
    readField.setAttribute('type', 'checkbox');
    readField.setAttribute('name', 'read');
    readField.setAttribute('value', 'Unread');
    readField.setAttribute('id', 'readFieldCheckbox');

    readField.addEventListener('click', (e) => {
      readField.setAttribute('value', 'Read');
    });

    let newBookSubmit = document.createElement('button');
    newBookSubmit.setAttribute('id', 'newBookSubmitBtn');
    newBookSubmit.textContent = 'Add new book';

    newBookPopUp.append(titleFieldLabel);
    newBookPopUp.append(titleField);

    newBookPopUp.append(authorFieldLabel);
    newBookPopUp.append(authorField);

    newBookPopUp.append(pagesFieldLabel);
    newBookPopUp.append(pagesField);

    newBookPopUp.append(readFieldLabel);
    newBookPopUp.append(readField);

    newBookPopUp.append(newBookSubmit);

    newBookSubmit.addEventListener('click', (e) => {
      if (titleField.value == '') {
        titleField.setAttribute('class', 'inputFieldError');
      } else if (authorField.value == '') {
        titleField.setAttribute('class', 'inputField');
        pagesField.setAttribute('class', 'inputField');
        authorField.setAttribute('class', 'inputFieldError');
      } else if (pagesField.value == '') {
        titleField.setAttribute('class', 'inputField');
        authorField.setAttribute('class', 'inputField');
        pagesField.setAttribute('class', 'inputFieldError');
      } else {
        let newBook = new Book(
          titleField.value,
          authorField.value,
          pagesField.value,
          readField.value
        );
        console.log(pagesField.value);
        newBook.saveBook();
        newBookPopUp.querySelectorAll('*').forEach((n) => n.remove());
        newBookPopUp.setAttribute('class', 'newBookPopUpHidden');
        library.remove();
      }
    });
  }
});

// initialize Firebase
initFirebaseAuth();

loadBooks();
