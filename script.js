class CreativeLoginV4 {
    constructor() {
        this.accounts = [];
        this.activityLog = [];
        this.currentUser = null;
        this.recoveryEmail = null;
        this.init();
    }

    init() {
        console.log('🚀 CreativeLogin v4.0 - PERFECT EDITION');
        this.loadData();
        this.ensureAdmin();
        this.bindEvents();
        this.checkSession();
    }

    loadData() {
        try {
            this.accounts = JSON.parse(localStorage.getItem('userAccounts')) || [];
            this.activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
        } catch (e) {
            this.accounts = [];
            this.activityLog = [];
        }
    }

    ensureAdmin() {
        const admin = this.accounts.find(a => a.username.toLowerCase() === 'admin');
        if (!admin) {
            this.accounts.unshift({
                username: 'admin',
                email: 'admin@creative.com',
                password: 'admin2024',
                isAdmin: true,
                isSuspended: false,
                createdAt: Date.now(),
                lastLogin: null
            });
            this.saveAccounts();
            console.log('👑 Admin created: admin/admin2024');
        }
    }

    bindEvents() {
        // Form links
        ['toRegister', 'toLogin', 'toForgot', 'backLogin1', 'backLogin2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = (e) => {
                    e.preventDefault();
                    this.switchPanel(id);
                };
            }
        });

        // Forms
        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            this.login();
        };
        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();
            this.register();
        };
        document.getElementById('forgot1Form').onsubmit = (e) => {
            e.preventDefault();
            this.forgotStep1();
        };
        document.getElementById('forgot2Form').onsubmit = (e) => {
            e.preventDefault();
            this.forgotStep2();
        };
        document.getElementById('settingsForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveSettings();
        };

        // Dashboard buttons
        document.getElementById('logoutBtn').onclick = () => this.logout();
        document.getElementById('settingsBtn').onclick = () => this.showSettings();
        document.getElementById('adminBtn').onclick = () => this.showAdmin();

        // Modal close buttons
        document.getElementById('closeSettings').onclick = () => this.hideModal('settingsModal');
        document.getElementById('closeAdmin').onclick = () => this.hideModal('adminModal');

        // Admin actions
        document.getElementById('clearUsers').onclick = () => this.clearUsers();
        document.getElementById('clearActivity').onclick = () => this.clearActivity();

        // Modal backdrop close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.onclick = (e) => {
                if (e.target.classList.contains('modal')) {
                    this.hideModal(modal.id);
                }
            };
        });

        // Admin tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            };
        });
    }

    switchPanel(id) {
        const panels = {
            'toRegister': 'registerPanel',
            'toLogin': 'loginPanel',
            'toForgot': 'forgot1Panel',
            'backLogin1': 'loginPanel',
            'backLogin2': 'loginPanel'
        };
        const target = panels[id];
        if (target) {
            document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            this.clearMessages();
        }
    }

    showMessage(id, text, isError = false) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.className = `message ${isError ? 'error' : 'success'} show`;
            setTimeout(() => el.classList.remove('show'), 5000);
        }
    }

    clearMessages() {
        document.querySelectorAll('.message').forEach(m => {
            m.textContent = '';
            m.className = 'message';
        });
    }

    shake(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 500);
        }
    }

    login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showMessage('loginMessage', 'Please enter username & password', true);
            this.shake('loginForm');
            return;
        }

        const user = this.accounts.find(u =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.password === password &&
            !u.isSuspended
        );

        if (!user) {
            this.showMessage('loginMessage', 'Invalid credentials', true);
            this.shake('loginForm');
            return;
        }

        this.currentUser = user;
        user.lastLogin = Date.now();
        localStorage.setItem('session', JSON.stringify({ username: user.username }));
        this.saveAccounts();
        this.logActivity(`Login: ${user.username}`);
        this.showDashboard();
    }

    register() {
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        if (!username || !email || !password) {
            this.showMessage('registerMessage', 'Please fill all fields', true);
            return;
        }

        if (password.length < 6) {
            this.showMessage('registerMessage', 'Password must be 6+ characters', true);
            return;
        }

        if (password !== confirm) {
            this.showMessage('registerMessage', 'Passwords do not match', true);
            return;
        }

        if (this.accounts.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            this.showMessage('registerMessage', 'Username already taken', true);
            return;
        }

        if (this.accounts.some(u => u.email === email)) {
            this.showMessage('registerMessage', 'Email already registered', true);
            return;
        }

        this.accounts.push({
            username,
            email,
            password,
            isAdmin: false,
            isSuspended: false,
            createdAt: Date.now(),
            lastLogin: null
        });

        this.saveAccounts();
        this.logActivity(`Registered: ${username}`);
        this.showMessage('registerMessage', 'Account created successfully! Please login.', false);
        setTimeout(() => this.switchPanel('toLogin'), 2000);
    }

    forgotStep1() {
        const email = document.getElementById('forgotEmail').value.trim().toLowerCase();

        if (!email) {
            this.showMessage('forgot1Message', 'Please enter your email', true);
            return;
        }

        const user = this.accounts.find(u => u.email === email);

        if (!user) {
            this.showMessage('forgot1Message', 'Email not found in our records', true);
            return;
        }

        this.recoveryEmail = email;
        document.getElementById('resetUserDisplay').textContent = `Resetting for: ${user.username}`;
        this.showMessage('forgot1Message', `User found! Proceeding to reset...`, false);
        setTimeout(() => {
            document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('forgot2Panel').classList.add('active');
        }, 1500);
    }

    forgotStep2() {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('newConfirm').value;

        if (password.length < 6) {
            this.showMessage('forgot2Message', 'Password must be 6+ characters', true);
            return;
        }

        if (password !== confirm) {
            this.showMessage('forgot2Message', 'Passwords do not match', true);
            return;
        }

        const user = this.accounts.find(u => u.email === this.recoveryEmail);
        if (user) {
            user.password = password;
            this.saveAccounts();
            this.logActivity(`Password reset: ${user.username}`);
            this.showMessage('forgot2Message', 'Password updated successfully!', false);
            this.recoveryEmail = null;
            setTimeout(() => this.switchPanel('backLogin2'), 2000);
        }
    }

    showDashboard() {
        document.getElementById('loginContainer').classList.add('hidden');
        const dash = document.getElementById('dashboard');
        dash.classList.remove('hidden');
        dash.classList.add('show');

        document.getElementById('dashUser').textContent = this.currentUser.username;
        const joinedDate = new Date(this.currentUser.createdAt).toLocaleDateString();
        const adminBadge = this.currentUser.isAdmin ? ' • 👑 Admin' : '';
        document.getElementById('userDetails').textContent =
            `${this.currentUser.email} • Joined ${joinedDate}${adminBadge}`;

        const adminBtn = document.querySelector('.admin-only');
        if (adminBtn) {
            adminBtn.style.display = this.currentUser.isAdmin ? 'flex' : 'none';
        }
    }

    logout() {
        localStorage.removeItem('session');
        this.currentUser = null;

        document.getElementById('dashboard').classList.remove('show');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('loginContainer').classList.remove('hidden');
        document.getElementById('loginContainer').classList.add('active');

        this.switchPanel('backLogin1');
        this.hideAllModals();
    }

    showSettings() {
        document.getElementById('setUsername').value = this.currentUser.username;
        document.getElementById('setEmail').value = this.currentUser.email;
        document.getElementById('settingsModal').classList.remove('hidden');
        document.getElementById('settingsModal').classList.add('show');
    }

    saveSettings() {
        this.showMessage('settingsMsg', 'Settings saved successfully!', false);
        setTimeout(() => this.hideModal('settingsModal'), 1500);
    }

    showAdmin() {
        this.updateUsersList();
        this.updateActivityList();
        document.getElementById('adminModal').classList.remove('hidden');
        document.getElementById('adminModal').classList.add('show');
    }

    updateUsersList() {
        const usersList = document.getElementById('usersList');
        if (this.accounts.length === 0) {
            usersList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No users found</p>';
            return;
        }

        usersList.innerHTML = this.accounts.map((user, i) => `
            <div class="user-item ${user.isAdmin ? 'admin' : ''} ${user.isSuspended ? 'suspended' : ''}">
                <div>
                    <strong>${user.username}</strong>
                    <br><small>${user.email}</small>
                </div>
                <div style="text-align: right;">
                    ${user.isAdmin ? '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">👑 Admin</span>' : ''}
                    ${user.isSuspended ? '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">🚫 Suspended</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    updateActivityList() {
        const recent = this.activityLog.slice(-15).reverse();
        const activityList = document.getElementById('activityList');

        if (recent.length === 0) {
            activityList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No activity logged</p>';
            return;
        }

        activityList.innerHTML = recent.map(log => `
            <div class="activity-item">
                <strong>${log.action}</strong>
                <br><small style="color: #666;">${new Date(parseInt(log.time)).toLocaleString()}</small>
            </div>
        `).join('');
    }

    clearUsers() {
        if (confirm('⚠️ WARNING: This will delete ALL user accounts permanently!\n\nAre you absolutely sure?')) {
            localStorage.clear();
            location.reload();
        }
    }

    clearActivity() {
        if (confirm('Clear all activity logs?')) {
            this.activityLog = [];
            localStorage.setItem('activityLog', '[]');
            this.updateActivityList();
            this.logActivity('Cleared activity logs');
        }
    }

    checkSession() {
        const session = localStorage.getItem('session');
        if (session) {
            try {
                const { username } = JSON.parse(session);
                const user = this.accounts.find(u => u.username === username);
                if (user && !user.isSuspended) {
                    this.currentUser = user;
                    this.showDashboard();
                } else {
                    localStorage.removeItem('session');
                }
            } catch (e) {
                localStorage.removeItem('session');
            }
        }
    }

    saveAccounts() {
        localStorage.setItem('userAccounts', JSON.stringify(this.accounts));
    }

    logActivity(action) {
        this.activityLog.unshift({
            action,
            time: Date.now().toString()
        });
        // Keep only last 100 activities
        localStorage.setItem('activityLog', JSON.stringify(this.activityLog.slice(0, 100)));
    }

    hideModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    hideAllModals() {
        document.querySelectorAll('.modal.show').forEach(m => {
            m.classList.remove('show');
            setTimeout(() => m.classList.add('hidden'), 300);
        });
    }
}

// 🔥 Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CreativeLoginV4();
    console.log('✅ CreativeLogin v4.0 READY!');
    console.log('👑 Default Admin: username: admin | password: admin2024');
});