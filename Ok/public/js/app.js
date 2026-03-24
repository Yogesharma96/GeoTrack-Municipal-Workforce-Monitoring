document.addEventListener('DOMContentLoaded', () => {
  // --- LOGIN LOGIC ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const errEl = document.getElementById('loginError');

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.worker));
          window.location.href = '/dashboard.html';
        } else {
          errEl.textContent = data.message || "Login failed";
          errEl.classList.remove('hide');
        }
      } catch (err) {
        // Fallback for demo if backend is not running yet
        if(phone === 'admin' && password === 'admin') {
          localStorage.setItem('user', JSON.stringify({name: 'Admin', role: 'admin'}));
          window.location.href = '/dashboard.html';
        } else {
          errEl.textContent = "Server error. Try 'admin'/'admin' locally.";
          errEl.classList.remove('hide');
        }
      }
    });
  }

  // --- DASHBOARD LOGIC ---
  const isDashboard = document.querySelector('.dashboard-body');
  if (isDashboard) {
    const user = JSON.parse(localStorage.getItem('user'));
    if(!user) {
      window.location.href = '/index.html';
      return;
    }
    
    document.getElementById('userNameDisplay').textContent = user.name || 'Admin';
    if(user.name) {
      document.querySelector('.avatar').textContent = user.name.charAt(0).toUpperCase();
    }

    // Sidebar routing
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(nv => nv.classList.remove('active'));
        item.classList.add('active');
        
        const targetView = item.getAttribute('data-view');
        
        views.forEach(v => v.classList.remove('active-view'));
        const viewEl = document.getElementById(`view-${targetView}`);
        if(viewEl) viewEl.classList.add('active-view');
        
        pageTitle.textContent = item.childNodes[0].textContent.trim();
        
        // Render map if switching to dashboard
        if(targetView === 'dashboard') initMap();
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('user');
      window.location.href = '/index.html';
    });

    // Fetch Stats
    fetchDashboardStats();
    
    // Init Map
    initMap();

    // Modal Logic for Assign Task
    const taskModal = document.getElementById('taskModal');
    const openBtn = document.getElementById('openTaskModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const assignTaskForm = document.getElementById('assignTaskForm');

    if(openBtn && taskModal) {
      let assignMap;
      let assignMarker;
      openBtn.addEventListener('click', () => {
         taskModal.classList.remove('hide');
         if (!assignMap) {
            setTimeout(() => {
               assignMap = L.map('modalMap').setView([19.0760, 72.8777], 12);
               
               const modalStreet = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 });
               const modalSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
               
               modalStreet.addTo(assignMap);
               L.control.layers({"Street": modalStreet, "Satellite (Detailed)": modalSat}).addTo(assignMap);

               assignMap.on('click', (e) => {
                 document.getElementById('newTaskLat').value = e.latlng.lat.toFixed(5);
                 document.getElementById('newTaskLng').value = e.latlng.lng.toFixed(5);
                 if(assignMarker) assignMap.removeLayer(assignMarker);
                 assignMarker = L.marker(e.latlng).addTo(assignMap);
               });

               window.assignMapInstance = assignMap;
               window.assignMapMarker = assignMarker;
            }, 300);
         } else {
            setTimeout(() => assignMap.invalidateSize(), 300);
         }
      });
      closeBtn.addEventListener('click', () => taskModal.classList.add('hide'));
      
      const autoFetchBtn = document.getElementById('autoFetchCoordsBtn');
      const deepSearchBtn = document.getElementById('modalMapSearchBtn');
      const expandModalMapBtn = document.getElementById('expandModalMapBtn');
      
      if(expandModalMapBtn) {
         expandModalMapBtn.addEventListener('click', () => {
            const mMap = document.getElementById('modalMap');
            if(mMap.style.height === '400px') {
               mMap.style.height = '180px';
               expandModalMapBtn.innerHTML = '<i class="ph ph-arrows-out"></i> Expand Map';
            } else {
               mMap.style.height = '400px';
               expandModalMapBtn.innerHTML = '<i class="ph ph-arrows-in"></i> Collapse Map';
               setTimeout(() => mMap.scrollIntoView({behavior: "smooth", block: "center"}), 100);
            }
            if(window.assignMapInstance) {
               setTimeout(() => window.assignMapInstance.invalidateSize(), 350);
            }
         });
      }
      
      const fetchAddressCoords = async (addressStr) => {
         if(!addressStr) return;
         try {
             const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`);
             const data = await res.json();
             if(data && data.length > 0) {
               const lat = parseFloat(data[0].lat);
               const lng = parseFloat(data[0].lon);
               document.getElementById('newTaskLat').value = lat.toFixed(5);
               document.getElementById('newTaskLng').value = lng.toFixed(5);
               
               if (window.assignMapInstance) {
                 window.assignMapInstance.flyTo([lat, lng], 17);
                 if (window.assignMapMarker) window.assignMapInstance.removeLayer(window.assignMapMarker);
                 window.assignMapMarker = L.marker([lat, lng]).addTo(window.assignMapInstance);
               }
             }
         } catch(e) { console.error('Auto-fetch failed.', e); }
      };

      const locInput = document.getElementById('newTaskLoc');
      if (locInput) {
         locInput.addEventListener('change', async () => {
            if (locInput.value.trim().length > 3) {
               await fetchAddressCoords(locInput.value);
            }
         });
      }

      if(autoFetchBtn) {
         autoFetchBtn.addEventListener('click', async () => {
           autoFetchBtn.textContent = 'Fetching...';
           await fetchAddressCoords(document.getElementById('newTaskLoc').value);
           autoFetchBtn.textContent = '+ Auto-fetch from Address';
         });
      }
      if(deepSearchBtn) {
         deepSearchBtn.addEventListener('click', async () => {
           deepSearchBtn.textContent = 'Searching...';
           await fetchAddressCoords(document.getElementById('newTaskLoc').value);
           deepSearchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Deep Search';
         });
      }

      const latInput = document.getElementById('newTaskLat');
      const lngInput = document.getElementById('newTaskLng');
      const updateMapFromInputs = () => {
         const lat = parseFloat(latInput.value);
         const lng = parseFloat(lngInput.value);
         if (!isNaN(lat) && !isNaN(lng) && window.assignMapInstance) {
            window.assignMapInstance.flyTo([lat, lng], 16);
            if (window.assignMapMarker) window.assignMapInstance.removeLayer(window.assignMapMarker);
            window.assignMapMarker = L.marker([lat, lng]).addTo(window.assignMapInstance);
         }
      };
      if(latInput) latInput.addEventListener('change', updateMapFromInputs);
      if(lngInput) lngInput.addEventListener('change', updateMapFromInputs);

      assignTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('newTaskTitle').value;
        const worker = document.getElementById('newTaskWorker').value;
        const loc = document.getElementById('newTaskLoc').value;
        const lat = parseFloat(document.getElementById('newTaskLat').value);
        const lng = parseFloat(document.getElementById('newTaskLng').value);
        const submitBtn = assignTaskForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true; submitBtn.textContent = 'Assigning...';

        try {
          const res = await fetch('/api/tasks', {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ title, assignedTo: worker, status: 'Draft', location: { address: loc, lat, lng } })
          });
          const data = await res.json();
          if(data.success) {
            assignTaskForm.reset();
            taskModal.classList.add('hide');
            await fetchTasks();
            await fetchDashboardStats();
            
            // Auto-switch to Dashboard to monitor the new task
            const dashTab = document.querySelector('[data-view="dashboard"]');
            if(dashTab) dashTab.click();
            
            // Fly main map to the new task location
            setTimeout(() => {
               if(map && !isNaN(lat) && !isNaN(lng)) {
                  map.setView([lat, lng], 17);
               }
            }, 800);
            
          } else { alert('Failed to assign task: ' + data.message); }
        } catch(err) { alert('Error connecting to Server.'); } 
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Assign Task'; }
      });
    }

    // Modal Logic for Add Worker
    const workerModal = document.getElementById('workerModal');
    const openWorkerBtn = document.getElementById('openWorkerModalBtn');
    const closeWorkerBtn = document.getElementById('closeWorkerModalBtn');
    const addWorkerForm = document.getElementById('addWorkerForm');

    if(openWorkerBtn && workerModal) {
      openWorkerBtn.addEventListener('click', () => workerModal.classList.remove('hide'));
      closeWorkerBtn.addEventListener('click', () => workerModal.classList.add('hide'));
      
      addWorkerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let phone = document.getElementById('newWorkerPhone').value.trim();
        if (!phone.startsWith('+91')) phone = '+91 ' + phone.trim();
        
        const existingPhones = Array.from(document.querySelectorAll('.worker-phone')).map(el => el.textContent.trim());
        if (existingPhones.includes(phone)) {
            alert('Error: This phone number is already registered to another worker. Please use a unique phone number.');
            return;
        }
        
        const name = document.getElementById('newWorkerName').value;
        const role = document.getElementById('newWorkerRole').value;
        const zone = document.getElementById('newWorkerZone').value;
        const submitBtn = addWorkerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true; submitBtn.textContent = 'Registering...';

        try {
          const res = await fetch('/api/workers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, role, zone, status: 'Active' })
          });
          const data = await res.json();
          if(data.success) {
             addWorkerForm.reset();
             workerModal.classList.add('hide');
             fetchWorkers(); fetchDashboardStats();
          } else { alert('Failed to add worker: ' + data.message); }
        } catch(err) { alert('Error connecting to server.'); } 
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Register Staff'; }
      });
    }
    // Edit Task Modal Logic
    const editTaskModal = document.getElementById('editTaskModal');
    const closeEditTaskBtn = document.getElementById('closeEditTaskModalBtn');
    const editTaskForm = document.getElementById('editTaskForm');

    // --- Edit Map Interactions ---
    const editExpandBtn = document.getElementById('expandEditModalMapBtn');
    if(editExpandBtn) {
       editExpandBtn.addEventListener('click', () => {
          const mMap = document.getElementById('editModalMap');
          if(mMap.style.height === '400px') {
             mMap.style.height = '180px';
             editExpandBtn.innerHTML = '<i class="ph ph-arrows-out"></i> Expand Map';
          } else {
             mMap.style.height = '400px';
             editExpandBtn.innerHTML = '<i class="ph ph-arrows-in"></i> Collapse Map';
             setTimeout(() => mMap.scrollIntoView({behavior: "smooth", block: "center"}), 100);
          }
          if(window.editMapInstance) setTimeout(() => window.editMapInstance.invalidateSize(), 350);
       });
    }

    const fetchEditAddressCoords = async (addressStr) => {
       if(!addressStr) return;
       try {
           const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`);
           const data = await res.json();
           if(data && data.length > 0) {
             const lat = parseFloat(data[0].lat);
             const lng = parseFloat(data[0].lon);
             document.getElementById('editTaskLat').value = lat.toFixed(5);
             document.getElementById('editTaskLng').value = lng.toFixed(5);
             if (window.editMapInstance) {
               window.editMapInstance.flyTo([lat, lng], 17);
               if (window.editMapMarker) window.editMapInstance.removeLayer(window.editMapMarker);
               window.editMapMarker = L.marker([lat, lng]).addTo(window.editMapInstance);
             }
           }
       } catch(e) { console.error('Auto-fetch failed.', e); }
    };

    const editLocInput = document.getElementById('editTaskLoc');
    if (editLocInput) {
       editLocInput.addEventListener('change', async () => {
          if (editLocInput.value.trim().length > 3) {
             await fetchEditAddressCoords(editLocInput.value);
          }
       });
    }

    const eFetchBtn = document.getElementById('editAutoFetchCoordsBtn');
    if(eFetchBtn) eFetchBtn.addEventListener('click', async () => {
       eFetchBtn.textContent = '...';
       await fetchEditAddressCoords(document.getElementById('editTaskLoc').value);
       eFetchBtn.innerHTML = '<i class="ph ph-map-pin"></i> Auto-fetch from Address';
    });

    const eDeepBtn = document.getElementById('editModalMapSearchBtn');
    if(eDeepBtn) eDeepBtn.addEventListener('click', async () => {
       eDeepBtn.textContent = '...';
       await fetchEditAddressCoords(document.getElementById('editTaskLoc').value);
       eDeepBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Deep Search';
    });

    const eLatInput = document.getElementById('editTaskLat');
    const eLngInput = document.getElementById('editTaskLng');
    const updateEditMapFromInputs = () => {
       const lat = parseFloat(eLatInput.value);
       const lng = parseFloat(eLngInput.value);
       if (!isNaN(lat) && !isNaN(lng) && window.editMapInstance) {
          window.editMapInstance.flyTo([lat, lng], 16);
          if (window.editMapMarker) window.editMapInstance.removeLayer(window.editMapMarker);
          window.editMapMarker = L.marker([lat, lng]).addTo(window.editMapInstance);
       }
    };
    if(eLatInput) eLatInput.addEventListener('change', updateEditMapFromInputs);
    if(eLngInput) eLngInput.addEventListener('change', updateEditMapFromInputs);

    if(editTaskModal && closeEditTaskBtn) {
      closeEditTaskBtn.addEventListener('click', () => { editTaskModal.classList.add('hide'); window.currentRowBeingEdited = null; });
      editTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(window.currentRowBeingEdited) {
          const taskId = window.currentRowBeingEdited.getAttribute('data-id');
          const newTitle = document.getElementById('editTaskTitle').value;
          const newWorker = document.getElementById('editTaskWorker').value;
          const newLoc = document.getElementById('editTaskLoc').value;
          const newLat = parseFloat(document.getElementById('editTaskLat').value);
          const newLng = parseFloat(document.getElementById('editTaskLng').value);

          const submitBtn = editTaskForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          submitBtn.disabled = true; submitBtn.textContent = 'Saving...';
          try {
            const payload = {
              title: newTitle,
              assignedTo: newWorker,
            };
            if(!isNaN(newLat) && !isNaN(newLng)) {
              payload.location = { address: newLoc, lat: newLat, lng: newLng };
            } else {
              payload['location.address'] = newLoc;
            }
            const res = await fetch(`/api/tasks/${taskId}`, {
               method: 'PUT', headers: {'Content-Type': 'application/json'},
               body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) {
               await fetchTasks();
               await fetchDashboardStats();
               
               // Fly main map to the updated task location
               if(map && !isNaN(newLat) && !isNaN(newLng)) {
                  const dashTab = document.querySelector('[data-view="dashboard"]');
                  if(dashTab) dashTab.click();
                  setTimeout(() => map.setView([newLat, newLng], 17), 800);
               }
            }
          } catch(err) { console.error(err); } finally {
            submitBtn.disabled = false; submitBtn.innerHTML = originalText;
            editTaskModal.classList.add('hide'); window.currentRowBeingEdited = null;
          }
        }
      });
    }

    // Edit Worker Modal Logic
    const editWorkerModal = document.getElementById('editWorkerModal');
    const closeEditWorkerBtn = document.getElementById('closeEditWorkerModalBtn');
    const editWorkerForm = document.getElementById('editWorkerForm');
    if(editWorkerModal && closeEditWorkerBtn) {
      closeEditWorkerBtn.addEventListener('click', () => { editWorkerModal.classList.add('hide'); window.currentRowBeingEditedWorker = null; });
      editWorkerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(window.currentRowBeingEditedWorker) {
          let newPhone = document.getElementById('editWorkerPhone').value.trim();
          if (!newPhone.startsWith('+91')) newPhone = '+91 ' + newPhone.trim();
          
          const allPhoneCells = Array.from(document.querySelectorAll('.worker-phone'));
          const currentPhoneCell = window.currentRowBeingEditedWorker.querySelector('.worker-phone');
          const otherPhones = allPhoneCells.filter(el => el !== currentPhoneCell).map(el => el.textContent.trim());
          if (otherPhones.includes(newPhone)) {
             alert('Error: This phone number is already registered to another worker. Please use a unique phone number.');
             return;
          }
          const workerId = window.currentRowBeingEditedWorker.getAttribute('data-id');
          const newName = document.getElementById('editWorkerName').value;
          const newRole = document.getElementById('editWorkerRole').value;
          const newZone = document.getElementById('editWorkerZone').value;

          const submitBtn = editWorkerForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          submitBtn.disabled = true; submitBtn.textContent = 'Saving...';
          try {
            const res = await fetch(`/api/workers/${workerId}`, {
               method: 'PUT', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ name: newName, phone: newPhone, role: newRole, zone: newZone })
            });
            const data = await res.json();
            if(data.success) fetchWorkers();
          } catch(err) { console.error(err); } finally {
            submitBtn.disabled = false; submitBtn.innerHTML = originalText;
            editWorkerModal.classList.add('hide'); window.currentRowBeingEditedWorker = null;
          }
        }
      });
    }

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      const currentTheme = localStorage.getItem('theme') || 'light';
      if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
      } else {
        themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
      }

      themeToggleBtn.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
          document.body.removeAttribute('data-theme');
          localStorage.setItem('theme', 'light');
          themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
        } else {
          document.body.setAttribute('data-theme', 'dark');
          localStorage.setItem('theme', 'dark');
          themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
        }
      });
    }

  }
});

