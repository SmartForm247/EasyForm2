(function () {   
  const UpdateCounts = {
    /**
     * Counts the number of fieldsets in each role container.
     */
    update() {
      // Count all director fieldsets
      const directorCount = document.querySelectorAll('#idirectorsContainer fieldset').length;

      // Count all subscriber fieldsets
      const subscriberCount = document.querySelectorAll('#isubscribersContainer fieldset').length;

      // Count all owner fieldsets
      const ownerCount = document.querySelectorAll('#iownersContainer fieldset').length;

      console.log(`🔢 Counts -> Directors: ${directorCount}, Subscribers: ${subscriberCount}, Owners: ${ownerCount}`);

      // Optional: Update hidden fields if they exist
      document.getElementById('idirectorCount')?.setAttribute('value', directorCount);
      document.getElementById('isubscriberCount')?.setAttribute('value', subscriberCount);
      document.getElementById('iownerCount')?.setAttribute('value', ownerCount);

      // === 🧩 Display logic for directors ===
      const threeAndFour = [
        'addDirector-Page1three&four',
        'addDirector-Page2three&four',
        'addDirector-Page3three&four'
      ];

      const fiveAndSix = [
        'addDirector-Page1five&six',
        'addDirector-Page2five&six',
        'addDirector-Page3five&six'
      ];

      if (directorCount < 3) {
        [...threeAndFour, ...fiveAndSix].forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
      } else if (directorCount < 5) {
        threeAndFour.forEach(id => document.getElementById(id)?.style.setProperty('display', ''));
        fiveAndSix.forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
      } else {
        [...threeAndFour, ...fiveAndSix].forEach(id => document.getElementById(id)?.style.setProperty('display', ''));
      }

      // === 🧩 Display logic for subscribers ===
      const subscriberIDs = ['subscriber3', 'subscriber4', 'subscriber5', 'subscriber6'];

      // Hide logic based on subscriberCount
      if (subscriberCount < 3) {
        subscriberIDs.forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
      } 
      else if (subscriberCount < 4) {
        ['subscriber4', 'subscriber5', 'subscriber6'].forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
        document.getElementById('subscriber3')?.style.setProperty('display', '');
      } 
      else if (subscriberCount < 5) {
        ['subscriber5', 'subscriber6'].forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
        ['subscriber3', 'subscriber4'].forEach(id => document.getElementById(id)?.style.setProperty('display', ''));
      } 
      else if (subscriberCount < 6) {
        ['subscriber6'].forEach(id => document.getElementById(id)?.style.setProperty('display', 'none'));
        ['subscriber3', 'subscriber4', 'subscriber5'].forEach(id => document.getElementById(id)?.style.setProperty('display', ''));
      } 
      else {
        subscriberIDs.forEach(id => document.getElementById(id)?.style.setProperty('display', ''));
      }
    },

    /**
     * Initializes the module.
     */
    init() {
      console.log('🔢 UpdateCounts module ready.');
      this.update();

      // Automatically recheck when directors or subscribers are added/removed
      const directorsContainer = document.getElementById('idirectorsContainer');
      const subscribersContainer = document.getElementById('isubscribersContainer');

      if (directorsContainer) {
        const observer = new MutationObserver(() => this.update());
        observer.observe(directorsContainer, { childList: true, subtree: true });
      }

      if (subscribersContainer) {
        const observer = new MutationObserver(() => this.update());
        observer.observe(subscribersContainer, { childList: true, subtree: true });
      }
    }
  };

  // Register globally via your App system
  App.register("UpdateCounts", function () {
    return UpdateCounts;
  });
})();
