// ─── CONFIG ──────────────────────────────────────────
// ⚠️ REPLACE WITH YOUR SUPABASE CREDENTIALS ⚠️
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ─── STATE ──────────────────────────────────────────
let allJournals = [];
let allFaculty = [];
let allNews = [];
let allProgrammes = [];
let adminSession = null;
let supabase = null;

// ─── INIT ────────────────────────────────────────────
function init() {
    console.log('🚀 Initializing...');
    try {
        if (SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized');
        } else {
            console.warn('⚠️ Please replace SUPABASE_URL and SUPABASE_ANON_KEY');
            supabase = window.supabase.createClient(
                'https://your-project.supabase.co',
                'your-anon-key'
            );
        }

        // Check for existing session
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                adminSession = data.session;
                console.log('✅ Found existing admin session');
            }
        }).catch(() => {});

        // Load all data
        refreshAllData();

        // Setup admin link
        document.getElementById('adminLink').addEventListener('click', function(e) {
            e.preventDefault();
            if (adminSession) {
                showPage('admin');
                loadAdminDashboard();
            } else {
                showPage('admin-login');
            }
        });

        console.log('✅ Site initialized successfully');
    } catch (e) {
        console.error('❌ Init error:', e);
        showToast('Error initializing: ' + e.message, 'error');
    }
}

// ─── UTILITY FUNCTIONS ──────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return 'Invalid date';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch { return 'Invalid date'; }
}

function getBadgeColor(tag) {
    const colors = {
        'Urban Studies': 'badge-urban',
        'Policy': 'badge-policy',
        'Gender': 'badge-gender',
        'Rural': 'badge-sociology',
        'Politics': 'badge-policy',
        'Identity': 'badge-dev',
        'Social Capital': 'badge-sociology',
        'Youth': 'badge-urban',
        'Religion': 'badge-gender',
        'Health': 'badge-dev',
        'Climate': 'badge-urban',
        'Displacement': 'badge-policy'
    };
    return colors[tag] || 'badge-sociology';
}

