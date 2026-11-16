// ======================================================
// STATE MANAGEMENT
// ======================================================

let currentUser = null;
let courses = [];
let editingCourseId = null;

let miniChartInstance = null;
let barChartInstance = null;
let doughnutChartInstance = null;


// ======================================================
// USER ACCOUNT STORAGE
// ======================================================

const USER_STORAGE_KEY = 'classync_users';

function getSavedUsers() {
    try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);

        if (!stored) return [];

        const users = JSON.parse(stored);

        if (!Array.isArray(users)) {
            console.error('Saved account data is not an array.');
            return null;
        }

        return users;

    } catch (error) {
        console.error('Unable to retrieve accounts:', error);
        return null;
    }
}




function saveUsers(users) {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));

        const saved = JSON.parse(
            localStorage.getItem(USER_STORAGE_KEY) || 'null'
        );

        return Array.isArray(saved) &&
               saved.length === users.length;

    } catch (error) {
        console.error('Unable to save accounts:', error);
        return false;
    }
}

function fillDemoCredentials() {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (emailInput) emailInput.value = 'test123@student.edu.my';
    if (passInput) passInput.value = '1234567890';
    hideAuthError();
}

// ======================================================
// INDIVIDUAL USER COURSE STORAGE
// ======================================================

const COURSE_STORAGE_PREFIX = 'classync_courses_';


// Get courses belonging to a specific user
function getSavedCourses(email) {
    const storageKey =
        COURSE_STORAGE_PREFIX + email.toLowerCase();

    try {
        const stored = localStorage.getItem(storageKey);

        // Every new account starts with zero courses
        if (stored === null) {
            return [];
        }

        const savedCourses = JSON.parse(stored);

        return Array.isArray(savedCourses)
            ? savedCourses
            : [];

    } catch (error) {
        console.error('Unable to retrieve courses:', error);
        return [];
    }
}


// Save courses belonging to a specific user
function saveCoursesForUser(email, userCourses) {
    try {
        const storageKey =
            COURSE_STORAGE_PREFIX + email.toLowerCase();

        localStorage.setItem(
            storageKey,
            JSON.stringify(userCourses)
        );

        return true;

    } catch (error) {
        console.error('Unable to save courses:', error);
        return false;
    }
}


// Save the currently logged-in user's courses
function saveCurrentUserCourses() {
    if (!currentUser) return false;

    return saveCoursesForUser(
        currentUser.email,
        courses
    );
}

// ======================================================
// INDIVIDUAL USER TO-DO STORAGE & LOGIC
// ======================================================

let todos = [];
const TODO_STORAGE_PREFIX = 'classync_todos_';

function getSavedTodos(email) {
    const storageKey = TODO_STORAGE_PREFIX + email.toLowerCase();
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored === null) return [];
        const savedTodos = JSON.parse(stored);
        return Array.isArray(savedTodos) ? savedTodos : [];
    } catch (error) {
        console.error('Unable to retrieve todos:', error);
        return [];
    }
}

function saveCurrentUserTodos() {
    if (!currentUser) return false;
    try {
        const storageKey = TODO_STORAGE_PREFIX + currentUser.email.toLowerCase();
        localStorage.setItem(storageKey, JSON.stringify(todos));
        return true;
    } catch (error) {
        console.error('Unable to save todos:', error);
        return false;
    }
}

function renderTodos() {
    const listEl = document.getElementById('todo-list');
    const counterEl = document.getElementById('todo-counter');
    if (!listEl) return;

    const remaining = todos.filter(t => !t.completed).length;
    if (counterEl) {
        counterEl.innerText = `${remaining} left`;
    }

    if (todos.length === 0) {
        listEl.innerHTML = `<li class="text-center text-muted py-6">No tasks yet. Add one above!</li>`;
        return;
    }

    listEl.innerHTML = todos.map(todo => `
        <li class="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 bg-white/70 hover:bg-white transition-all">
            <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})"
                    class="w-3.5 h-3.5 accent-[#96515D] rounded cursor-pointer">
                <span class="truncate ${todo.completed ? 'line-through text-muted' : 'text-ink font-medium'}">
                    ${todo.text}
                </span>
            </label>
            <button onclick="deleteTodo(${todo.id})" class="text-muted hover:text-red-500 px-1.5 transition-colors" title="Delete task">
                <i class="fa-solid fa-trash-can text-[11px]"></i>
            </button>
        </li>
    `).join('');
}

