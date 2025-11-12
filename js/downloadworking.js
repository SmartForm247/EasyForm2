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

        // --- Check if segmented download is needed ---
        const directorCount = document.querySelectorAll('#idirectorsContainer fieldset').length;
        const subscriberCount = document.querySelectorAll('#isubscribersContainer fieldset').length;
        const ownerCount = document.querySelectorAll('#iownersContainer fieldset').length;
        
        const needsSegmentedDownload = directorCount > 2 || subscriberCount > 2 || ownerCount > 2;
        
        if (needsSegmentedDownload) {
          await performSegmentedDownload(description);
        } else {
          await performStandardDownload(description);
        }

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
        restoreUI();
      }
    });
  }

  // --- Standard Download Function ---
  async function performStandardDownload(description) {
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
  }

  // --- Segmented Download Function ---
  async function performSegmentedDownload(description) {
    // --- UI Preparation for PDF ---
    const buttonContainer = document.querySelector(".button-container");
    const sect1 = document.getElementById("sect1");
    const sect2 = document.querySelector(".sect2");
    
    if (buttonContainer) buttonContainer.style.display = "none";
    if (sect1) sect1.style.display = "none";
    if (sect2) sect2.style.display = "block";
    window.scrollTo(0, 0);

    await new Promise(resolve => setTimeout(resolve, 300));

    // --- Step 1: Download Main Pages ---
    // Hide all additional pages
    hideAdditionalPages();
    
    // Generate PDF for main pages
    const mainOptions = {
      margin: 0,
      filename: `${description.replace(/\s+/g, "_")}_Part1.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    if (typeof html2pdf === 'undefined') {
      throw new Error("html2pdf library is not loaded.");
    }

    await html2pdf().set(mainOptions).from(document.body).save();
    
    // --- Step 2: Download Additional Pages ---
    // Hide main pages and show additional pages
    hideMainPages();
    showAdditionalPages();
    
    // Generate PDF for additional pages
    const additionalOptions = {
      margin: 0,
      filename: `${description.replace(/\s+/g, "_")}_Part2.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    
    await html2pdf().set(additionalOptions).from(document.body).save();
    
    // Inform user about the segmented download
    alert(`✅ ${description} downloaded successfully!\n\nDue to the size of your document, it has been split into two parts:\n1. Main document pages\n2. Additional pages for extra directors/subscribers/owners`);
  }

  // --- Helper Functions for Segmented Download ---
  function hideAdditionalPages() {
    // Hide additional director pages
    document.querySelectorAll('.dir3&4, .dir5&6').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional subscriber pages
    document.querySelectorAll('.sub3, .sub4, .sub5, .sub6').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional owner pages
    document.querySelectorAll('.Owner3, .Owner4, .Owner5, .Owner6').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional director declaration and consent pages
    document.querySelectorAll('.D3-declaration, .D4-declaration, .D5-declaration, .D6-declaration').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('.D3-consent, .D4-consent, .D5-consent, .D6-consent').forEach(el => {
      el.style.display = 'none';
    });
  }
  
  function hideMainPages() {
    // Hide the main pages (first 2 directors, subscribers, owners)
    // We'll identify them by their absence of special classes
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
      if (!page.classList.contains('dir3&4') && 
          !page.classList.contains('dir5&6') &&
          !page.classList.contains('sub3') && 
          !page.classList.contains('sub4') && 
          !page.classList.contains('sub5') && 
          !page.classList.contains('sub6') &&
          !page.classList.contains('Owner3') && 
          !page.classList.contains('Owner4') && 
          !page.classList.contains('Owner5') && 
          !page.classList.contains('Owner6') &&
          !page.classList.contains('D3-declaration') && 
          !page.classList.contains('D4-declaration') && 
          !page.classList.contains('D5-declaration') && 
          !page.classList.contains('D6-declaration') &&
          !page.classList.contains('D3-consent') && 
          !page.classList.contains('D4-consent') && 
          !page.classList.contains('D5-consent') && 
          !page.classList.contains('D6-consent')) {
        page.style.display = 'none';
      }
    });
  }
  
  function showAdditionalPages() {
    // Show only the additional pages that should be visible based on counts
    const directorCount = document.querySelectorAll('#idirectorsContainer fieldset').length;
    const subscriberCount = document.querySelectorAll('#isubscribersContainer fieldset').length;
    const ownerCount = document.querySelectorAll('#iownersContainer fieldset').length;
    
    // Show additional director pages if needed
    if (directorCount > 2) {
      document.querySelectorAll('.dir3&4').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    if (directorCount > 4) {
      document.querySelectorAll('.dir5&6').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Show additional subscriber pages if needed
    if (subscriberCount > 2) {
      document.querySelector('.sub3') && (document.querySelector('.sub3').style.display = 'block');
    }
    if (subscriberCount > 3) {
      document.querySelector('.sub4') && (document.querySelector('.sub4').style.display = 'block');
    }
    if (subscriberCount > 4) {
      document.querySelector('.sub5') && (document.querySelector('.sub5').style.display = 'block');
    }
    if (subscriberCount > 5) {
      document.querySelector('.sub6') && (document.querySelector('.sub6').style.display = 'block');
    }
    
    // Show additional owner pages if needed
    if (ownerCount > 2) {
      document.querySelectorAll('.Owner3').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 3) {
      document.querySelectorAll('.Owner4').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 4) {
      document.querySelectorAll('.Owner5').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 5) {
      document.querySelectorAll('.Owner6').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Show additional director declaration and consent pages if needed
    if (directorCount > 2) {
      document.querySelector('.D3-declaration') && (document.querySelector('.D3-declaration').style.display = 'block');
      document.querySelector('.D3-consent') && (document.querySelector('.D3-consent').style.display = 'block');
    }
    if (directorCount > 3) {
      document.querySelector('.D4-declaration') && (document.querySelector('.D4-declaration').style.display = 'block');
      document.querySelector('.D4-consent') && (document.querySelector('.D4-consent').style.display = 'block');
    }
    if (directorCount > 4) {
      document.querySelector('.D5-declaration') && (document.querySelector('.D5-declaration').style.display = 'block');
      document.querySelector('.D5-consent') && (document.querySelector('.D5-consent').style.display = 'block');
    }
    if (directorCount > 5) {
      document.querySelector('.D6-declaration') && (document.querySelector('.D6-declaration').style.display = 'block');
      document.querySelector('.D6-consent') && (document.querySelector('.D6-consent').style.display = 'block');
    }
  }

  function restoreUI() {
    const buttonContainer = document.querySelector(".button-container");
    const sect1 = document.getElementById("sect1");
    const sect2 = document.querySelector(".sect2");
    
    if (buttonContainer) buttonContainer.style.display = "block";
    if (sect1) sect1.style.display = "block";
    if (sect2) sect2.style.display = "none";
    
    // Reset all pages to their default visibility based on counts
    const UpdateCounts = App.use('UpdateCounts');
    if (UpdateCounts) {
      UpdateCounts.update();
    }
  }

  // --- Public API ---
  return {
    init() {
      console.log("Download module initialized.");
      // Call setupDownload() for each button
      setupDownload("sole-download-btn", 1, "Sole Proprietor PDF");
      setupDownload("limited-company-download-btn", 1, "Limited Company PDF");
      setupDownload("partnership-download-btn", 1, "Partnership PDF");
    }
  };
})();