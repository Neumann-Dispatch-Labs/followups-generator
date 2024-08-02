const dbFolder = '/db/';
const dbFile = 'trucks.json';

let trucks = {};
let darkMode = true;

function showNotification(message, type = 'info') {
    const toast = new bootstrap.Toast(document.getElementById('notification'));
    const toastBody = document.querySelector('.toast-body');
    toastBody.textContent = message;
    document.getElementById('notification').classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    document.getElementById('notification').classList.add(`bg-${type}`);
    toast.show();
}

async function loadTrucks() {
    try {
        const response = await fetch(dbFolder + dbFile);
        trucks = await response.json();
    } catch (error) {
        console.error('Error loading trucks:', error);
        trucks = {};
        showNotification('Error loading trucks. Starting with an empty list.', 'warning');
    }
    updateTruckList();
}

async function saveTrucks() {
    try {
        await fetch(dbFolder + dbFile, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trucks),
        });
        showNotification('Trucks saved successfully.', 'success');
    } catch (error) {
        console.error('Error saving trucks:', error);
        showNotification('Error saving trucks. Please try again.', 'danger');
    }
}

function updateTruckList() {
    const truckList = document.getElementById('truckList');
    truckList.innerHTML = '';
    for (const [truckNumber, data] of Object.entries(trucks)) {
        const row = truckList.insertRow();
        row.innerHTML = `
            <td>${truckNumber}</td>
            <td>${data.route}</td>
            <td class="status-${data.status}">${data.status}</td>
            <td>${data.additionalNotes || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-btn" data-truck="${truckNumber}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-truck="${truckNumber}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
    }
    updateFollowUps();
}

function updateFollowUps() {
    const followUps = document.getElementById('followUps');
    let text = 'Follow-ups\n';
    for (const [truckNumber, data] of Object.entries(trucks)) {
        const route = data.route.split('-');
        const origin = route[0];
        const destination = route[route.length - 1];
        let status = data.status;
        if (status === 'Rolling' || status === 'Deadhead') {
            status = `${status} to ${destination}`;
        } else if (status === 'Ready') {
            status = `Ready at ${data.readyLocation || ''}`;
        }
        if (data.additionalNotes) {
            status += `. ${data.additionalNotes}`;
        }
        text += `${truckNumber} - (${origin}-${destination}) ${status}.\n`;
    }
    followUps.value = text;
}

document.getElementById('truckForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const truckNumber = document.getElementById('truckNumber').value;
    const route = document.getElementById('route').value;
    const status = document.getElementById('status').value;
    const additionalNotes = document.getElementById('additionalNotes').value;

    if (status === 'Ready') {
        showReadyLocationModal(truckNumber, route, additionalNotes);
    } else {
        addTruck(truckNumber, route, status, additionalNotes);
    }
});

function addTruck(truckNumber, route, status, additionalNotes, readyLocation = '') {
    trucks[truckNumber] = { route, status, additionalNotes, readyLocation };
    saveTrucks();
    updateTruckList();
    document.getElementById('truckForm').reset();
    showNotification(`Truck ${truckNumber} added successfully.`, 'success');
}

function showReadyLocationModal(truckNumber, route, additionalNotes) {
    const modal = new bootstrap.Modal(document.getElementById('readyLocationModal'));
    modal.show();
    document.getElementById('confirmReadyLocation').onclick = function() {
        const readyLocation = document.getElementById('readyLocation').value;
        addTruck(truckNumber, route, 'Ready', additionalNotes, readyLocation);
        modal.hide();
    };
}

document.getElementById('truckList').addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn') || e.target.parentElement.classList.contains('edit-btn')) {
        const truckNumber = e.target.closest('button').dataset.truck;
        const truck = trucks[truckNumber];
        document.getElementById('editTruckNumber').value = truckNumber;
		document.getElementById('editRoute').value = truck.route;
                document.getElementById('editStatus').value = truck.status;
                document.getElementById('editAdditionalNotes').value = truck.additionalNotes;
                new bootstrap.Modal(document.getElementById('editModal')).show();
            } else if (e.target.classList.contains('delete-btn') || e.target.parentElement.classList.contains('delete-btn')) {
                const truckNumber = e.target.closest('button').dataset.truck;
                showDeleteConfirmModal(truckNumber);
            }
        });

        function showDeleteConfirmModal(truckNumber) {
            const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            modal.show();
            document.getElementById('confirmDelete').onclick = function() {
                delete trucks[truckNumber];
                saveTrucks();
                updateTruckList();
                modal.hide();
                showNotification(`Truck ${truckNumber} deleted successfully.`, 'success');
            };
        }

        document.getElementById('updateTruck').addEventListener('click', function() {
            const truckNumber = document.getElementById('editTruckNumber').value;
            const route = document.getElementById('editRoute').value;
            const status = document.getElementById('editStatus').value;
            const additionalNotes = document.getElementById('editAdditionalNotes').value;

            if (status === 'Ready') {
                showReadyLocationModal(truckNumber, route, additionalNotes);
            } else {
                trucks[truckNumber] = { route, status, additionalNotes };
                saveTrucks();
                updateTruckList();
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                showNotification(`Truck ${truckNumber} updated successfully.`, 'success');
            }
        });

        document.getElementById('copyButton').addEventListener('click', function() {
            const followUps = document.getElementById('followUps');
            followUps.select();
            document.execCommand('copy');
            this.innerHTML = '<i class="bi bi-clipboard-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = '<i class="bi bi-clipboard"></i> Copy to Clipboard';
            }, 2000);
            showNotification('Follow-ups copied to clipboard.', 'success');
        });

        function updateTimezones() {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' };

            document.getElementById('pacific').textContent = `PT: ${now.toLocaleString('en-US', { ...options, timeZone: 'America/Los_Angeles' })}`;
            document.getElementById('mountain').textContent = `MT: ${now.toLocaleString('en-US', { ...options, timeZone: 'America/Denver' })}`;
            document.getElementById('central').textContent = `CT: ${now.toLocaleString('en-US', { ...options, timeZone: 'America/Chicago' })}`;
            document.getElementById('eastern').textContent = `ET: ${now.toLocaleString('en-US', { ...options, timeZone: 'America/New_York' })}`;
        }

        function toggleDarkMode() {
            darkMode = !darkMode;
            document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
            const icon = document.querySelector('#darkModeToggle i');
            icon.classList.toggle('bi-moon-fill', darkMode);
            icon.classList.toggle('bi-sun-fill', !darkMode);
        }

        document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

        updateTimezones();
        setInterval(updateTimezones, 60000); // Update every minute

        loadTrucks();