function handleAddTodo(e) {
    e.preventDefault();
    if (!currentUser) return;

    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;

    todos.unshift({
        id: Date.now(),
        text: text,
        completed: false
    });

    input.value = '';
    saveCurrentUserTodos();
    renderTodos();
}

function toggleTodo(id) {
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveCurrentUserTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveCurrentUserTodos();
    renderTodos();
}


// ======================================================
// AUTHENTICATION ERROR
// ======================================================

function showAuthError(message) {
    const errorBox = document.getElementById('auth-error');
    const errorMsg = document.getElementById('auth-error-msg');

    if (errorBox && errorMsg) {
        errorMsg.innerText = message;
        errorBox.classList.remove('hidden');
    } else {
        alert(message);
    }
}


function hideAuthError() {
    const errorBox = document.getElementById('auth-error');

    if (errorBox) {
        errorBox.classList.add('hidden');
    }
}


// ======================================================
// LOGIN AND REGISTER TABS
// ======================================================

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    hideAuthError();

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');

        tabLogin.className =
            'flex-1 py-2 text-xs font-semibold rounded-lg bg-white shadow-xs text-brand-500 transition-all';

        tabRegister.className =
            'flex-1 py-2 text-xs font-semibold rounded-lg text-muted hover:text-ink transition-all';

    } else if (tab === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');

        tabRegister.className =
            'flex-1 py-2 text-xs font-semibold rounded-lg bg-white shadow-xs text-brand-500 transition-all';

        tabLogin.className =
            'flex-1 py-2 text-xs font-semibold rounded-lg text-muted hover:text-ink transition-all';
    }
}


// ======================================================
// REGISTER FUNCTION
// ======================================================

function handleRegister(e) {
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById('reg-name').value.trim();

    const email = document.getElementById('reg-email')
        .value.trim().toLowerCase();

    const role = document.getElementById('reg-major').value.trim();

    const password = document.getElementById('reg-pass').value;


    // Check empty fields
    if (!name || !email || !role || !password) {
        showAuthError('Please fill in all fields.');
        return;
    }


    // Check password length
    if (password.length < 6) {
        showAuthError(
            'Password must contain at least 6 characters.'
        );
        return;
    }


    const users = getSavedUsers();

    if (!Array.isArray(users)) {
        showAuthError(
            'Unable to access account storage. Please use a normal browser window and try again.'
        );
        return;
    }


    // Check whether email already exists
    const existingUser = users.find(user =>
        String(user.email || '').trim().toLowerCase() === email
    );

    if (existingUser) {
        showAuthError(
            'This email is already registered. Please log in instead.'
        );
        return;
    }


    // Create new account
    const newUser = {
        name: name,
        email: email,
        role: role,
        password: password
    };


    // Initialize new account with ZERO courses
    const emptyCoursesSaved = saveCoursesForUser(email, []);

    if (!emptyCoursesSaved) {
        showAuthError(
            'Unable to initialize your account courses. Please try again.'
        );
        return;
    }


    // Save new user
    users.push(newUser);

    if (!saveUsers(users)) {
        showAuthError(
            'Your account could not be saved. Please check your browser storage settings.'
        );

        // Remove the course storage if account creation fails
        localStorage.removeItem(
            COURSE_STORAGE_PREFIX + email
        );

        return;
    }


    // Reset registration form
    document.getElementById('register-form').reset();

    switchAuthTab('login');

    document.getElementById('login-email').value = email;

    document.getElementById('login-password').value = '';


    alert(
        'Account successfully created! Please enter your password to log in.'
    );
}


// ======================================================
// LOGIN FUNCTION
// ======================================================

function handleLogin(e) {
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    // Ensure the default lecturer demo account is always ready
    if (typeof seedDefaultAccount === 'function') {
        seedDefaultAccount();
    }

    const users = getSavedUsers();

    if (!Array.isArray(users)) {
        showAuthError('Unable to read saved accounts. Please check your browser storage settings.');
        return;
    }

    // Check login details
    let matchedUser = users.find(user =>
        String(user.email || '').trim().toLowerCase() === email &&
        String(user.password ?? '') === password
    );

    // Fallback guarantee for the default demo account
    if (!matchedUser && email === 'test123@student.edu.my' && password === '1234567890') {
        matchedUser = {
            name: 'User',
            email: 'test123@student.edu.my',
            role: 'System Management',
            password: '1234567890'
        };
    }

    if (!matchedUser) {
        showAuthError('Invalid email or password. Please check the details you used when registering.');
        return;
    }

    // Set current user
    currentUser = {
        name: matchedUser.name || 'Student',
        email: matchedUser.email,
        role: matchedUser.role || matchedUser.major || 'Student'
    };

    // Load ONLY this user's courses and todos
    courses = getSavedCourses(currentUser.email);
    if (typeof getSavedTodos === 'function') {
        todos = getSavedTodos(currentUser.email);
    }

    // Show main application
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-layout').classList.remove('hidden');

    initDashboard();
    navigateTo('dashboard');
}


