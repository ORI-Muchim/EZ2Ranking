document.addEventListener('DOMContentLoaded', function() {
    // FAQ 아코디언 기능
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // 현재 활성화된 FAQ 아이템 찾기
            const currentActive = document.querySelector('.faq-item.active');
            
            // 다른 아이템이 활성화되어 있으면 닫기
            if (currentActive && currentActive !== item) {
                currentActive.classList.remove('active');
            }
            
            // 현재 아이템 토글
            item.classList.toggle('active');
        });
    });
    
    // 문의 양식 제출 처리
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 폼 데이터 수집
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                agreePrivacy: document.getElementById('agree-privacy').checked
            };
            
            // 폼 유효성 검사
            if (!validateForm(formData)) {
                return;
            }
            
            // 제출 버튼 로딩 상태로 변경
            const submitBtn = document.querySelector('.submit-btn');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner"></span> 전송 중...';
            submitBtn.classList.add('loading');
            
            // 서버에 데이터 전송 (실제로는 서버 API를 호출하지만, 여기서는 setTimeout으로 대체)
            setTimeout(() => {
                // 폼 요소 숨기기
                contactForm.style.display = 'none';
                
                // 성공 메시지 표시
                const successMessage = document.createElement('div');
                successMessage.className = 'success-container';
                successMessage.innerHTML = `
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="success-title">문의가 접수되었습니다!</h2>
                    <p class="success-message">빠른 시일 내에 ${formData.email}로 답변 드리겠습니다. 추가 문의 사항이 있으시면 언제든지 연락해주세요.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/'">홈으로 돌아가기</button>
                `;
                
                // 성공 메시지 추가
                const formContainer = document.querySelector('.contact-form-container');
                formContainer.appendChild(successMessage);
                
                // 제목 업데이트
                const formTitle = formContainer.querySelector('h2');
                formTitle.textContent = '문의 접수 완료';
                
            }, 2000); // 2초 후 성공 메시지 표시 (실제 구현에서는 API 응답에 따라 처리)
        });
    }
    
    // 폼 유효성 검사 함수
    function validateForm(formData) {
        // 이전 오류 메시지 제거
        clearErrors();
        
        let isValid = true;
        
        // 이름 검사
        if (!formData.name.trim()) {
            showError('name', '이름을 입력해주세요.');
            isValid = false;
        }
        
        // 이메일 검사
        if (!formData.email.trim()) {
            showError('email', '이메일을 입력해주세요.');
            isValid = false;
        } else if (!isValidEmail(formData.email)) {
            showError('email', '유효한 이메일 주소를 입력해주세요.');
            isValid = false;
        }
        
        // 문의 유형 검사
        if (!formData.subject) {
            showError('subject', '문의 유형을 선택해주세요.');
            isValid = false;
        }
        
        // 문의 내용 검사
        if (!formData.message.trim()) {
            showError('message', '문의 내용을 입력해주세요.');
            isValid = false;
        } else if (formData.message.trim().length < 10) {
            showError('message', '문의 내용은 최소 10자 이상 입력해주세요.');
            isValid = false;
        }
        
        // 개인정보 수집 동의 검사
        if (!formData.agreePrivacy) {
            showError('agree-privacy', '개인정보 수집 및 이용에 동의해주세요.');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 오류 메시지 표시 함수
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        // 폼 그룹에 오류 클래스 추가
        formGroup.classList.add('error');
        
        // 오류 메시지 요소 생성
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        // 폼 그룹에 오류 메시지 추가
        formGroup.appendChild(errorMessage);
        
        // 첫 번째 오류 필드에 포커스
        if (!document.querySelector('.form-group.error input:focus, .form-group.error select:focus, .form-group.error textarea:focus')) {
            field.focus();
        }
    }
    
    // 오류 메시지 제거 함수
    function clearErrors() {
        // 모든 폼 그룹에서 오류 클래스 제거
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        
        // 모든 오류 메시지 제거
        document.querySelectorAll('.error-message').forEach(message => {
            message.remove();
        });
    }
    
    // 이메일 유효성 검사 함수
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 필수 입력 필드 레이블에 표시 추가
    document.querySelectorAll('label[for="name"], label[for="email"], label[for="subject"], label[for="message"]').forEach(label => {
        label.classList.add('required');
    });
});
