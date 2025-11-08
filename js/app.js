// app.js

App.registerModule('App', function () {
  // --- Dependencies ---
  const Firebase = App.use('Firebase');
  if (!Firebase) {
    console.error("App module: Firebase dependency not found.");
    return null;
  }
  const { auth, db } = Firebase;

  // --- Private Module State ---
  let currentUser = null;
  let userListener = null;
  let topUpModal = null;

  // --- Private DOM Elements ---
  let authSection, dashboardSection, notification, loadingSpinner;

  // --- Private Configuration ---
  const paystackKey = "pk_live_4126067326a4ff0fbdac73d10db5474b483a824d";

  // --- Private Helper Functions ---
  function generateUniqueId(firstName, email) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPart = email.split('@')[0];
    const emailPrefix = emailPart.substring(0, 6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${cleanFirstName}${emailPrefix}${randomDigits}`;
  }

  function showSection(section) {
    authSection?.classList.remove('active');
    dashboardSection?.classList.remove('active');
    if (section === 'auth') {
      authSection?.classList.add('active');
    } else if (section === 'dashboard') {
      dashboardSection?.classList.add('active');
    }
  }

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
    if (show) {
      loadingSpinner.classList.add('active');
    } else {
      loadingSpinner.classList.remove('active');
    }
  }

  function logout() {
    showLoading(true);
    auth.signOut()
      .then(() => {
        showLoading(false);
        showNotification('Logged out successfully', 'success');
        showSection('auth');
      })
      .catch((error) => {
        showLoading(false);
        showNotification('Error logging out: ' + error.message, 'error');
      });
  }

  function handleTopUpClick() {
    if (!topUpModal) {
      const modalElement = document.getElementById('topUpModal');
      if (modalElement) {
        topUpModal = new bootstrap.Modal(modalElement);
      } else {
        console.error("Top-up modal element with id 'topUpModal' not found!");
        return;
      }
    }
    topUpModal.show();
  }

  function updateDashboard(userData) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = userData.firstName || userData.email.split('@')[0] || 'User';
    }
    const balanceElement = document.getElementById('creditBalance');
    if (balanceElement) {
      balanceElement.textContent = `${userData.credit_balance || 0} Creadits`;
    }
    const usageElement = document.getElementById('usageCount');
    if (usageElement) {
      usageElement.textContent = userData.usage_count || 0;
    }
    const totalUsage = userData.formUsage ?
      (userData.formUsage.llc || 0) + (userData.formUsage.sole || 0) + (userData.formUsage.ngo || 0) :
      (userData.usage_count || 0);
    const freeSubmissions = Math.max(0, 2 - totalUsage);
    const freeSubmissionsElement = document.getElementById('freeSubmissions');
    if (freeSubmissionsElement) {
      freeSubmissionsElement.textContent = freeSubmissions;
    }
    if (userData.formLinks) {
      const llcLinkElement = document.getElementById('LLCDataLink');
      if (llcLinkElement) llcLinkElement.value = userData.formLinks.llc || 'Generating link...';
      const soleLinkElement = document.getElementById('SoleDataLink');
      if (soleLinkElement) soleLinkElement.value = userData.formLinks.sole || 'Generating link...';
      const ngoLinkElement = document.getElementById('NGODataLink');
      if (ngoLinkElement) ngoLinkElement.value = userData.formLinks.ngo || 'Generating link...';
    } else if (userData.shareableLink) {
      const uniqueId = userData.uniqueId;
      const formLinks = {
        llc: userData.shareableLink,
        sole: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/sole-input-form.html?owner=${uniqueId}`,
        ngo: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/ngo-input-form.html?owner=${uniqueId}`
      };
      const formUsage = userData.formUsage || { llc: userData.usage_count || 0, sole: 0, ngo: 0 };
      db.collection('users').doc(currentUser.uid).update({ formLinks, formUsage })
        .then(() => { console.log('User document updated with new form structure'); loadUserData(); })
        .catch(error => { console.error('Error updating user document:', error); });
      const llcLinkElement = document.getElementById('LLCDataLink');
      if (llcLinkElement) llcLinkElement.value = userData.shareableLink;
      const soleLinkElement = document.getElementById('SoleDataLink');
      if (soleLinkElement) soleLinkElement.value = formLinks.sole;
      const ngoLinkElement = document.getElementById('NGODataLink');
      if (ngoLinkElement) ngoLinkElement.value = formLinks.ngo;
    }
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
      if (userData.transactions && userData.transactions.length > 0) {
        transactionsList.innerHTML = '';
        userData.transactions.slice(0, 5).forEach(transaction => {
          const transactionItem = document.createElement('div');
          transactionItem.className = 'transaction-item';
          const date = transaction.timestamp ?
            (transaction.timestamp.toDate ? new Date(transaction.timestamp.toDate()).toLocaleDateString() : new Date(transaction.timestamp).toLocaleDateString()) :
            'N/A';
          const type = transaction.type === 'credit' ? 'Credit' : 'Debit';
          const sign = transaction.type === 'credit' ? '+' : '-';
          transactionItem.innerHTML = `
            <div class="d-flex justify-content-between">
              <div>
                <div class="fw-bold">${type}</div>
                <div class="text-muted small">${date}</div>
              </div>
              <div class="fw-bold ${transaction.type === 'credit' ? 'text-success' : 'text-danger'}">
                ${sign}${transaction.amount} Credits
              </div>
            </div>
          `;
          transactionsList.appendChild(transactionItem);
        });
      } else {
        transactionsList.innerHTML = '<p class="text-muted">No transactions yet</p>';
      }
    }
  }

  function loadUserData() {
    if (!currentUser) return;
    console.log('Setting up real-time listener for user:', currentUser.uid);
    showLoading(true);
    const userDocRef = db.collection('users').doc(currentUser.uid);
    if (userListener) userListener();
    userListener = userDocRef.onSnapshot(
      (doc) => {
        showLoading(false);
        if (doc.exists) {
          console.log('User data updated in real-time:', doc.data());
          updateDashboard(doc.data());
        } else {
          console.log('User document not found, creating new one.');
          const email = currentUser.email;
          const firstName = email.split('@')[0];
          const uniqueId = generateUniqueId(firstName, email);
          const formLinks = {
            llc: `https://smartform247.github.io/EasyForm2/pages/llc-input-form.html?owner=${uniqueId}`,
            sole: `https://smartform247.github.io/EasyForm2/pages/sole-input-form.html?owner=${uniqueId}`,
            ngo: `https://smartform247.github.io/EasyForm2/pages/ngo-input-form.html?owner=${uniqueId}`
          };
          const userData = {
            email, firstName, uniqueId, formLinks,
            credit_balance: 0, usage_count: 0,
            formUsage: { llc: 0, sole: 0, ngo: 0 },
            transactions: [],
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          };
          console.log('Creating new user with data:', userData);
          updateDashboard(userData);
          userDocRef.set(userData)
            .then(() => { console.log('New user document created with links.'); updateDashboard(userData); })
            .catch((error) => { console.error('Error creating user document:', error); showNotification('Error creating user profile: ' + error.message, 'error'); });
        }
      },
      (error) => {
        showLoading(false);
        console.error('Real-time listener error:', error);
        showNotification('Error loading user data: ' + error.message, 'error');
      }
    );
  }

  function processPayment() {
    const amountInput = document.getElementById('customAmount').value.trim();
    const amount = Number(amountInput);
    const selectedPaymentMethod = document.querySelector('.payment-method.selected');
    const paymentNumber = document.getElementById('paymentNumber').value.trim();
    const email = document.getElementById('paymentEmail').value.trim() || 'user@example.com';

    if (!amount || isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    if (!selectedPaymentMethod) {
      showNotification('Please select a payment method', 'error');
      return;
    }
    if (!paymentNumber) {
      showNotification('Please enter your mobile money number', 'error');
      return;
    }
    const paymentMethod = selectedPaymentMethod.dataset.method;
    console.log('Processing payment:', { amount, paymentMethod, paymentNumber });

    const handler = PaystackPop.setup({
      key: paystackKey,
      email: email,
      amount: amount * 100,
      currency: 'GHS',
      ref: 'PSK' + Math.floor((Math.random() * 1000000000) + 1),
      callback: function (response) {
        console.log('✅ Payment callback received:', response);
        showLoading(true);
        const transaction = {
          type: 'credit', amount, method: 'Mobile Money',
          provider: paymentMethod, timestamp: new Date(), ref: response.reference
        };
        const userDocRef = db.collection('users').doc(currentUser.uid);
        userDocRef.get().then((doc) => {
          if (doc.exists) {
            console.log('User exists — updating credit balance...');
            return userDocRef.update({
              credit_balance: firebase.firestore.FieldValue.increment(amount),
              transactions: firebase.firestore.FieldValue.arrayUnion(transaction)
            });
          } else {
            console.log('Creating new user document...');
            return userDocRef.set({
              email: currentUser.email, credit_balance: amount, usage_count: 0,
              transactions: [transaction], created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        })
        .then(() => {
          console.log('✅ Firestore updated successfully.');
          showLoading(false);
          topUpModal.hide();
          showNotification('Payment successful! Credits added to your account.', 'success');
          document.getElementById('customAmount').value = '';
          document.getElementById('paymentNumber').value = '';
          document.getElementById('paymentEmail').value = '';
          document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
          document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        })
        .catch((error) => {
          console.error('🔥 Error updating Firestore:', error);
          showLoading(false);
          showNotification('Error updating account: ' + error.message, 'error');
        });
      },
      onClose: function () {
        console.log('Payment closed by user.');
        showNotification('Payment cancelled', 'info');
      }
    });
    handler.openIframe();
  }

  function debugUserData() {
    if (currentUser) {
      db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            console.log('User data from Firestore:', data);
            console.log('Form links:', data.formLinks);
            console.log('Form usage:', data.formUsage);
          } else {
            console.log('No user document found');
          }
        })
        .catch((error) => {
          console.error('Error getting user data:', error);
        });
    } else {
      console.log('No current user');
    }
  }

  // --- Public API ---
  return {
    init() {
      console.log("App module initializing...");
      authSection = document.getElementById('authSection');
      dashboardSection = document.getElementById('dashboardSection');
      notification = document.getElementById('notification');
      loadingSpinner = document.getElementById('loadingSpinner');

      auth.onAuthStateChanged(user => {
        if (user) {
          currentUser = user;
          loadUserData();
          showSection('dashboard');
        } else {
          showSection('auth');
        }
      });

      document.getElementById('logoutLink')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
      document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
      const topUpBtn = document.getElementById('topUpBtn');
      if (topUpBtn) {
        topUpBtn.addEventListener('click', handleTopUpClick);
      }
      document.getElementById('viewSubmissionsBtn')?.addEventListener('click', () => {
        window.location.href = 'EasyRegistrationForms/formsDashboard.html';
      });
      document.getElementById('copyLinkBtn1')?.addEventListener('click', () => {
        const shareableLink = document.getElementById('LLCDataLink').value;
        navigator.clipboard.writeText(shareableLink).then(() => showNotification('LLC link copied!', 'success')).catch(() => showNotification('Failed to copy', 'error'));
      });
      document.getElementById('copyLinkBtn2')?.addEventListener('click', () => {
        const shareableLink = document.getElementById('SoleDataLink').value;
        navigator.clipboard.writeText(shareableLink).then(() => showNotification('Sole Proprietorship link copied!', 'success')).catch(() => showNotification('Failed to copy', 'error'));
      });
      document.getElementById('copyLinkBtn3')?.addEventListener('click', () => {
        const shareableLink = document.getElementById('NGODataLink').value;
        navigator.clipboard.writeText(shareableLink).then(() => showNotification('NGO link copied!', 'success')).catch(() => showNotification('Failed to copy', 'error'));
      });
      document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('customAmount').value = btn.dataset.amount;
          document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
      document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
          document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
          method.classList.add('selected');
        });
      });
      document.getElementById('processPaymentBtn')?.addEventListener('click', processPayment);
    },
    debug: debugUserData,
    handleTopUpClick: handleTopUpClick
  };
});
// NOTE: The document.addEventListener('DOMContentLoaded', ...) block has been REMOVED.