document.addEventListener('DOMContentLoaded', () => {
    // 인증 상태 확인 및 UI 업데이트
    checkAuthStatus().then(user => {
        if (!user) {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            window.location.href = '/login.html?redirect=profile';
            return;
        }
        
        // 현재 사용자 정보로 폼 초기화
        initializeForm(user);
    });
    
    // 프로필 이미지 업로드 처리
    const profileImageUpload = document.getElementById('profile-image-upload');
    const currentProfileImage = document.getElementById('current-profile-image');
    
    if (profileImageUpload && currentProfileImage) {
        profileImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 파일 유효성 검사
                if (!file.type.startsWith('image/')) {
                    showMessage('이미지 파일만 업로드 가능합니다.', 'error');
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                    showMessage('이미지 크기는 5MB 이하여야 합니다.', 'error');
                    return;
                }
                
                // 이미지 미리보기
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentProfileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 프로필 폼 제출 처리
    const profileForm = document.getElementById('profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 폼 데이터 수집
            const displayName = document.getElementById('display-name').value;
            const newPassword = document.getElementById('new-password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            
            // 기본 유효성 검사
            if (!displayName) {
              showMessage('닉네임을 입력해주세요.', 'error');
              return;
            }
            
            // 현재 사용자 정보 조회
            const user = await getLoggedInUser();
            const isSocialLogin = user && user.is_social_login;
            
            // 일반 사용자가 비밀번호를 변경하려는 경우에만 확인
            if (!isSocialLogin && newPassword) {
              if (newPassword.length < 8) {
                showMessage('새 비밀번호는 8자 이상이어야 합니다.', 'error');
                return;
              }
              
              if (newPassword !== confirmPassword) {
                showMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'error');
                return;
              }
            }
            
            // 저장 버튼 상태 변경
            const saveBtn = document.getElementById('save-btn');
            const originalBtnText = saveBtn.textContent;
            saveBtn.textContent = '저장 중...';
            saveBtn.disabled = true;
            
            try {
              // 프로필 이미지 업로드 (있는 경우)
              let profileImageUrl = null;
              const profileImageFile = document.getElementById('profile-image-upload').files[0];
              
              if (profileImageFile) {
                profileImageUrl = await uploadProfileImage(profileImageFile);
              }
              
              // 프로필 정보 업데이트
              const updateData = {
                displayName,
                newPassword: isSocialLogin ? '' : (newPassword || undefined),
                profileImage: profileImageUrl
              };
              
              const response = await updateProfile(updateData);
              
              showMessage('프로필이 성공적으로 업데이트되었습니다.', 'success');
              
              // 3초 후 홈페이지로 리다이렉트
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
              
            } catch (error) {
              console.error('프로필 업데이트 오류:', error);
              showMessage(error.message || '프로필 업데이트 중 오류가 발생했습니다.', 'error');
              
              // 버튼 상태 복원
              saveBtn.textContent = originalBtnText;
              saveBtn.disabled = false;
            }
        });
    }
    
    // 취소 버튼 처리
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
});

    // 드롭다운 메뉴 (프로필)
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        
        // 드롭다운 외부 클릭 시 닫기
        window.addEventListener('click', () => {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        });
    }

// 프로필 폼 초기화
async function initializeForm(user) {
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    const currentProfileImage = document.getElementById('current-profile-image');
    
    if (displayNameInput && user.display_name) {
      displayNameInput.value = user.display_name;
    }
    
    if (emailInput && user.email) {
      emailInput.value = user.email;
    }
    
    if (currentProfileImage && user.profile_image) {
      currentProfileImage.src = user.profile_image;
    }
    
    // 소셜 로그인 여부와 상관없이 비밀번호 필드 숨김
    // 현재 비밀번호 필드 숨김
    const currentPasswordField = document.querySelector('.form-group:has(#current-password)');
    if (currentPasswordField) {
      currentPasswordField.style.display = 'none';
    }
    
    // 비밀번호 변경 섹션은 유지 (선택적으로 변경 가능)
    // 소셜 로그인 사용자는 비밀번호 변경 불가
    if (user.is_social_login) {
      // 비밀번호 변경 섹션 숨김
      const passwordDivider = document.querySelector('.form-divider');
      if (passwordDivider) {
        passwordDivider.style.display = 'none';
      }
      
      // 비밀번호 변경 필드들 숨김
      const passwordFields = document.querySelectorAll('.form-divider ~ .form-group');
      passwordFields.forEach(field => {
        field.style.display = 'none';
      });
      
      // 소셜 로그인 메시지 추가
      const formActions = document.querySelector('.form-actions');
      if (formActions) {
        const socialLoginMsg = document.createElement('div');
        socialLoginMsg.className = 'social-login-msg';
        socialLoginMsg.textContent = '구글 로그인 계정입니다.';
        socialLoginMsg.style.color = 'var(--accent-primary)';
        socialLoginMsg.style.marginBottom = '15px';
        formActions.parentNode.insertBefore(socialLoginMsg, formActions);
      }
    }
}

// 프로필 이미지 업로드 함수
async function uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
        const response = await fetch('/api/profile/upload-image', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '이미지 업로드 중 오류가 발생했습니다.');
        }
        
        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        throw error;
    }
}

// 프로필 업데이트 함수
async function updateProfile(updateData) {
    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '프로필 업데이트 중 오류가 발생했습니다.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('프로필 업데이트 API 오류:', error);
        throw error;
    }
}

// 현재 로그인한 사용자 정보 가져오는 함수
async function getLoggedInUser() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // 세션 쿠키 포함
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // 인증되지 않은 경우
        }
        throw new Error('사용자 정보 조회 실패');
      }
      
      return await response.json();
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  }

// 메시지 표시 함수
function showMessage(message, type = 'error') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    
    // 폼 상단에 메시지 삽입
    const form = document.querySelector('.profile-form');
    form.insertBefore(messageDiv, form.firstChild);
    
    // 5초 후 메시지 자동 제거 (성공 메시지가 아닌 경우)
    if (type !== 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}
