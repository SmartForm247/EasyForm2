// client.js  (Frontend - browser)
// Place this instead of secret-containing logic in app.js.
// It uses Paystack public key only and calls your backend to verify.

const paystackPublicKey = "pk_live_4126067326a4ff0fbdac73d10db5474b483a824d"; // public key ok in front-end
const backendBaseUrl = "https://<YOUR-RENDER-URL>.onrender.com"; // <- set this after you deploy backend

function startPayment(amount, email, paymentNumber) {
  if (!amount || isNaN(amount) || amount <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }

  const handler = PaystackPop.setup({
    key: paystackPublicKey,
    email: email || (firebase.auth().currentUser && firebase.auth().currentUser.email) || 'user@example.com',
    amount: Math.round(amount * 100),
    currency: 'GHS',
    ref: 'PSK' + Math.floor((Math.random() * 1000000000) + 1),
    callback: function(response) {
      console.log('Payment callback (frontend):', response);

      // Send reference to backend for verification & Firestore update
      verifyPaymentOnServer(response.reference, amount)
        .then(result => {
          if (result && result.status === 'success') {
            showNotification('Payment confirmed — credits added', 'success');
            // reload user data or call your existing function to refresh dashboard
            if (App && App.debug) { /* optional */ }
            // If you have loadUserData or similar, call it:
            if (typeof loadUserData === 'function') loadUserData();
          } else {
            showNotification('Payment verification failed on server', 'error');
          }
        })
        .catch(err => {
          console.error('Error verifying on server:', err);
          showNotification('Server error verifying payment', 'error');
        });
    },
    onClose: function() {
      console.log('Payment window closed.');
      showNotification('Payment cancelled', 'info');
    }
  });

  handler.openIframe();
}

async function verifyPaymentOnServer(reference, amount) {
  if (!backendBaseUrl || backendBaseUrl.includes('<YOUR-RENDER-URL>')) {
    console.error('backendBaseUrl is not set. Replace with your Render backend URL.');
    throw new Error('Backend URL not configured');
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }
  const body = {
    reference,
    amount,
    userId: user.uid
  };

  const res = await fetch(`${backendBaseUrl}/paystack/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

/* Minimal notification helper - if your app already has showNotification etc, keep using them */
function showNotification(message, type) {
  const el = document.getElementById('notification');
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.className = `notification ${type}`;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}
