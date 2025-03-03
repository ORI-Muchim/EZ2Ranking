document.addEventListener('DOMContentLoaded', () => {
    // 비밀번호 표시/숨기기 토글
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    
    if(togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            // 비밀번호 표시 타입 변경
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 아이콘 변경
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
    
    // 로그인 폼 제출
    const loginForm = document.querySelector('.login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // 유효성 검사
            if(!username || !password) {
                showError('아이디와 비밀번호를 모두 입력해주세요.');
                return;
            }
            
            // API 호출 (실제로는 fetch나 axios 등으로 구현)
            login(username, password, remember);
        });
    }
    
    // 회원가입 링크
    const registerLink = document.querySelector('.register-link');
    if(registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            // 회원가입 페이지로 이동 또는 모달 표시
            window.location.href = 'register.html';
        });
    }
    
    // 비밀번호 찾기 링크
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if(forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // 비밀번호 재설정 페이지로 이동 또는 모달 표시
            window.location.href = 'forgot-password.html';
        });
    }
    
    // 소셜 로그인 버튼
    const googleBtn = document.querySelector('.social-btn.google');
    if(googleBtn) {
        googleBtn.addEventListener('click', () => {
            // Google OAuth 호출
            console.log('Google 로그인 시도');
            // 실제 구현은 Google OAuth API 사용
        });
    }
    
    // 배경 애니메이션 효과
    animateBackground();
});

// 로그인 함수
function login(username, password, remember) {
    // 로딩 표시
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '로그인 중...';
    loginBtn.disabled = true;
    
    // 실제 구현에서는 서버에 인증 요청
    setTimeout(() => {
        // 임시 성공 처리 (실제로는 서버 응답에 따라 처리)
        const success = true;
        
        if(success) {
            // 로그인 성공
            localStorage.setItem('auth_token', 'sample_token');
            if(remember) {
                localStorage.setItem('remember_user', 'true');
            }
            
            // 홈 페이지로 리다이렉트
            window.location.href = 'index.html';
        } else {
            // 로그인 실패
            showError('아이디 또는 비밀번호가 올바르지 않습니다.');
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    }, 1500); // 임시 지연 (실제로는 서버 응답 시간에 따라 다름)
}

// 에러 메시지 표시
function showError(message) {
    // 이미 있는 에러 메시지 제거
    const existingError = document.querySelector('.error-message');
    if(existingError) {
        existingError.remove();
    }
    
    // 새 에러 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'var(--error-color)';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '-10px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;
    
    // 폼 위에 삽입
    const formGroup = document.querySelector('.form-group:nth-child(2)');
    formGroup.parentNode.insertBefore(errorDiv, formGroup.nextSibling);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => {
            if(errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 5000);
}

// 배경 애니메이션
function animateBackground() {
    const cityscapeLights = document.querySelector('.cityscape-lights');
    if(!cityscapeLights) return;
    
    // 별 반짝임 효과 추가
    for(let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 별 위치 및 스타일
        star.style.position = 'absolute';
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.background = 'white';
        star.style.borderRadius = '50%';
        
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 60}%`; // 위쪽 60%에만 별 표시
        
        // 반짝임 애니메이션
        star.style.animation = `twinkle ${Math.random() * 5 + 3}s infinite`;
        
        cityscapeLights.appendChild(star);
    }
    
    // 별 반짝임 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkle {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
        }
    `;
    document.head.appendChild(style);
}

// 페이지 로드 시 사용자 정보가 저장되어 있는지 확인
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('remember_user');
    const authToken = localStorage.getItem('auth_token');
    
    if(rememberedUser && authToken) {
        // 자동 로그인 또는 사용자 이름 미리 채우기
        // 실제 구현에서는 토큰 유효성 검사 필요
    }
}

// 페이지 나갈 때 이벤트
window.addEventListener('beforeunload', () => {
    // 필요한 정리 작업 수행
});
