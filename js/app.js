// ========== DATA STORES ==========
let users = [];
let teachers = [];
let students = [];
let modules = [];
let grades = [];
let classes = [];
let schedules = [];
let currentUser = null;
let nextIds = { users: 1, teachers: 1, students: 1, modules: 1, grades: 1, classes: 1, schedules: 1 };

// ========== INITIALIZATION ==========
function initDemoData() {
    // Admin user
    users.push({ id: 1, email: "admin@edumanage.com", password: "admin123", role: "admin", refId: null, fullName: "Administrateur" });

    // Teacher demo
    teachers.push({ id: 1, nom_prenom: "Dr. Sophie Martin", email: "sophie.martin@ecole.fr" });
    users.push({ id: 2, email: "sophie.martin@ecole.fr", password: "teacher", role: "teacher", refId: 1, fullName: "Dr. Sophie Martin" });

    // Classes
    classes.push({ id: 1, name: "S1 GI" });
    classes.push({ id: 2, name: "S2 GI" });

    // Students with classId
    students = [
        { id: 1, nom_prenom: "Lucas Bernard",  email: "lucas.bernard@etudiant.fr",  classId: 1 },
        { id: 2, nom_prenom: "Emma Petit",      email: "emma.petit@etudiant.fr",     classId: 1 },
        { id: 3, nom_prenom: "Thomas Dubois",   email: "thomas.dubois@etudiant.fr",  classId: 2 }
    ];
    users.push({ id: 3, email: "lucas.bernard@etudiant.fr",  password: "student", role: "student", refId: 1, fullName: "Lucas Bernard" });
    users.push({ id: 4, email: "emma.petit@etudiant.fr",     password: "student", role: "student", refId: 2, fullName: "Emma Petit" });
    users.push({ id: 5, email: "thomas.dubois@etudiant.fr",  password: "student", role: "student", refId: 3, fullName: "Thomas Dubois" });

    // Modules
    modules.push({ id: 1, nom_module: "Mathématiques Avancées", coefficient: 3, credits: 6,  teacherId: 1 });
    modules.push({ id: 2, nom_module: "Base de Données",        coefficient: 4, credits: 8,  teacherId: 1 });
    modules.push({ id: 3, nom_module: "Programmation Web",      coefficient: 5, credits: 10, teacherId: 1 });

    // Schedule
    schedules.push({ id: 1, moduleId: 1, teacherId: 1, classId: 1, day: "Monday",    hour: "10:00" });
    schedules.push({ id: 2, moduleId: 2, teacherId: 1, classId: 1, day: "Wednesday", hour: "14:00" });
    schedules.push({ id: 3, moduleId: 3, teacherId: 1, classId: 2, day: "Friday",    hour: "08:00" });

    // Grades
    grades.push({ id: 1, studentId: 1, moduleId: 1, note: 15.5, date_saisie: "2025-02-10", statut: "Publié" });
    grades.push({ id: 2, studentId: 2, moduleId: 1, note: 12.0, date_saisie: "2025-02-10", statut: "Publié" });
    grades.push({ id: 3, studentId: 1, moduleId: 2, note: 17.0, date_saisie: "2025-02-15", statut: "Publié" });
    grades.push({ id: 4, studentId: 3, moduleId: 2, note: 14.5, date_saisie: "2025-02-15", statut: "Brouillon" });

    nextIds = { users: 6, teachers: 2, students: 4, modules: 4, grades: 5, classes: 3, schedules: 4 };
}

function saveData() {
    localStorage.setItem('edumanage_data', JSON.stringify({ users, teachers, students, modules, grades, classes, schedules, nextIds }));
}


