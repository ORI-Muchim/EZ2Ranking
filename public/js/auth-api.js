// 인증 관련 API 클라이언트
const authAPI = {
    // 회원가입
    async register(userData) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
        }
        
        return data;
      } catch (error) {
        console.error('회원가입 API 오류:', error);
        throw error;
      }
    },
  
    // 로그인
    async login(credentials) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // 세션 쿠키 포함
          body: JSON.stringify(credentials)
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '로그인 중 오류가 발생했습니다.');
        }
        
        return data;
      } catch (error) {
        console.error('로그인 API 오류:', error);
        throw error;
      }
    },
  
    // 로그아웃
    async logout() {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include' // 세션 쿠키 포함
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '로그아웃 중 오류가 발생했습니다.');
        }
        
        return data;
      } catch (error) {
        console.error('로그아웃 API 오류:', error);
        throw error;
      }
    },
  
    // 현재 사용자 정보 조회
    async getCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // 세션 쿠키 포함
        });
  
        // 인증되지 않은 경우 null 반환
        if (response.status === 401) {
          return null;
        }
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '사용자 정보 조회 중 오류가 발생했습니다.');
        }
        
        return data;
      } catch (error) {
        console.error('사용자 정보 조회 API 오류:', error);
        throw error;
      }
    },
  
    // 비밀번호 찾기
    async forgotPassword(email) {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '비밀번호 찾기 요청 중 오류가 발생했습니다.');
        }
        
        return data;
      } catch (error) {
        console.error('비밀번호 찾기 API 오류:', error);
        throw error;
      }
    }
  };
  
// 프로필 관련 API 함수 추가
const profileAPI = {
    // 현재 사용자 프로필 정보 불러오기
    async getProfile() {
      return authAPI.getCurrentUser();
    },
    
    // 프로필 이미지 업로드
    async uploadProfileImage(imageFile) {
      try {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        
        const response = await fetch('/api/profile/upload-image', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '이미지 업로드 중 오류가 발생했습니다.');
        }
        
        return await response.json();
      } catch (error) {
        console.error('프로필 이미지 업로드 오류:', error);
        throw error;
      }
    },
    
    // 프로필 정보 업데이트
    async updateProfile(updateData) {
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
        
        const data = await response.json();
        
        // 로컬 스토리지의 사용자 정보 업데이트
        if (data.user) {
          const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');
          const updatedUser = {
            ...storedUser,
            displayName: data.user.display_name,
            profileImage: data.user.profile_image
          };
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
        
        return data;
      } catch (error) {
        console.error('프로필 업데이트 API 오류:', error);
        throw error;
      }
    }
  };