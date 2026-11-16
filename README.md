# ClasSync — Student Academic & Timetable Dashboard

**ClasSync** is a responsive web-based student productivity and academic management dashboard designed to help university students organize weekly class schedules, track enrolled courses, manage daily academic tasks, and visualize study workload distribution.

---

## Features Included

* **Interactive Weekly Timetable:** Dynamic CSS Grid-based class schedule displaying course codes, venues, lecturers, and color-coded time blocks across Monday to Saturday.
* **Course & Class Management:** Add, view, and manage enrolled courses with credit hours, venue details, lecturer names, and custom color tags.
* **Academic Workload Analytics:** Interactive data visualizations (bar and doughnut charts) illustrating weekly class contact hours and credit distribution per course.
* **Task & To-Do Tracker:** Built-in academic task checklist allowing students to add, complete, and manage assignment deadlines and study reminders.
* **Global Instant Search:** Real-time search bar in the header to quickly filter and locate registered courses or pending tasks.
* **Multi-Account Demo & Local Persistence:** Client-side data persistence via `localStorage` with automatic demo account seeding so evaluators can test the dashboard immediately with pre-populated sample data.
* **Responsive & Theme-Adaptive UI:** Full desktop and mobile viewport support (including mobile bottom navigation) with a Light/Dark mode toggle.

---

## Instructions to Test Login

ClasSync comes pre-configured with a demo student account that automatically populates sample courses, timetable slots, and tasks on first load:

1. Open `index.html` in any modern web browser (or run via a local server such as Live Server / localhost).
2. On the login screen, enter the following demo credentials (pre-filled automatically on initial load):
   * **Email:** `test123@student.edu.my`
   * **Password:** `1234567890`
3. Click **Sign In / Login** to access the dashboard.
4. *(Optional)* You can also register a new student account via the Sign-Up form to test creating a custom schedule from scratch.

---

## Frameworks & Libraries Used

* **HTML5 & CSS3 (CSS Grid & Flexbox):** Semantic page structure and custom timetable grid layout.
* **Tailwind CSS:** Utility-first CSS framework for responsive layouts, glassmorphism cards, and dark/light theme styling.
* **Vanilla JavaScript (ES6+):** Application state management, DOM rendering, search filtering, and `localStorage` persistence.
* **Chart.js:** Interactive bar and doughnut charts for visualising contact hours and credit distribution.
* **Font Awesome:** Scalable vector icons used across navigation, cards, and action controls.
