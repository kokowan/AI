// DOM元素
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const uploadBtn = document.getElementById('upload-btn');
const avatarUploadBtn = document.getElementById('avatar-upload-btn');
const avatarUpload = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('avatar-preview-img');
const loginBtn = document.getElementById('login-button');
const signupBtn = document.getElementById('signup-button');
const authModal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchToRegisterBtn = document.getElementById('switch-to-register');
const switchToLoginBtn = document.getElementById('switch-to-login');
const newConversationBtn = document.getElementById('new-conversation-button');
const searchInput = document.getElementById('search-input');
const clearHistoryBtn = document.getElementById('clear-history-button');
const historyList = document.getElementById('history-list');
const greetingCard = document.getElementById('greeting-card');
const greetingText = document.getElementById('greeting-text');
const inputArea = document.getElementById('input-area');
const customFooter = document.getElementById('custom-footer');

// 通知组件
const successNotification = document.getElementById('success-notification');
const errorNotification = document.getElementById('error-notification');
const successText = document.getElementById('success-text');
const errorText = document.getElementById('error-text');

// 文件上传相关
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'file-input';
fileInput.style.display = 'none';
fileInput.setAttribute('multiple', true);
document.body.appendChild(fileInput);

// 状态变量
let messages = [];
let history = [];
let isLoggedIn = false;
let username = '';
let avatarUrl = '';
let uploadedFiles = [];
let isProcessing = false;

// API密钥
const API_KEYS = {
    HUNYUAN: 'sk-mzheGWK7EQ0iKQbsosyT3uaokPsylUZ9oz0oYzNSemE2qlUz',
    KIMI: 'sk-6nfQOET8ZJH07cbFcjRkKWk1SL0zz3RCFknqFEYAxyBKIex2',
    DEEPSEEK: 'sk-a0f8855825dc4727af29f641a1e10584',
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 从本地存储加载历史记录
    loadHistoryFromLocalStorage();

    // 设置问候卡文字
    updateGreetingText();

    // 事件监听器
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 发送消息按钮点击事件
    sendBtn.addEventListener('click', sendMessage);

    // 回车键发送消息
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 文件上传按钮点击事件
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', handleFileUpload);

    // 登录按钮点击事件
    loginBtn.addEventListener('click', () => openAuthModal('login'));

    // 注册按钮点击事件
    signupBtn.addEventListener('click', () => openAuthModal('register'));

    // 关闭模态框事件
    closeModal.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    // 模态框点击外部关闭
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    // 切换到注册表单
    switchToRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchForms('register');
    });

    // 切换到登录表单
    switchToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchForms('login');
    });

    // 登录表单提交事件
    loginForm.addEventListener('submit', handleLogin);

    // 注册表单提交事件
    registerForm.addEventListener('submit', handleRegister);

    // 头像上传按钮点击事件
    avatarUploadBtn.addEventListener('click', () => {
        avatarUpload.click();
    });

    // 头像文件选择事件
    avatarUpload.addEventListener('change', previewAvatar);

    // 新建对话按钮点击事件
    newConversationBtn.addEventListener('click', newConversation);

    // 搜索框功能
    searchInput.addEventListener('input', filterHistory);

    // 清空历史记录按钮点击事件
    clearHistoryBtn.addEventListener('click', () => {
        clearHistory();
    });
}

// 打开认证模态框
function openAuthModal(type) {
    authModal.classList.add('active');
    switchForms(type);
}

// 切换表单显示
function switchForms(type) {
    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        switchToRegisterBtn.classList.remove('hidden');
        switchToLoginBtn.classList.add('hidden');
        document.getElementById('modal-title').textContent = '用户登录';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        switchToRegisterBtn.classList.add('hidden');
        switchToLoginBtn.classList.remove('hidden');
        document.getElementById('modal-title').textContent = '用户注册';
    }
}

