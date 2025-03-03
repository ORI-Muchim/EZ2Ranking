document.addEventListener('DOMContentLoaded', () => {
    // 비밀번호 표시/숨기기 토글 기능
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // 아이콘 변경
            button.classList.toggle('fa-eye');
            button.classList.toggle('fa-eye-slash');
        });
    });
    
    // 이용약관 라벨 클릭 시 팝업 표시
    const termsLabel = document.querySelector('label[for="agree-terms"]');
    termsLabel.style.cursor = 'pointer';
    termsLabel.addEventListener('click', (e) => {
        // 체크박스의 상태를 변경하지 않도록 이벤트 전파 중단
        e.preventDefault();
        e.stopPropagation();
        showTermsPopup();
    });
    
    // 체크박스 자체의 클릭은 정상적으로 처리되도록 함
    const agreeTermsCheckbox = document.getElementById('agree-terms');
    agreeTermsCheckbox.addEventListener('click', (e) => {
        // 이벤트 전파 중단하지 않음 (정상적인 체크박스 토글 동작)
        e.stopPropagation();
    });
    
    // 회원가입 폼 제출 처리
    const registerForm = document.querySelector('.login-form');
    const registerBtn = document.querySelector('.register-btn');
    
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 입력값 가져오기
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const displayName = document.getElementById('display-name').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        
        // 유효성 검사
        clearErrors();
        let isValid = true;
        
        // 이메일 검사
        if (!isValidEmail(email)) {
            showError('email', '유효한 이메일 주소를 입력해주세요.');
            isValid = false;
        }
        
        // 아이디 검사
        if (username.length < 4) {
            showError('username', '아이디는 최소 4자 이상이어야 합니다.');
            isValid = false;
        }
        
        // 닉네임 검사
        if (displayName.length < 2) {
            showError('display-name', '닉네임은 최소 2자 이상이어야 합니다.');
            isValid = false;
        }
        
        // 비밀번호 검사
        if (password.length < 8) {
            showError('password', '비밀번호는 최소 8자 이상이어야 합니다.');
            isValid = false;
        }
        
        // 비밀번호 확인 검사
        if (password !== confirmPassword) {
            showError('confirm-password', '비밀번호가 일치하지 않습니다.');
            isValid = false;
        }
        
        // 약관 동의 검사
        if (!agreeTerms) {
            showError('agree-terms', '이용약관 및 개인정보 처리방침에 동의해주세요.');
            isValid = false;
        }
        
        // 폼이 유효하면 제출
        if (isValid) {
            // 회원가입 처리 중 버튼 상태 변경
            registerBtn.textContent = '회원가입 중...';
            registerBtn.disabled = true;
            
            // 회원가입 API 호출 (예시)
            setTimeout(() => {
                // 성공 시 로그인 페이지로 리다이렉트
                window.location.href = 'login.html?registered=true';
                
                // 실패 시 처리 (예시)
                // showFormError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
                // registerBtn.textContent = '회원가입';
                // registerBtn.disabled = false;
            }, 1500);
        }
    });
    
    // 이메일 유효성 검사 함수
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 에러 메시지 표시 함수
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--error-color)';
        errorDiv.style.fontSize = '0.75rem';
        errorDiv.style.marginTop = '5px';
        
        const parentDiv = field.closest('.form-group') || field.parentNode;
        field.style.borderColor = 'var(--error-color)';
        
        // 체크박스의 경우 다른 방식으로 에러 표시
        if (fieldId === 'agree-terms') {
            const formOptions = field.closest('.form-options');
            formOptions.appendChild(errorDiv);
        } else {
            parentDiv.appendChild(errorDiv);
        }
    }
    
    // 폼 전체 에러 메시지 표시
    function showFormError(message) {
        const formError = document.createElement('div');
        formError.className = 'form-error-message';
        formError.textContent = message;
        formError.style.color = 'var(--error-color)';
        formError.style.fontSize = '0.85rem';
        formError.style.textAlign = 'center';
        formError.style.marginBottom = '15px';
        
        const form = document.querySelector('.login-form');
        form.insertBefore(formError, form.firstChild);
    }
    
    // 에러 메시지 초기화 함수
    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message, .form-error-message');
        errorMessages.forEach(error => error.remove());
        
        const inputs = document.querySelectorAll('.form-group input');
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
    }
    
    // 이용약관 팝업 표시 함수
    function showTermsPopup() {
        // 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector('.terms-popup-container');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 현재 체크박스 상태 저장
        const isChecked = document.getElementById('agree-terms').checked;
        
        // 팝업 컨테이너 생성
        const popupContainer = document.createElement('div');
        popupContainer.className = 'terms-popup-container';
        popupContainer.style.position = 'fixed';
        popupContainer.style.top = '0';
        popupContainer.style.left = '0';
        popupContainer.style.width = '100%';
        popupContainer.style.height = '100%';
        popupContainer.style.backgroundColor = 'var(--overlay-color)';
        popupContainer.style.zIndex = '1000';
        popupContainer.style.display = 'flex';
        popupContainer.style.justifyContent = 'center';
        popupContainer.style.alignItems = 'center';
        popupContainer.style.backdropFilter = 'blur(5px)';
        
        // 팝업 내용 생성
        const popupContent = document.createElement('div');
        popupContent.className = 'terms-popup-content';
        popupContent.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
        popupContent.style.borderRadius = 'var(--border-radius)';
        popupContent.style.boxShadow = 'var(--shadow-soft)';
        popupContent.style.padding = '25px';
        popupContent.style.width = '90%';
        popupContent.style.maxWidth = '600px';
        popupContent.style.maxHeight = '80vh';
        popupContent.style.display = 'flex';
        popupContent.style.flexDirection = 'column';
        popupContent.style.position = 'relative';
        popupContent.style.border = '1px solid var(--border-color)';
        popupContent.style.transition = 'transform var(--transition-speed)';
        popupContent.style.transform = 'translateY(0)';
        
        // 팝업 호버 효과
        popupContent.addEventListener('mouseenter', () => {
            popupContent.style.transform = 'translateY(-5px)';
            popupContent.style.boxShadow = 'var(--shadow-soft), var(--shadow-neon)';
        });
        
        popupContent.addEventListener('mouseleave', () => {
            popupContent.style.transform = 'translateY(0)';
            popupContent.style.boxShadow = 'var(--shadow-soft)';
        });
        
        // 팝업 헤더
        const popupHeader = document.createElement('div');
        popupHeader.className = 'terms-popup-header';
        popupHeader.style.display = 'flex';
        popupHeader.style.justifyContent = 'space-between';
        popupHeader.style.alignItems = 'center';
        popupHeader.style.marginBottom = '20px';
        popupHeader.style.borderBottom = '1px solid var(--border-color)';
        popupHeader.style.paddingBottom = '15px';
        
        // 팝업 제목
        const popupTitle = document.createElement('h2');
        popupTitle.textContent = '이용약관 및 개인정보 처리방침';
        popupTitle.style.margin = '0';
        popupTitle.style.fontSize = '1.5rem';
        popupTitle.style.color = 'var(--text-primary)';
        popupTitle.style.textShadow = '0 0 10px rgba(255, 177, 0, 0.5)';
        
        // 닫기 버튼
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.color = 'var(--text-primary)';
        closeButton.style.fontSize = '1.8rem';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0 5px';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.transition = 'color var(--transition-speed)';
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = 'var(--accent-primary)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = 'var(--text-primary)';
        });
        
        closeButton.addEventListener('click', () => {
            popupContainer.remove();
        });
        
        // 팝업 본문 - iframe으로 terms.html 로드
        const popupBody = document.createElement('div');
        popupBody.className = 'terms-popup-body';
        popupBody.style.flex = '1';
        popupBody.style.overflowY = 'auto';
        popupBody.style.marginBottom = '20px';
        
        const termsIframe = document.createElement('iframe');
        termsIframe.src = 'terms.html';
        termsIframe.style.width = '100%';
        termsIframe.style.height = '400px';
        termsIframe.style.border = '1px solid var(--border-color)';
        termsIframe.style.borderRadius = 'var(--border-radius)';
        termsIframe.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        
        // 동의 체크박스
        const agreeCheckboxDiv = document.createElement('div');
        agreeCheckboxDiv.className = 'popup-agree-option';
        agreeCheckboxDiv.style.display = 'flex';
        agreeCheckboxDiv.style.alignItems = 'center';
        agreeCheckboxDiv.style.marginBottom = '20px';
        
        const popupAgreeCheckbox = document.createElement('input');
        popupAgreeCheckbox.type = 'checkbox';
        popupAgreeCheckbox.id = 'popup-agree-terms';
        popupAgreeCheckbox.style.marginRight = '10px';
        popupAgreeCheckbox.style.accentColor = 'var(--accent-primary)';
        popupAgreeCheckbox.checked = isChecked;
        
        const popupAgreeLabel = document.createElement('label');
        popupAgreeLabel.htmlFor = 'popup-agree-terms';
        popupAgreeLabel.textContent = '이용약관 및 개인정보 처리방침에 동의합니다';
        popupAgreeLabel.style.fontSize = '0.9rem';
        popupAgreeLabel.style.color = 'var(--text-secondary)';
        
        agreeCheckboxDiv.appendChild(popupAgreeCheckbox);
        agreeCheckboxDiv.appendChild(popupAgreeLabel);
        
        // 버튼 컨테이너
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        
        // 취소 버튼
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '취소';
        cancelButton.style.backgroundColor = 'transparent';
        cancelButton.style.color = 'var(--text-secondary)';
        cancelButton.style.border = '1px solid var(--border-color)';
        cancelButton.style.borderRadius = 'var(--border-radius)';
        cancelButton.style.padding = '12px 20px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.fontSize = '0.9rem';
        cancelButton.style.fontWeight = '500';
        cancelButton.style.transition = 'all var(--transition-speed)';
        
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = 'transparent';
        });
        
        cancelButton.addEventListener('click', () => {
            popupContainer.remove();
        });
        
        // 확인 버튼
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '확인';
        confirmButton.style.backgroundColor = 'var(--accent-primary)';
        confirmButton.style.color = 'white';
        confirmButton.style.border = 'none';
        confirmButton.style.borderRadius = 'var(--border-radius)';
        confirmButton.style.padding = '12px 25px';
        confirmButton.style.cursor = 'pointer';
        confirmButton.style.fontSize = '0.9rem';
        confirmButton.style.fontWeight = '500';
        confirmButton.style.transition = 'all var(--transition-speed)';
        
        confirmButton.addEventListener('mouseenter', () => {
            confirmButton.style.transform = 'translateY(-2px)';
            confirmButton.style.boxShadow = '0 5px 15px rgba(255, 177, 0, 0.4)';
        });
        
        confirmButton.addEventListener('mouseleave', () => {
            confirmButton.style.transform = 'translateY(0)';
            confirmButton.style.boxShadow = 'none';
        });
        
        confirmButton.addEventListener('click', () => {
            // 약관 동의 체크박스 상태 동기화
            const mainCheckbox = document.getElementById('agree-terms');
            mainCheckbox.checked = popupAgreeCheckbox.checked;
            
            // 팝업 닫기
            popupContainer.remove();
        });
        
        // 팝업 구성
        popupHeader.appendChild(popupTitle);
        popupHeader.appendChild(closeButton);
        popupBody.appendChild(termsIframe);
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        
        popupContent.appendChild(popupHeader);
        popupContent.appendChild(popupBody);
        popupContent.appendChild(agreeCheckboxDiv);
        popupContent.appendChild(buttonContainer);
        
        popupContainer.appendChild(popupContent);
        document.body.appendChild(popupContainer);
        
        // 배경 클릭 시 팝업 닫기
        popupContainer.addEventListener('click', (e) => {
            if (e.target === popupContainer) {
                popupContainer.remove();
            }
        });
    }
    
    // 배경 애니메이션
    animateBackground();
});

// 배경 애니메이션 함수
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
    
    // CSS에 트윙클 애니메이션이 없으면 추가
    if (!document.querySelector('style#star-animation')) {
        const style = document.createElement('style');
        style.id = 'star-animation';
        style.textContent = `
            @keyframes twinkle {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
}
