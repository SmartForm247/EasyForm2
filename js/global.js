// global.js

(function() {
  'use strict';

  // Ensure the App namespace exists
  window.App = window.App || {};

  /**
   * Registers a module within the App namespace.
   * A module is defined by a factory function to ensure it's only initialized once.
   * @param {string} name - The name of the module.
   * @param {Function} factory - A function that returns the module object.
   */
  App.registerModule = function (name, factory) {
    if (!name || typeof name !== "string") {
      return console.error("Invalid module name provided to App.registerModule.");
    }

    if (App[name]) {
      console.warn(`⚠️ App module "${name}" already exists. Skipping registration.`);
      return;
    }

    if (typeof factory !== "function") {
      return console.error(`Factory for module "${name}" must be a function.`);
    }

    try {
      App[name] = factory();
      console.log(`✅ App module registered: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to initialize module "${name}":`, error);
    }
  };

  /**
   * Retrieves a registered module from the App namespace.
   * @param {string} name - The name of the module to retrieve.
   * @returns {object|null} The module object or null if not found.
   */
  App.use = function (name) {
    if (!App[name]) {
      console.warn(`⚠️ App module "${name}" not found.`);
    }
    return App[name] || null;
  };

  /**
   * A shared state object for global application data.
   */
  App.state = {};

  /**
   * A central initialization function for the App.
   */
  App.init = function () {
    console.log("🚀 App namespace initialized and ready.");
  };

  console.log("✅ App namespace setup complete.");

  // For backward compatibility, you can alias the old function name
  App.register = App.registerModule;

})();