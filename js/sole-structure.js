// sole-structure.js

App.registerModule('Structure', function () {
  // --- Private Module State ---
  const titleOptions = `
    <option value="">-- Select Title --</option>
    <option value="Mr">Mr</option>
    <option value="Mrs">Mrs</option>
    <option value="Miss">Miss</option>
    <option value="Ms">Ms</option>
    <option value="Dr">Dr</option>
  `;

  const genderOptions = `
    <option value="">-- Select Gender --</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  `;

  const nationalityOptions = `
    <option value="">-- Select Nationality --</option>
    <option value="Ghanaian">Ghanaian</option>
    <option value="Nigerian">Nigerian</option>
    <option value="British">British</option>
    <option value="American">American</option>
    <option value="Canadian">Canadian</option>
    <option value="German">German</option>
    <option value="Chinese">Chinese</option>
    <option value="South African">South African</option>
    <option value="Kenyan">Kenyan</option>
    <option value="Ivorian">Ivorian</option>
    <option value="Togolese">Togolese</option>
  `;

  // --- Private Helper Functions ---
  function renumberFieldsets(containerId, prefixId, baseLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const fieldsets = Array.from(container.querySelectorAll('fieldset'));

    fieldsets.forEach((fs, idx) => {
      const newIndex = idx + 1;
      const oldMatch = fs.id.match(new RegExp(`^${prefixId}(\\d+)$`));
      const oldIndex = oldMatch ? oldMatch[1] : null;

      fs.id = `${prefixId}${newIndex}`;
      const legend = fs.querySelector('legend');
      if (legend) legend.textContent = `${baseLabel} ${newIndex}`;

      fs.querySelectorAll('[id]').forEach(el => {
        el.id = el.id.replace(new RegExp(`${prefixId}\\d+_`, 'g'), `${prefixId}${newIndex}_`);
      });
    });
  }

  function makeRemoveButton(label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label || 'Remove';
    return btn;
  }

  function addCellClassToInputs() {
    document.querySelectorAll('input').forEach(input => {
      input.classList.add('cell');
    });
  }

  function setupPasteHandler() {
    document.addEventListener('paste', function (event) {
      const activeElement = document.activeElement;

      if (activeElement && activeElement.tagName === 'INPUT') {
        event.preventDefault();
        const pasteData = (event.clipboardData || window.clipboardData).getData('text');
        const values = pasteData.split(/\t|\r?\n/).map(v => v.trim());
        const inputs = Array.from(document.querySelectorAll('input:not([disabled]):not([hidden])'));
        const startIndex = inputs.indexOf(activeElement);

        for (let i = 0; i < values.length; i++) {
          const nextInput = inputs[startIndex + i];
          if (nextInput) {
            if (nextInput.type === 'number' && !isNaN(values[i])) {
              nextInput.value = parseFloat(values[i]);
            } else {
              nextInput.value = values[i];
            }
          }
        }
      }
    });
  }

  // --- Public API ---
  return {
    // Exposed methods
    duplicateFieldset() {
      console.log("Duplicating fieldset...");
      // You can call this.renumberFieldsets() manually if needed
    },

    anotherMethod() {
      console.log("Another function");
    },

    // Initialization method
    init() {
      console.log("Structure module initialized.");
      addCellClassToInputs();
      setupPasteHandler();
    },

    // Expose helpers if needed by other modules
    renumberFieldsets: renumberFieldsets,
    makeRemoveButton: makeRemoveButton
  };
});