// ─── PAGE NAVIGATION ─────────────────────────────────
function showPage(page) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('#mainNav a').forEach(a => a.classList.remove('active'));
    const navLink = document.querySelector(`#mainNav a[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    document.getElementById('mainNav').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log(`📄 Switched to page: ${page}`);
}

function toggleMobileMenu() {
    document.getElementById('mainNav').classList.toggle('open');
}

function togglePanel(header) {
    const body = header.nextElementSibling;
    if (body.style.display === 'none' || !body.style.display) {
        body.style.display = 'block';
        header.querySelector('span:last-child').textContent = '▼';
    } else {
        body.style.display = 'none';
        header.querySelector('span:last-child').textContent = '›';
    }
}

// ─── DATA FETCHING ──────────────────────────────────
async function fetchJournals() {
    try {
        const { data, error } = await supabase
            .from('journals')
            .select('*')
            .order('year', { ascending: false })
            .order('volume', { ascending: false });
        if (error) throw error;
        allJournals = data || [];
        console.log(`📚 Loaded ${allJournals.length} journals`);
        return allJournals;
    } catch (e) {
        console.error('Error fetching journals:', e);
        return [];
    }
}

async function fetchFaculty() {
    try {
        const { data, error } = await supabase
            .from('faculty')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) throw error;
        allFaculty = data || [];
        console.log(`👨‍🏫 Loaded ${allFaculty.length} faculty members`);
        return allFaculty;
    } catch (e) {
        console.error('Error fetching faculty:', e);
        return [];
    }
}

async function fetchNews() {
    try {
        const { data, error } = await supabase
            .from('news_events')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        allNews = data || [];
        console.log(`📰 Loaded ${allNews.length} news items`);
        return allNews;
    } catch (e) {
        console.error('Error fetching news:', e);
        return [];
    }
}

async function fetchProgrammes() {
    try {
        const { data, error } = await supabase
            .from('programmes')
            .select('*')
            .order('level', { ascending: true });
        if (error) throw error;
        allProgrammes = data || [];
        console.log(`🎓 Loaded ${allProgrammes.length} programmes`);
        return allProgrammes;
    } catch (e) {
        console.error('Error fetching programmes:', e);
        return [];
    }
}

async function refreshAllData() {
    console.log('🔄 Refreshing all data...');
    await Promise.all([fetchJournals(), fetchFaculty(), fetchNews(), fetchProgrammes()]);
    renderHomePage();
    renderAllPages();
}

// ─── RENDER FUNCTIONS ──────────────────────────────
function renderJournalCard(article) {
    const tags = article.tags || [];
    return `
        <div class="journal-card">
            <div class="journal-meta">
                <span class="journal-vol">Vol. ${article.volume} · ${article.year}</span>
                <span class="journal-year">${formatDate(article.published_date)}</span>
            </div>
            <h3>${article.title}</h3>
            <div class="authors">${article.authors}</div>
            <p class="journal-abstract">${article.abstract}</p>
            <div class="journal-card-footer">
                <div class="badge-area">
                    ${tags.slice(0, 2).map(tag => `<span class="badge ${getBadgeColor(tag)}">${tag}</span>`).join('')}
                </div>
                <button class="read-btn" onclick="viewArticle('${article.slug}')">Read →</button>
            </div>
        </div>
    `;
}

function renderFacultyCard(member) {
    const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return `
        <div class="faculty-card">
            <div class="faculty-photo">
                ${member.photo_url ? `<img src="${member.photo_url}" alt="${member.name}" loading="lazy">` : initials}
            </div>
            <div class="faculty-info">
                <h4>${member.name}</h4>
                <div class="title">${member.title}</div>
                <div class="specialization">${member.specialization}</div>
            </div>
        </div>
    `;
}

function renderNewsItem(item) {
    const date = new Date(item.date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const typeClass = {
        'Seminar': 'type-event',
        'Call for Papers': 'type-call',
        'Department News': 'type-news',
        'Workshop': 'type-event'
    }[item.type] || 'type-news';
    return `
        <div class="news-item">
            <div class="news-date-block">
                <span class="day">${date.getDate()}</span>
                <span class="month">${monthNames[date.getMonth()]}</span>
            </div>
            <div>
                <span class="news-type ${typeClass}">${item.type}</span>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `;
}

function renderProgrammeCard(programme) {
    const levelColors = {
        'B.Sc': '#3b82f6',
        'M.Sc': '#22c55e',
        'PhD': '#a855f7'
    };
    return `
        <div style="border-left:4px solid ${levelColors[programme.level] || '#ccc'};background:white;border-radius:10px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                <h3 style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--text-primary);">${programme.title}</h3>
                <span style="font-size:12px;font-weight:600;background:#f5f5f5;padding:2px 10px;border-radius:100px;">${programme.level}</span>
            </div>
            <p style="color:var(--text-secondary);font-size:14px;margin-bottom:0.5rem;">${programme.description}</p>
            ${programme.duration ? `<p style="font-size:12px;color:var(--text-muted);">⏱️ Duration: ${programme.duration}</p>` : ''}
        </div>
    `;
}

// ─── VIEW ARTICLE ──────────────────────────────────
async function viewArticle(slug) {
    try {
        const { data: article, error } = await supabase
            .from('journals')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error) throw error;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; overflow-y: auto;
        `;
        modal.innerHTML = `
            <div style="background:white;border-radius:12px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;padding:2rem;position:relative;">
                <button onclick="this.closest('div[style]').remove()" style="position:sticky;top:0;float:right;background:none;border:none;font-size:28px;cursor:pointer;z-index:10;color:#666;">✕</button>
                <h1 style="font-family:'Playfair Display',serif;font-size:1.8rem;color:var(--text-primary);margin-bottom:0.5rem;">${article.title}</h1>
                <p style="color:var(--text-muted);font-style:italic;margin-bottom:1rem;">${article.authors}</p>
                <p style="font-size:14px;color:var(--text-muted);margin-bottom:1.5rem;">Vol. ${article.volume} · ${article.year} · Published: ${formatDate(article.published_date)}</p>
                <h2 style="font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:0.5rem;">Abstract</h2>
                <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:1.5rem;">${article.abstract}</p>
                <div style="background:#f8f8f8;border-left:4px solid var(--kasu-gold);padding:1rem;border-radius:4px;margin-bottom:1.5rem;">
                    <p style="font-size:13px;color:var(--text-muted);"><strong>Keywords:</strong> ${(article.tags || []).join(', ') || 'None'}</p>
                </div>
                ${article.pdf_url ? `<a href="${article.pdf_url}" target="_blank" class="btn-primary" style="display:inline-block;">Download PDF</a>` : '<p style="color:var(--text-muted);">PDF not available</p>'}
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (e) {
        console.error('Error loading article:', e);
        showToast('Error loading article', 'error');
    }
}

// ─── SEARCH ──────────────────────────────────────────
function searchJournals() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('featuredJournals');
    const filtered = allJournals.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.authors.toLowerCase().includes(query) ||
        (j.tags || []).some(t => t.toLowerCase().includes(query)) ||
        j.abstract.toLowerCase().includes(query)
    );
    container.innerHTML = filtered.map(renderJournalCard).join('') || '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No articles found.</p>';
}

function searchJournalsPage() {
    const query = document.getElementById('searchJournalsPage').value.toLowerCase();
    const container = document.getElementById('allJournalsGrid');
    const filtered = allJournals.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.authors.toLowerCase().includes(query) ||
        (j.tags || []).some(t => t.toLowerCase().includes(query)) ||
        j.abstract.toLowerCase().includes(query)
    );
    container.innerHTML = filtered.map(renderJournalCard).join('') || '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No articles found.</p>';
}

// ─── RENDER PAGES ──────────────────────────────────
function renderHomePage() {
    // Featured Journals
    const featuredContainer = document.getElementById('featuredJournals');
    const featured = allJournals.slice(0, 6);
    featuredContainer.innerHTML = featured.map(renderJournalCard).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No articles found. Add some in the admin panel!</p>';

    // Home News
    const newsContainer = document.getElementById('homeNewsList');
    const newsItems = allNews.slice(0, 4);
    newsContainer.innerHTML = newsItems.map(renderNewsItem).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No news found.</p>';

    // Home Faculty
    const facultyContainer = document.getElementById('homeFacultyGrid');
    const facultyItems = allFaculty.slice(0, 8);
    facultyContainer.innerHTML = facultyItems.map(renderFacultyCard).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No faculty found.</p>';

    // Archive list
    const archiveContainer = document.getElementById('archiveList');
    const volumes = [...new Set(allJournals.map(j => `Volume ${j.volume} (${j.year})`))];
    archiveContainer.innerHTML = volumes.map(v => `<li>${v}</li>`).join('') || '<li>No volumes</li>';

    // Update stats
    const yearsOfPublication = allJournals.length ?
        new Date().getFullYear() - Math.min(...allJournals.map(j => j.year)) + 1 :
        0;
    const uniqueTags = new Set(allJournals.flatMap(j => j.tags || []));
    document.getElementById('statYears').textContent = `${yearsOfPublication}+`;
    document.getElementById('statAreas').textContent = uniqueTags.size || 6;
    document.getElementById('statArticles').textContent = `${allJournals.length}+`;
    document.getElementById('statFaculty').textContent = allFaculty.length || 48;
}

function renderAllPages() {
    // All Journals
    const allJournalsContainer = document.getElementById('allJournalsGrid');
    allJournalsContainer.innerHTML = allJournals.map(renderJournalCard).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No articles found.</p>';

    // All Faculty
    const allFacultyContainer = document.getElementById('allFacultyGrid');
    allFacultyContainer.innerHTML = allFaculty.map(renderFacultyCard).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No faculty found.</p>';

    // All News
    const allNewsContainer = document.getElementById('allNewsList');
    allNewsContainer.innerHTML = allNews.map(renderNewsItem).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No news found.</p>';

    // Programmes
    const programmesContainer = document.getElementById('programmesGrid');
    programmesContainer.innerHTML = allProgrammes.map(renderProgrammeCard).join('') ||
        '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No programmes found.</p>';
}

// ─── SUBMIT PAPER ──────────────────────────────────
function submitPaper(event) {
    event.preventDefault();
    showToast('Thank you! Your submission has been received. Our team will review it shortly.', 'success');
    document.querySelectorAll('form[id*="submissionForm"]').forEach(form => form.reset());
    showPage('home');
}

// ─── ADMIN FUNCTIONS ─────────────────────────────────

function isAdminLoggedIn() {
    return adminSession !== null;
}

async function adminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminLoginError');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        adminSession = data.session;
        document.getElementById('adminLoginForm').reset();
        errorEl.style.display = 'none';
        showToast('Login successful!', 'success');
        showPage('admin');
        loadAdminDashboard();
    } catch (e) {
        errorEl.textContent = e.message || 'Invalid email or password';
        errorEl.style.display = 'block';
    }
}

async function adminLogout() {
    await supabase.auth.signOut();
    adminSession = null;
    showToast('Logged out', 'info');
    showPage('home');
}

function showAdminPage(page) {
    document.querySelectorAll('.admin-content > div').forEach(el => el.style.display = 'none');
    const target = document.getElementById(`admin-${page}`);
    if (target) target.style.display = 'block';
    document.querySelectorAll('.admin-sidebar nav a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.admin-sidebar nav a[data-admin="${page}"]`);
    if (link) link.classList.add('active');
    if (page === 'dashboard') loadAdminDashboard();
    if (page === 'journals') loadAdminJournals();
    if (page === 'faculty') loadAdminFaculty();
    if (page === 'news') loadAdminNews();
    if (page === 'programmes') loadAdminProgrammes();
}