function loadData() {
    const raw = localStorage.getItem('edumanage_data');
    if (raw) {
        const data = JSON.parse(raw);
        users     = data.users;
        teachers  = data.teachers;
        students  = data.students;
        modules   = data.modules;
        grades    = data.grades;
        classes   = data.classes   || [];
        schedules = data.schedules || [];
        nextIds   = data.nextIds;
        // Ensure new keys exist in old saves
        if (!nextIds.classes)   nextIds.classes   = classes.length   + 1;
        if (!nextIds.schedules) nextIds.schedules = schedules.length + 1;
    } else {
        initDemoData();
        saveData();
    }
}

// ========== ROLE & PERMISSION HELPERS ==========
function requireRole(role) {
    if (!currentUser || currentUser.role !== role) {
        alert("Accès refusé");
        return false;
    }
    return true;
}

function canEditGrade(moduleId) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher') {
        const mod = modules.find(m => m.id === moduleId);
        return mod && mod.teacherId === currentUser.refId;
    }
    return false;
}

function getVisibleSchedule() {
    if (currentUser.role === 'admin') return schedules;
    if (currentUser.role === 'teacher') return schedules.filter(s => s.teacherId === currentUser.refId);
    if (currentUser.role === 'student') {
        const student = students.find(s => s.id === currentUser.refId);
        return student ? schedules.filter(s => s.classId === student.classId) : [];
    }
    return [];
}

// ========== HELPER FUNCTIONS ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getStudentAverage(studentId) {
    const studentGrades = grades.filter(g => g.studentId === studentId && g.statut === "Publié");
    if (studentGrades.length === 0) return null;
    let sum = 0, totalCoeff = 0;
    studentGrades.forEach(g => {
        const moduleData = modules.find(m => m.id === g.moduleId);
        const coeff = moduleData ? moduleData.coefficient : 1;
        sum += g.note * coeff;
        totalCoeff += coeff;
    });
    return (sum / totalCoeff).toFixed(1);
}

function getGradeColor(note) {
    if (note >= 16) return 'grade-excellent';
    if (note >= 14) return 'grade-good';
    if (note >= 10) return 'grade-average';
    return 'grade-poor';
}

// ========== RENDER FUNCTIONS ==========
function updateStatsUI() {
    const statStudents = document.getElementById('statStudents');
    const statTeachers = document.getElementById('statTeachers');
    const statModules  = document.getElementById('statModules');
    const statGrades   = document.getElementById('statGrades');
    if (statStudents) statStudents.innerText = students.length;
    if (statTeachers) statTeachers.innerText = teachers.length;
    if (statModules)  statModules.innerText  = modules.length;
    if (statGrades)   statGrades.innerText   = grades.length;
}