let map;
let taskMarkers = [];
function initMap() {
  const mapContainer = document.getElementById('map');
  if(!mapContainer || map) return; // already initialized

  // Center on India/Specific City for demo
  map = L.map('map').setView([19.0760, 72.8777], 13); // Mumbai coords

  const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
  });

  streetLayer.addTo(map);

  L.control.layers({
    "Detailed Street Map": streetLayer,
    "High-Res Satellite": satelliteLayer
  }).addTo(map);

}

async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();
    if(data.success) {
      document.getElementById('statWorkers').textContent = data.stats.totalWorkers || 0;
      document.getElementById('statPending').textContent = data.stats.pendingTasks || 0;
      document.getElementById('statCompleted').textContent = data.stats.completedTasks || 0;
      document.getElementById('statPresent').textContent = data.stats.presentToday || 0;
    }
  } catch(err) {
    console.log("Mocking stats for demo");
    document.getElementById('statWorkers').textContent = 145;
    document.getElementById('statPending').textContent = 23;
    document.getElementById('statCompleted').textContent = 112;
    document.getElementById('statPresent').textContent = 130;
  }

  // Live fetching from MongoDB Backend
  fetchAttendance();
  fetchTasks();
  fetchWorkers();
}

async function fetchAttendance() {
  const tbody = document.getElementById('attendanceTableBody');
  if(!tbody) return;
  try {
    const res = await fetch('/api/attendance');
    const data = await res.json();
    if(data.success) {
      tbody.innerHTML = data.logs.map(l => `
        <tr>
          <td>${l.worker ? l.worker.name : 'Unknown User'}</td>
          <td>${l.worker ? l.worker.zone : '-'}</td>
          <td>${new Date(l.createdAt).toLocaleTimeString()}</td>
          <td class="text-success">Verified</td>
          <td><span class="badge success-bg">Present</span></td>
        </tr>
      `).join('');
    }
  } catch(err) { console.error('Error fetching attendance:', err); }
}

