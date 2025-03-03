document.addEventListener('DOMContentLoaded', () => {
    // 인증 상태 확인 및 UI 업데이트
    checkAuthStatus().then(isLoggedIn => {
        // '시작하기' 버튼 이벤트 리스너
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (isLoggedIn) {
                    // 로그인 상태면 기록 페이지로 이동
                    window.location.href = '/records.html';
                } else {
                    // 로그인 상태가 아니면 로그인 페이지로 이동
                    window.location.href = '/login.html';
                }
            });
        }
    });

    // 모바일 메뉴 토글
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
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
    
    // 카드 애니메이션 - 수정된 버전
    const featureCards = document.querySelectorAll('.feature-card');
    
    if (featureCards.length) {
        featureCards.forEach(card => {
            // 호버 효과만 적용
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
            
            // 초기 스타일 설정 (트랜지션만 적용)
            card.style.transition = 'transform 0.3s ease';
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