// ======================================================
// LOGOUT FUNCTION
// ======================================================

function handleLogout() {
    currentUser = null;

    courses = [];
    todos = [];

    // Hide main application
    document.getElementById('app-layout')
        .classList.add('hidden');

    // Return to login screen
    document.getElementById('auth-screen')
        .classList.remove('hidden');

    // Show Login tab
    switchAuthTab('login');

    // Clear login details
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.reset();
    }

    document.getElementById('login-email').value = 'test123@student.edu.my';
    document.getElementById('login-password').value = '1234567890';

    hideAuthError();
}


// ======================================================
// NAVIGATION ROUTER
// ======================================================


function navigateTo(pageId) {
    const pages = [
        'dashboard',
        'timetable',
        'courses',
        'analytics'
    ];

    // Hide all pages and reset desktop navigation
    pages.forEach(p => {
        const page = document.getElementById(`page-${p}`);

        if (page) {
            page.classList.add('hidden');
        }

        const btn = document.getElementById(`nav-${p}`);

        if (btn) {
            btn.className =
                'px-4 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-ink transition-all';
        }
    });

    // Show selected page
    const selectedPage = document.getElementById(`page-${pageId}`);

    if (!selectedPage) return;

    selectedPage.classList.remove('hidden');

    // Update desktop navigation
    const activeBtn = document.getElementById(`nav-${pageId}`);

    if (activeBtn) {
        activeBtn.className =
            'px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-500 shadow-xs transition-all';
    }

    // Update mobile navigation
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const isMatch = btn.dataset.mobileNav === pageId;

        btn.classList.toggle('active', isMatch);
        btn.classList.toggle('text-[#96515D]', isMatch);
        btn.classList.toggle('font-semibold', isMatch);
        btn.classList.toggle('text-slate-500', !isMatch);
        btn.classList.toggle('font-medium', !isMatch);
    });

    // Refresh page content
    if (pageId === 'dashboard') updateKPIs();
    if (pageId === 'timetable') renderTimetableGrid();
    if (pageId === 'courses') renderCoursesTable();
    if (pageId === 'analytics') renderAnalyticsCharts();
}



// ======================================================
// DASHBOARD DATA CALCULATIONS
// ======================================================

function updateKPIs() {

    // Total credits
    const totalCredits = courses.reduce(
        (sum, c) => sum + (parseInt(c.credits) || 0),
        0
    );

    document.getElementById('kpi-credits').innerText =
        totalCredits;


    // Total subjects
    document.getElementById('kpi-subject-count').innerText =
        `${courses.length} Subjects`;


    // Today's classes
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = fullDays[new Date().getDay()];
document.getElementById('dash-current-day').innerText = `${today} Agenda`;

    const todayClasses = courses.filter(
        c => c.day === today
    );

    document.getElementById('kpi-today-classes').innerText =
        todayClasses.length;

    document.getElementById('dash-today-count').innerText =
        `${todayClasses.length} classes`;


    // Weekly hours
    const weeklyHours = courses.reduce((sum, c) => {
        const start = parseInt(c.startTime.split(':')[0]);
        const end = parseInt(c.endTime.split(':')[0]);

        return sum + (end - start);

    }, 0);


    document.getElementById('kpi-weekly-hours').innerText =
        `${weeklyHours} hrs`;


    renderTodayAgenda(todayClasses);

    renderMiniChart();
}


// ======================================================
// TODAY'S AGENDA
// ======================================================