async function fetchTasks() {
  const tbody = document.getElementById('tasksTableBody');
  if(!tbody) return;
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if(data.success) {
      if(map) {
         taskMarkers.forEach(m => map.removeLayer(m));
         taskMarkers = [];
      }
      tbody.innerHTML = data.tasks.map(l => {
        if(map && l.location && l.location.lat && l.location.lng && l.status !== 'Completed' && l.status !== 'Verified') {
           const m = L.marker([l.location.lat, l.location.lng]).addTo(map)
             .bindPopup(`<b>Task: ${l.title}</b><br>Assigned to: ${l.assignedTo}<br>Status: ${l.status}`);
           taskMarkers.push(m);
        }
        return `
        <tr data-id="${l._id}">
          <td class="task-title"><strong>${l.title}</strong></td>
          <td class="task-worker">${l.assignedTo || 'Unassigned'}</td>
          <td class="task-loc">${l.location?.address || ''} <br><small>(${l.location?.lat||0}, ${l.location?.lng||0})</small></td>
          <td class="status-cell"><span class="badge bg-status-${l.status.replace(' ', '-').toLowerCase()}">${l.status}</span></td>
          <td class="task-actions" style="display:flex; gap:0.5rem; align-items:center;">
            ${l.status === 'Draft' ? `
              <button class="action-btn btn-edit edit-task-btn" onclick="editTask(this)"><i class="ph ph-pencil-simple"></i> Edit</button>
              <button class="action-btn btn-confirm confirm-task-btn" onclick="confirmTask(this)"><i class="ph ph-check-circle"></i> Confirm</button>
              <button class="action-btn btn-simulate simulate-worker-btn" style="display:none;" onclick="simulateWorkerAction(this, ${l.location?.lat||0}, ${l.location?.lng||0})"><i class="ph ph-camera"></i> Simulate</button>
            ` : (l.status === 'Completed' || l.status === 'Verified' ? `<span class="text-success" style="font-weight:600;"><i class="ph ph-check-circle"></i> Verified</span>` : `<button class="action-btn btn-simulate simulate-worker-btn" onclick="simulateWorkerAction(this, ${l.location?.lat||0}, ${l.location?.lng||0})"><i class="ph ph-camera"></i> Simulate</button>`)}
          </td>
        </tr>
      `;
      }).join('');
    }
  } catch(err) { console.error('Error fetching tasks:', err); }
}

