// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultAdmin();
    checkRememberedUser();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 注册表单提交
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 密码可见性切换
    const passwordToggle = document.querySelector('[data-password-toggle]');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }

    // 注册链接
    const registerLink = document.querySelector('[data-show-register]');
    if (registerLink) {
        registerLink.addEventListener('click', showRegisterForm);
    }

    // 返回登录链接
    const loginLink = document.querySelector('[data-show-login]');
    if (loginLink) {
        loginLink.addEventListener('click', showLoginForm);
    }
}

// 初始化默认管理员账户
function initializeDefaultAdmin() {
    const storedUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // 如果没有用户，创建默认管理员
    if (storedUsers.length === 0) {
        const defaultAdmin = {
            username: 'admin',
            password: simpleEncrypt('admin123'),
            email: 'admin@xiaoxinbao.com',
            role: 'administrator',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('adminUsers', JSON.stringify([defaultAdmin]));
        
        // 显示提示
        setTimeout(() => {
            showNotification('已创建默认管理员账户：admin / admin123', 'info');
        }, 1000);
    }
}

// 检查记住的用户
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = rememberedUser;
        }
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
}

// 简单的加密函数（实际项目中应使用更安全的方式）
function simpleEncrypt(text) {
    return btoa(text); // Base64编码
}

function simpleDecrypt(encryptedText) {
    try {
        return atob(encryptedText); // Base64解码
    } catch (e) {
        return '';
    }
}

// 切换密码可见性
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput && passwordIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordIcon.classList.remove('fa-eye');
            passwordIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            passwordIcon.classList.remove('fa-eye-slash');
            passwordIcon.classList.add('fa-eye');
        }
    }
}

// 显示注册表单
function showRegisterForm(event) {
    if (event) {
        event.preventDefault();
    }
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// 显示登录表单
function showLoginForm(event) {
    if (event) {
        event.preventDefault();
    }
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
}

// 处理登录
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    console.log('尝试登录:', username);
    
    // 从localStorage获取存储的用户信息
    const storedUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    console.log('存储的用户:', storedUsers);
    
    // 查找用户
    const user = storedUsers.find(u => u.username === username);
    
    if (!user) {
        console.log('用户不存在');
        showNotification('用户名不存在', 'error');
        return;
    }
    
    // 验证密码
    const decryptedPassword = simpleDecrypt(user.password);
    console.log('验证密码:', decryptedPassword === password ? '成功' : '失败');
    
    if (decryptedPassword !== password) {
        showNotification('密码错误', 'error');
        return;
    }
    
    // 登录成功
    if (remember) {
        localStorage.setItem('rememberedUser', username);
    } else {
        localStorage.removeItem('rememberedUser');
    }
    
    // 设置登录状态
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    sessionStorage.setItem('adminUsername', username);
    
    showNotification('登录成功', 'success');
    
    // 跳转到控制台
    setTimeout(() => {
        window.location.href = 'admin-panel.html';
    }, 1000);
}

// 处理注册
function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 验证密码
    if (password !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }
    
    // 获取现有用户
    const storedUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // 检查用户名是否已存在
    if (storedUsers.find(u => u.username === username)) {
        showNotification('用户名已存在', 'error');
        return;
    }
    
    // 创建新用户
    const newUser = {
        username: username,
        password: simpleEncrypt(password),
        email: username + '@xiaoxinbao.com',
        role: 'administrator',
        createdAt: new Date().toISOString()
    };
    
    // 保存用户
    storedUsers.push(newUser);
    localStorage.setItem('adminUsers', JSON.stringify(storedUsers));
    
    showNotification('注册成功', 'success');
    
    // 清空表单并返回登录
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    setTimeout(() => {
        showLoginForm();
    }, 1500);
}

// 显示通知
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    
    // 根据类型设置样式
    const styles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.className = `flex items-center p-4 text-white rounded-lg shadow-lg ${styles[type]} animate-bounce`;
    notification.innerHTML = `
        <i class="${icons[type]} mr-3"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}