function renderTodayAgenda(todayClasses) {
    const container = document.getElementById('dash-today-schedule');

    container.innerHTML = '';


    if (todayClasses.length === 0) {
        container.innerHTML =
            '<p class="text-xs text-muted py-4 text-center">No classes scheduled for today.</p>';

        return;
    }


    todayClasses.forEach(c => {
        const item = document.createElement('div');

        item.className =
            'p-4 rounded-xl bg-white border border-brand-500/10 flex items-center justify-between shadow-2xs';

        item.innerHTML = `
            <div>
                <h4 class="font-bold text-ink text-xs">
                    ${c.code} — ${c.name}
                </h4>

                <p class="text-[11px] text-muted">
                    ${c.venue} • ${c.lecturer}
                </p>
            </div>

            <span class="px-3 py-1 rounded-full bg-brand-50 text-brand-500 font-semibold text-[11px]">
                ${c.startTime} - ${c.endTime}
            </span>
        `;

        container.appendChild(item);
    });
}


// ======================================================
// TIMETABLE RENDERING
// ======================================================

function renderTimetableGrid() {
    const container = document.getElementById('timetable-grid-container');
    if (!container) return;

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00',
        '16:00', '17:00'
    ];

    const allDays = [
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];

    const filterDay = document.getElementById('timetable-filter-day')?.value || 'ALL';
    const days = filterDay === 'ALL' ? allDays : [filterDay];

    // 1. Build the Grid wrapper: 80px time column + equal columns for days
    // 1 header row (44px) + 10 hourly rows (64px each)
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `80px repeat(${days.length}, minmax(0, 1fr))`;
    container.style.gridTemplateRows = `44px repeat(${timeSlots.length}, 64px)`;

    // 2. Render Top Header Row (Row 1)
    const timeHeader = document.createElement('div');
    timeHeader.className = 'flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-slate-100';
    timeHeader.style.gridColumn = '1';
    timeHeader.style.gridRow = '1';
    timeHeader.textContent = 'Time';
    container.appendChild(timeHeader);

    days.forEach((day, dayIdx) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-slate-100';
        dayHeader.style.gridColumn = `${dayIdx + 2}`;
        dayHeader.style.gridRow = '1';
        dayHeader.textContent = day;
        container.appendChild(dayHeader);
    });

    // 3. Render Background Time Labels & Horizontal Grid Lines
    timeSlots.forEach((slot, rowIdx) => {
        const gridRow = rowIdx + 2; // Row 1 is header, so 08:00 starts at Row 2

        const timeCell = document.createElement('div');
        timeCell.className = 'pt-2 text-center text-xs font-semibold text-muted border-b border-slate-100';
        timeCell.style.gridColumn = '1';
        timeCell.style.gridRow = `${gridRow}`;
        timeCell.textContent = slot;
        container.appendChild(timeCell);

        days.forEach((_, dayIdx) => {
            const bgCell = document.createElement('div');
            bgCell.className = 'border-b border-l border-slate-100/80';
            bgCell.style.gridColumn = `${dayIdx + 2}`;
            bgCell.style.gridRow = `${gridRow}`;
            container.appendChild(bgCell);
        });
    });

    // 4. Render Course Cards (Placed directly onto their exact Day column & Hour span)
    const startOfDayMinutes = timeToMinutes(timeSlots[0]); // 08:00 = 480 mins

    courses.forEach(course => {
        const dayIndex = days.indexOf(course.day);
        if (dayIndex === -1) return;

        const startMins = timeToMinutes(course.startTime);
        const endMins = timeToMinutes(course.endTime);

        // Calculate starting row (1-indexed, +2 skips the header row)
        const startSlotOffset = Math.floor((startMins - startOfDayMinutes) / 60);
        const durationSlots = Math.max(1, Math.ceil((endMins - startMins) / 60));

        if (startSlotOffset < 0 || startSlotOffset >= timeSlots.length) return;

        const gridRowStart = startSlotOffset + 2;
        const gridRowEnd = Math.min(gridRowStart + durationSlots, timeSlots.length + 2);
        const colour = course.color || '#FCE7F3';

        const card = document.createElement('div');
        card.className = 'grid-cell-item m-1 p-3 rounded-xl border text-left flex flex-col justify-between overflow-hidden z-10';
        card.style.gridColumn = `${dayIndex + 2}`;
        card.style.gridRow = `${gridRowStart} / ${gridRowEnd}`;
        card.style.backgroundColor = colour;
        card.style.borderColor = colour;

        card.innerHTML = `
            <div>
                <p class="font-bold text-xs text-slate-800">${course.code}</p>
                <p class="text-[11px] font-medium text-slate-700 mt-1">${course.name}</p>
            </div>
            <div>
                <p class="text-[10px] text-slate-600">${course.venue}</p>
                <p class="text-[10px] text-slate-600 mt-0.5">${course.startTime} - ${course.endTime}</p>
            </div>
        `;

        container.appendChild(card);
    });
}