function renderStudents() {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    const filtered = students.filter(s =>
        s.nom_prenom.toLowerCase().includes(searchTerm) || s.email.toLowerCase().includes(searchTerm)
    );
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = filtered.map(s => {
        const avg = getStudentAverage(s.id);
        const avgDisplay = avg ? `<span class="${getGradeColor(parseFloat(avg))}">${avg}/20</span>` : '—';
        const cls = classes.find(c => c.id === s.classId);
        const actions = isAdmin
            ? `<i class="fas fa-edit action-icon edit-student" data-id="${s.id}"></i>
               <i class="fas fa-trash-alt action-icon delete-student" data-id="${s.id}"></i>`
            : '';
        return `
            <tr>
                <td>${s.id}</td>
                <td>${escapeHtml(s.nom_prenom)}</td>
                <td>${escapeHtml(s.email)}</td>
                <td>${cls ? escapeHtml(cls.name) : '—'}</td>
                <td>${avgDisplay}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
    attachStudentEvents();
}

function renderTeachers() {
    const tbody = document.querySelector('#teachersTable tbody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchTeacher')?.value.toLowerCase() || '';
    const filtered = teachers.filter(t =>
        t.nom_prenom.toLowerCase().includes(searchTerm) || t.email.toLowerCase().includes(searchTerm)
    );
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = filtered.map(t => {
        const moduleCount = modules.filter(m => m.teacherId === t.id).length;
        const actions = isAdmin
            ? `<i class="fas fa-edit action-icon edit-teacher" data-id="${t.id}"></i>
               <i class="fas fa-trash-alt action-icon delete-teacher" data-id="${t.id}"></i>`
            : '';
        return `
            <tr>
                <td>${t.id}</td>
                <td>${escapeHtml(t.nom_prenom)}</td>
                <td>${escapeHtml(t.email)}</td>
                <td>${moduleCount} module(s)</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
    attachTeacherEvents();
}

function renderModules() {
    const tbody = document.querySelector('#modulesTable tbody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchModule')?.value.toLowerCase() || '';
    const filtered = modules.filter(m => m.nom_module.toLowerCase().includes(searchTerm));
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = filtered.map(m => {
        const teacher = teachers.find(t => t.id === m.teacherId);
        const actions = isAdmin
            ? `<i class="fas fa-edit action-icon edit-module" data-id="${m.id}"></i>
               <i class="fas fa-trash-alt action-icon delete-module" data-id="${m.id}"></i>`
            : '';
        return `
            <tr>
                <td>${m.id}</td>
                <td>${escapeHtml(m.nom_module)}</td>
                <td>${m.coefficient || 1}</td>
                <td>${teacher ? escapeHtml(teacher.nom_prenom) : 'Non affecté'}</td>
                <td>${m.credits || 0}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
    attachModuleEvents();
}

function renderGrades() {
    const tbody = document.querySelector('#gradesTable tbody');
    if (!tbody) return;

    const filterModule  = document.getElementById('filterModule')?.value;
    const filterStudent = document.getElementById('filterStudent')?.value;
    const filterStatus  = document.getElementById('filterStatus')?.value;

    let filtered = [...grades];
    // Students only see published grades for themselves
    if (currentUser && currentUser.role === 'student') {
        filtered = filtered.filter(g => g.studentId === currentUser.refId && g.statut === "Publié");
    }
    if (filterModule)  filtered = filtered.filter(g => g.moduleId  == filterModule);
    if (filterStudent) filtered = filtered.filter(g => g.studentId == filterStudent);
    if (filterStatus)  filtered = filtered.filter(g => g.statut === filterStatus);

    tbody.innerHTML = filtered.map(g => {
        const student = students.find(s => s.id === g.studentId);
        const module  = modules.find(m => m.id === g.moduleId);
        const editable = canEditGrade(g.moduleId);
        const actions = editable
            ? `<i class="fas fa-edit action-icon edit-grade" data-id="${g.id}"></i>
               <i class="fas fa-trash-alt action-icon delete-grade" data-id="${g.id}"></i>`
            : '';
        return `
            <tr>
                <td>${student ? escapeHtml(student.nom_prenom) : 'N/A'}</td>
                <td>${module  ? escapeHtml(module.nom_module)  : 'N/A'}</td>
                <td class="${getGradeColor(g.note)}">${g.note}/20</td>
                <td>${g.date_saisie}</td>
                <td><span class="badge">${g.statut}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
    attachGradeEvents();
    updateGradeStats();
}

function renderSchedule() {
    const tbody = document.querySelector('#scheduleTable tbody');
    if (!tbody) return;
    const visible = getVisibleSchedule();
    tbody.innerHTML = visible.map(s => {
        const mod     = modules.find(m => m.id === s.moduleId);
        const teacher = teachers.find(t => t.id === s.teacherId);
        const cls     = classes.find(c => c.id === s.classId);
        return `
            <tr>
                <td>${s.day}</td>
                <td>${s.hour}</td>
                <td>${mod     ? escapeHtml(mod.nom_module)     : 'N/A'}</td>
                <td>${teacher ? escapeHtml(teacher.nom_prenom) : 'N/A'}</td>
                <td>${cls     ? escapeHtml(cls.name)           : 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function updateGradeStats() {
    const statsDiv = document.getElementById('gradeStats');
    if (!statsDiv) return;
    const publishedGrades = grades.filter(g => g.statut === "Publié");
    if (publishedGrades.length === 0) {
        statsDiv.innerHTML = '<p>Aucune note publiée pour le moment.</p>';
        return;
    }
    const notes    = publishedGrades.map(g => g.note);
    const avg      = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1);
    const min      = Math.min(...notes);
    const max      = Math.max(...notes);
    const passRate = ((notes.filter(n => n >= 10).length / notes.length) * 100).toFixed(0);

    statsDiv.innerHTML = `
        <div class="stats-grid">
            <div class="stat-box"><h3>${avg}</h3><p>Moyenne générale</p></div>
            <div class="stat-box"><h3>${max}</h3><p>Meilleure note</p></div>
            <div class="stat-box"><h3>${min}</h3><p>Note minimale</p></div>
            <div class="stat-box"><h3>${passRate}%</h3><p>Taux de réussite</p></div>
        </div>
    `;
}

function updateRecentActivities() {
    const activitiesDiv = document.getElementById('recentActivities');
    if (!activitiesDiv) return;
    const recentGrades = [...grades].sort((a, b) => b.id - a.id).slice(0, 5);
    if (recentGrades.length === 0) {
        activitiesDiv.innerHTML = '<p>Aucune activité récente.</p>';
        return;
    }
    activitiesDiv.innerHTML = '<ul style="list-style: none;">' + recentGrades.map(g => {
        const student = students.find(s => s.id === g.studentId);
        const module  = modules.find(m => m.id === g.moduleId);
        return `<li style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <i class="fas fa-check-circle" style="color: #1e3c72;"></i>
            Note de ${student ? student.nom_prenom : 'N/A'} en ${module ? module.nom_module : 'N/A'} : ${g.note}/20 (${g.date_saisie})
        </li>`;
    }).join('') + '</ul>';
}

function refreshAllUI() {
    renderStudents();
    renderTeachers();
    renderModules();
    renderGrades();
    renderSchedule();
    updateStatsUI();
    updateRecentActivities();
    updateFilterOptions();
}

function updateFilterOptions() {
    const moduleFilter  = document.getElementById('filterModule');
    const studentFilter = document.getElementById('filterStudent');
    if (moduleFilter) {
        moduleFilter.innerHTML = '<option value="">Tous les modules</option>' +
            modules.map(m => `<option value="${m.id}">${escapeHtml(m.nom_module)}</option>`).join('');
    }
    if (studentFilter) {
        studentFilter.innerHTML = '<option value="">Tous les étudiants</option>' +
            students.map(s => `<option value="${s.id}">${escapeHtml(s.nom_prenom)}</option>`).join('');
    }
}

// ========== CRUD OPERATIONS ==========
function attachStudentEvents() {
    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Supprimer cet étudiant ?')) {
                students = students.filter(s => s.id !== id);
                grades   = grades.filter(g => g.studentId !== id);
                users    = users.filter(u => !(u.role === 'student' && u.refId === id));
                saveData();
                refreshAllUI();
            }
        });
    });

    document.querySelectorAll('.edit-student').forEach(btn => {
        btn.addEventListener('click', () => {
            const id      = parseInt(btn.dataset.id);
            const student = students.find(s => s.id === id);
            if (!student) return;
            const classOptions = classes.map(c =>
                `<option value="${c.id}" ${c.id === student.classId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');
            showModal(`
                <h3>Modifier l'étudiant</h3>
                <form id="editStudentForm">
                    <div class="input-group"><label>Nom complet</label>
                        <input type="text" id="editStudentName" value="${escapeHtml(student.nom_prenom)}" required></div>
                    <div class="input-group"><label>Email</label>
                        <input type="email" id="editStudentEmail" value="${escapeHtml(student.email)}" required></div>
                    <div class="input-group"><label>Classe</label>
                        <select id="editStudentClass">${classOptions}</select></div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, () => {
                student.nom_prenom = document.getElementById('editStudentName').value;
                student.email      = document.getElementById('editStudentEmail').value;
                student.classId    = parseInt(document.getElementById('editStudentClass').value);
                saveData();
                refreshAllUI();
            });
        });
    });
}

function attachTeacherEvents() {
    document.querySelectorAll('.delete-teacher').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Supprimer cet enseignant ?')) {
                teachers  = teachers.filter(t => t.id !== id);
                // FIX: nullify teacher reference instead of deleting modules
                modules   = modules.map(m => { if (m.teacherId === id) m.teacherId = null; return m; });
                schedules = schedules.filter(s => s.teacherId !== id);
                users     = users.filter(u => !(u.role === 'teacher' && u.refId === id));
                saveData();
                refreshAllUI();
            }
        });
    });

    document.querySelectorAll('.edit-teacher').forEach(btn => {
        btn.addEventListener('click', () => {
            const id      = parseInt(btn.dataset.id);
            const teacher = teachers.find(t => t.id === id);
            if (!teacher) return;
            showModal(`
                <h3>Modifier l'enseignant</h3>
                <form id="editTeacherForm">
                    <div class="input-group"><label>Nom complet</label>
                        <input type="text" id="editTeacherName" value="${escapeHtml(teacher.nom_prenom)}" required></div>
                    <div class="input-group"><label>Email</label>
                        <input type="email" id="editTeacherEmail" value="${escapeHtml(teacher.email)}" required></div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, () => {
                teacher.nom_prenom = document.getElementById('editTeacherName').value;
                teacher.email      = document.getElementById('editTeacherEmail').value;
                saveData();
                refreshAllUI();
            });
        });
    });
}

function attachModuleEvents() {
    document.querySelectorAll('.delete-module').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Supprimer ce module ?')) {
                modules   = modules.filter(m => m.id !== id);
                // FIX: cascade delete grades + schedules
                grades    = grades.filter(g => g.moduleId !== id);
                schedules = schedules.filter(s => s.moduleId !== id);
                saveData();
                refreshAllUI();
            }
        });
    });

    document.querySelectorAll('.edit-module').forEach(btn => {
        btn.addEventListener('click', () => {
            const id     = parseInt(btn.dataset.id);
            const module = modules.find(m => m.id === id);
            if (!module) return;
            const teacherOptions = teachers.map(t =>
                `<option value="${t.id}" ${t.id === module.teacherId ? 'selected' : ''}>${escapeHtml(t.nom_prenom)}</option>`
            ).join('');
            showModal(`
                <h3>Modifier le module</h3>
                <form id="editModuleForm">
                    <div class="input-group"><label>Nom du module</label>
                        <input type="text" id="editModuleName" value="${escapeHtml(module.nom_module)}" required></div>
                    <div class="input-group"><label>Coefficient</label>
                        <input type="number" id="editModuleCoeff" value="${module.coefficient || 1}" step="0.5" required></div>
                    <div class="input-group"><label>Crédits ECTS</label>
                        <input type="number" id="editModuleCredits" value="${module.credits || 0}" required></div>
                    <div class="input-group"><label>Enseignant responsable</label>
                        <select id="editModuleTeacher">${teacherOptions}</select></div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, () => {
                module.nom_module  = document.getElementById('editModuleName').value;
                module.coefficient = parseFloat(document.getElementById('editModuleCoeff').value);
                module.credits     = parseInt(document.getElementById('editModuleCredits').value);
                module.teacherId   = parseInt(document.getElementById('editModuleTeacher').value);
                saveData();
                refreshAllUI();
            });
        });
    });
}

function attachGradeEvents() {
    document.querySelectorAll('.delete-grade').forEach(btn => {
        btn.addEventListener('click', () => {
            const id    = parseInt(btn.dataset.id);
            const grade = grades.find(g => g.id === id);
            if (!grade) return;
            if (!canEditGrade(grade.moduleId)) { alert("Non autorisé"); return; }
            if (confirm('Supprimer cette note ?')) {
                grades = grades.filter(g => g.id !== id);
                saveData();
                refreshAllUI();
            }
        });
    });

    document.querySelectorAll('.edit-grade').forEach(btn => {
        btn.addEventListener('click', () => {
            const id    = parseInt(btn.dataset.id);
            const grade = grades.find(g => g.id === id);
            if (!grade) return;
            if (!canEditGrade(grade.moduleId)) { alert("Non autorisé"); return; }

            const studentOptions = students.map(s =>
                `<option value="${s.id}" ${s.id === grade.studentId ? 'selected' : ''}>${escapeHtml(s.nom_prenom)}</option>`
            ).join('');
            const moduleOptions = modules.map(m =>
                `<option value="${m.id}" ${m.id === grade.moduleId ? 'selected' : ''}>${escapeHtml(m.nom_module)}</option>`
            ).join('');
            showModal(`
                <h3>Modifier la note</h3>
                <form id="editGradeForm">
                    <div class="input-group"><label>Étudiant</label>
                        <select id="editGradeStudent">${studentOptions}</select></div>
                    <div class="input-group"><label>Module</label>
                        <select id="editGradeModule">${moduleOptions}</select></div>
                    <div class="input-group"><label>Note /20</label>
                        <input type="number" id="editGradeValue" step="0.1" value="${grade.note}" required></div>
                    <div class="input-group"><label>Statut</label>
                        <select id="editGradeStatus">
                            <option value="Publié"   ${grade.statut === 'Publié'   ? 'selected' : ''}>Publié</option>
                            <option value="Brouillon" ${grade.statut === 'Brouillon' ? 'selected' : ''}>Brouillon</option>
                        </select></div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, () => {
                const newModuleId = parseInt(document.getElementById('editGradeModule').value);
                if (!canEditGrade(newModuleId)) { alert("Non autorisé pour ce module"); return; }
                grade.studentId = parseInt(document.getElementById('editGradeStudent').value);
                grade.moduleId  = newModuleId;
                grade.note      = parseFloat(document.getElementById('editGradeValue').value);
                grade.statut    = document.getElementById('editGradeStatus').value;
                saveData();
                refreshAllUI();
            });
        });
    });
}

