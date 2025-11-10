// init.js

function initializeApp() {
  console.log("🚀 Initializing application modules...");

  // The App module is initialized separately to prevent conflicts
  const AppModule = App.use('App');
  if (AppModule && typeof AppModule.init === 'function') {
    try {
      AppModule.init();
      console.log(`✅ App module initialized.`);
    } catch (error) {
      console.error(`❌ Failed to initialize App module:`, error);
    }
  }

  
// List of all OTHER modules that need to be initialized
const modulesToInit = [
  'Auth',
  'Structure',
  'SoleRenderer',
  'SoleHandler',
  'LLCRenderer',
  'Validation',
  'Download',
  'Editable',
  'UpdateCounts' // ✅ Add this line
];

  modulesToInit.forEach(moduleName => {
    const moduleInstance = App.use(moduleName);
    if (moduleInstance && typeof moduleInstance.init === 'function') {
      try {
        moduleInstance.init();
        console.log(`✅ ${moduleName} module initialized.`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${moduleName} module:`, error);
      }
    } else {
      console.warn(`⚠️ Module '${moduleName}' not found or has no init function.`);
    }
  });
  console.log("🎉 Application initialization complete.");
}

// Wait for the window to load all resources before initializing
window.addEventListener('load', initializeApp);