// 预览头像
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 发送消息
async function sendMessage() {
    const userMessage = messageInput.value.trim();

    if (isProcessing) return;
    if (userMessage === '' && uploadedFiles.length === 0) return;

    try {
        isProcessing = true;
        sendBtn.disabled = true;
        messageInput.disabled = true;

        // 创建思考消息
        const thinkingMessage = createThinkingMessage();
        chatContainer.appendChild(thinkingMessage);
        scrollToBottom();

        // 处理文件上传
        if (uploadedFiles.length > 0) {
            const allContent = getUploadedContent();
            const fileMessage = createFileMessage(allContent);
            chatContainer.appendChild(fileMessage);
            uploadedFiles = [];
        }

        // 发送消息并获取回复
        const selectedModel = modelSelect.value;
        const botResponse = await sendRequestToServer(userMessage, selectedModel);

        // 创建用户消息
        if (userMessage !== '') {
            const userMessageElement = createUserMessage(userMessage);
            chatContainer.insertBefore(userMessageElement, thinkingMessage);
        }

        // 移除思考消息
        chatContainer.removeChild(thinkingMessage);

        // 创建助手消息
        const assistantMessageElement = createAssistantMessage(botResponse, selectedModel);
        chatContainer.appendChild(assistantMessageElement);

        // 更新消息历史
        messages.push({
            role: 'user',
            content: userMessage
        }, {
            role: 'assistant',
            content: botResponse
        });

        // 添加到历史记录
        history.push({
            user: userMessage,
            assistant: botResponse,
            model: selectedModel
        });

        // 保存历史记录
        saveHistoryToLocalStorage();
        updateHistoryList();

        // 清空输入框
        messageInput.value = '';

        // 显示成功通知
        showNotification('success', '消息发送成功！');

    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('error', '发送消息时出错，请重试。');
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
    }
}

// 创建思考消息
function createThinkingMessage() {
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'message-group';
    thinkingMessage.style.justifyContent = 'flex-start';

    const avatar = document.createElement('div');
    avatar.className = 'assistant-avatar';
    avatar.textContent = getModelAvatarText(modelSelect.value);

    const message = document.createElement('div');
    message.className = 'thinking-message';
    message.innerHTML = `
        <div class="spinner"></div>
        <span>正在思考中...</span>
    `;

    thinkingMessage.appendChild(avatar);
    thinkingMessage.appendChild(message);
    return thinkingMessage;
}

// 创建用户消息
function createUserMessage(content) {
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    messageGroup.style.justifyContent = 'flex-end';

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = '我';

    const message = document.createElement('div');
    message.className = 'message-bubble user-message';
    message.innerHTML = `
        <div class="message-content">${escapeHtml(content)}</div>
    `;

    messageGroup.appendChild(message);
    messageGroup.appendChild(avatar);
    return messageGroup;
}

// 创建助手消息
function createAssistantMessage(content, model) {
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    messageGroup.style.justifyContent = 'flex-start';

    const avatar = document.createElement('div');
    avatar.className = 'assistant-avatar';
    
    // 根据选择的模型设置不同的图标
    const modelAvatars = {
        'hunyuan-turbos-latest': 'AI慧聊',
        'moonshot-v1-8k': 'Kimi AI',
        'deepseek-chat': 'DeepSeek'
    };
    
    avatar.textContent = modelAvatars[model] || 'AI';

    const message = document.createElement('div');
    message.className = 'message-bubble assistant-message';
    message.innerHTML = `
        <div class="message-content">${formatAnswer(content)}</div>
    `;

    messageGroup.appendChild(avatar);
    messageGroup.appendChild(message);
    return messageGroup;
}

// 获取模型头像文本
function getModelAvatarText(model) {
    const modelAvatars = {
        'hunyuan-turbos-latest': 'AI慧聊',
        'moonshot-v1-8k': 'Kimi AI',
        'deepseek-chat': 'DeepSeek'
    };
    return modelAvatars[model] || 'AI';
}

// 创建文件消息
function createFileMessage(content) {
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    messageGroup.style.justifyContent = 'flex-end';

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = '我';

    const fileMessage = document.createElement('div');
    fileMessage.className = 'message-bubble user-message file-message';
    fileMessage.innerHTML = `
        <div class="file-icon">
            <i class="fas fa-file-alt"></i>
        </div>
        <div class="file-info">
            <div class="file-name">已上传文件内容</div>
            <div class="file-size">${content.length} 字符</div>
        </div>
    `;

    messageGroup.appendChild(fileMessage);
    messageGroup.appendChild(avatar);
    return messageGroup;
}

