// llc-renderer.js

App.registerModule('LLCRenderer', function () {
  // --- Dependencies ---
  const Firebase = App.use('Firebase');
  if (!Firebase) {
    console.error("LLCRenderer module: Firebase dependency not found.");
    return null;
  }
  const { auth, db } = Firebase;

  // --- Private Module State ---
  let currentUser = null;
  let currentClientId = null;
  let ownerUniqueId = null;
  const FORM_TYPE = 'llc';

  // --- Private Helper Functions ---
  function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  function sanitizeFirestoreKeys(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[ .]/g, '_');
      sanitized[safeKey] = value;
    }
    return sanitized;
  }

  // --- Private Core Logic ---
  function loadUserData() {
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          ownerUniqueId = userData.uniqueId;
          document.getElementById('userName').textContent = userData.firstName || 'User';
          document.getElementById('userUniqueId').textContent = ownerUniqueId;
          loadClientData();
        } else {
          showNotification('User data not found. Please contact support.', 'error');
        }
      })
      .catch((error) => {
        console.error("Error getting user data:", error);
        showNotification('Error loading user data. Please try again.', 'error');
      });
  }

  function loadClientData() {
    showNotification('Loading client data...', 'info');
    db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`)
      .orderBy('submittedAt', 'desc')
      .get()
      .then((querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Loaded LLC clients:', clients);
        if (clients.length === 0) {
          showEmptyState();
        } else {
          renderClientList(clients);
        }
      })
      .catch((error) => {
        console.error("Error getting client data:", error);
        showNotification('Error loading client data. Please try again.', 'error');
      });
  }

  function showEmptyState() {
    const container = document.getElementById('clientListContainer');
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <h3>No LLC Client Data Found</h3>
        <p>No clients have submitted LLC registration data through your link yet.</p>
        <p>Share your unique LLC link with clients to start collecting data.</p>
      </div>
    `;
  }

  function renderClientList(clients) {
    const container = document.getElementById('clientListContainer');
    if (!container) return;
    
    container.innerHTML = clients.map(client => {
      const companyName = client['company_Company Name'] || 'Unknown Company';
      const submittedDate = new Date(client.submittedAt).toLocaleString();
      return `
        <div class="client-item">
          <h4>${companyName}</h4>
          <p><strong>Submitted:</strong> ${submittedDate}</p>
          <p><strong>Directors:</strong> ${client.directorsCount || 0}</p>
          <p><strong>Subscribers:</strong> ${client.subscribersCount || 0}</p>
          <div class="client-meta">
            <span class="client-id">ID: ${client.id}</span>
            <div>
              <button class="btn-view" data-client-id="${client.id}">View Details</button>
              <button class="btn-delete" data-client-id="${client.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to the new buttons
    container.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => viewClient(e.target.dataset.clientId));
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => deleteClient(e.target.dataset.clientId));
    });
  }

  function viewClient(clientId) {
    db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(clientId).get()
      .then((doc) => {
        if (doc.exists) {
          const client = doc.data();
          currentClientId = clientId;
          document.getElementById('clientListView').style.display = 'none';
          document.getElementById('clientDetailView').style.display = 'block';
          document.getElementById('mainTitle').textContent = 'LLC Client Data Details';
          const companyName = client['company_Company Name'] || 'Unknown Company';
          document.getElementById('clientDetailTitle').textContent = `${companyName} - Submitted ${new Date(client.submittedAt).toLocaleString()}`;
          renderClientDetail(client);
        } else {
          showNotification('Client not found!', 'error');
        }
      })
      .catch((error) => {
        console.error("Error getting client data:", error);
        showNotification('Error loading client data. Please try again.', 'error');
      });
  }

  function renderClientDetail(client) {
    const container = document.getElementById('clientDetailContainer');
    if (!container) return;
    container.innerHTML = '';
    
    // Business Information
    const businessFields = [
      { label: 'Company Name', value: client['company_Company Name'] || '' },
      { label: 'Presented By', value: client['company_Presented By'] || '' },
      { label: 'Presenter TIN', value: client['company_Presenter TIN'] || '' },
      { label: 'Activities', value: client['company_Activities'] || '' },
      { label: 'Stated Capital', value: client['company_Stated Capital'] || '' },
      { label: 'Estimated Revenue', value: client['company_Estimated Revenue'] || '' },
      { label: 'Number of Employees', value: client['company_Number of Employees'] || '' },
      { label: 'GPS Address', value: client['office_GPS Address'] || '' },
      { label: 'Landmark', value: client['office_Landmark'] || '' },
      { label: 'Building No.', value: client['office_Building No.'] || '' },
      { label: 'Town', value: client['office_Town'] || '' },
      { label: 'Street Name', value: client['office_Street Name'] || '' },
      { label: 'City', value: client['office_City'] || '' },
      { label: 'District', value: client['office_District'] || '' },
      { label: 'Region', value: client['office_Region'] || '' },
      { label: 'Postal Number', value: client['office_Postal Number'] || '' },
      { label: 'Postal Town', value: client['office_Postal Town'] || '' },
      { label: 'Postal Region', value: client['office_Postal Region'] || '' },
      { label: 'Contact 1', value: client['office_Contact 1'] || '' },
      { label: 'Contact 2', value: client['office_Contact 2'] || '' },
      { label: 'Email', value: client['office_Email'] || '' }
    ];
    
    let html = `<div class="section-container">
      <h3>Business Information</h3>
      <table>
        <tr><th>Field Label</th><th>Submitted Data</th></tr>`;
    
    businessFields.forEach(field => {
      html += `<tr data-field="${field.label}">
        <td>${field.label}</td>
        <td class="value-cell">${field.value}</td>
      </tr>`;
    });
    
    html += `</table>
      <div class="button-group">
        <button class="btn-edit" data-section="business">Edit Section</button>
        <button class="btn-save" style="display:none;" data-section="business">Save Section</button>
        <button class="btn-cancel" style="display:none;" data-section="business">Cancel</button>
        <button class="btn-copy" data-section="business">Copy Section</button>
      </div>
    </div>`;
    
    const sectionDiv = document.createElement('div');
    sectionDiv.innerHTML = html;
    sectionDiv.id = 'business-section';
    container.appendChild(sectionDiv);
    
    // Directors
    for (let i = 0; i < (client.directorsCount || 0); i++) {
      let roleHtml = '';
      let badges = [];
      if (client[`director${i}_isSubscriber`]) badges.push('<span class="role-badge subscriber">Subscriber</span>');
      if (client[`director${i}_isSecretary`]) badges.push('<span class="role-badge secretary">Secretary</span>');
      
      roleHtml = `
        <div class="director-role-display">
          <h3>Directors - Entry ${i + 1}
          ${badges.length > 0 ? `<div class="role-badges">${badges.join('')}</div>` : ''}
          ${client[`director${i}_isSubscriber`] && client[`director${i}_sharePercent`] ? 
            `<div class="share-percent-display"><strong>Share Percentage:</strong> ${client[`director${i}_sharePercent`]}%</div>` : ''}
        </div>`;
      
      const directorFields = [
        { label: 'First Name', value: client[`director${i}_First Name`] || '' },
        { label: 'Middle Name', value: client[`director${i}_Middle Name`] || '' },
        { label: 'Surname', value: client[`director${i}_Surname`] || '' },
        { label: 'Former Name', value: client[`director${i}_Former Name`] || '' },
        { label: 'Date of Birth', value: client[`director${i}_Date of Birth`] || '' },
        { label: 'Place of Birth', value: client[`director${i}_Place of Birth`] || '' },
        { label: 'Nationality', value: client[`director${i}_Nationality`] || '' },
        { label: 'Occupation', value: client[`director${i}_Occupation`] || '' },
        { label: 'Contact 1', value: client[`director${i}_Contact 1`] || '' },
        { label: 'Contact 2', value: client[`director${i}_Contact 2`] || '' },
        { label: 'Email', value: client[`director${i}_Email`] || '' },
        { label: 'TIN', value: client[`director${i}_TIN`] || '' },
        { label: 'Ghana Card', value: client[`director${i}_Ghana Card`] || '' },
        { label: 'GPS', value: client[`director${i}_GPS`] || '' },
        { label: 'House No.', value: client[`director${i}_House No.`] || '' },
        { label: 'Landmark', value: client[`director${i}_Landmark`] || '' },
        { label: 'Street', value: client[`director${i}_Street`] || '' },
        { label: 'City', value: client[`director${i}_City`] || '' },
        { label: 'Town', value: client[`director${i}_Town`] || '' },
        { label: 'District', value: client[`director${i}_District`] || '' },
        { label: 'Region', value: client[`director${i}_Region`] || '' },
        { label: 'Country', value: client[`director${i}_Country`] || '' }
      ];
      
      html = `<div class="section-container">
        ${roleHtml}
        <table>
          <tr><th>Field Label</th><th>Submitted Data</th></tr>`;
      
      directorFields.forEach(field => {
        html += `<tr data-field="${field.label}">
          <td>${field.label}</td>
          <td class="value-cell">${field.value}</td>
        </tr>`;
      });
      
      html += `</table>
        <div class="button-group">
          <button class="btn-edit" data-section="director-${i}">Edit Section</button>
          <button class="btn-save" style="display:none;" data-section="director-${i}">Save Section</button>
          <button class="btn-cancel" style="display:none;" data-section="director-${i}">Cancel</button>
          <button class="btn-copy" data-section="director-${i}">Copy Section</button>
        </div>
      </div>`;
      
      const directorSectionDiv = document.createElement('div');
      directorSectionDiv.innerHTML = html;
      directorSectionDiv.id = `director-${i}-section`;
      container.appendChild(directorSectionDiv);
    }
    
    // Secretary (only if no director is secretary)
    let hasDirectorAsSecretary = false;
    for (let i = 0; i < (client.directorsCount || 0); i++) {
      if (client[`director${i}_isSecretary`]) { hasDirectorAsSecretary = true; break; }
    }
    if (!hasDirectorAsSecretary) {
      const secretaryFields = [
        { label: 'Qualification', value: client['secretary_Qualification'] || '' },
        { label: 'First Name', value: client['secretary_First Name'] || '' },
        { label: 'Middle Name', value: client['secretary_Middle Name'] || '' },
        { label: 'Surname', value: client['secretary_Surname'] || '' },
        { label: 'Former Name', value: client['secretary_Former Name'] || '' },
        { label: 'Date of Birth', value: client['secretary_Date of Birth'] || '' },
        { label: 'Place of Birth', value: client['secretary_Place of Birth'] || '' },
        { label: 'Nationality', value: client['secretary_Nationality'] || '' },
        { label: 'Occupation', value: client['secretary_Occupation'] || '' },
        { label: 'Contact 1', value: client['secretary_Contact 1'] || '' },
        { label: 'Contact 2', value: client['secretary_Contact 2'] || '' },
        { label: 'Email', value: client['secretary_Email'] || '' },
        { label: 'TIN', value: client['secretary_TIN'] || '' },
        { label: 'Ghana Card', value: client['secretary_Ghana Card'] || '' },
        { label: 'GPS', value: client['secretary_GPS'] || '' },
        { label: 'House No.', value: client['secretary_House No.'] || '' },
        { label: 'Landmark', value: client['secretary_Landmark'] || '' },
        { label: 'Street', value: client['secretary_Street'] || '' },
        { label: 'City', value: client['secretary_City'] || '' },
        { label: 'Town', value: client['secretary_Town'] || '' },
        { label: 'District', value: client['secretary_District'] || '' },
        { label: 'Region', value: client['secretary_Region'] || '' },
        { label: 'Country', value: client['secretary_Country'] || '' }
      ];
      
      html = `<div class="section-container">
        <h3>Secretary Details</h3>
        <table>
          <tr><th>Field Label</th><th>Submitted Data</th></tr>`;
      
      secretaryFields.forEach(field => {
        html += `<tr data-field="${field.label}">
          <td>${field.label}</td>
          <td class="value-cell">${field.value}</td>
        </tr>`;
      });
      
      html += `</table>
        <div class="button-group">
          <button class="btn-edit" data-section="secretary">Edit Section</button>
          <button class="btn-save" style="display:none;" data-section="secretary">Save Section</button>
          <button class="btn-cancel" style="display:none;" data-section="secretary">Cancel</button>
          <button class="btn-copy" data-section="secretary">Copy Section</button>
        </div>
      </div>`;
      
      const secretarySectionDiv = document.createElement('div');
      secretarySectionDiv.innerHTML = html;
      secretarySectionDiv.id = 'secretary-section';
      container.appendChild(secretarySectionDiv);
    }
    
    // Subscribers
    for (let i = 0; i < (client.subscribersCount || 0); i++) {
      const subscriberFields = [
        { label: 'First Name', value: client[`subscriber${i}_First Name`] || '' },
        { label: 'Middle Name', value: client[`subscriber${i}_Middle Name`] || '' },
        { label: 'Surname', value: client[`subscriber${i}_Surname`] || '' },
        { label: 'Former Name', value: client[`subscriber${i}_Former Name`] || '' },
        { label: 'Date of Birth', value: client[`subscriber${i}_Date of Birth`] || '' },
        { label: 'Place of Birth', value: client[`subscriber${i}_Place of Birth`] || '' },
        { label: 'Nationality', value: client[`subscriber${i}_Nationality`] || '' },
        { label: 'Occupation', value: client[`subscriber${i}_Occupation`] || '' },
        { label: 'Contact 1', value: client[`subscriber${i}_Contact 1`] || '' },
        { label: 'Contact 2', value: client[`subscriber${i}_Contact 2`] || '' },
        { label: 'Email', value: client[`subscriber${i}_Email`] || '' },
        { label: 'TIN', value: client[`subscriber${i}_TIN`] || '' },
        { label: 'Ghana Card', value: client[`subscriber${i}_Ghana Card`] || '' },
        { label: 'GPS', value: client[`subscriber${i}_GPS`] || '' },
        { label: 'House No.', value: client[`subscriber${i}_House No.`] || '' },
        { label: 'Landmark', value: client[`subscriber${i}_Landmark`] || '' },
        { label: 'Street', value: client[`subscriber${i}_Street`] || '' },
        { label: 'City', value: client[`subscriber${i}_City`] || '' },
        { label: 'Town', value: client[`subscriber${i}_Town`] || '' },
        { label: 'District', value: client[`subscriber${i}_District`] || '' },
        { label: 'Region', value: client[`subscriber${i}_Region`] || '' }
      ];
      
      html = `<div class="section-container">
        <h3>Subscribers - Entry ${i + 1}</h3>
        <table>
          <tr><th>Field Label</th><th>Submitted Data</th></tr>`;
      
      subscriberFields.forEach(field => {
        html += `<tr data-field="${field.label}">
          <td>${field.label}</td>
          <td class="value-cell">${field.value}</td>
        </tr>`;
      });
      
      html += `</table>
          <div class="button-group">
            <button class="btn-edit" data-section="subscriber-${i}">Edit Section</button>
            <button class="btn-save" style="display:none;" data-section="subscriber-${i}">Save Section</button>
            <button class="btn-cancel" style="display:none;" data-section="subscriber-${i}">Cancel</button>
            <button class="btn-copy" data-section="subscriber-${i}">Copy Section</button>
          </div>
        </div>`;
      
      const subscriberSectionDiv = document.createElement('div');
      subscriberSectionDiv.innerHTML = html;
      subscriberSectionDiv.id = `subscriber-${i}-section`;
      container.appendChild(subscriberSectionDiv);
    }
  }

  function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client data?')) {
      db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(clientId).delete()
        .then(() => {
          showNotification('Client data deleted successfully!');
          loadClientData();
        })
        .catch((error) => {
          console.error("Error deleting client data:", error);
          showNotification('Error deleting client data. Please try again.', 'error');
        });
    }
  }

  function showClientList() {
    document.getElementById('clientDetailView').style.display = 'none';
    document.getElementById('clientListView').style.display = 'block';
    document.getElementById('mainTitle').textContent = 'LLC Client Data Management Dashboard';
    loadClientData();
  }

  function editSection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if (!section) return;
    const table = section.querySelector('table');
    const editBtn = section.querySelector('.btn-edit');
    const saveBtn = section.querySelector('.btn-save');
    const cancelBtn = section.querySelector('.btn-cancel');
    table.classList.add('edit-mode');
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    const rows = table.querySelectorAll('tr:not(:first-child)');
    rows.forEach(row => {
      const valueCell = row.querySelector('.value-cell');
      const currentValue = valueCell.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentValue;
      input.className = 'edit-input';
      valueCell.innerHTML = '';
      valueCell.appendChild(input);
    });
  }

  function saveSection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if (!section) return;
    const table = section.querySelector('table');
    const editBtn = section.querySelector('.btn-edit');
    const saveBtn = section.querySelector('.btn-save');
    const cancelBtn = section.querySelector('.btn-cancel');
    const rows = table.querySelectorAll('tr:not(:first-child)');
    const updatedData = [];
    rows.forEach(row => {
      const input = row.querySelector('.edit-input');
      const label = row.querySelector('td:first-child').textContent;
      const value = input ? input.value : row.querySelector('.value-cell').textContent;
      updatedData.push({ label, value });
      if (input) {
        row.querySelector('.value-cell').textContent = value;
      }
    });
    updateClientSectionData(sectionId, updatedData)
      .then(() => {
        table.classList.remove('edit-mode');
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        showNotification('Section updated successfully!');
      })
      .catch((error) => {
        console.error("Error updating section:", error);
        showNotification('Error updating section. Please try again.', 'error');
      });
  }

  function cancelEdit(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if (!section) return;
    const table = section.querySelector('table');
    const editBtn = section.querySelector('.btn-edit');
    const saveBtn = section.querySelector('.btn-save');
    const cancelBtn = section.querySelector('.btn-cancel');
    table.classList.remove('edit-mode');
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  }

  function copySection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if (!section) return;
    const rows = section.querySelectorAll('tr:not(:first-child)');
    const values = [];
    const fieldLabels = Array.from(rows).map(row => row.querySelector('td:first-child').textContent);
    const fieldValues = Array.from(rows).map(row => row.querySelector('.value-cell').textContent);
    const tabSeparatedValues = fieldValues.join('\t');
    navigator.clipboard.writeText(tabSeparatedValues).then(() => {
      showCopyFormatNotification();
    });
  }

  function showCopyFormatNotification() {
    let notification = document.getElementById('copyFormatNotification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'copyFormatNotification';
      notification.className = 'copy-format-notification';
      document.body.appendChild(notification);
    }
    notification.innerHTML = `
      <h4>Data Copied!</h4>
      <p>Data has been copied as tab-separated values for spreadsheet compatibility.</p>
      <p>Empty fields are included to maintain cell positions when pasted.</p>
    `;
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 4000);
  }

  function updateClientSectionData(sectionId, updatedData) {
    return db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(currentClientId).get()
      .then((doc) => {
        if (doc.exists) {
          const client = doc.data();
          if (sectionId === 'business') {
            updatedData.forEach(field => {
              if (field.label === 'Company Name') client['company_Company Name'] = field.value;
              else if (field.label === 'Presented By') client['company_Presented By'] = field.value;
              // ... (other mappings)
            });
          } else if (sectionId.startsWith('director-')) {
              const index = parseInt(sectionId.split('-')[1]);
              updatedData.forEach(field => {
                  if (field.label === 'First Name') client[`director${index}_First Name`] = field.value;
                  // ... (other mappings)
              });
          } else if (sectionId === 'secretary') {
              updatedData.forEach(field => {
                  if (field.label === 'Qualification') client['secretary_Qualification'] = field.value;
                  // ... (other mappings)
              });
          } else if (sectionId.startsWith('subscriber-')) {
              const index = parseInt(sectionId.split('-')[1]);
              updatedData.forEach(field => {
                  if (field.label === 'First Name') client[`subscriber${index}_First Name`] = field.value;
                  // ... (other mappings)
              });
          }
          const sanitizedClient = sanitizeFirestoreKeys(client);
          return db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(currentClientId).update(sanitizedClient);
        } else {
          return Promise.reject('Client document not found');
        }
      });
  }

  // --- Public API ---
  return {
    init() {
      console.log("LLCRenderer module initialized.");
      auth.onAuthStateChanged(user => {
        if (user) {
          currentUser = user;
          loadUserData();
        } else {
          window.location.href = 'authenticate.html';
        }
      });
      // Attach event listeners to the main container for dynamic buttons
      const mainContainer = document.querySelector('#clientDetailView');
      if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
          if (e.target.matches('.btn-edit, .btn-save, .btn-cancel, .btn-copy')) {
            const sectionId = e.target.dataset.section;
            if (e.target.classList.contains('btn-edit')) editSection(sectionId);
            if (e.target.classList.contains('btn-save')) saveSection(sectionId);
            if (e.target.classList.contains('btn-cancel')) cancelEdit(sectionId);
            if (e.target.classList.contains('btn-copy')) copySection(sectionId);
          }
        });
      }
    }
  };
});
// NOTE: The document.addEventListener('DOMContentLoaded', ...) block has been REMOVED.