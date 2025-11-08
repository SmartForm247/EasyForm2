// sole-renderer.js

App.registerModule('SoleRenderer', function () {
  // --- Dependencies ---
  const Firebase = App.use('Firebase');
  if (!Firebase) {
    console.error("SoleRenderer module: Firebase dependency not found.");
    return null;
  }
  const { auth, db } = Firebase;

  // --- Private Module State ---
  let currentUser = null;
  let currentClientId = null;
  let ownerUniqueId = null;
  const FORM_TYPE = 'sole';

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

  function generateUniqueId(firstName, email) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPart = email.split('@')[0];
    const emailPrefix = emailPart.substring(0, 6);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${cleanFirstName}${emailPrefix}${randomDigits}`;
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
          let userData = doc.data();
          let needsUpdate = false;

          if (!userData.uniqueId) {
            console.warn("User is missing a uniqueId. Generating a new one.");
            needsUpdate = true;
            const email = currentUser.email;
            const firstName = userData.firstName || email.split('@')[0];
            userData.uniqueId = generateUniqueId(firstName, email);
          }
          ownerUniqueId = userData.uniqueId;

          if (!userData.formLinks) {
            console.warn("User is missing formLinks. Generating new ones.");
            needsUpdate = true;
            userData.formLinks = {
              llc: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/llc-input-form.html?owner=${ownerUniqueId}`,
              sole: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/sole-input-form.html?owner=${ownerUniqueId}`,
              ngo: `https://smartform247.github.io/EasyForm/EasyRegistrationForms/ngo-input-form.html?owner=${ownerUniqueId}`
            };
          }

          if (needsUpdate) {
            console.log("Updating user document with new uniqueId and formLinks.");
            db.collection('users').doc(currentUser.uid).update({
              uniqueId: userData.uniqueId,
              formLinks: userData.formLinks
            }).catch(error => console.error("Error updating user document:", error));
          }
          
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
        console.log('Loaded Sole Proprietorship clients:', clients);
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
        <h3>No Sole Proprietorship Client Data Found</h3>
        <p>No clients have submitted Sole Proprietorship registration data through your link yet.</p>
        <p>Share your unique Sole Proprietorship link with clients to start collecting data.</p>
      </div>
    `;
  }

  function renderClientList(clients) {
    const container = document.getElementById('clientListContainer');
    if (!container) return;
    
    container.innerHTML = clients.map(client => {
      const businessName = client['business_Business Name'] || 'Unknown Business';
      const submittedDate = new Date(client.submittedAt).toLocaleString();
      const ownerName = `${client['owner_First Name'] || ''} ${client['owner_Surname'] || ''}`;
      
      return `
        <div class="client-item">
          <h4>${businessName}</h4>
          <p><strong>Submitted:</strong> ${submittedDate}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
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
          document.getElementById('mainTitle').textContent = 'Sole Proprietorship Client Data Details';
          const businessName = client['business_Business Name'] || 'Unknown Business';
          document.getElementById('clientDetailTitle').textContent = `${businessName} - Submitted ${new Date(client.submittedAt).toLocaleString()}`;
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
    
    const copyAllButton = document.createElement('div');
    copyAllButton.className = 'copy-all-container';
    copyAllButton.innerHTML = `<button class="btn-copy-all"><i class="fas fa-copy"></i> Copy All Data</button>`;
    container.appendChild(copyAllButton);
    copyAllButton.querySelector('.btn-copy-all').addEventListener('click', copyAllData);

    const sections = [
      { id: 'business', title: 'Business Information', fields: [
        { label: 'Business Name', key: 'business_Business Name' }, { label: 'Business Activities', key: 'business_Business Activities' },
        { label: 'Start Date', key: 'business_Start Date' }, { label: 'Estimated Annual Revenue', key: 'business_Estimated Annual Revenue' },
        { label: 'Number of Employees', key: 'business_Number of Employees' }
      ]},
      { id: 'location', title: 'Business Location', fields: [
        { label: 'GPS Address', key: 'location_GPS Address' }, { label: 'Landmark', key: 'location_Landmark' },
        { label: 'Building No.', key: 'location_Building No.' }, { label: 'Town', key: 'location_Town' },
        { label: 'Street Name', key: 'location_Street Name' }, { label: 'City', key: 'location_City' },
        { label: 'District', key: 'location_District' }, { label: 'Region', key: 'location_Region' },
        { label: 'Postal Number', key: 'location_Postal Number' }, { label: 'Postal Town', key: 'location_Postal Town' },
        { label: 'Postal Region', key: 'location_Postal Region' }, { label: 'Business Contact', key: 'location_Business Contact' },
        { label: 'Business Email', key: 'location_Business Email' }
      ]},
      { id: 'owner', title: 'Owner Information', fields: [
        { label: 'First Name', key: 'owner_First Name' }, { label: 'Middle Name', key: 'owner_Middle Name' },
        { label: 'Surname', key: 'owner_Surname' }, { label: 'Former Name', key: 'owner_Former Name' },
        { label: 'Date of Birth', key: 'owner_Date of Birth' }, { label: 'Place of Birth', key: 'owner_Place of Birth' },
        { label: 'Nationality', key: 'owner_Nationality' }, { label: 'Occupation', key: 'owner_Occupation' },
        { label: 'Contact 1', key: 'owner_Contact 1' }, { label: 'Contact 2', key: 'owner_Contact 2' },
        { label: 'Email', key: 'owner_Email' }, { label: "Mother's Name", key: "owner_Mother's Name" },
        { label: 'TIN', key: 'owner_TIN' }, { label: 'Ghana Card', key: 'owner_Ghana Card' },
        { label: 'GPS', key: 'owner_GPS' }, { label: 'Landmark', key: 'owner_Landmark' },
        { label: 'House No.', key: 'owner_House No.' }, { label: 'Street', key: 'owner_Street' },
        { label: 'City', key: 'owner_City' }, { label: 'Town', key: 'owner_Town' },
        { label: 'District', key: 'owner_District' }, { label: 'Region', key: 'owner_Region' },
        { label: 'Country', key: 'owner_Country' }
      ]}
    ];

    sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'section-container';
      sectionDiv.id = `${section.id}-section`;
      
      let html = `<h3>${section.title}</h3><table><tr><th>Field Label</th><th>Submitted Data</th></tr>`;
      section.fields.forEach(field => {
        html += `<tr data-field="${field.label}"><td>${field.label}</td><td class="value-cell">${client[field.key] || ''}</td></tr>`;
      });
      html += `</table><div class="button-group">
        <button class="btn-edit">Edit Section</button>
        <button class="btn-save" style="display:none;">Save Section</button>
        <button class="btn-cancel" style="display:none;">Cancel</button>
      </div>`;
      sectionDiv.innerHTML = html;
      container.appendChild(sectionDiv);

      sectionDiv.querySelector('.btn-edit').addEventListener('click', () => editSection(section.id));
      sectionDiv.querySelector('.btn-save').addEventListener('click', () => saveSection(section.id));
      sectionDiv.querySelector('.btn-cancel').addEventListener('click', () => cancelEdit(section.id));
    });
  }

  function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client data?')) {
      db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(clientId).delete()
        .then(() => {
          showNotification('Client data deleted successfully!');
          showClientList();
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
    document.getElementById('mainTitle').textContent = 'Sole Proprietorship Client Data Management Dashboard';
    loadClientData();
  }

  function editSection(sectionId) {
    const section = document.getElementById(`${sectionId}-section`);
    if (!section) return;
    const table = section.querySelector('table');
    section.querySelector('.btn-edit').style.display = 'none';
    section.querySelector('.btn-save').style.display = 'inline-block';
    section.querySelector('.btn-cancel').style.display = 'inline-block';
    table.classList.add('edit-mode');
    
    section.querySelectorAll('tr:not(:first-child)').forEach(row => {
      const valueCell = row.querySelector('.value-cell');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = valueCell.textContent;
      input.className = 'edit-input';
      valueCell.innerHTML = '';
      valueCell.appendChild(input);
    });
  }

  function saveSection(sectionId) {
    const section = document.getElementById(`${sectionId}-section`);
    if (!section) return;
    const table = section.querySelector('table');
    const updatedData = [];
    
    section.querySelectorAll('tr:not(:first-child)').forEach(row => {
      const input = row.querySelector('.edit-input');
      const label = row.querySelector('td:first-child').textContent;
      const value = input ? input.value : row.querySelector('.value-cell').textContent;
      updatedData.push({ label, value });
      if (input) row.querySelector('.value-cell').textContent = value;
    });

    updateClientSectionData(sectionId, updatedData)
      .then(() => {
        table.classList.remove('edit-mode');
        section.querySelector('.btn-edit').style.display = 'inline-block';
        section.querySelector('.btn-save').style.display = 'none';
        section.querySelector('.btn-cancel').style.display = 'none';
        showNotification('Section updated successfully!');
      })
      .catch((error) => {
        console.error("Error updating section:", error);
        showNotification('Error updating section. Please try again.', 'error');
      });
  }

  function cancelEdit(sectionId) {
    const section = document.getElementById(`${sectionId}-section`);
    if (!section) return;
    const table = section.querySelector('table');
    table.classList.remove('edit-mode');
    section.querySelector('.btn-edit').style.display = 'inline-block';
    section.querySelector('.btn-save').style.display = 'none';
    section.querySelector('.btn-cancel').style.display = 'none';
    if (currentClientId) viewClient(currentClientId);
  }

  function copyAllData() {
    const allRows = [];
    document.querySelectorAll('.section-container table tr:not(:first-child)').forEach(row => {
      const rowValues = Array.from(row.querySelectorAll('.value-cell')).map(cell => cell.textContent);
      if (rowValues.length > 0) allRows.push(rowValues.join('\t'));
    });
    const excelData = allRows.join('\n');
    navigator.clipboard.writeText(excelData).then(() => showCopyAllNotification())
      .catch(err => {
        console.error('Failed to copy data:', err);
        showNotification('Failed to copy data. Please try again.', 'error');
      });
  }

  function showCopyAllNotification() {
    let notification = document.getElementById('copyAllNotification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'copyAllNotification';
      notification.className = 'copy-all-notification';
      document.body.appendChild(notification);
    }
    notification.innerHTML = `<h4>All Data Copied!</h4><p>All submitted data has been copied as tab-separated values for spreadsheet compatibility.</p><p>You can paste this directly into Excel or Google Sheets.</p>`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
  }

  function updateClientSectionData(sectionId, updatedData) {
    return db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(currentClientId).get()
      .then((doc) => {
        if (!doc.exists) return Promise.reject('Client document not found');
        const client = doc.data();
        updatedData.forEach(field => {
          const key = `${sectionId}_${field.label.replace(/ /g, '_')}`;
          client[key] = field.value;
        });
        const sanitizedClient = sanitizeFirestoreKeys(client);
        return db.collection('owners').doc(ownerUniqueId).collection(`${FORM_TYPE}_clients`).doc(currentClientId).update(sanitizedClient);
      });
  }

  // --- Public API ---
  return {
    init() {
      console.log("SoleRenderer module initialized.");
      auth.onAuthStateChanged(user => {
        if (user) {
          currentUser = user;
          loadUserData();
        } else {
          window.location.href = 'authenticate.html';
        }
      });
    }
  };
});
// NOTE: The window.addEventListener('load', ...) block has been REMOVED.