// 处理文件上传
async function handleFileUpload(event) {
    if (!event.target.files || event.target.files.length === 0) return;

    const files = Array.from(event.target.files);
    uploadedFiles = [...files];

    // 显示进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-container';
    chatContainer.appendChild(progressBar);
    progressBar.querySelector('.progress-bar').style.width = '0%';

    try {
        let totalProgress = 0;
        const step = 100 / files.length;

        for (const file of files) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(file);
            });

            totalProgress += step;
            progressBar.querySelector('.progress-bar').style.width = `${totalProgress}%`;

            // 模拟上传延迟
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        showNotification('success', '文件上传成功！');
    } catch (error) {
        console.error('Error handling file upload:', error);
        showNotification('error', '文件上传失败，请重试。');
    } finally {
        chatContainer.removeChild(progressBar);
    }
}

// 获取上传文件内容
function getUploadedContent() {
    return uploadedFiles.map(file => {
        const reader = new FileReader();
        let content = '';
        reader.onload = (e) => {
            content = e.target.result;
        };
        reader.readAsText(file);
        return content;
    }).join(' ');
}

// 发送请求到API
async function sendRequestToServer(message, model) {
    try {
        let answer = '';
        const API_KEY = getAPIKey(model);

        switch(model) {
            case 'hunyuan-turbos-latest':
                // 调用Hunyuan API
                const hunyuanResponse = await fetch('https://api.hunyuan.cloud.tencent.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [...messages, { role: 'user', content: message }],
                        enable_enhancement: true
                    })
                });
                const hunyuanData = await hunyuanResponse.json();
                answer = hunyuanData.choices[0].message.content;
                break;

            case 'moonshot-v1-8k':
                // 调用Kimi API
                const kimiResponse = await fetch('https://api.kimi.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [...messages, { role: 'user', content: message }],
                        enable_enhancement: true
                    })
                });
                const kimiData = await kimiResponse.json();
                answer = kimiData.choices[0].message.content;
                break;

            case 'deepseek-chat':
                // 调用DeepSeek API
                const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [...messages, { role: 'user', content: message }],
                        enable_enhancement: true
                    })
                });
                const deepseekData = await deepseekResponse.json();
                answer = deepseekData.choices[0].message.content;
                break;

            default:
                answer = `您选择的模型不支持。这是默认回答。`;
                break;
        }

        return answer;
    } catch (error) {
        console.error('Error fetching response:', error);
        throw error;
    }
}

// 获取API密钥
function getAPIKey(model) {
    switch(model) {
        case 'hunyuan-turbos-latest':
            return API_KEYS.HUNYUAN;
        case 'moonshot-v1-8k':
            return API_KEYS.KIMI;
        case 'deepseek-chat':
            return API_KEYS.DEEPSEEK;
        default:
            return API_KEYS.KIMI;
    }
}

// 登录处理
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username) {
        showError('username-error', '请输入用户名');
        return;
    }

    if (!password) {
        showError('password-error', '请输入密码');
        return;
    }

    // 这里应该调用登录API，这里仅做模拟
    isLoggedIn = true;
    username = username;
    avatarUrl = 'default-avatar.png';

    // 更新UI
    updateUserInfo();
    authModal.classList.remove('active');

    // 显示欢迎通知
    showNotification('success', `欢迎回来，${username}！`);
}

// 注册处理
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();

    if (!username) {
        showError('reg-username-error', '请输入用户名');
        return;
    }

    if (!password) {
        showError('reg-password-error', '请输入密码');
        return;
    }

    if (password !== confirmPassword) {
        showError('reg-confirm-password-error', '两次输入的密码不一致');
        return;
    }

    // 这里应该调用注册API，这里仅做模拟
    isLoggedIn = true;
    showNotification('success', '注册成功！请登录');
    switchForms('login');
    resetForm(registerForm);
    document.getElementById('username').value = username;
}

// 更新用户信息
function updateUserInfo() {
    // 这里可以更新用户信息显示，例如头像、用户名等
}

