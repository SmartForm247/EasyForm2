(function () {
  const UpdateCounts = {
    /**
     * Counts the number of fieldsets in each role container.
     */
    update() {
      // === 🧮 Count sections ===
      const directorCount = document.querySelectorAll('#idirectorsContainer fieldset').length;
      const subscriberCount = document.querySelectorAll('#isubscribersContainer fieldset').length;
      const ownerCount = document.querySelectorAll('#iownersContainer fieldset').length;

      console.log(`🔢 Counts -> Directors: ${directorCount}, Subscribers: ${subscriberCount}, Owners: ${ownerCount}`);

      // Optional: update hidden fields
      document.getElementById('idirectorCount')?.setAttribute('value', directorCount);
      document.getElementById('isubscriberCount')?.setAttribute('value', subscriberCount);
      document.getElementById('iownerCount')?.setAttribute('value', ownerCount);

      // === 🧩 Director display logic ===
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

      // === 🧩 Director Declaration & Consent display logic ===
      const directorDeclarations = [
        ['D3-declaration', 'D3-consent'],
        ['D4-declaration', 'D4-consent'],
        ['D5-declaration', 'D5-consent'],
        ['D6-declaration', 'D6-consent']
      ];

      directorDeclarations.forEach((group, index) => {
        const minDirectors = index + 3; // D3 hides if less than 3, D4 if less than 4, etc.
        const shouldHide = directorCount < minDirectors;

        group.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.setProperty('display', shouldHide ? 'none' : '');
        });
      });

      // === 🧩 Subscriber display logic ===
      const subscriberIDs = ['subscriber3', 'subscriber4', 'subscriber5', 'subscriber6'];

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

      // === 🧩 Beneficial Owner display logic ===
      const owners = [
        ['Owner3page1', 'Owner3page2', 'Owner3page3'],
        ['Owner4page1', 'Owner4page2', 'Owner4page3'],
        ['Owner5page1', 'Owner5page2', 'Owner5page3'],
        ['Owner6page1', 'Owner6page2', 'Owner6page3']
      ];

      // Hide pages progressively if owner count is below thresholds
      owners.forEach((group, index) => {
        const minOwners = index + 3; // Owner3 group hides if less than 3 owners, etc.
        const shouldHide = ownerCount < minOwners;

        group.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.setProperty('display', shouldHide ? 'none' : '');
        });
      });
    },

    /**
     * Initializes the module.
     */
    init() {
      console.log('🔢 UpdateCounts module ready.');
      this.update();

      // Automatically recheck when containers change
      const watch = (id) => {
        const el = document.getElementById(id);
        if (el) {
          const observer = new MutationObserver(() => this.update());
          observer.observe(el, { childList: true, subtree: true });
        }
      };

      watch('idirectorsContainer');
      watch('isubscribersContainer');
      watch('iownersContainer');
    }
  };

  // Register globally via your App system
  App.register("UpdateCounts", function () {
    return UpdateCounts;
  });
})();