async function fetchWorkers() {
  const tbody = document.getElementById('workersTableBody');
  const taskSelect = document.getElementById('newTaskWorker');
  if(taskSelect) taskSelect.innerHTML = '';
  
  if(!tbody) return;
  try {
    const res = await fetch('/api/workers');
    const data = await res.json();
    if(data.success) {
      tbody.innerHTML = data.workers.map(l => `
        <tr data-id="${l._id}">
          <td class="worker-name">${l.name}</td>
          <td class="worker-phone">${l.phone}</td>
          <td class="worker-role">${l.role}</td>
          <td class="worker-zone">${l.zone}</td>
          <td class="${l.status === 'Active' ? 'text-success' : 'text-danger'}"><strong>${l.status}</strong></td>
          <td><button class="action-btn btn-edit" onclick="editWorker(this)"><i class="ph ph-pencil-simple"></i> Edit</button></td>
        </tr>
      `).join('');
      
      if(taskSelect) {
         data.workers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.name;
            opt.textContent = w.name;
            taskSelect.appendChild(opt);
         });
      }
    }
  } catch(err) { console.error('Error fetching workers:', err); }
}

// Haversine formula for strict 100m geofence validation
window.simulateWorkerAction = function(btnEl, targetLat, targetLng) {
  // Mock worker being slightly offset (~50 meters away) to make testing easy
  const currentLat = window.prompt("Simulate Worker's Current Latitude:", (targetLat + 0.0004).toFixed(5));
  const currentLng = window.prompt("Simulate Worker's Current Longitude:", (targetLng + 0.0004).toFixed(5));
  
  if(!currentLat || !currentLng) return;
  
  const R = 6371e3; // Earth radius in metres
  const phi1 = parseFloat(currentLat) * Math.PI/180;
  const phi2 = targetLat * Math.PI/180;
  const deltaPhi = (targetLat - parseFloat(currentLat)) * Math.PI/180;
  const deltaLambda = (targetLng - parseFloat(currentLng)) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = Math.round(R * c);

  if(distance <= 100) {
    window.alert(`Success! Worker is ${distance} meters away (within 100m geofence). Task marked as completed with Photo Proof!`);
    const tr = btnEl.closest('tr');
    const taskId = tr.getAttribute('data-id');
    
    if(taskId) {
       btnEl.textContent = '...';
       fetch(`/api/tasks/${taskId}`, {
          method: 'PUT', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ status: 'Completed', completedAt: new Date() })
       }).then(() => { fetchTasks(); fetchDashboardStats(); });
    }
  } else {
    window.alert(`Geofence Error: Worker is ${distance} meters away!\n\nYou must be within 100m of (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}) to check in and click a selfie.`);
  }
};