// ========== MODAL ==========
function showModal(contentHtml, onSubmit) {
    const modal        = document.getElementById('genericModal');
    const modalContent = document.getElementById('modalContent');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = contentHtml;
    modal.classList.add('open');

    const form = modalContent.querySelector('form');
    if (form && onSubmit) {
        form.onsubmit = (e) => {
            e.preventDefault();
            onSubmit(form);
            modal.classList.remove('open');
        };
    }
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
}

// ========== ADD BUTTONS ==========
function initAddButtons() {
    // Add Student (admin only)
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            if (!requireRole('admin')) return;
            const classOptions = classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
            showModal(`
                <h3>Ajouter un étudiant</h3>
                <form id="addStudentForm">
                    <div class="input-group"><label>Nom complet</label>
                        <input type="text" id="studentName" required></div>
                    <div class="input-group"><label>Email</label>
                        <input type="email" id="studentEmail" required></div>
                    <div class="input-group"><label>Classe</label>
                        <select id="studentClass">${classOptions}</select></div>
                    <button type="submit" class="btn-primary">Créer</button>
                </form>
            `, () => {
                const name    = document.getElementById('studentName').value;
                const email   = document.getElementById('studentEmail').value;
                const classId = parseInt(document.getElementById('studentClass').value);
                const newId   = nextIds.students++;
                students.push({ id: newId, nom_prenom: name, email, classId });
                users.push({ id: nextIds.users++, email, password: "student", role: "student", refId: newId, fullName: name });
                saveData();
                refreshAllUI();
            });
        });
    }

    // Add Teacher (admin only)
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) {
        addTeacherBtn.addEventListener('click', () => {
            if (!requireRole('admin')) return;
            showModal(`
                <h3>Ajouter un enseignant</h3>
                <form id="addTeacherForm">
                    <div class="input-group"><label>Nom complet</label>
                        <input type="text" id="teacherName" required></div>
                    <div class="input-group"><label>Email</label>
                        <input type="email" id="teacherEmail" required></div>
                    <button type="submit" class="btn-primary">Ajouter</button>
                </form>
            `, () => {
                const name  = document.getElementById('teacherName').value;
                const email = document.getElementById('teacherEmail').value;
                const newId = nextIds.teachers++;
                teachers.push({ id: newId, nom_prenom: name, email });
                users.push({ id: nextIds.users++, email, password: "teacher", role: "teacher", refId: newId, fullName: name });
                saveData();
                refreshAllUI();
            });
        });
    }

    // Add Module (admin only)
    const addModuleBtn = document.getElementById('addModuleBtn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', () => {
            if (!requireRole('admin')) return;
            const teacherOptions = teachers.map(t => `<option value="${t.id}">${escapeHtml(t.nom_prenom)}</option>`).join('');
            showModal(`
                <h3>Ajouter un module</h3>
                <form id="addModuleForm">
                    <div class="input-group"><label>Nom du module</label>
                        <input type="text" id="moduleName" required></div>
                    <div class="input-group"><label>Coefficient</label>
                        <input type="number" id="moduleCoeff" value="1" step="0.5" required></div>
                    <div class="input-group"><label>Crédits ECTS</label>
                        <input type="number" id="moduleCredits" value="0" required></div>
                    <div class="input-group"><label>Enseignant responsable</label>
                        <select id="moduleTeacher">${teacherOptions}</select></div>
                    <button type="submit" class="btn-primary">Créer</button>
                </form>
            `, () => {
                modules.push({
                    id: nextIds.modules++,
                    nom_module:  document.getElementById('moduleName').value,
                    coefficient: parseFloat(document.getElementById('moduleCoeff').value),
                    credits:     parseInt(document.getElementById('moduleCredits').value),
                    teacherId:   parseInt(document.getElementById('moduleTeacher').value)
                });
                saveData();
                refreshAllUI();
            });
        });
    }

    // Add Grade (admin or teacher)
    const addGradeBtn = document.getElementById('addGradeBtn');
    if (addGradeBtn) {
        addGradeBtn.addEventListener('click', () => {
            if (currentUser.role === 'student') { alert("Non autorisé"); return; }
            // Teachers only see their modules
            const allowedModules = currentUser.role === 'admin'
                ? modules
                : modules.filter(m => m.teacherId === currentUser.refId);

            const studentOptions = students.map(s =>
                `<option value="${s.id}">${escapeHtml(s.nom_prenom)}</option>`).join('');
            const moduleOptions = allowedModules.map(m =>
                `<option value="${m.id}">${escapeHtml(m.nom_module)}</option>`).join('');

            showModal(`
                <h3>Attribuer une note</h3>
                <form id="addGradeForm">
                    <div class="input-group"><label>Étudiant</label>
                        <select id="gradeStudent">${studentOptions}</select></div>
                    <div class="input-group"><label>Module</label>
                        <select id="gradeModule">${moduleOptions}</select></div>
                    <div class="input-group"><label>Note /20</label>
                        <input type="number" id="gradeValue" step="0.1" min="0" max="20" required></div>
                    <div class="input-group"><label>Statut</label>
                        <select id="gradeStatus">
                            <option value="Publié">Publié</option>
                            <option value="Brouillon">Brouillon</option>
                        </select></div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, () => {
                const moduleId = parseInt(document.getElementById('gradeModule').value);
                if (!canEditGrade(moduleId)) { alert("Non autorisé pour ce module"); return; }
                grades.push({
                    id:          nextIds.grades++,
                    studentId:   parseInt(document.getElementById('gradeStudent').value),
                    moduleId,
                    note:        parseFloat(document.getElementById('gradeValue').value),
                    date_saisie: new Date().toISOString().slice(0, 10),
                    statut:      document.getElementById('gradeStatus').value
                });
                saveData();
                refreshAllUI();
            });
        });
    }
}

// ========== SEARCH ==========
function initSearch() {
    ['searchStudent', 'searchTeacher', 'searchModule'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            if (id === 'searchStudent') renderStudents();
            if (id === 'searchTeacher') renderTeachers();
            if (id === 'searchModule')  renderModules();
        });
    });
    ['filterModule', 'filterStudent', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => renderGrades());
    });
}

// ========== AUTHENTICATION ==========
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        const userBadge = document.getElementById('currentUserRole');
        if (userBadge) {
            const roleDisplay = currentUser.role === 'admin' ? 'Administrateur'
                              : currentUser.role === 'teacher' ? 'Enseignant' : 'Étudiant';
            userBadge.innerHTML = `<i class="fas fa-id-card"></i> ${roleDisplay} : ${currentUser.email}`;
        }
        return true;
    }
    return false;
}

function handleLogin(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Role-based redirection
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (user.role === 'teacher') {
            window.location.href = 'teachers.html';
        } else {
            window.location.href = 'students.html';
        }
        return true;
    } else {
        alert("Email ou mot de passe incorrect");
        return false;
    }
}

function showAdminNavIfNeeded() {
    const adminNavItem = document.getElementById('adminNavItem');
    if (adminNavItem && currentUser && currentUser.role === 'admin') {
        adminNavItem.style.display = 'block';
    }
}

function handleRegister(email, password, role, fullName) {
    if (users.find(u => u.email === email)) {
        alert("Email déjà utilisé");
        return false;
    }
    // Prevent duplicate admins
    if (role === 'admin' && users.some(u => u.role === 'admin')) {
        alert("Un administrateur existe déjà");
        return false;
    }

    let refId = null;
    if (role === 'teacher') {
        const newId = nextIds.teachers++;
        teachers.push({ id: newId, nom_prenom: fullName, email });
        refId = newId;
    } else if (role === 'student') {
        const newId = nextIds.students++;
        students.push({ id: newId, nom_prenom: fullName, email, classId: null });
        refId = newId;
    }

    users.push({ id: nextIds.users++, email, password, role, refId, fullName });
    saveData();
    alert("Inscription réussie ! Veuillez vous connecter.");
    return true;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ========== PAGE INITIALIZATION ==========
function initPage() {
    loadData();

    const path       = window.location.pathname;
    const isAuthPage  = path.includes('login.html') || path.includes('register.html');
    const isIndexPage = path.endsWith('index.html') || path === '/' || path.endsWith('/');

    if (!isAuthPage && !isIndexPage) {
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        showAdminNavIfNeeded();
    }

    refreshAllUI();
    initAddButtons();
    initSearch();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(
                document.getElementById('loginEmail').value,
                document.getElementById('loginPassword').value
            );
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const roleSelect       = document.getElementById('regRole');
        const teacherNameGroup = document.getElementById('teacherNameGroup');
        const studentNameGroup = document.getElementById('studentNameGroup');

        if (roleSelect) {
            const updateNameFields = () => {
                if (teacherNameGroup) teacherNameGroup.style.display = roleSelect.value === 'teacher' ? 'block' : 'none';
                if (studentNameGroup) studentNameGroup.style.display = roleSelect.value === 'student' ? 'block' : 'none';
            };
            roleSelect.addEventListener('change', updateNameFields);
            updateNameFields();
        }

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('regRole').value;
            let fullName = '';
            if (role === 'teacher')      fullName = document.getElementById('teacherName')?.value || '';
            else if (role === 'student') fullName = document.getElementById('studentName')?.value || '';
            else                         fullName = document.getElementById('regEmail').value.split('@')[0];

            if (!fullName) { alert("Veuillez entrer votre nom complet"); return; }

            if (handleRegister(
                document.getElementById('regEmail').value,
                document.getElementById('regPassword').value,
                role,
                fullName
            )) {
                window.location.href = 'login.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initPage);