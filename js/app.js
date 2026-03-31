// ========== DATA STORES ==========
let users = [];
let teachers = [];
let students = [];
let modules = [];
let grades = [];
let currentUser = null;
let nextIds = { users: 1, teachers: 1, students: 1, modules: 1, grades: 1 };

// ========== INITIALIZATION ==========
function initDemoData() {
    // Admin user
    users.push({ id: 1, email: "admin@edumanage.com", password: "admin123", role: "admin", refId: null, fullName: "Administrateur" });
    
    // Teacher demo
    teachers.push({ id: 1, nom_prenom: "Dr. Sophie Martin", email: "sophie.martin@ecole.fr" });
    users.push({ id: 2, email: "sophie.martin@ecole.fr", password: "teacher", role: "teacher", refId: 1, fullName: "Dr. Sophie Martin" });
    
    // Students demo
    students.push({ id: 1, nom_prenom: "Lucas Bernard", email: "lucas.bernard@etudiant.fr" });
    users.push({ id: 3, email: "lucas.bernard@etudiant.fr", password: "student", role: "student", refId: 1, fullName: "Lucas Bernard" });
    
    students.push({ id: 2, nom_prenom: "Emma Petit", email: "emma.petit@etudiant.fr" });
    users.push({ id: 4, email: "emma.petit@etudiant.fr", password: "student", role: "student", refId: 2, fullName: "Emma Petit" });
    
    students.push({ id: 3, nom_prenom: "Thomas Dubois", email: "thomas.dubois@etudiant.fr" });
    users.push({ id: 5, email: "thomas.dubois@etudiant.fr", password: "student", role: "student", refId: 3, fullName: "Thomas Dubois" });
    
    // Modules
    modules.push({ id: 1, nom_module: "Mathématiques Avancées", coefficient: 3, credits: 6, teacherId: 1 });
    modules.push({ id: 2, nom_module: "Base de Données", coefficient: 4, credits: 8, teacherId: 1 });
    modules.push({ id: 3, nom_module: "Programmation Web", coefficient: 5, credits: 10, teacherId: 1 });
    
    // Grades
    grades.push({ id: 1, studentId: 1, moduleId: 1, note: 15.5, date_saisie: "2025-02-10", statut: "Publié" });
    grades.push({ id: 2, studentId: 2, moduleId: 1, note: 12.0, date_saisie: "2025-02-10", statut: "Publié" });
    grades.push({ id: 3, studentId: 1, moduleId: 2, note: 17.0, date_saisie: "2025-02-15", statut: "Publié" });
    grades.push({ id: 4, studentId: 3, moduleId: 2, note: 14.5, date_saisie: "2025-02-15", statut: "Brouillon" });
    
    nextIds = { users: 6, teachers: 2, students: 4, modules: 4, grades: 5 };
}

function saveData() {
    localStorage.setItem('edumanage_data', JSON.stringify({ users, teachers, students, modules, grades, nextIds }));
}

function loadData() {
    const raw = localStorage.getItem('edumanage_data');
    if (raw) {
        const data = JSON.parse(raw);
        users = data.users;
        teachers = data.teachers;
        students = data.students;
        modules = data.modules;
        grades = data.grades;
        nextIds = data.nextIds;
    } else {
        initDemoData();
        saveData();
    }
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
    let sum = 0;
    let totalCoeff = 0;
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
    const statModules = document.getElementById('statModules');
    const statGrades = document.getElementById('statGrades');
    if (statStudents) statStudents.innerText = students.length;
    if (statTeachers) statTeachers.innerText = teachers.length;
    if (statModules) statModules.innerText = modules.length;
    if (statGrades) statGrades.innerText = grades.length;
}

