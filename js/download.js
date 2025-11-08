// download.js

App.registerModule('Download', function () {
  // --- Dependencies ---
  const Firebase = App.use('Firebase');
  if (!Firebase) {
    console.error("Download module: Firebase dependency not found.");
    return null;
  }
  const { auth, db } = Firebase;

  // --- Private Helper Functions ---
  async function setupDownload(buttonId, cost, description) {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.warn(`Download button with id "${buttonId}" not found.`);
      return;
    }

    button.addEventListener("click", async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("Please log in before downloading.");
          window.location.href = "authenticate.html";
          return;
        }

        const userRef = db.collection("users").doc(user.uid);
        const docSnap = await userRef.get();

        if (!docSnap.exists) {
          alert("User record not found.");
          return;
        }

        const userData = docSnap.data();
        const freeDownloads = Math.max(0, 2 - (userData.download_count || 0));

        if (freeDownloads === 0 && (userData.credit_balance || 0) < cost) {
          alert("Insufficient balance. Please top up your account.");
          return;
        }

        // --- UI Preparation for PDF ---
        const element = document.body;
        const buttonContainer = document.querySelector(".button-container");
        const sect1 = document.getElementById("sect1");
        const sect2 = document.querySelector(".sect2");
        const sect2OriginalDisplay = sect2 ? sect2.style.display : null;

        if (buttonContainer) buttonContainer.style.display = "none";
        if (sect1) sect1.style.display = "none";
        if (sect2) sect2.style.display = "block";
        window.scrollTo(0, 0);

        await new Promise(resolve => setTimeout(resolve, 300));

        // --- PDF Generation ---
        const options = {
          margin: 0,
          filename: `${description.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
          throw new Error("html2pdf library is not loaded.");
        }

        await html2pdf().set(options).from(element).save();

        // --- Restore UI ---
        if (buttonContainer) buttonContainer.style.display = "block";
        if (sect1) sect1.style.display = "block";
        if (sect2) sect2.style.display = sect2OriginalDisplay;

        // --- Update User Data in Firestore ---
        const updates = {
          download_count: firebase.firestore.FieldValue.increment(1)
        };

        if (freeDownloads === 0) {
          updates.credit_balance = firebase.firestore.FieldValue.increment(-cost);
          updates.transactions = firebase.firestore.FieldValue.arrayUnion({
            type: "debit",
            amount: cost,
            description,
            timestamp: new Date()
          });
        }

        await userRef.update(updates);
        alert(`✅ ${description} downloaded successfully!`);

      } catch (err) {
        console.error(`Download error for ${buttonId}:`, err);
        alert("An error occurred while processing your download: " + err.message);
      } finally {
        // Always restore UI in case of error
        const buttonContainer = document.querySelector(".button-container");
        const sect1 = document.getElementById("sect1");
        const sect2 = document.querySelector(".sect2");
        if (buttonContainer) buttonContainer.style.display = "block";
        if (sect1) sect1.style.display = "block";
        if (sect2) sect2.style.display = "none";
      }
    });
  }

  // --- Public API ---
  return {
    init() {
      console.log("Download module initialized.");
      // Call setupDownload() for each button
      setupDownload("sole-download-btn", 10, "Sole Proprietor PDF");
      setupDownload("limited-company-download-btn", 20, "Limited Company PDF");
      setupDownload("partnership-download-btn", 20, "Partnership PDF");
    }
  };
});

