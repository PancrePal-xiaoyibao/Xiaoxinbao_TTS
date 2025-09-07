const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const ADMIN_FILE = path.join(__dirname, '../../config/admin.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 初始化管理员账户
function initAdmin() {
    if (!fs.existsSync(ADMIN_FILE)) {
        const defaultAdmin = {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
            createdAt: new Date().toISOString()
        };
        
        if (!fs.existsSync(path.dirname(ADMIN_FILE))) {
            fs.mkdirSync(path.dirname(ADMIN_FILE), { recursive: true });
        }
        
        fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultAdmin, null, 2));
        console.log('管理员账户已初始化');
    }
}

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        initAdmin();
        
        const adminData = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
        
        if (username !== adminData.username) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const isValidPassword = bcrypt.compareSync(password, adminData.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const token = jwt.sign({ username: adminData.username }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            token,
            username: adminData.username,
            message: '登录成功'
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 验证token
router.post('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: '未提供token' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, username: decoded.username });
    } catch (error) {
        res.status(401).json({ valid: false, error: 'token无效' });
    }
});

module.exports = router;