function showAdminForm(type) {
    const formId = `admin${type.charAt(0).toUpperCase() + type.slice(1)}Form`;
    const el = document.getElementById(formId);
    if (el) {
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideAdminForm(type) {
    const formId = `admin${type.charAt(0).toUpperCase() + type.slice(1)}Form`;
    const el = document.getElementById(formId);
    if (el) el.style.display = 'none';
}

// ─── LOAD ADMIN DATA ─────────────────────────────────

async function loadAdminDashboard() {
    try {
        const [{ count: journalCount }, { count: facultyCount }, { count: newsCount }, { count: programmeCount }] =
        await Promise.all([
            supabase.from('journals').select('*', { count: 'exact', head: true }),
            supabase.from('faculty').select('*', { count: 'exact', head: true }),
            supabase.from('news_events').select('*', { count: 'exact', head: true }),
            supabase.from('programmes').select('*', { count: 'exact', head: true })
        ]);
        document.getElementById('adminStatJournals').textContent = journalCount || 0;
        document.getElementById('adminStatFaculty').textContent = facultyCount || 0;
        document.getElementById('adminStatNews').textContent = newsCount || 0;
        document.getElementById('adminStatProgrammes').textContent = programmeCount || 0;
    } catch (e) {
        console.error('Error loading dashboard:', e);
    }
}

async function loadAdminJournals() {
    try {
        const { data, error } = await supabase
            .from('journals')
            .select('*')
            .order('year', { ascending: false })
            .order('volume', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('adminJournalList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No journals yet. Click "New Article" to add one.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Title</th><th>Authors</th><th>Vol/Year</th><th>Actions</th></tr></thead>
                <tbody>
                    ${data.map(j => `
                        <tr>
                            <td>${j.title}</td>
                            <td>${j.authors}</td>
                            <td>Vol.${j.volume} (${j.year})</td>
                            <td>
                                <div class="actions">
                                    <button class="delete-btn" onclick="deleteJournal('${j.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        console.error('Error loading admin journals:', e);
        document.getElementById('adminJournalList').innerHTML = '<p style="color:red;">Error loading journals</p>';
    }
}

async function loadAdminFaculty() {
    try {
        const { data, error } = await supabase
            .from('faculty')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) throw error;
        const container = document.getElementById('adminFacultyList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No faculty members yet. Click "Add Faculty" to add one.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Name</th><th>Title</th><th>Specialization</th><th>Actions</th></tr></thead>
                <tbody>
                    ${data.map(f => `
                        <tr>
                            <td>${f.name}</td>
                            <td>${f.title}</td>
                            <td>${f.specialization}</td>
                            <td>
                                <div class="actions">
                                    <button class="delete-btn" onclick="deleteFaculty('${f.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        console.error('Error loading admin faculty:', e);
        document.getElementById('adminFacultyList').innerHTML = '<p style="color:red;">Error loading faculty</p>';
    }
}

async function loadAdminNews() {
    try {
        const { data, error } = await supabase
            .from('news_events')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('adminNewsList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No news yet. Click "Add News" to add one.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                    ${data.map(n => `
                        <tr>
                            <td>${n.title}</td>
                            <td>${n.type}</td>
                            <td>${new Date(n.date).toLocaleDateString()}</td>
                            <td>
                                <div class="actions">
                                    <button class="delete-btn" onclick="deleteNews('${n.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        console.error('Error loading admin news:', e);
        document.getElementById('adminNewsList').innerHTML = '<p style="color:red;">Error loading news</p>';
    }
}

async function loadAdminProgrammes() {
    try {
        const { data, error } = await supabase
            .from('programmes')
            .select('*')
            .order('level', { ascending: true });
        if (error) throw error;
        const container = document.getElementById('adminProgrammesList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No programmes yet. Click "Add Programme" to add one.</p>';
            return;
        }
        container.innerHTML = `
            <table>
                <thead><tr><th>Title</th><th>Level</th><th>Duration</th><th>Actions</th></tr></thead>
                <tbody>
                    ${data.map(p => `
                        <tr>
                            <td>${p.title}</td>
                            <td>${p.level}</td>
                            <td>${p.duration || '-'}</td>
                            <td>
                                <div class="actions">
                                    <button class="delete-btn" onclick="deleteProgramme('${p.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        console.error('Error loading admin programmes:', e);
        document.getElementById('adminProgrammesList').innerHTML = '<p style="color:red;">Error loading programmes</p>';
    }
}

// ─── ADMIN CRUD ──────────────────────────────────────

// Create Journal
async function adminSaveJournal(event) {
    event.preventDefault();
    try {
        const title = document.getElementById('ajTitle').value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { error } = await supabase.from('journals').insert({
            title,
            slug,
            authors: document.getElementById('ajAuthors').value,
            abstract: document.getElementById('ajAbstract').value,
            volume: parseInt(document.getElementById('ajVolume').value),
            year: parseInt(document.getElementById('ajYear').value),
            published_date: document.getElementById('ajDate').value,
            tags: document.getElementById('ajTags').value.split(',').map(t => t.trim()).filter(Boolean),
            pdf_url: document.getElementById('ajPdfUrl').value || null
        });
        if (error) throw error;
        showToast('Journal created!', 'success');
        document.getElementById('adminJournalForm').querySelector('form').reset();
        hideAdminForm('journal');
        loadAdminJournals();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error creating journal', 'error');
    }
}

// Delete Journal
async function deleteJournal(id) {
    if (!confirm('Are you sure you want to delete this journal article?')) return;
    try {
        const { error } = await supabase.from('journals').delete().eq('id', id);
        if (error) throw error;
        showToast('Journal deleted', 'success');
        loadAdminJournals();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error deleting journal', 'error');
    }
}

// Create Faculty
async function adminSaveFaculty(event) {
    event.preventDefault();
    try {
        const { error } = await supabase.from('faculty').insert({
            name: document.getElementById('afName').value,
            title: document.getElementById('afTitle').value,
            specialization: document.getElementById('afSpecialization').value,
            email: document.getElementById('afEmail').value || null,
            office: document.getElementById('afOffice').value || null,
            photo_url: document.getElementById('afPhoto').value || null,
            display_order: 0
        });
        if (error) throw error;
        showToast('Faculty added!', 'success');
        document.getElementById('adminFacultyForm').querySelector('form').reset();
        hideAdminForm('faculty');
        loadAdminFaculty();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error creating faculty', 'error');
    }
}

// Delete Faculty
async function deleteFaculty(id) {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
        const { error } = await supabase.from('faculty').delete().eq('id', id);
        if (error) throw error;
        showToast('Faculty deleted', 'success');
        loadAdminFaculty();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error deleting faculty', 'error');
    }
}

// Create News
async function adminSaveNews(event) {
    event.preventDefault();
    try {
        const title = document.getElementById('anTitle').value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { error } = await supabase.from('news_events').insert({
            title,
            slug,
            type: document.getElementById('anType').value,
            date: document.getElementById('anDate').value,
            description: document.getElementById('anDescription').value,
            image_url: document.getElementById('anImage').value || null
        });
        if (error) throw error;
        showToast('News created!', 'success');
        document.getElementById('adminNewsForm').querySelector('form').reset();
        hideAdminForm('news');
        loadAdminNews();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error creating news', 'error');
    }
}

// Delete News
async function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this news item?')) return;
    try {
        const { error } = await supabase.from('news_events').delete().eq('id', id);
        if (error) throw error;
        showToast('News deleted', 'success');
        loadAdminNews();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error deleting news', 'error');
    }
}

// Create Programme
async function adminSaveProgramme(event) {
    event.preventDefault();
    try {
        const { error } = await supabase.from('programmes').insert({
            title: document.getElementById('apTitle').value,
            level: document.getElementById('apLevel').value,
            description: document.getElementById('apDescription').value,
            duration: document.getElementById('apDuration').value || null
        });
        if (error) throw error;
        showToast('Programme created!', 'success');
        document.getElementById('adminProgrammeForm').querySelector('form').reset();
        hideAdminForm('programme');
        loadAdminProgrammes();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error creating programme', 'error');
    }
}

// Delete Programme
async function deleteProgramme(id) {
    if (!confirm('Are you sure you want to delete this programme?')) return;
    try {
        const { error } = await supabase.from('programmes').delete().eq('id', id);
        if (error) throw error;
        showToast('Programme deleted', 'success');
        loadAdminProgrammes();
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error deleting programme', 'error');
    }
}

// ─── ADMIN SETTINGS ─────────────────────────────────

async function adminSaveSettings(event) {
    event.preventDefault();
    try {
        const settings = [
            { key: 'site_name', value: document.getElementById('setSiteName').value },
            { key: 'site_tagline', value: document.getElementById('setTagline').value },
            { key: 'contact_email', value: document.getElementById('setEmail').value },
            { key: 'contact_phone', value: document.getElementById('setPhone').value },
            { key: 'contact_address', value: document.getElementById('setAddress').value },
            { key: 'footer_copyright', value: document.getElementById('setCopyright').value }
        ];
        for (const s of settings) {
            await supabase.from('settings').upsert({ key: s.key, value: s.value, type: 'text' });
        }
        showToast('Settings saved!', 'success');
        await refreshAllData();
    } catch (e) {
        showToast(e.message || 'Error saving settings', 'error');
    }
}

// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
