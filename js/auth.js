// auth.js

App.registerModule('Auth', function () {
  // --- Dependencies ---
  const Firebase = App.use('Firebase');
  if (!Firebase) {
    console.error("Auth module: Firebase dependency not found.");
    return null;
  }
  const { auth, db } = Firebase;

  // --- Private DOM Elements ---
  let loginForm, signupForm, notification, loadingSpinner;

  // --- Private Helper Functions ---
  function showNotification(message, type) {
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }

  function showLoading(show) {
    if (!loadingSpinner) return;
    loadingSpinner.style.display = show ? 'flex' : 'none';
  }

  function generateUniqueId(firstName, email) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPart = email.split('@')[0];
    const emailPrefix = emailPart.substring(0, 6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${cleanFirstName}${emailPrefix}${randomDigits}`;
  }

  function login() {
    const email = document.getElementById('loginEmail').value;
    const phone = document.getElementById('loginPhone').value;
    
    if (!email || !phone) {
      showNotification('Please enter both email and phone number', 'error');
      return;
    }

    showLoading(true);
    
    auth.signInWithEmailAndPassword(email, phone)
      .then(() => {
        showLoading(false);
        window.location.href = '../index.html';
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          db.collection('users').where('email', '==', email).where('phone', '==', phone).get()
            .then((querySnapshot) => {
              if (querySnapshot.empty) {
                showLoading(false);
                showNotification('Invalid email or phone number', 'error');
                return;
              }
              auth.createUserWithEmailAndPassword(email, phone)
                .then(() => {
                  showLoading(false);
                  window.location.href = '../index.html';
                })
                .catch((createError) => {
                  showLoading(false);
                  showNotification(createError.message, 'error');
                });
            })
            .catch((checkError) => {
              showLoading(false);
              showNotification('Network error. Please try again.', 'error');
            });
        } else {
          showLoading(false);
          showNotification(error.message, 'error');
        }
      });
  }

  function signup() {
    const firstName = document.getElementById('firstName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const confirmPhone = document.getElementById('confirmPhone').value;
    
    if (!firstName || !email || !phone || !confirmPhone) {
      showNotification('Please fill all fields', 'error');
      return;
    }
    
    if (phone !== confirmPhone) {
      showNotification('Phone numbers do not match', 'error');
      return;
    }
    
    showLoading(true);
    
    auth.createUserWithEmailAndPassword(email, phone)
      .then((userCredential) => {
        const user = userCredential.user;
        const uniqueId = generateUniqueId(firstName, email);
        const formLinks = {
          llc: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/llc-input-form.html?owner=${uniqueId}`,
          sole: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/sole-input-form.html?owner=${uniqueId}`,
          ngo: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/ngo-input-form.html?owner=${uniqueId}`
        };
        const userData = {
          firstName, email, phone, uniqueId, formLinks,
          credit_balance: 0, usage_count: 0,
          formUsage: { llc: 0, sole: 0, ngo: 0 },
          transactions: [],
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        db.collection('users').doc(user.uid).set(userData)
          .then(() => {
            showLoading(false);
            showNotification('Account created successfully!', 'success');
            setTimeout(() => { window.location.href = '../index.html'; }, 1500);
          })
          .catch((error) => {
            console.error('Error creating user document:', error);
            showLoading(false);
            showNotification(error.message, 'error');
          });
      })
      .catch((error) => {
        console.error('Error creating user account:', error);
        showLoading(false);
        showNotification(error.message, 'error');
      });
  }

  // --- Public API ---
  return {
    init() {
      console.log("Auth module initialized.");

      // Cache DOM elements
      loginForm = document.getElementById('loginForm');
      signupForm = document.getElementById('signupForm');
      notification = document.getElementById('notification');
      loadingSpinner = document.getElementById('loadingSpinner');

      // Check if user is already logged in
      showLoading(true);
      auth.onAuthStateChanged(user => {
        if (user) {
          window.location.href = '../index.html';
        } else {
          showLoading(false);
        }
      });

      // Auth Navigation
      document.getElementById('showSignupLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';
      });

      document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (signupForm) signupForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
      });

      // Login and Signup buttons
      document.getElementById('loginBtn')?.addEventListener('click', login);
      document.getElementById('signupBtn')?.addEventListener('click', signup);
    }
  };
});

