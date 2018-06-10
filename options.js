// Saves options to chrome.storage
function save_options() {
    var sort = document.getElementById('sort').value;
    var dark = document.getElementById('dark').checked;

    chrome.storage.sync.set({
      sort: sort,
      dark: dark
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      document.body.classList.toggle("dark", dark);
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    chrome.storage.sync.get({
      sort: 'score',
      dark: false
    }, function(items) {
      document.getElementById('sort').value = items.sort;
      document.getElementById('dark').checked = items.dark;
      document.body.classList.toggle("dark", items.dark);
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);