document.addEventListener('DOMContentLoaded', () => {
  // 로그인 폼 제출 처리
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember')?.checked || false;
      
      // 로딩 상태 표시
      const loginBtn = document.querySelector('.login-btn');
      const originalBtnText = loginBtn.textContent;
      loginBtn.textContent = '로그인 중...';
      loginBtn.disabled = true;
      
      // 에러 메시지 초기화
      clearErrors();
      
      try {
          // API 호출
          const userData = await authAPI.login({ username, password });
          
          // 로그인 성공
          if (rememberMe) {
            localStorage.setItem('remembered_user', username);
          }
          
          // 사용자 정보 저장 - 필드 이름이 일치하는지 확인
          localStorage.setItem('user_data', JSON.stringify({
            userId: userData.user_id,
            username: userData.username,
            displayName: userData.display_name,
            profileImage: userData.profile_image
          }));
          
          // 홈으로 리다이렉트
          window.location.href = '/';
          
        } catch (error) {
        // 로그인 실패
        showError(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
        loginBtn.textContent = originalBtnText;
        loginBtn.disabled = false;
      }
    });
  }
  
  // 회원가입 폼 제출 처리
  const registerForm = document.querySelector('.register-container .login-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const username = document.getElementById('username').value;
      const displayName = document.getElementById('display-name').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const agreeTerms = document.getElementById('agree-terms')?.checked || false;
      
      // 로딩 상태 표시
      const registerBtn = document.querySelector('.register-btn');
      const originalBtnText = registerBtn.textContent;
      registerBtn.textContent = '회원가입 중...';
      registerBtn.disabled = true;
      
      // 에러 메시지 초기화
      clearErrors();
      
      // 기본 유효성 검사
      if (!email || !username || !password || !confirmPassword) {
        showError('모든 필수 항목을 입력해주세요.');
        registerBtn.textContent = originalBtnText;
        registerBtn.disabled = false;
        return;
      }
      
      if (password !== confirmPassword) {
        showError('비밀번호가 일치하지 않습니다.');
        registerBtn.textContent = originalBtnText;
        registerBtn.disabled = false;
        return;
      }
      
      if (!agreeTerms) {
        showError('이용약관 및 개인정보 처리방침에 동의해주세요.');
        registerBtn.textContent = originalBtnText;
        registerBtn.disabled = false;
        return;
      }
      
      try {
        // API 호출
        await authAPI.register({ username, email, password, displayName });
        
        // 회원가입 성공 - 로그인 페이지로 리다이렉트
        window.location.href = '/login.html?registered=true';
        
      } catch (error) {
        // 회원가입 실패
        showError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
        registerBtn.textContent = originalBtnText;
        registerBtn.disabled = false;
      }
    });
  }
  
  // 비밀번호 찾기 폼 제출 처리
  const forgotPasswordForm = document.querySelector('.forgot-password-container .login-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      
      // 로딩 상태 표시
      const resetBtn = document.querySelector('.reset-btn');
      const originalBtnText = resetBtn.textContent;
      resetBtn.textContent = '전송 중...';
      resetBtn.disabled = true;
      
      // 에러 메시지 초기화
      clearErrors();
      
      // 기본 유효성 검사
      if (!email) {
        showError('이메일을 입력해주세요.');
        resetBtn.textContent = originalBtnText;
        resetBtn.disabled = false;
        return;
      }
      
      try {
        // API 호출
        await authAPI.forgotPassword(email);
        
        // 성공 메시지 표시
        const instructionText = document.querySelector('.instruction-text');
        const formGroup = document.querySelector('.form-group');
        
        if (instructionText) instructionText.style.display = 'none';
        if (formGroup) formGroup.style.display = 'none';
        resetBtn.style.display = 'none';
        
        // 확인 메시지 표시
        const confirmationMessage = document.querySelector('.confirmation-message');
        if (confirmationMessage) {
          confirmationMessage.classList.remove('hidden');
          confirmationMessage.style.display = 'flex';
        }
        
      } catch (error) {
        // 실패
        showError(error.message || '이메일 전송에 실패했습니다. 다시 시도해주세요.');
        resetBtn.textContent = originalBtnText;
        resetBtn.disabled = false;
      }
    });
  }
  
  // 로그아웃 버튼 처리
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await authAPI.logout();
        
        // 로컬 스토리지 데이터 삭제
        localStorage.removeItem('user_data');
        
        // 홈으로 리다이렉트
        window.location.href = '/login.html?logged_out=true';
      } catch (error) {
        console.error('로그아웃 오류:', error);
      }
    });
  }
  
  // 비밀번호 표시/숨기기 토글 기능
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  if (togglePasswordBtns) {
    togglePasswordBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // 아이콘 변경
        btn.classList.toggle('fa-eye');
        btn.classList.toggle('fa-eye-slash');
      });
    });
  }
  
  // 소셜 로그인 버튼 - HTML의 onclick 속성을 JavaScript로 덮어쓰기
  const googleBtn = document.querySelector('.social-btn.google');
  if(googleBtn) {
      // 기존 onclick 속성을 JavaScript로 덮어쓰기
      googleBtn.onclick = function(e) {
          e.preventDefault();
          showTermsPopup();
          return false;
      };
  }
  
  // 페이지 로드 시 URL 파라미터 확인
  const urlParams = new URLSearchParams(window.location.search);
  
  // 회원가입 성공 메시지
  if (urlParams.get('registered') === 'true') {
    showMessage('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
  }
  
  // 로그아웃 메시지
  if (urlParams.get('logged_out') === 'true') {
    showMessage('로그아웃되었습니다.', 'info');
  }
  
  // 자동 로그인 처리
  checkAuthStatus();
  
  // 애니메이션 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
      .terms-popup-overlay {
          animation: fadeIn 0.3s ease-out;
      }
      
      .terms-popup {
          animation: scaleIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      }
      
      @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
      }
  `;
  document.head.appendChild(style);
});

// 약관 동의 팝업 표시 함수
// 약관 동의 팝업 표시 함수
function showTermsPopup() {
  // 기존 팝업이 있다면 제거
  const existingPopup = document.querySelector('.terms-popup-overlay');
  if(existingPopup) {
      existingPopup.remove();
  }
  
  // 팝업 오버레이 생성
  const popupOverlay = document.createElement('div');
  popupOverlay.className = 'terms-popup-overlay';
  popupOverlay.style.position = 'fixed';
  popupOverlay.style.top = '0';
  popupOverlay.style.left = '0';
  popupOverlay.style.width = '100%';
  popupOverlay.style.height = '100%';
  popupOverlay.style.backgroundColor = 'var(--overlay-color, rgba(0, 0, 0, 0.7))';
  popupOverlay.style.zIndex = '1000';
  popupOverlay.style.display = 'flex';
  popupOverlay.style.justifyContent = 'center';
  popupOverlay.style.alignItems = 'center';
  
  // 팝업 컨테이너
  const popupContainer = document.createElement('div');
  popupContainer.className = 'terms-popup';
  popupContainer.style.width = '90%';
  popupContainer.style.maxWidth = '600px'; // 너비 증가
  popupContainer.style.maxHeight = '85vh'; // 높이 증가
  popupContainer.style.backgroundColor = 'var(--bg-secondary, #1e1e1e)'; // 다크모드 배경색
  popupContainer.style.borderRadius = '10px';
  popupContainer.style.boxShadow = 'var(--shadow-soft), var(--shadow-neon)'; // 다크모드 그림자 효과
  popupContainer.style.padding = '30px'; // 패딩 증가
  popupContainer.style.display = 'flex';
  popupContainer.style.flexDirection = 'column';
  popupContainer.style.fontFamily = "'Noto Sans KR', sans-serif";
  popupContainer.style.border = '1px solid var(--border-color, #333333)'; // 다크모드 테두리
  popupContainer.style.color = 'var(--text-primary, #ffffff)'; // 다크모드 텍스트 색상
  
  // 팝업 헤더
  const popupHeader = document.createElement('div');
  popupHeader.className = 'terms-popup-header';
  popupHeader.style.display = 'flex';
  popupHeader.style.justifyContent = 'space-between';
  popupHeader.style.alignItems = 'center';
  popupHeader.style.marginBottom = '20px'; // 마진 증가
  popupHeader.style.borderBottom = '1px solid var(--border-color, #333333)'; // 헤더 구분선 추가
  popupHeader.style.paddingBottom = '15px'; // 패딩 추가
  
  // 팝업 제목
  const popupTitle = document.createElement('h2');
  popupTitle.textContent = '서비스 이용약관';
  popupTitle.style.margin = '0';
  popupTitle.style.fontSize = '1.8rem'; // 크기 증가
  popupTitle.style.fontWeight = '700'; // 볼드체 강화
  popupTitle.style.color = 'var(--accent-primary, #ffb100)'; // 다크모드 강조 색상
  popupTitle.style.textShadow = '0 0 5px rgba(255, 177, 0, 0.3)'; // 약간의 텍스트 그림자 효과
  
  // 닫기 버튼
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.border = 'none';
  closeButton.style.background = 'none';
  closeButton.style.fontSize = '2rem'; // 크기 증가
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0 10px';
  closeButton.style.lineHeight = '1';
  closeButton.style.color = 'var(--text-secondary, #b0b0b0)'; // 다크모드 텍스트 색상
  closeButton.style.transition = 'color var(--transition-speed, 0.3s)';
  closeButton.addEventListener('mouseover', () => {
    closeButton.style.color = 'var(--accent-primary, #ffb100)'; // 호버 시 색상 변경
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.color = 'var(--text-secondary, #b0b0b0)';
  });
  closeButton.addEventListener('click', () => {
    popupOverlay.remove();
  });
  
  // 헤더에 요소 추가
  popupHeader.appendChild(popupTitle);
  popupHeader.appendChild(closeButton);
  
  // iframe을 사용하여 terms.html 내용을 로드
  const termsFrame = document.createElement('iframe');
  termsFrame.src = 'terms.html';
  termsFrame.style.width = '100%';
  termsFrame.style.height = '350px'; // 높이 증가
  termsFrame.style.border = '1px solid var(--border-color, #333333)'; // 다크모드 테두리
  termsFrame.style.borderRadius = '8px';
  termsFrame.style.marginBottom = '20px'; // 마진 증가
  termsFrame.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'; // 배경색 어둡게 설정
  
  // 약관 동의 체크박스
  const termsCheckboxContainer = document.createElement('div');
  termsCheckboxContainer.style.display = 'flex';
  termsCheckboxContainer.style.alignItems = 'center';
  termsCheckboxContainer.style.marginBottom = '25px'; // 마진 증가
  termsCheckboxContainer.style.padding = '15px'; // 패딩 추가
  termsCheckboxContainer.style.backgroundColor = 'rgba(255, 177, 0, 0.05)'; // 약간의 배경색 추가
  termsCheckboxContainer.style.borderRadius = '8px';
  termsCheckboxContainer.style.border = '1px solid rgba(255, 177, 0, 0.2)'; // 테두리 추가
  
  const termsCheckbox = document.createElement('input');
  termsCheckbox.type = 'checkbox';
  termsCheckbox.id = 'terms-agreement';
  termsCheckbox.style.marginRight = '12px';
  termsCheckbox.style.width = '18px'; // 체크박스 크기 증가
  termsCheckbox.style.height = '18px'; // 체크박스 크기 증가
  termsCheckbox.style.accentColor = 'var(--accent-primary, #ffb100)'; // 체크박스 액센트 색상
  
  const termsLabel = document.createElement('label');
  termsLabel.htmlFor = 'terms-agreement';
  termsLabel.textContent = '위 약관에 동의합니다';
  termsLabel.style.fontSize = '1rem';
  termsLabel.style.fontWeight = '500';
  termsLabel.style.color = 'var(--text-primary, #ffffff)';
  
  termsCheckboxContainer.appendChild(termsCheckbox);
  termsCheckboxContainer.appendChild(termsLabel);
  
  // 버튼 컨테이너
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.marginTop = '10px';
  
  // 취소 버튼
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '취소';
  cancelButton.style.padding = '12px 25px'; // 패딩 증가
  cancelButton.style.border = '1px solid var(--border-color, #333333)'; // 다크모드 테두리
  cancelButton.style.borderRadius = '8px';
  cancelButton.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'; // 배경색 어둡게 설정
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.fontFamily = "'Noto Sans KR', sans-serif";
  cancelButton.style.fontSize = '1rem';
  cancelButton.style.width = '48%';
  cancelButton.style.color = 'var(--text-primary, #ffffff)'; // 다크모드 텍스트 색상
  cancelButton.style.transition = 'all var(--transition-speed, 0.3s)';
  
  cancelButton.addEventListener('mouseover', () => {
    cancelButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  });
  cancelButton.addEventListener('mouseout', () => {
    cancelButton.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  });
  
  cancelButton.addEventListener('click', () => {
    popupOverlay.remove();
  });
  
  // 동의 버튼
  const agreeButton = document.createElement('button');
  agreeButton.textContent = '동의하고 계속하기';
  agreeButton.style.padding = '12px 25px'; // 패딩 증가
  agreeButton.style.border = 'none';
  agreeButton.style.borderRadius = '8px';
  agreeButton.style.background = 'linear-gradient(45deg, var(--accent-primary, #ffb100), var(--accent-secondary, #ff8c00))'; // 그라데이션 배경
  agreeButton.style.color = 'white';
  agreeButton.style.cursor = 'pointer';
  agreeButton.style.fontFamily = "'Noto Sans KR', sans-serif";
  agreeButton.style.fontSize = '1rem';
  agreeButton.style.fontWeight = '600'; // 볼드체 강화
  agreeButton.style.width = '48%';
  agreeButton.style.boxShadow = '0 4px 8px rgba(255, 177, 0, 0.3)'; // 버튼 그림자 효과
  agreeButton.style.transition = 'all var(--transition-speed, 0.3s)';
  agreeButton.disabled = true;
  agreeButton.style.opacity = '0.6';
  
  agreeButton.addEventListener('mouseover', () => {
    if (!agreeButton.disabled) {
      agreeButton.style.transform = 'translateY(-2px)';
      agreeButton.style.boxShadow = '0 6px 12px rgba(255, 177, 0, 0.4)';
    }
  });
  agreeButton.addEventListener('mouseout', () => {
    agreeButton.style.transform = 'translateY(0)';
    agreeButton.style.boxShadow = '0 4px 8px rgba(255, 177, 0, 0.3)';
  });
  
  agreeButton.addEventListener('click', () => {
    if(termsCheckbox.checked) {
      // 구글 OAuth 리다이렉트
      window.location.href = '/auth/google';
    }
  });
  
  // 체크박스 상태에 따라 동의 버튼 활성화/비활성화
  termsCheckbox.addEventListener('change', () => {
    if(termsCheckbox.checked) {
      agreeButton.disabled = false;
      agreeButton.style.opacity = '1';
    } else {
      agreeButton.disabled = true;
      agreeButton.style.opacity = '0.6';
    }
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(agreeButton);
  
  // 요소들을 팝업 컨테이너에 추가
  popupContainer.appendChild(popupHeader);
  popupContainer.appendChild(termsFrame);
  popupContainer.appendChild(termsCheckboxContainer);
  popupContainer.appendChild(buttonContainer);
  
  // 팝업 오버레이를 body에 추가
  popupOverlay.appendChild(popupContainer);
  document.body.appendChild(popupOverlay);
  
  // 팝업 등장 애니메이션 적용
  setTimeout(() => {
    popupContainer.style.opacity = '0';
    popupContainer.style.transform = 'scale(0.9)';
    popupContainer.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      popupContainer.style.opacity = '1';
      popupContainer.style.transform = 'scale(1)';
    }, 50);
  }, 10);
}

// 다크모드 토글 기능 추가
function setupDarkModeToggle() {
  // 이미 토글 버튼이 있는지 확인
  if (document.getElementById('darkmode-toggle')) {
    return;
  }
  
  // 토글 버튼 생성
  const darkModeToggle = document.createElement('button');
  darkModeToggle.id = 'darkmode-toggle';
  darkModeToggle.innerHTML = '<i class="far fa-moon"></i>'; // FontAwesome 아이콘 사용
  darkModeToggle.title = '다크모드 전환';
  
  // 스타일 설정
  darkModeToggle.style.position = 'fixed';
  darkModeToggle.style.top = '20px';
  darkModeToggle.style.right = '20px';
  darkModeToggle.style.width = '40px';
  darkModeToggle.style.height = '40px';
  darkModeToggle.style.borderRadius = '50%';
  darkModeToggle.style.backgroundColor = 'var(--accent-primary, #ffb100)';
  darkModeToggle.style.color = '#121212';
  darkModeToggle.style.border = 'none';
  darkModeToggle.style.cursor = 'pointer';
  darkModeToggle.style.display = 'flex';
  darkModeToggle.style.justifyContent = 'center';
  darkModeToggle.style.alignItems = 'center';
  darkModeToggle.style.fontSize = '1.2rem';
  darkModeToggle.style.boxShadow = 'var(--shadow-soft)';
  darkModeToggle.style.zIndex = '100';
  darkModeToggle.style.transition = 'all 0.3s ease';
  
  // 이미 다크모드면 아이콘 변경
  if (document.body.classList.contains('light-mode')) {
    darkModeToggle.innerHTML = '<i class="far fa-sun"></i>';
    darkModeToggle.title = '라이트모드 전환';
  }
  
  // 바디에 추가
  document.body.appendChild(darkModeToggle);
  
  // 호버 효과
  darkModeToggle.addEventListener('mouseover', () => {
    darkModeToggle.style.transform = 'scale(1.1)';
  });
  
  darkModeToggle.addEventListener('mouseout', () => {
    darkModeToggle.style.transform = 'scale(1)';
  });
}

// 인증 상태 확인
async function checkAuthStatus() {
  try {
    // 현재 로그인한 사용자 정보 조회
    const userData = await authAPI.getCurrentUser();
    
    if (userData) {
      // 로그인 상태 - 유저 인터페이스 업데이트
      updateUIForLoggedInUser(userData);
      return userData; // 사용자 데이터 반환
    } else {
      // 로그아웃 상태
      updateUIForLoggedOutUser();
      
      // 로그인 페이지에서 저장된 사용자 이름 표시
      if (window.location.pathname.includes('login')) {
        const rememberedUser = localStorage.getItem('remembered_user');
        if (rememberedUser) {
          const usernameInput = document.getElementById('username');
          if (usernameInput) {
            usernameInput.value = rememberedUser;
            document.getElementById('remember').checked = true;
          }
        }
      }
      return null; // 사용자 데이터 없음을 명시적으로 반환
    }
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    updateUIForLoggedOutUser();
    return null; // 오류 발생 시 null 반환
  }
}

// 로그인 상태 UI 업데이트
function updateUIForLoggedInUser(userData) {
  const authButtons = document.querySelector('.auth-buttons');
  const userProfile = document.querySelector('.user-profile');
  
  if (authButtons && userProfile) {
  authButtons.classList.add('hidden');
  userProfile.classList.remove('hidden');
  
  // 유저 정보 표시
  const usernameDisplay = document.getElementById('username-display');
  const profileImg = document.getElementById('profile-img');
  
  if (usernameDisplay) {
      // display_name을 우선 사용하고 없으면 username 사용
      usernameDisplay.textContent = userData.display_name || userData.username;
  }
  
  if (profileImg && userData.profile_image) {
      // 프로필 이미지 경로 설정
      profileImg.src = userData.profile_image;
      profileImg.alt = userData.display_name || userData.username;
  } else if (profileImg) {
      // 기본 이미지 설정
      profileImg.src = '/images/default-profile.png';
  }
  
  console.log('로그인된 사용자 정보:', userData); // 디버깅용
  }
}

// 로그아웃 상태 UI 업데이트
function updateUIForLoggedOutUser() {
  const authButtons = document.querySelector('.auth-buttons');
  const userProfile = document.querySelector('.user-profile');
  
  if (authButtons && userProfile) {
    authButtons.classList.remove('hidden');
    userProfile.classList.add('hidden');
  }
}

// 에러 메시지 표시
function showError(message) {
  // 기존 에러 메시지 제거
  clearErrors();
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = 'var(--error-color)';
  errorDiv.style.fontSize = '0.85rem';
  errorDiv.style.textAlign = 'center';
  errorDiv.style.marginBottom = '15px';
  
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
  }
}

// 메시지 표시
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-box ${type}`;
  messageDiv.textContent = message;
  
  // 스타일 설정
  let bgColor = 'rgba(0, 123, 255, 0.1)'; // 기본 info
  let borderColor = 'var(--accent-primary)';
  
  if (type === 'success') {
    bgColor = 'rgba(40, 167, 69, 0.1)';
    borderColor = 'var(--success-color)';
  } else if (type === 'error') {
    bgColor = 'rgba(220, 53, 69, 0.1)';
    borderColor = 'var(--error-color)';
  }
  
  messageDiv.style.backgroundColor = bgColor;
  messageDiv.style.border = `1px solid ${borderColor}`;
  messageDiv.style.borderRadius = 'var(--border-radius)';
  messageDiv.style.padding = '12px';
  messageDiv.style.marginBottom = '20px';
  messageDiv.style.textAlign = 'center';
  
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.insertBefore(messageDiv, loginForm.firstChild);
  }
  
  // 5초 후 메시지 자동 제거
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    messageDiv.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 500);
  }, 5000);
}

// 에러 메시지 초기화
function clearErrors() {
  const errorMessages = document.querySelectorAll('.error-message');
  if (errorMessages) {
    errorMessages.forEach(error => {
      if (error.parentNode) {
        error.parentNode.removeChild(error);
      }
    });
  }
}
