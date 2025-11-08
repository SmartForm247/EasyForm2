// sole-handler.js

App.registerModule('SoleHandler', function () {
  // --- Private Helper Functions ---
  function val(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    return el.value ?? el.textContent ?? "";
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text ?? "";
  }

  function setCheckmark(id, checked) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = checked ? "\u2714" : "";
  }

  function nowDateString() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // --- Private Core Logic ---
  function fillBusiness() {
    setText("companyName", val("icompanyName"));
    setText("principalActivities", val("iactivities"));
    setText("date", val("date"));
    setText("revenueEnvisage", val("iestimatedRevenue"));
    setText("NoOfemployee", val("inumOfEmployees"));
  }

  function fillOffice() {
    setText("officedigital address", val("iofficeGps"));
    setText("officeLandmark", val("iofficeLandmark"));
    setText("officehousenumber", val("iofficeHseNo"));
    setText("officetown", val("iofficeTown"));
    setText("officeStreet", val("iofficeStreetName"));
    setText("officeCity", val("iofficeCity"));
    setText("officeDistrict", val("iofficeDistrict"));
    setText("officeRegion", val("iofficeRegion"));

    const postalType = val("iofficePostalType").toLowerCase();
    const boxNumber = val("iofficeBoxNumber");

    // Set checkmarks for postal type
    setText("emptyBox1", postalType === "pobox" ? "\u2714" : "");
    setText("emptyBox2", postalType === "pmb" ? "\u2714" : "");
    setText("emptyBox3", postalType === "dtd" ? "\u2714" : "");

    // Clear all number fields first
    setText("POBOX", "");
    setText("PMB", "");
    setText("DTD", "");

    // Place box number under the correct postal type
    if (postalType === "pobox") {
      setText("POBOX", boxNumber);
    } else if (postalType === "pmb") {
      setText("PMB", boxNumber);
    } else if (postalType === "dtd") {
      setText("DTD", boxNumber);
    }

    setText("officePostalCodeTown", val("iofficeBoxTown"));
    setText("officePostalCodeRegion", val("iofficeBoxRegion"));
    setText("contactOne", val("iofficeContact1"));
    setText("contactTwo", val("iofficeContact2"));
    setText("email", val("iofficeEmail"));
  }

  function applyTitleOverlay(prefix, titleValue) {
    const titles = ["MR", "MRS", "MISS", "MS", "DR"];
    titles.forEach(t => {
      const id = `${prefix}Tittle${t}`;
      setText(id, "");
    });

    if (!titleValue) return;
    const normalized = titleValue.trim().toUpperCase();
    let key = normalized;
    if (key === "MRS" || key === "MRS.") key = "MRS";
    if (key === "MISS") key = "MISS";
    if (key === "DR" || key === "DR.") key = "DR";
    
    const targetId = `${prefix}Tittle${key}`;
    setText(targetId, "\u2714");
  }

  function applyGenderOverlay(prefix, genderValue) {
    setText(prefix + "GenderMale", "");
    setText(prefix + "GenderFemale", "");
    setText(prefix + "genderMale", "");
    setText(prefix + "genderFemale", "");
    
    const normalized = (genderValue || "").toLowerCase();
    if (normalized === "male") {
      setText(prefix + "GenderMale", "\u2714");
      setText(prefix + "genderMale", "\u2714");
    } else if (normalized === "female") {
      setText(prefix + "GenderFemale", "\u2714");
      setText(prefix + "genderFemale", "\u2714");
    }
  }

  function fillOwner() {
    applyTitleOverlay("", val("iownerTitle"));
    applyGenderOverlay("", val("iownerGender"));
    setText("FirstName", val("iownerFname"));
    setText("OwnerMiddleName", val("iownerMname"));
    setText("OwnerLastName", val("iownerSurname"));
    setText("OwnerFormerName", val("iownerFormerName"));
    setText("OwnerDOB", val("iownerDob"));
    setText("OwnerPOB", val("iownerPob"));
    setText("OwnerNationality", val("iownerNationality"));
    setText("Ocupation", val("iownerOccupation"));
    setText("OwnerPhoneNO1", val("iownerContact1"));
    setText("OwnerPhoneNO2", val("iownerContact2"));
    setText("OwnerEmail", val("iownerEmail"));
    setText("OwnerTIN", val("iownerTin"));
    setText("OwnerGhanaCard", val("iownerGhanaCard"));

    setText("OwnerDigitalAddress", val("iownerGps"));
    setText("OwnerLandmark", val("iownerLandmark"));
    setText("Ownerhousenumber", val("iownerHseNo"));
    setText("Ownertown", val("iownerTown"));
    setText("OwnerStreet", val("iownerStreet"));
    setText("OwnerCity", val("iownerCity"));
    setText("OwnerDistrict", val("iownerDistrict"));
    setText("OwnerRegion", val("iownerRegion"));
    setText("OwnerCountry", val("iownerCountry"));

    const fullName = [val("iownerFname"), val("iownerMname"), val("iownerSurname"), val("iownerFormerName")].filter(Boolean).join(" ");
    setText("Ownerfullname", fullName);
    setText("date2", val("date"));
  }

  function updateOverlay() {
    fillBusiness();
    fillOffice();
    fillOwner();
    const today = nowDateString();
    ["date", "date2"].forEach(did => setText(did, today));
  }

  function attachListeners() {
    const form = document.getElementById("icompanyForm");
    if (!form) {
      console.warn("Form with id icompanyForm not found in DOM when wiring overlay update listeners.");
      return;
    }
    
    form.querySelectorAll("input, select, textarea").forEach(el => {
      el.addEventListener("input", updateOverlay);
      el.addEventListener("change", updateOverlay);
      el.addEventListener("paste", (e) => {
        setTimeout(updateOverlay, 10);
      });
    });

    updateOverlay();
  }

  // --- Public API ---
  return {
    init() {
      console.log("SoleHandler module initialized.");
      attachListeners();
      // Ensure a final run in case other scripts populate values after DOMContentLoaded
      setTimeout(updateOverlay, 250);
      setTimeout(updateOverlay, 800);
    },
    // Expose the update function so other modules can trigger it if needed
    update: updateOverlay
  };
});

