// sole-validation.js

App.registerModule('Validation', function () {
  // --- Private Helper Functions ---
  function updateSelectStyle(select) {
    select.classList.toggle("empty", select.value === "");
    select.classList.toggle("filled", select.value !== "");
  }

  function updateInputBorder(input) {
    input.classList.toggle("empty", input.value.trim() === "");
    input.classList.toggle("filled", input.value.trim() !== "");
  }

  function revalidateAllFields() {
    document.querySelectorAll("select").forEach(updateSelectStyle);
    document.querySelectorAll("input").forEach(updateInputBorder);
  }

  function handleChangeEvent(e) {
    if (e.target.tagName.toLowerCase() === "select") {
      updateSelectStyle(e.target);
    }
  }

  function handleInputEvent(e) {
    if (e.target.tagName.toLowerCase() === "input") {
      updateInputBorder(e.target);
    }
  }

  function handlePasteOrDrop() {
    setTimeout(revalidateAllFields, 20);
  }

  function handleMutation(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!node.querySelectorAll) return;

        if (node.tagName) {
          const tag = node.tagName.toLowerCase();
          if (tag === "select") updateSelectStyle(node);
          if (tag === "input") updateInputBorder(node);
        }

        node.querySelectorAll("select").forEach(updateSelectStyle);
        node.querySelectorAll("input").forEach(updateInputBorder);
      });
    });
  }

  // --- Public API ---
  return {
    init() {
      console.log("Validation module initialized.");

      // Event: change (select dropdowns)
      document.addEventListener("change", handleChangeEvent);

      // Event: typing (inputs)
      document.addEventListener("input", handleInputEvent);

      // Event: paste or drop (revalidate everything)
      document.addEventListener("paste", handlePasteOrDrop);
      document.addEventListener("drop", handlePasteOrDrop);

      // Monitor dynamic elements
      const observer = new MutationObserver(handleMutation);
      observer.observe(document.body, { childList: true, subtree: true });

      // Validate everything on page load and on back/forward restore
      window.addEventListener("load", revalidateAllFields);
      window.addEventListener("pageshow", revalidateAllFields);

      // Initial validation on start
      revalidateAllFields();
    },

    // Expose the main revalidation function
    revalidateAll: revalidateAllFields
  };
});

