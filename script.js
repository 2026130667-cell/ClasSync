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

    const email = document.getElementById('login-email')
        .value.trim().toLowerCase();

    const password = document.getElementById('login-password').value;


    const users = getSavedUsers();

    if (!Array.isArray(users)) {
        showAuthError(
            'Unable to read saved accounts. Please check your browser storage settings.'
        );
        return;
    }


    // Check login details
    const matchedUser = users.find(user =>
        String(user.email || '').trim().toLowerCase() === email &&
        String(user.password ?? '') === password
    );


    if (!matchedUser) {
        showAuthError(
            'Invalid email or password. Please check the details you used when registering.'
        );
        return;
    }


    // Set current user
    currentUser = {
        name: matchedUser.name || 'Student',
        email: matchedUser.email,
        role: matchedUser.role || matchedUser.major || 'Student'
    };


    // Load ONLY this user's courses
    courses = getSavedCourses(currentUser.email);
    todos = getSavedTodos(currentUser.email);


    // Show main application
    document.getElementById('auth-screen')
        .classList.add('hidden');

    document.getElementById('app-layout')
        .classList.remove('hidden');


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

    pages.forEach(p => {
        document.getElementById(`page-${p}`)
            .classList.add('hidden');

        const btn = document.getElementById(`nav-${p}`);

        if (btn) {
            btn.className =
                'px-4 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-ink transition-all';
        }
    });


    document.getElementById(`page-${pageId}`)
        .classList.remove('hidden');

    const activeBtn = document.getElementById(`nav-${pageId}`);

    if (activeBtn) {
        activeBtn.className =
            'px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-500 shadow-xs transition-all';
    }


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
    const tbody = document.getElementById('timetable-grid-body');

    if (!tbody) return;

    tbody.innerHTML = '';

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00',
        '16:00', '17:00'
    ];

    const allDays = [
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];

    const filterDay =
        document.getElementById('timetable-filter-day')?.value || 'ALL';

    const days = filterDay === 'ALL'
        ? allDays
        : [filterDay];

    // Track which timetable cells are already occupied
    const occupied = {};

    days.forEach(day => {
        occupied[day] = new Set();
    });

    timeSlots.forEach((slot, rowIndex) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td class="py-3 px-3 text-center text-xs font-semibold text-muted bg-canvas/30 border-b border-slate-100">
                ${slot}
            </td>
        `;

        days.forEach(day => {

            // Skip cells already covered by a merged course box
            if (occupied[day].has(rowIndex)) {
                return;
            }

            const match = courses.find(course =>
                course.day === day &&
                course.startTime <= slot &&
                course.endTime > slot
            );

            if (match) {

                const startMinutes =
                    timeToMinutes(match.startTime);

                const endMinutes =
                    timeToMinutes(match.endTime);

                const durationRows = Math.max(
                    1,
                    Math.ceil((endMinutes - startMinutes) / 60)
                );

                // Mark the following rows as occupied
                for (
                    let i = rowIndex + 1;
                    i < Math.min(rowIndex + durationRows, timeSlots.length);
                    i++
                ) {
                    occupied[day].add(i);
                }

                const colour = match.color || '#FCE7F3';

                const td = document.createElement('td');

                td.rowSpan = durationRows;

                td.className = 'p-1.5 align-top border-b border-slate-100';

                td.innerHTML = `
                    <div
                        class="h-full min-h-[75px] p-3 rounded-xl border text-left"
                        style="
                            background-color: ${colour};
                            border-color: ${colour};
                        "
                    >
                        <p class="font-bold text-xs text-slate-800">
                            ${match.code}
                        </p>

                        <p class="text-[11px] font-medium text-slate-700 mt-1">
                            ${match.name}
                        </p>

                        <p class="text-[10px] text-slate-600 mt-2">
                            ${match.venue}
                        </p>

                        <p class="text-[10px] text-slate-600 mt-1">
                            ${match.startTime} - ${match.endTime}
                        </p>
                    </div>
                `;

                tr.appendChild(td);

            } else {

                const td = document.createElement('td');

                td.className =
                    'p-2 border-b border-slate-100';

                tr.appendChild(td);
            }
        });

        tbody.appendChild(tr);
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
                labels: courses.map(c => c.code),

                datasets: [{
                    label: 'Contact Hours',

                    data: courses.map(c =>
                        parseInt(c.endTime.split(':')[0]) -
                        parseInt(c.startTime.split(':')[0])
                    ),

                    backgroundColor: '#96515D',

                    borderRadius: 8
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
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
                labels: courses.map(c => c.code),

                datasets: [{
                    data: courses.map(c => c.credits),

                    backgroundColor: [
                        '#96515D',
                        '#7E3F4B',
                        '#64313B',
                        '#E7E5E4'
                    ]
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