// 新建对话
function newConversation() {
    // 保留问候卡片
    const existingGreetingCard = document.querySelector('.greeting-card');
    if (existingGreetingCard) {
        chatContainer.removeChild(existingGreetingCard);
    }

    // 清空聊天容器并添加新的问候卡片
    chatContainer.innerHTML = '';
    const newGreetingCard = greetingCard.cloneNode(true);
    chatContainer.appendChild(newGreetingCard);

    // 更新消息历史
    messages = [];
    uploadedFiles = [];

    // 滚动到底部
    scrollToBottom();
}

// 滚动到底部
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 滚动到输入框
function scrollToInput() {
    inputArea.scrollIntoView({ behavior: 'smooth' });
}

// 滑动功能
function filterHistory() {
    const searchTerm = searchInput.value.toLowerCase();
    updateHistoryList(searchTerm);
}

// 清空历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        history = [];
        saveHistoryToLocalStorage();
        updateHistoryList();
        showNotification('success', '历史记录已清空');
        newConversation(); // 清空历史记录后触发新建会话
    }
}

// 加载历史记录从本地存储
function loadHistoryFromLocalStorage() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        updateHistoryList();
    }
}

// 保存历史记录到本地存储
function saveHistoryToLocalStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

// 更新历史记录列表
function updateHistoryList(searchTerm = '') {
    historyList.innerHTML = '';

    const filteredHistory = searchTerm
        ? history.filter(item =>
            item.user.toLowerCase().includes(searchTerm) ||
            item.assistant.toLowerCase().includes(searchTerm)
        )
        : history;

    if (filteredHistory.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'history-item';
        emptyItem.textContent = '暂无对话记录';
        emptyItem.style.justifyContent = 'center';
        emptyItem.style.color = '#888';
        historyList.appendChild(emptyItem);
        return;
    }

    filteredHistory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        if (index === history.length - 1) li.classList.add('active');

        const modelName = getModelName(item.model);
        li.innerHTML = `
            <div class="history-item-date">${formatDate(new Date())}</div>
            <div class="history-item-text">${item.user.slice(0, 30)}... - ${modelName}</div>
        `;

        li.addEventListener('click', () => loadHistory(index));
        historyList.appendChild(li);
    });
}

// 加载历史记录
function loadHistory(index) {
    const item = history[index];
    chatContainer.innerHTML = '';

    // 添加问候卡片
    const greetingCardClone = greetingCard.cloneNode(true);
    chatContainer.appendChild(greetingCardClone);

    // 添加用户消息
    const userMessageElement = createUserMessage(item.user);
    chatContainer.appendChild(userMessageElement);

    // 添加助手消息
    const assistantMessageElement = createAssistantMessage(item.assistant, item.model);
    chatContainer.appendChild(assistantMessageElement);

    // 更新消息历史
    messages = [
        { role: 'user', content: item.user },
        { role: 'assistant', content: item.assistant }
    ];

    // 滚动到底部
    scrollToBottom();
}

// 获取模型名称
function getModelName(model) {
    switch (model) {
        case 'hunyuan-turbos-latest': return 'AI慧聊';
        case 'moonshot-v1-8k': return 'Kimi AI';
        case 'deepseek-chat': return 'DeepSeek';
        default: return 'AI助手';
    }
}

// 格式化日期
function formatDate(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化回答内容
function formatAnswer(answer) {
    return answer
        .replace(/<\/?[a-z][^>]*>/gi, '')
        .split('\n')
        .filter(p => p.trim() !== '')
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join('');
}

// 转义HTML特殊字符
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示通知
function showNotification(type, message) {
    const notification = type === 'success' ? successNotification : errorNotification;
    const textElement = type === 'success' ? successText : errorText;

    textElement.textContent = message;
    notification.classList.add('active');

    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// 更新问候文字
function updateGreetingText() {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour >= 0 && hour < 5) greeting = '凌晨好';
    else if (hour >= 5 && hour < 12) greeting = '早上好';
    else if (hour >= 12 && hour < 14) greeting = '中午好';
    else if (hour >= 14 && hour < 18) greeting = '下午好';
    else greeting = '晚上好';

    greetingText.textContent = `${greeting}！选择一个模型开始对话吧！`;
}

// 显示错误信息
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');

    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 3000);
}

// 重置表单
function resetForm(form) {
    form.reset();
    // 重置头像预览
    avatarPreview.src = 'https://via.placeholder.com/120/4361ee/ffffff?text=头像';
}