window.currentRowBeingEditedWorker = null;

window.editWorker = function(btn) {
  window.currentRowBeingEditedWorker = btn.closest('tr');
  const name = window.currentRowBeingEditedWorker.querySelector('.worker-name').textContent;
  const phone = window.currentRowBeingEditedWorker.querySelector('.worker-phone').textContent;
  const role = window.currentRowBeingEditedWorker.querySelector('.worker-role').textContent;
  const zone = window.currentRowBeingEditedWorker.querySelector('.worker-zone').textContent;

  document.getElementById('editWorkerName').value = name;
  document.getElementById('editWorkerPhone').value = phone;
  
  const roleSelect = document.getElementById('editWorkerRole');
  if(roleSelect) roleSelect.value = role;
  
  document.getElementById('editWorkerZone').value = zone;
  
  const editWorkerModal = document.getElementById('editWorkerModal');
  if(editWorkerModal) editWorkerModal.classList.remove('hide');
};

window.currentRowBeingEdited = null;

window.editTask = function(btn) {
  window.currentRowBeingEdited = btn.closest('tr');
  const title = window.currentRowBeingEdited.querySelector('.task-title strong').textContent;
  const worker = window.currentRowBeingEdited.querySelector('.task-worker').textContent;
  const locNode = window.currentRowBeingEdited.querySelector('.task-loc').childNodes[0];
  const loc = locNode ? locNode.nodeValue.trim() : '';

  document.getElementById('editTaskTitle').value = title;
  
  const workerSelect = document.getElementById('editTaskWorker');
  if(workerSelect && !Array.from(workerSelect.options).some(o => o.value === worker)) {
     const opt = document.createElement('option');
     opt.value = worker;
     opt.textContent = worker;
     workerSelect.appendChild(opt);
  }
  if(workerSelect) workerSelect.value = worker;

  document.getElementById('editTaskLoc').value = loc;

  let lat = 0, lng = 0;
  const smallNode = window.currentRowBeingEdited.querySelector('.task-loc small');
  if(smallNode) {
     const text = smallNode.textContent; // "(19.05, 72.88)"
     const coordsStr = text.replace(/[\(\)]/g, '').split(',');
     if(coordsStr.length === 2) {
       lat = parseFloat(coordsStr[0]);
       lng = parseFloat(coordsStr[1]);
     }
  }
  document.getElementById('editTaskLat').value = isNaN(lat) || lat === 0 ? '' : lat;
  document.getElementById('editTaskLng').value = isNaN(lng) || lng === 0 ? '' : lng;
  
  const editModal = document.getElementById('editTaskModal');
  if(editModal) {
    editModal.classList.remove('hide');
    if(!window.editMapInstance) {
       setTimeout(() => {
          let startLat = isNaN(lat) || lat === 0 ? 19.0760 : lat;
          let startLng = isNaN(lng) || lng === 0 ? 72.8777 : lng;
          window.editMapInstance = L.map('editModalMap').setView([startLat, startLng], 15);
          const modalStreet = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 });
          const modalSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
          modalStreet.addTo(window.editMapInstance);
          L.control.layers({"Street": modalStreet, "Satellite (Detailed)": modalSat}).addTo(window.editMapInstance);

          window.editMapInstance.on('click', (e) => {
             document.getElementById('editTaskLat').value = e.latlng.lat.toFixed(5);
             document.getElementById('editTaskLng').value = e.latlng.lng.toFixed(5);
             if(window.editMapMarker) window.editMapInstance.removeLayer(window.editMapMarker);
             window.editMapMarker = L.marker(e.latlng).addTo(window.editMapInstance);
          });
          
          if(!isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0) {
             window.editMapMarker = L.marker([lat, lng]).addTo(window.editMapInstance);
          }
       }, 300);
    } else {
       setTimeout(() => {
          window.editMapInstance.invalidateSize();
          let newLat = isNaN(lat) || lat === 0 ? 19.0760 : lat;
          let newLng = isNaN(lng) || lng === 0 ? 72.8777 : lng;
          window.editMapInstance.setView([newLat, newLng], 15);
          if(window.editMapMarker) window.editMapInstance.removeLayer(window.editMapMarker);
          if(!isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0) {
             window.editMapMarker = L.marker([lat, lng]).addTo(window.editMapInstance);
          }
       }, 300);
    }
  }
};

window.confirmTask = async function(btn) {
  if(!window.confirm("Are you sure you want to finalize and confirm this task assignment? You won't be able to edit it afterward.")) return;
  const row = btn.closest('tr');
  const taskId = row.getAttribute('data-id');
  btn.textContent = '...';
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ status: 'Pending' })
    });
    if(res.ok) { fetchTasks(); fetchDashboardStats(); }
  } catch(err) { console.error(err); }
};
