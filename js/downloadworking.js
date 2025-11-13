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
    document.querySelectorAll('[id*="addDirector-Page"]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional subscriber pages
    document.querySelectorAll('[id^="subscriber"]:not([id="subscriber1"]):not([id="subscriber2"])').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional owner pages
    document.querySelectorAll('[id^="Owner"]:not([id="Owner1"]):not([id="Owner2"])').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide additional director declaration and consent pages
    document.querySelectorAll('[class*="D"][class*="-declaration"]:not([class*="D1"]):not([class*="D2"])').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('[class*="D"][class*="-consent"]:not([class*="D1"]):not([class*="D2"])').forEach(el => {
      el.style.display = 'none';
    });
  }
  
  function hideMainPages() {
    // Hide the main pages (first 2 directors, subscribers, owners)
    // We'll identify them by their absence of special classes
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
      const id = page.id;
      const classes = Array.from(page.classList);
      
      // Check if this is an additional page
      const isAdditionalDirectorPage = id && id.includes('addDirector-Page');
      const isAdditionalSubscriberPage = id && id.startsWith('subscriber') && 
                                        !id.includes('subscriber1') && !id.includes('subscriber2');
      const isAdditionalOwnerPage = id && id.startsWith('Owner') && 
                                   !id.includes('Owner1') && !id.includes('Owner2');
      const isAdditionalDeclarationPage = classes.some(c => c.includes('-declaration') && 
                                        (c.includes('D3') || c.includes('D4') || c.includes('D5') || c.includes('D6')));
      const isAdditionalConsentPage = classes.some(c => c.includes('-consent') && 
                                      (c.includes('D3') || c.includes('D4') || c.includes('D5') || c.includes('D6')));
      
      // If it's not an additional page, hide it
      if (!isAdditionalDirectorPage && 
          !isAdditionalSubscriberPage && 
          !isAdditionalOwnerPage && 
          !isAdditionalDeclarationPage && 
          !isAdditionalConsentPage) {
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
      document.querySelectorAll('[id*="addDirector-Page1three&four"], [id*="addDirector-Page2three&four"], [id*="addDirector-Page3three&four"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    if (directorCount > 4) {
      document.querySelectorAll('[id*="addDirector-Page1five&six"], [id*="addDirector-Page2five&six"], [id*="addDirector-Page3five&six"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Show additional subscriber pages if needed
    if (subscriberCount > 2) {
      const subscriber3 = document.getElementById('subscriber3');
      if (subscriber3) subscriber3.style.display = 'block';
    }
    if (subscriberCount > 3) {
      const subscriber4 = document.getElementById('subscriber4');
      if (subscriber4) subscriber4.style.display = 'block';
    }
    if (subscriberCount > 4) {
      const subscriber5 = document.getElementById('subscriber5');
      if (subscriber5) subscriber5.style.display = 'block';
    }
    if (subscriberCount > 5) {
      const subscriber6 = document.getElementById('subscriber6');
      if (subscriber6) subscriber6.style.display = 'block';
    }
    
    // Show additional owner pages if needed
    if (ownerCount > 2) {
      document.querySelectorAll('[id^="Owner3"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 3) {
      document.querySelectorAll('[id^="Owner4"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 4) {
      document.querySelectorAll('[id^="Owner5"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    if (ownerCount > 5) {
      document.querySelectorAll('[id^="Owner6"]').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Show additional director declaration and consent pages if needed
    if (directorCount > 2) {
      const d3Declaration = document.querySelector('.D3-declaration');
      const d3Consent = document.querySelector('.D3-consent');
      if (d3Declaration) d3Declaration.style.display = 'block';
      if (d3Consent) d3Consent.style.display = 'block';
    }
    if (directorCount > 3) {
      const d4Declaration = document.querySelector('.D4-declaration');
      const d4Consent = document.querySelector('.D4-consent');
      if (d4Declaration) d4Declaration.style.display = 'block';
      if (d4Consent) d4Consent.style.display = 'block';
    }
    if (directorCount > 4) {
      const d5Declaration = document.querySelector('.D5-declaration');
      const d5Consent = document.querySelector('.D5-consent');
      if (d5Declaration) d5Declaration.style.display = 'block';
      if (d5Consent) d5Consent.style.display = 'block';
    }
    if (directorCount > 5) {
      const d6Declaration = document.querySelector('.D6-declaration');
      const d6Consent = document.querySelector('.D6-consent');
      if (d6Declaration) d6Declaration.style.display = 'block';
      if (d6Consent) d6Consent.style.display = 'block';
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