function renderStudents() {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    const filtered = students.filter(s => s.nom_prenom.toLowerCase().includes(searchTerm) || s.email.toLowerCase().includes(searchTerm));
    
    tbody.innerHTML = filtered.map(s => {
        const avg = getStudentAverage(s.id);
        const avgDisplay = avg ? `<span class="${getGradeColor(parseFloat(avg))}">${avg}/20</span>` : '—';
        return `
            <tr>
                <td>${s.id}</td>
                <td>${escapeHtml(s.nom_prenom)}</td>
                <td>${escapeHtml(s.email)}</td>
                <td>${avgDisplay}</td>
                <td>
                    <i class="fas fa-edit action-icon edit-student" data-id="${s.id}"></i>
                    <i class="fas fa-trash-alt action-icon delete-student" data-id="${s.id}"></i>
                </td>
            </tr>
        `;
    }).join('');
    attachStudentEvents();
}

function renderTeachers() {
    const tbody = document.querySelector('#teachersTable tbody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchTeacher')?.value.toLowerCase() || '';
    const filtered = teachers.filter(t => t.nom_prenom.toLowerCase().includes(searchTerm) || t.email.toLowerCase().includes(searchTerm));
    
    tbody.innerHTML = filtered.map(t => {
        const teacherModules = modules.filter(m => m.teacherId === t.id);
        const moduleCount = teacherModules.length;
        return `
            <tr>
                <td>${t.id}</td>
                <td>${escapeHtml(t.nom_prenom)}</td>
                <td>${escapeHtml(t.email)}</td>
                <td>${moduleCount} module(s)</td>
                <td>
                    <i class="fas fa-edit action-icon edit-teacher" data-id="${t.id}"></i>
                    <i class="fas fa-trash-alt action-icon delete-teacher" data-id="${t.id}"></i>
                </td>
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
    
    tbody.innerHTML = filtered.map(m => {
        const teacher = teachers.find(t => t.id === m.teacherId);
        return `
            <tr>
                <td>${m.id}</td>
                <td>${escapeHtml(m.nom_module)}</td>
                <td>${m.coefficient || 1}</td>
                <td>${teacher ? escapeHtml(teacher.nom_prenom) : 'Non affecté'}</td>
                <td>${m.credits || 0}</td>
                <td>
                    <i class="fas fa-edit action-icon edit-module" data-id="${m.id}"></i>
                    <i class="fas fa-trash-alt action-icon delete-module" data-id="${m.id}"></i>
                </td>
            </tr>
        `;
    }).join('');
    attachModuleEvents();
}

function renderGrades() {
    const tbody = document.querySelector('#gradesTable tbody');
    if (!tbody) return;
    const filterModule = document.getElementById('filterModule')?.value;
    const filterStudent = document.getElementById('filterStudent')?.value;
    const filterStatus = document.getElementById('filterStatus')?.value;
    
    let filtered = [...grades];
    if (filterModule) filtered = filtered.filter(g => g.moduleId == filterModule);
    if (filterStudent) filtered = filtered.filter(g => g.studentId == filterStudent);
    if (filterStatus) filtered = filtered.filter(g => g.statut === filterStatus);
    
    tbody.innerHTML = filtered.map(g => {
        const student = students.find(s => s.id === g.studentId);
        const module = modules.find(m => m.id === g.moduleId);
        return `
            <tr>
                <td>${student ? escapeHtml(student.nom_prenom) : 'N/A'}</td>
                <td>${module ? escapeHtml(module.nom_module) : 'N/A'}</td>
                <td class="${getGradeColor(g.note)}">${g.note}/20</td>
                <td>${g.date_saisie}</td>
                <td><span class="badge">${g.statut}</span></td>
                <td>
                    <i class="fas fa-edit action-icon edit-grade" data-id="${g.id}"></i>
                    <i class="fas fa-trash-alt action-icon delete-grade" data-id="${g.id}"></i>
                </td>
            </tr>
        `;
    }).join('');
    attachGradeEvents();
    updateGradeStats();
}

function updateGradeStats() {
    const statsDiv = document.getElementById('gradeStats');
    if (!statsDiv) return;
    const publishedGrades = grades.filter(g => g.statut === "Publié");
    if (publishedGrades.length === 0) {
        statsDiv.innerHTML = '<p>Aucune note publiée pour le moment.</p>';
        return;
    }
    const notes = publishedGrades.map(g => g.note);
    const avg = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1);
    const min = Math.min(...notes);
    const max = Math.max(...notes);
    const aboveAvg = notes.filter(n => n >= 10).length;
    const passRate = ((aboveAvg / notes.length) * 100).toFixed(0);
    
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
        const module = modules.find(m => m.id === g.moduleId);
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
    updateStatsUI();
    updateRecentActivities();
    updateFilterOptions();
}

function updateFilterOptions() {
    const moduleFilter = document.getElementById('filterModule');
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
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            if (confirm('Supprimer cet étudiant ?')) {
                students = students.filter(s => s.id !== id);
                grades = grades.filter(g => g.studentId !== id);
                saveData();
                refreshAllUI();
            }
        });
    });
    
    document.querySelectorAll('.edit-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            let student = students.find(s => s.id === id);
            if (student) {
                showModal(`
                    <h3>Modifier l'étudiant</h3>
                    <form id="editStudentForm">
                        <div class="input-group">
                            <label>Nom complet</label>
                            <input type="text" id="editStudentName" value="${escapeHtml(student.nom_prenom)}" required>
                        </div>
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="editStudentEmail" value="${escapeHtml(student.email)}" required>
                        </div>
                        <button type="submit" class="btn-primary">Enregistrer</button>
                    </form>
                `, (form) => {
                    student.nom_prenom = document.getElementById('editStudentName').value;
                    student.email = document.getElementById('editStudentEmail').value;
                    saveData();
                    refreshAllUI();
                });
            }
        });
    });
}

function attachTeacherEvents() {
    document.querySelectorAll('.delete-teacher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            if (confirm('Supprimer cet enseignant ?')) {
                teachers = teachers.filter(t => t.id !== id);
                modules = modules.filter(m => m.teacherId !== id);
                saveData();
                refreshAllUI();
            }
        });
    });
    
    document.querySelectorAll('.edit-teacher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            let teacher = teachers.find(t => t.id === id);
            if (teacher) {
                showModal(`
                    <h3>Modifier l'enseignant</h3>
                    <form id="editTeacherForm">
                        <div class="input-group">
                            <label>Nom complet</label>
                            <input type="text" id="editTeacherName" value="${escapeHtml(teacher.nom_prenom)}" required>
                        </div>
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="editTeacherEmail" value="${escapeHtml(teacher.email)}" required>
                        </div>
                        <button type="submit" class="btn-primary">Enregistrer</button>
                    </form>
                `, (form) => {
                    teacher.nom_prenom = document.getElementById('editTeacherName').value;
                    teacher.email = document.getElementById('editTeacherEmail').value;
                    saveData();
                    refreshAllUI();
                });
            }
        });
    });
}

function attachModuleEvents() {
    document.querySelectorAll('.delete-module').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            if (confirm('Supprimer ce module ?')) {
                modules = modules.filter(m => m.id !== id);
                grades = grades.filter(g => g.moduleId !== id);
                saveData();
                refreshAllUI();
            }
        });
    });
    
    document.querySelectorAll('.edit-module').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            let module = modules.find(m => m.id === id);
            if (module) {
                const teacherOptions = teachers.map(t => `<option value="${t.id}" ${t.id === module.teacherId ? 'selected' : ''}>${escapeHtml(t.nom_prenom)}</option>`).join('');
                showModal(`
                    <h3>Modifier le module</h3>
                    <form id="editModuleForm">
                        <div class="input-group">
                            <label>Nom du module</label>
                            <input type="text" id="editModuleName" value="${escapeHtml(module.nom_module)}" required>
                        </div>
                        <div class="input-group">
                            <label>Coefficient</label>
                            <input type="number" id="editModuleCoeff" value="${module.coefficient || 1}" step="0.5" required>
                        </div>
                        <div class="input-group">
                            <label>Crédits ECTS</label>
                            <input type="number" id="editModuleCredits" value="${module.credits || 0}" required>
                        </div>
                        <div class="input-group">
                            <label>Enseignant responsable</label>
                            <select id="editModuleTeacher">${teacherOptions}</select>
                        </div>
                        <button type="submit" class="btn-primary">Enregistrer</button>
                    </form>
                `, (form) => {
                    module.nom_module = document.getElementById('editModuleName').value;
                    module.coefficient = parseFloat(document.getElementById('editModuleCoeff').value);
                    module.credits = parseInt(document.getElementById('editModuleCredits').value);
                    module.teacherId = parseInt(document.getElementById('editModuleTeacher').value);
                    saveData();
                    refreshAllUI();
                });
            }
        });
    });
}

function attachGradeEvents() {
    document.querySelectorAll('.delete-grade').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            if (confirm('Supprimer cette note ?')) {
                grades = grades.filter(g => g.id !== id);
                saveData();
                refreshAllUI();
            }
        });
    });
    
    document.querySelectorAll('.edit-grade').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = parseInt(btn.dataset.id);
            let grade = grades.find(g => g.id === id);
            if (grade) {
                const studentOptions = students.map(s => `<option value="${s.id}" ${s.id === grade.studentId ? 'selected' : ''}>${escapeHtml(s.nom_prenom)}</option>`).join('');
                const moduleOptions = modules.map(m => `<option value="${m.id}" ${m.id === grade.moduleId ? 'selected' : ''}>${escapeHtml(m.nom_module)}</option>`).join('');
                showModal(`
                    <h3>Modifier la note</h3>
                    <form id="editGradeForm">
                        <div class="input-group">
                            <label>Étudiant</label>
                            <select id="editGradeStudent">${studentOptions}</select>
                        </div>
                        <div class="input-group">
                            <label>Module</label>
                            <select id="editGradeModule">${moduleOptions}</select>
                        </div>
                        <div class="input-group">
                            <label>Note /20</label>
                            <input type="number" id="editGradeValue" step="0.1" value="${grade.note}" required>
                        </div>
                        <div class="input-group">
                            <label>Statut</label>
                            <select id="editGradeStatus">
                                <option value="Publié" ${grade.statut === 'Publié' ? 'selected' : ''}>Publié</option>
                                <option value="Brouillon" ${grade.statut === 'Brouillon' ? 'selected' : ''}>Brouillon</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-primary">Enregistrer</button>
                    </form>
                `, (form) => {
                    grade.studentId = parseInt(document.getElementById('editGradeStudent').value);
                    grade.moduleId = parseInt(document.getElementById('editGradeModule').value);
                    grade.note = parseFloat(document.getElementById('editGradeValue').value);
                    grade.statut = document.getElementById('editGradeStatus').value;
                    saveData();
                    refreshAllUI();
                });
            }
        });
    });
}

// ========== MODAL FUNCTIONS ==========
function showModal(contentHtml, onSubmit) {
    const modal = document.getElementById('genericModal');
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
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('open');
    };
}

// ========== ADD BUTTONS ==========
function initAddButtons() {
    // Add Student
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            showModal(`
                <h3>Ajouter un étudiant</h3>
                <form id="addStudentForm">
                    <div class="input-group">
                        <label>Nom complet</label>
                        <input type="text" id="studentName" required>
                    </div>
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" id="studentEmail" required>
                    </div>
                    <button type="submit" class="btn-primary">Créer</button>
                </form>
            `, (form) => {
                const name = document.getElementById('studentName').value;
                const email = document.getElementById('studentEmail').value;
                const newId = nextIds.students++;
                students.push({ id: newId, nom_prenom: name, email });
                users.push({ id: nextIds.users++, email: email, password: "student", role: "student", refId: newId, fullName: name });
                saveData();
                refreshAllUI();
            });
        });
    }
    
    // Add Teacher
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) {
        addTeacherBtn.addEventListener('click', () => {
            showModal(`
                <h3>Ajouter un enseignant</h3>
                <form id="addTeacherForm">
                    <div class="input-group">
                        <label>Nom complet</label>
                        <input type="text" id="teacherName" required>
                    </div>
                    <div class="input-group">
                        <label>Email</label>
                        <input type="email" id="teacherEmail" required>
                    </div>
                    <button type="submit" class="btn-primary">Ajouter</button>
                </form>
            `, (form) => {
                const name = document.getElementById('teacherName').value;
                const email = document.getElementById('teacherEmail').value;
                const newId = nextIds.teachers++;
                teachers.push({ id: newId, nom_prenom: name, email });
                users.push({ id: nextIds.users++, email: email, password: "teacher", role: "teacher", refId: newId, fullName: name });
                saveData();
                refreshAllUI();
            });
        });
    }
    
    // Add Module
    const addModuleBtn = document.getElementById('addModuleBtn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', () => {
            const teacherOptions = teachers.map(t => `<option value="${t.id}">${escapeHtml(t.nom_prenom)}</option>`).join('');
            showModal(`
                <h3>Ajouter un module</h3>
                <form id="addModuleForm">
                    <div class="input-group">
                        <label>Nom du module</label>
                        <input type="text" id="moduleName" required>
                    </div>
                    <div class="input-group">
                        <label>Coefficient</label>
                        <input type="number" id="moduleCoeff" value="1" step="0.5" required>
                    </div>
                    <div class="input-group">
                        <label>Crédits ECTS</label>
                        <input type="number" id="moduleCredits" value="0" required>
                    </div>
                    <div class="input-group">
                        <label>Enseignant responsable</label>
                        <select id="moduleTeacher">${teacherOptions}</select>
                    </div>
                    <button type="submit" class="btn-primary">Créer</button>
                </form>
            `, (form) => {
                const name = document.getElementById('moduleName').value;
                const coeff = parseFloat(document.getElementById('moduleCoeff').value);
                const credits = parseInt(document.getElementById('moduleCredits').value);
                const teacherId = parseInt(document.getElementById('moduleTeacher').value);
                modules.push({ id: nextIds.modules++, nom_module: name, coefficient: coeff, credits: credits, teacherId: teacherId });
                saveData();
                refreshAllUI();
            });
        });
    }
    
    // Add Grade
    const addGradeBtn = document.getElementById('addGradeBtn');
    if (addGradeBtn) {
        addGradeBtn.addEventListener('click', () => {
            const studentOptions = students.map(s => `<option value="${s.id}">${escapeHtml(s.nom_prenom)}</option>`).join('');
            const moduleOptions = modules.map(m => `<option value="${m.id}">${escapeHtml(m.nom_module)}</option>`).join('');
            showModal(`
                <h3>Attribuer une note</h3>
                <form id="addGradeForm">
                    <div class="input-group">
                        <label>Étudiant</label>
                        <select id="gradeStudent">${studentOptions}</select>
                    </div>
                    <div class="input-group">
                        <label>Module</label>
                        <select id="gradeModule">${moduleOptions}</select>
                    </div>
                    <div class="input-group">
                        <label>Note /20</label>
                        <input type="number" id="gradeValue" step="0.1" required>
                    </div>
                    <div class="input-group">
                        <label>Statut</label>
                        <select id="gradeStatus">
                            <option value="Publié">Publié</option>
                            <option value="Brouillon">Brouillon</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </form>
            `, (form) => {
                const studentId = parseInt(document.getElementById('gradeStudent').value);
                const moduleId = parseInt(document.getElementById('gradeModule').value);
                const note = parseFloat(document.getElementById('gradeValue').value);
                const statut = document.getElementById('gradeStatus').value;
                grades.push({ 
                    id: nextIds.grades++, 
                    studentId, 
                    moduleId, 
                    note, 
                    date_saisie: new Date().toISOString().slice(0, 10), 
                    statut 
                });
                saveData();
                refreshAllUI();
            });
        });
    }
}

// ========== SEARCH FUNCTIONALITY ==========
function initSearch() {
    const searchStudent = document.getElementById('searchStudent');
    if (searchStudent) {
        searchStudent.addEventListener('input', () => renderStudents());
    }
    
    const searchTeacher = document.getElementById('searchTeacher');
    if (searchTeacher) {
        searchTeacher.addEventListener('input', () => renderTeachers());
    }
    
    const searchModule = document.getElementById('searchModule');
    if (searchModule) {
        searchModule.addEventListener('input', () => renderModules());
    }
    
    const filterModule = document.getElementById('filterModule');
    if (filterModule) {
        filterModule.addEventListener('change', () => renderGrades());
    }
    
    const filterStudent = document.getElementById('filterStudent');
    if (filterStudent) {
        filterStudent.addEventListener('change', () => renderGrades());
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => renderGrades());
    }
}

// ========== AUTHENTICATION ==========
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        const userBadge = document.getElementById('currentUserRole');
        if (userBadge) {
            let roleDisplay = currentUser.role === 'admin' ? 'Administrateur' : (currentUser.role === 'teacher' ? 'Enseignant' : 'Étudiant');
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
        window.location.href = 'dashboard.html';
        return true;
    } else {
        alert("Email ou mot de passe incorrect");
        return false;
    }
}

function handleRegister(email, password, role, fullName) {
    if (users.find(u => u.email === email)) {
        alert("Email déjà utilisé");
        return false;
    }
    
    let refId = null;
    if (role === 'teacher') {
        const newId = nextIds.teachers++;
        teachers.push({ id: newId, nom_prenom: fullName, email: email });
        refId = newId;
    } else if (role === 'student') {
        const newId = nextIds.students++;
        students.push({ id: newId, nom_prenom: fullName, email: email });
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
    
    // Check if we're on auth pages
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');
    const isIndexPage = path.endsWith('index.html') || path === '/' || path.endsWith('/');
    
    if (!isAuthPage && !isIndexPage) {
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Initialize page-specific elements
    refreshAllUI();
    initAddButtons();
    initSearch();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pwd = document.getElementById('loginPassword').value;
            handleLogin(email, pwd);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const roleSelect = document.getElementById('regRole');
        const teacherNameGroup = document.getElementById('teacherNameGroup');
        const studentNameGroup = document.getElementById('studentNameGroup');
        
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                if (teacherNameGroup) teacherNameGroup.style.display = roleSelect.value === 'teacher' ? 'block' : 'none';
                if (studentNameGroup) studentNameGroup.style.display = roleSelect.value === 'student' ? 'block' : 'none';
            });
            // Trigger initial state
            if (roleSelect.value === 'teacher' && teacherNameGroup) teacherNameGroup.style.display = 'block';
            if (roleSelect.value === 'student' && studentNameGroup) studentNameGroup.style.display = 'block';
        }
        
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const pwd = document.getElementById('regPassword').value;
            const role = document.getElementById('regRole').value;
            let fullName = '';
            
            if (role === 'teacher') {
                fullName = document.getElementById('teacherName')?.value || '';
            } else if (role === 'student') {
                fullName = document.getElementById('studentName')?.value || '';
            } else {
                fullName = email.split('@')[0];
            }
            
            if (fullName === '') {
                alert("Veuillez entrer votre nom complet");
                return;
            }
            
            if (handleRegister(email, pwd, role, fullName)) {
                window.location.href = 'login.html';
            }
        });
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', initPage);