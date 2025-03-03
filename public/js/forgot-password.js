document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.querySelector('.login-form');
    const resetBtn = document.querySelector('.reset-btn');
    const confirmationMessage = document.querySelector('.confirmation-message');
    
    // 비밀번호 찾기 폼 제출 처리
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 입력값 가져오기
        const email = document.getElementById('email').value;
        
        // 유효성 검사
        clearErrors();
        
        if (!isValidEmail(email)) {
            showError('유효한 이메일 주소를 입력해주세요.');
            return;
        }
        
        // 로딩 상태 표시
        resetBtn.textContent = '전송 중...';
        resetBtn.disabled = true;
        
        // API 호출 시뮬레이션 (실제로는 서버에 요청)
        setTimeout(() => {
            // 폼 숨기기
            hideFormElements();
            
            // 확인 메시지 표시
            confirmationMessage.classList.remove('hidden');
            confirmationMessage.style.display = 'flex';
            confirmationMessage.style.flexDirection = 'column';
            confirmationMessage.style.alignItems = 'center';
            confirmationMessage.style.justifyContent = 'center';
            confirmationMessage.style.padding = '20px';
            confirmationMessage.style.textAlign = 'center';
            
            // 애니메이션 적용
            confirmationMessage.style.opacity = '0';
            confirmationMessage.style.transform = 'translateY(20px)';
            confirmationMessage.style.transition = 'opacity 0.5s, transform 0.5s';
            
            setTimeout(() => {
                confirmationMessage.style.opacity = '1';
                confirmationMessage.style.transform = 'translateY(0)';
            }, 10);
            
            // 버튼 상태 복원 (필요시)
            resetBtn.textContent = '재설정 링크 받기';
            resetBtn.disabled = false;
        }, 1500);
    });
    
    // 이메일 유효성 검사 함수
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 에러 메시지 표시 함수
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--error-color)';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '15px';
        
        const instructionText = document.querySelector('.instruction-text');
        resetForm.insertBefore(errorDiv, instructionText.nextSibling);
        
        // 입력 필드 스타일 변경
        const emailInput = document.getElementById('email');
        emailInput.style.borderColor = 'var(--error-color)';
    }
    
    // 에러 메시지 초기화 함수
    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
        
        const emailInput = document.getElementById('email');
        emailInput.style.borderColor = '';
    }
    
    // 폼 요소들 숨기기
    function hideFormElements() {
        const instructionText = document.querySelector('.instruction-text');
        const formGroup = document.querySelector('.form-group');
        
        instructionText.style.display = 'none';
        formGroup.style.display = 'none';
        resetBtn.style.display = 'none';
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
