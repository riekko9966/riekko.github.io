(function () {
  const tableBody = document.getElementById('song-table-body');
  const emptyState = document.getElementById('empty-state');
  const errorState = document.getElementById('error-state');
  const headers = document.querySelectorAll('#song-table thead th');

  let songs = [];
  let sortKey = 'dateAdded';
  let sortDir = 'desc'; // 'asc' | 'desc'

  function parseDate(str) {
    // Expects d.m.yyyy, e.g. 23.4.2026
    const parts = String(str).split('.').map(s => parseInt(s, 10));
    const [day, month, year] = parts;
    return new Date(year, (month || 1) - 1, day || 1);
  }

  function ratingColor(rating) {
    // Simple three-band scale, like an old-fashioned rating badge.
    if (rating <= 3) return '#C0392B';   // red
    if (rating <= 6) return '#D68910';   // amber
    return '#2E8B57';                    // green
  }

  function sortSongs() {
    const type = document.querySelector(`th[data-key="${sortKey}"]`).dataset.type;
    const dir = sortDir === 'asc' ? 1 : -1;

    songs.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];

      if (type === 'number') {
        va = Number(va);
        vb = Number(vb);
      } else if (type === 'date') {
        va = parseDate(va);
        vb = parseDate(vb);
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }

  function updateHeaderState() {
    headers.forEach(th => {
      th.classList.remove('sorted');
      const arrow = th.querySelector('.arrow');
      if (arrow) arrow.textContent = '';
    });
    const activeTh = document.querySelector(`th[data-key="${sortKey}"]`);
    if (activeTh) {
      activeTh.classList.add('sorted');
      let arrow = activeTh.querySelector('.arrow');
      if (!arrow) {
        arrow = document.createElement('span');
        arrow.className = 'arrow';
        activeTh.appendChild(arrow);
      }
      arrow.textContent = sortDir === 'asc' ? '▲' : '▼';
    }
  }

  function render() {
    if (!songs.length) {
      tableBody.innerHTML = '';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    sortSongs();
    updateHeaderState();

    tableBody.innerHTML = songs.map(song => {
      const color = ratingColor(song.rating);
      return `
        <tr>
          <td class="title-cell">${escapeHtml(song.title)}</td>
          <td class="artist-cell">${escapeHtml(song.artist || '')}</td>
          <td class="rating-cell align-right">
            <span class="rating-pill" style="background:${color}">${song.rating}</span>
          </td>
          <td>${escapeHtml(song.genre)}</td>
          <td>${escapeHtml(song.country)}</td>
          <td class="date-cell align-right">${escapeHtml(song.dateAdded)}</td>
        </tr>
      `;
    }).join('');

    renderStats();
  }

  function renderStats() {
    const total = songs.length;
    const avg = (songs.reduce((sum, s) => sum + Number(s.rating), 0) / total).toFixed(1);
    const genres = new Set(songs.map(s => s.genre)).size;
    const countries = new Set(songs.map(s => s.country)).size;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-average').textContent = avg;
    document.getElementById('stat-genres').textContent = genres;
    document.getElementById('stat-countries').textContent = countries;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  headers.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = 'asc';
      }
      render();
    });
  });

  fetch('songs.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      songs = Array.isArray(data) ? data : [];
      render();
    })
    .catch(err => {
      console.error('Failed to load songs.json:', err);
      errorState.hidden = false;
    });
})();
