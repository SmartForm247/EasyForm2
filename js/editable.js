// editable.js

App.registerModule('Editable', function () {
  // --- Private Helper Functions ---
  function makeParagraphsEditable() {
    document.querySelectorAll(".page p").forEach(p => {
      p.setAttribute("contenteditable", "true");
    });
  }

  function setupSignatureUploads() {
    document.querySelectorAll(".signature-box").forEach(box => {
      const input = box.querySelector("input");
      const img = box.querySelector("img");

      if (!input || !img) {
        console.warn("Signature box is missing input or img element.", box);
        return;
      }

      box.addEventListener("click", () => {
        input.click();
      });

      input.addEventListener("change", () => {
        const file = input.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = e => {
            img.src = e.target.result;
            img.style.display = "block";
            // Hide the placeholder text node
            const placeholder = box.firstChild;
            if (placeholder && placeholder.nodeType === Node.TEXT_NODE) {
              placeholder.textContent = "";
            }
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  // --- Public API ---
  return {
    init() {
      console.log("Editable module initialized.");
      makeParagraphsEditable();
      setupSignatureUploads();
    }
  };
});