// Convert HH:MM into minutes
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
}


// ======================================================
// COURSE DIRECTORY TABLE
// ======================================================

function renderCoursesTable() {
    const tbody = document.getElementById('courses-table-body');

    tbody.innerHTML = '';

    const query =
        document.getElementById('course-search')?.value.toLowerCase() || '';

    const filtered = courses.filter(course =>
        course.code.toLowerCase().includes(query) ||
        course.name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-muted text-sm">
                    No courses added yet. Click "Add Course" to get started.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(course => {
        const tr = document.createElement('tr');

        tr.className = 'hover:bg-slate-50/50 transition';

        tr.innerHTML = `
            <td class="py-3 px-4 font-bold text-brand-500">
                ${course.code}
            </td>

            <td class="py-3 px-4 font-semibold">
                ${course.name}
            </td>

            <td class="py-3 px-4 text-muted">
                ${course.lecturer}
            </td>

            <td class="py-3 px-4">
                ${course.credits} Credits
            </td>

            <td class="py-3 px-4 text-muted">
                ${course.day}
                (${course.startTime}-${course.endTime})
                @ ${course.venue}
            </td>

            <td class="py-3 px-4 text-right whitespace-nowrap">
                <button
                    onclick="editCourse(${course.id})"
                    class="text-blue-500 hover:text-blue-700 mr-3"
                    title="Edit Course"
                >
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>

                <button
                    onclick="deleteCourse(${course.id})"
                    class="text-red-400 hover:text-red-600"
                    title="Delete Course"
                >
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


// ======================================================
// ADD COURSE MODAL
// ======================================================

// Open modal for adding a new course
function openAddCourseModal() {
    editingCourseId = null;

    document.getElementById('course-form').reset();

    document.getElementById('modal-course-id').value = '';

    document.getElementById('modal-title').innerText =
        'Add Class Schedule';

    document.getElementById('modal-save-button').innerText =
        'Save Class';

    document.getElementById('modal-color').value = '#FCE7F3';

    document.getElementById('course-modal')
        .classList.remove('hidden');
}


// Open modal for editing an existing course
function editCourse(id) {
    const course = courses.find(c => c.id === id);

    if (!course) return;

    editingCourseId = id;

    document.getElementById('modal-course-id').value = course.id;

    document.getElementById('modal-code').value = course.code;
    document.getElementById('modal-name').value = course.name;
    document.getElementById('modal-lecturer').value = course.lecturer;
    document.getElementById('modal-credits').value = course.credits;
    document.getElementById('modal-day').value = course.day;
    document.getElementById('modal-start-time').value = course.startTime;
    document.getElementById('modal-end-time').value = course.endTime;
    document.getElementById('modal-venue').value = course.venue;

    document.getElementById('modal-color').value =
        course.color || '#FCE7F3';

    document.getElementById('modal-title').innerText =
        'Edit Class Schedule';

    document.getElementById('modal-save-button').innerText =
        'Update Class';

    document.getElementById('course-modal')
        .classList.remove('hidden');
}


// Close modal
function closeAddCourseModal() {
    document.getElementById('course-modal')
        .classList.add('hidden');

    editingCourseId = null;
}


// Save new course or update existing course
function handleSaveCourse(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Please log in before managing courses.');
        return;
    }

    const startTime =
        document.getElementById('modal-start-time').value;

    const endTime =
        document.getElementById('modal-end-time').value;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        alert('End time must be later than start time.');
        return;
    }

    const courseData = {
        code: document.getElementById('modal-code').value.trim(),
        name: document.getElementById('modal-name').value.trim(),
        lecturer: document.getElementById('modal-lecturer').value.trim(),
        credits: parseInt(
            document.getElementById('modal-credits').value,
            10
        ),
        day: document.getElementById('modal-day').value,
        startTime: startTime,
        endTime: endTime,
        venue: document.getElementById('modal-venue').value.trim(),
        color: document.getElementById('modal-color').value
    };

    const previousCourses = [...courses];

    if (editingCourseId !== null) {

        // Update existing course
        courses = courses.map(course =>
            course.id === editingCourseId
                ? { ...course, ...courseData }
                : course
        );

    } else {

        // Add new course
        courses.push({
            id: Date.now(),
            ...courseData
        });
    }

    // Save changes to the logged-in user's account
    if (!saveCurrentUserCourses()) {
        courses = previousCourses;

        alert('Unable to save your course changes. Please try again.');
        return;
    }

    closeAddCourseModal();

    renderCoursesTable();
    renderTimetableGrid();
    updateKPIs();

    // Refresh analytics if currently open
    if (!document.getElementById('page-analytics').classList.contains('hidden')) {
        renderAnalyticsCharts();
    }
}


// ======================================================
// DELETE COURSE
// ======================================================

function deleteCourse(id) {
    const previousCourses = [...courses];

    courses = courses.filter(course => course.id !== id);


    // Save updated course list
    if (!saveCurrentUserCourses()) {

        courses = previousCourses;

        alert('Unable to delete course. Please try again.');

        return;
    }


    renderCoursesTable();

    updateKPIs();
}


// ======================================================
// MINI DASHBOARD CHART
// ======================================================

function renderMiniChart() {
    const ctx = document.getElementById('miniDistChart')?.getContext('2d');
    if (!ctx) return;

    if (miniChartInstance) {
        miniChartInstance.destroy();
    }

    // 1. Calculate actual weekly lecture hours from your saved courses
    const lectureHours = courses.reduce((sum, c) => {
        const start = timeToMinutes(c.startTime);
        const end = timeToMinutes(c.endTime);
        return sum + Math.max(0, (end - start) / 60);
    }, 0);

    // 2. Estimate recommended self-study hours (e.g., 1.5x lecture hours)
    const selfStudyHours = Math.round(lectureHours * 1.5);

    // 3. Calculate remaining awake/free hours out of a 50-hour study week
    const freeTimeHours = Math.max(0, 50 - (lectureHours + selfStudyHours));

    miniChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lectures (hrs)', 'Self Study (hrs)', 'Free Time (hrs)'],
            datasets: [{
                data: [lectureHours, selfStudyHours, freeTimeHours],
                backgroundColor: ['#96515D', '#E7E5E4', '#F3EFEB'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}


// ======================================================
// ANALYTICS CHARTS
// ======================================================

function renderAnalyticsCharts() {
    const courseLabels = courses.map(c => c.code);
    const courseColors = courses.map(c => c.color || '#96515D');

    // Bar chart
    const ctxBar = document
        .getElementById('analyticsBarChart')
        ?.getContext('2d');

    if (ctxBar) {
        if (barChartInstance) {
            barChartInstance.destroy();
        }

        barChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: courseLabels,
                datasets: [{
                    label: 'Contact Hours',
                    data: courses.map(c =>
                        parseInt(c.endTime.split(':')[0]) -
                        parseInt(c.startTime.split(':')[0])
                    ),
                    backgroundColor: courseColors,
                    borderColor: courseColors,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hides the single color swatch since each bar has its own course color
                    }
                }
            }
        });
    }

    // Doughnut chart
    const ctxDoughnut = document
        .getElementById('analyticsDoughnutChart')
        ?.getContext('2d');

    if (ctxDoughnut) {
        if (doughnutChartInstance) {
            doughnutChartInstance.destroy();
        }

        doughnutChartInstance = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: courseLabels,
                datasets: [{
                    data: courses.map(c => c.credits),
                    backgroundColor: courseColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// ======================================================
// INITIALIZE DASHBOARD
// ======================================================

function initDashboard() {
    if (currentUser) {

        const dashName =
            document.getElementById('dash-student-name');

        const headerName =
            document.getElementById('user-name-display');

        const headerRole =
            document.getElementById('user-role-display');


        if (dashName) {
            dashName.innerText =
                currentUser.name.split(' ')[0];
        }

        if (headerName) {
            headerName.innerText =
                currentUser.name;
        }

        if (headerRole) {
            headerRole.innerText =
                currentUser.role;
        }
    }

    updateKPIs();
    renderTodos();
}

// ======================================================
// DEFAULT DEMO ACCOUNT SEEDER
// ======================================================

function seedDefaultAccount() {
    const defaultEmail = 'test123@student.edu.my';
    const users = getSavedUsers() || [];

    // Check if the default account already exists
    const exists = users.some(
        u => String(u.email || '').trim().toLowerCase() === defaultEmail
    );

    if (!exists) {
        users.push({
            name: 'Sarah',
            email: defaultEmail,
            role: 'System Management',
            password: '1234567890'
        });
        saveUsers(users);

        // Pre-load all 6 sample courses for the lecturer demo
        const sampleCourses = [
            {
                id: 101,
                code: 'IMS555',
                name: 'Programming',
                lecturer: 'Dr. Sarah',
                credits: 3,
                day: 'Monday',
                startTime: '08:00',
                endTime: '11:00',
                venue: 'BK 23',
                color: '#93A5F6'
            },
            {
                id: 102,
                code: 'IMD112',
                name: 'System Administration',
                lecturer: 'Prof. Ahmad',
                credits: 2,
                day: 'Monday',
                startTime: '14:00',
                endTime: '16:00',
                venue: 'BK2',
                color: '#c9dc97'
            },
            {
                id: 103,
                code: 'ICM571',
                name: 'Social Media Management',
                lecturer: 'Dr. Linda ',
                credits: 3,
                day: 'Friday',
                startTime: '08:00',
                endTime: '11:00',
                venue: 'Studio 1',
                color: '#ad94af'
            },
            {
                id: 104,
                code: 'IMC311',
                name: 'Information Management',
                lecturer: 'Dr. Siti ',
                credits: 2,
                day: 'Tuesday',
                startTime: '14:00',
                endTime: '16:00',
                venue: 'BK 14',
                color: '#a27d60'
            },
            {
                id: 105,
                code: 'IMS564',
                name: 'Database Systems',
                lecturer: 'Dr. Hafiz',
                credits: 3,
                day: 'Tuesday',
                startTime: '09:00',
                endTime: '12:00',
                venue: 'Lab 3',
                color: '#cbc5ad'
            },
            {
                id: 106,
                code: 'TGC451',
                name: 'Introductory German (Level II)',
                lecturer: 'Madam Jane',
                credits: 2,
                day: 'Thursday',
                startTime: '10:00',
                endTime: '12:00',
                venue: 'BK 5',
                color: '#DDD6FE'
            }
        ];
        saveCoursesForUser(defaultEmail, sampleCourses);

        // Pre-load sample To-Do tasks
        const sampleTodos = [
            { id: 201, text: 'Submit IMS555 Lab 2 report', completed: false },
            { id: 202, text: 'Prepare ICM571 campaign presentation', completed: false },
            { id: 203, text: 'Review lecture slides for Week 5', completed: true }
        ];
        localStorage.setItem(
            'classync_todos_' + defaultEmail,
            JSON.stringify(sampleTodos)
        );
    }

    // Ensure the login fields are pre-filled on initial load
    const loginEmailInput = document.getElementById('login-email');
    const loginPassInput = document.getElementById('login-password');
    if (loginEmailInput && !loginEmailInput.value) {
        loginEmailInput.value = defaultEmail;
    }
    if (loginPassInput && !loginPassInput.value) {
        loginPassInput.value = '1234567890';
    }
}


// ======================================================
// INITIALIZE PAGE
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    getSavedUsers();

    [
        'login-email',
        'login-password',
        'reg-name',
        'reg-email',
        'reg-major',
        'reg-pass'
    ].forEach(id => {

        const input = document.getElementById(id);

        if (input) {
            input.addEventListener('input', hideAuthError);
        }
    });

});


// ======================================================
// FLIQLO FLIP CLOCK & DATE WIDGET
// ======================================================

function updateFlipClock() {
    const now = new Date();

    // Format 12-hour clock
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Format Day (e.g., SUN) and Date (e.g., 15 NOV)
    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayStr = daysShort[now.getDay()];
    const dateStr = `${now.getDate()} ${monthsShort[now.getMonth()]}`;

    // Update DOM elements if they exist
    const hoursEl = document.getElementById('flip-hours');
    const minutesEl = document.getElementById('flip-minutes');
    const ampmEl = document.getElementById('flip-ampm');
    const dayEl = document.getElementById('flip-day');
    const dateEl = document.getElementById('flip-date');

    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.innerText = minutes;
    if (ampmEl) ampmEl.innerText = ampm;
    if (dayEl) dayEl.innerText = dayStr;
    if (dateEl) dateEl.innerText = dateStr;
}

// Start clock immediately and update every second
document.addEventListener('DOMContentLoaded', () => {
    updateFlipClock();
    setInterval(updateFlipClock, 1000);
});

// ======================================================
// DARK / LIGHT THEME TOGGLE
// ======================================================

function applySavedTheme() {
    const savedTheme = localStorage.getItem('classync_theme') || 'light';
    const htmlEl = document.documentElement;
    const iconEl = document.getElementById('theme-toggle-icon');

    if (savedTheme === 'dark') {
        htmlEl.classList.add('dark');
        if (iconEl) iconEl.className = 'fa-solid fa-sun text-xs text-amber-400';
    } else {
        htmlEl.classList.remove('dark');
        if (iconEl) iconEl.className = 'fa-solid fa-moon text-xs';
    }
}

function toggleTheme() {
    const htmlEl = document.documentElement;
    const isDark = htmlEl.classList.toggle('dark');
    localStorage.setItem('classync_theme', isDark ? 'dark' : 'light');
    applySavedTheme();
}

// Apply theme immediately on load
document.addEventListener('DOMContentLoaded', applySavedTheme);

// ======================================================
// GLOBAL DASHBOARD SEARCH
// ======================================================

function handleGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const resultsBox = document.getElementById('global-search-results');
    if (!input || !resultsBox) return;

    const query = input.value.trim().toLowerCase();

    if (!query) {
        resultsBox.classList.add('hidden');
        resultsBox.innerHTML = '';
        return;
    }

    // Search matching courses (by code, name, lecturer, or venue)
    const matchedCourses = courses.filter(c =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.lecturer.toLowerCase().includes(query) ||
        c.venue.toLowerCase().includes(query)
    );

    // Search matching To-Do tasks
    const matchedTodos = (typeof todos !== 'undefined' ? todos : []).filter(t =>
        t.text.toLowerCase().includes(query)
    );

    if (matchedCourses.length === 0 && matchedTodos.length === 0) {
        resultsBox.innerHTML = `
            <div class="p-3.5 text-center text-muted">
                No courses or tasks found for "${input.value}"
            </div>
        `;
        resultsBox.classList.remove('hidden');
        return;
    }

    let html = '';

    if (matchedCourses.length > 0) {
        html += `<div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted bg-canvas/60">Courses</div>`;
        html += matchedCourses.map(c => `
            <button onclick="selectSearchCourse('${c.code}')" class="w-full text-left px-3.5 py-2.5 hover:bg-brand-50 flex items-center justify-between gap-2 transition-colors border-b border-slate-100/60">
                <div class="min-w-0">
                    <p class="font-bold text-brand-500 truncate">${c.code} — ${c.name}</p>
                    <p class="text-[10px] text-muted truncate">${c.day} • ${c.startTime}-${c.endTime} @ ${c.venue}</p>
                </div>
                <i class="fa-solid fa-arrow-right text-[10px] text-muted"></i>
            </button>
        `).join('');
    }

    if (matchedTodos.length > 0) {
        html += `<div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted bg-canvas/60">To-Do Tasks</div>`;
        html += matchedTodos.map(t => `
            <button onclick="selectSearchTodo()" class="w-full text-left px-3.5 py-2.5 hover:bg-brand-50 flex items-center justify-between gap-2 transition-colors border-b border-slate-100/60">
                <span class="truncate ${t.completed ? 'line-through text-muted' : 'text-ink font-medium'}">${t.text}</span>
                <span class="text-[10px] text-brand-500 font-semibold shrink-0">Dashboard</span>
            </button>
        `).join('');
    }

    resultsBox.innerHTML = html;
    resultsBox.classList.remove('hidden');
}

function selectSearchCourse(courseCode) {
    const resultsBox = document.getElementById('global-search-results');
    const globalInput = document.getElementById('global-search-input');
    if (resultsBox) resultsBox.classList.add('hidden');
    if (globalInput) globalInput.value = '';

    // Switch to Courses page and pre-fill its search filter
    navigateTo('courses');
    const courseSearchInput = document.getElementById('course-search');
    if (courseSearchInput) {
        courseSearchInput.value = courseCode;
        renderCoursesTable();
    }
}

function selectSearchTodo() {
    const resultsBox = document.getElementById('global-search-results');
    const globalInput = document.getElementById('global-search-input');
    if (resultsBox) resultsBox.classList.add('hidden');
    if (globalInput) globalInput.value = '';

    // Navigate to Dashboard and highlight the To-Do input
    navigateTo('dashboard');
    document.getElementById('todo-input')?.focus();
}

// Close search dropdown when clicking outside
document.addEventListener('click', (e) => {
    const input = document.getElementById('global-search-input');
    const resultsBox = document.getElementById('global-search-results');
    if (input && resultsBox && !input.contains(e.target) && !resultsBox.contains(e.target)) {
        resultsBox.classList.add('hidden');
    }
});
