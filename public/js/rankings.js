document.addEventListener('DOMContentLoaded', () => {
    // 초기 변수 설정
    let currentPage = 1;
    const itemsPerPage = 20;
    let totalPages = 1;
    let rankingsData = [];
    let filteredData = [];
    
    // DOM 요소
    const rankingsTableBody = document.getElementById('rankings-data');
    const songFilter = document.getElementById('song-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const modeFilter = document.getElementById('mode-filter'); // 모드 필터 추가
    const filterBtn = document.querySelector('.filter-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const loadingContainer = document.querySelector('.loading-container');
    const rankingsTableContainer = document.querySelector('.rankings-table-container');
    const noResultsMessage = document.querySelector('.no-results');
    const authRequired = document.querySelector('.rankings-content > .auth-required');
    const rankingModal = document.getElementById('ranking-detail-modal');
    
    // 페이지 로드 시 인증 상태 확인
    checkAuthStatus().then(user => {
        if (user) {
            // 인증된 상태면 랭킹 데이터 로드
            loadRankingsData();
        } else {
            // 인증되지 않은 상태면 인증 필요 메시지 표시
            showAuthRequired();
        }
    }).catch(error => {
        console.error('인증 상태 확인 오류:', error);
        showAuthRequired();
    });

    // 인증 필요 메시지 표시 함수
    function showAuthRequired() {
        loadingContainer.classList.add('hidden');
        
        // auth-required 요소를 rankings-content의 자식으로 이동
        const authRequired = document.querySelector('.auth-required');
        const rankingsContent = document.querySelector('.rankings-content');
        
        // 이미 이동되었는지 확인
        if (authRequired.parentElement !== rankingsContent) {
            rankingsContent.appendChild(authRequired);
        }
        
        // 스타일 조정
        authRequired.style.position = 'absolute';
        authRequired.style.top = '0';
        authRequired.style.left = '0';
        authRequired.style.width = '100%';
        authRequired.style.height = '100%';
        authRequired.style.zIndex = '100';
        authRequired.style.borderRadius = 'var(--border-radius)';
        
        authRequired.classList.remove('hidden');
    }
    
    // 랭킹 데이터 로드
    async function loadRankingsData() {
        showLoading();
        
        try {
            // API 호출
            const response = await fetch('/api/rankings');
            
            if (!response.ok) {
                throw new Error('랭킹 데이터를 불러오는데 실패했습니다.');
            }
            
            const data = await response.json();
            rankingsData = data;
            
            // 초기 필터링된 데이터는 전체 데이터
            filteredData = [...rankingsData];
            
            // 페이지 정보 업데이트
            updatePagination();
            
            // 데이터 표시
            displayRankings();
            
        } catch (error) {
            console.error('랭킹 데이터 로드 오류:', error);
            showError('랭킹 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    // 로딩 표시
    function showLoading() {
        loadingContainer.classList.remove('hidden');
        rankingsTableContainer.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
    }
    
    // 에러 표시
    function showError(message) {
        loadingContainer.classList.add('hidden');
        rankingsTableContainer.classList.add('hidden');
        
        // 에러 메시지 엘리먼트가 없으면 생성
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            document.querySelector('.rankings-results').appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    // 랭킹 표시
    function displayRankings() {
        loadingContainer.classList.add('hidden');
    
        if (filteredData.length === 0) {
            rankingsTableContainer.classList.add('hidden');
            noResultsMessage.classList.remove('hidden');
            return;
        }
    
        rankingsTableContainer.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
    
        rankingsTableBody.innerHTML = '';
    
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
        for (let i = startIndex; i < endIndex; i++) {
            const record = filteredData[i];
    
            const row = document.createElement('tr');
            row.setAttribute('data-record-id', record.ranking_id);
    
            // 순위 셀
            const rankCell = document.createElement('td');
            rankCell.className = 'rank-column';
            if (record.rank <= 3) {
                const rankBadge = document.createElement('div');
                rankBadge.className = `rank-badge rank-${record.rank}`;
                rankBadge.textContent = record.rank;
                rankCell.appendChild(rankBadge);
            } else {
                rankCell.textContent = record.rank;
            }
    
            // 플레이어 셀
            const playerCell = document.createElement('td');
            playerCell.className = 'player-column';
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            const playerImage = document.createElement('img');
            playerImage.src = record.profile_image || '/images/default-profile.png';
            playerImage.alt = '프로필 이미지';
            const playerName = document.createElement('span');
            playerName.className = 'player-name';
            playerName.textContent = record.display_name;
            playerInfo.appendChild(playerImage);
            playerInfo.appendChild(playerName);
            playerCell.appendChild(playerInfo);
    
            // 곡 정보 셀
            const songCell = document.createElement('td');
            songCell.className = 'song-column';
            const songInfo = document.createElement('div');
            songInfo.className = 'song-info';
            const songTitle = document.createElement('div');
            songTitle.className = 'song-title';
            songTitle.textContent = record.song_title;
            const songDifficulty = document.createElement('div');
            songDifficulty.className = 'song-difficulty';
            songDifficulty.textContent = '난이도: ';
            const difficultyBadge = document.createElement('span');
            difficultyBadge.className = `difficulty-badge difficulty-${record.difficulty_name}`;
            difficultyBadge.textContent = record.difficulty_name;
            songDifficulty.appendChild(difficultyBadge);
            
            // 게임 모드 정보 추가
            const songMode = document.createElement('div');
            songMode.className = 'song-mode';
            songMode.textContent = '모드: ' + record.mode_name;
            
            // 노래 정보 조립
            songInfo.appendChild(songTitle);
            songInfo.appendChild(songDifficulty);
            songInfo.appendChild(songMode);
            songCell.appendChild(songInfo);
    
            // 점수 셀
            const scoreCell = document.createElement('td');
            scoreCell.className = 'score-column';
            scoreCell.innerHTML = `<span class="score">${formatNumber(record.score)}</span>`;
    
            row.appendChild(rankCell);
            row.appendChild(playerCell);
            row.appendChild(songCell);
            row.appendChild(scoreCell);
    
            row.addEventListener('click', () => {
                showRecordDetails(record);
            });
    
            rankingsTableBody.appendChild(row);
        }
    
        updatePaginationButtons();
    }    
    
    // 기록 상세 정보 모달 표시
    function showRecordDetails(record) {
        document.getElementById('modal-player-img').src = record.profile_image || '/images/default-profile.png';
        document.getElementById('modal-player-name').textContent = record.display_name;
        document.getElementById('modal-rank').querySelector('span').textContent = `${record.rank}위`;
        document.getElementById('modal-song-title').textContent = record.song_title;
        document.getElementById('modal-difficulty').textContent = record.difficulty_name;
        
        // 게임 모드 값 설정 - 값이 없으면 기본값으로 '-' 표시
        document.getElementById('modal-mode').textContent = record.mode_name || '-';
        
        document.getElementById('modal-score').textContent = formatNumber(record.score);
        document.getElementById('modal-grade').textContent = record.grade || '-';
        document.getElementById('modal-date').textContent = formatDate(record.last_updated) || '-';

        if (record.image_url) {
            document.getElementById('modal-record-img').src = record.image_url;
            document.getElementById('modal-record-img').parentElement.classList.remove('hidden');
        } else {
            document.getElementById('modal-record-img').parentElement.classList.add('hidden');
        }

        if (record.grade) {
            document.getElementById('modal-grade').className = `info-value grade grade-${record.grade}`;
        }

        rankingModal.classList.add('show');

        const closeButton = rankingModal.querySelector('.modal-close-btn');
        closeButton.addEventListener('click', () => {
            rankingModal.classList.remove('show');
        });

        rankingModal.addEventListener('click', (e) => {
            if (e.target === rankingModal) {
                rankingModal.classList.remove('show');
            }
        });
    }  
    
    // 숫자 포맷 (천 단위 구분)
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // 날짜 포맷
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        
        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // 페이지네이션 정보 업데이트
    function updatePagination() {
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        // 결과가 없으면 1 페이지로 설정
        if (totalPages === 0) {
            totalPages = 1;
        }
        
        // 현재 페이지가 총 페이지 수보다 크면 조정
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        // 현재 페이지가 1보다 작으면 조정
        if (currentPage < 1) {
            currentPage = 1;
        }
        
        // 페이지 텍스트 업데이트
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        
        // 버튼 상태 업데이트
        updatePaginationButtons();
    }
    
    // 페이지네이션 버튼 상태 업데이트
    function updatePaginationButtons() {
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // 필터 적용
    function applyFilters() {
        const songText = songFilter.value.toLowerCase().trim();
        const difficultyValue = difficultyFilter.value;
        const modeValue = modeFilter.value; // 모드 필터 값 가져오기
        
        // 검색어, 난이도, 모드에 따라 필터링
        filteredData = rankingsData.filter(record => {
            const matchesSong = !songText || record.song_title.toLowerCase().includes(songText);
            const matchesDifficulty = !difficultyValue || record.difficulty_name === difficultyValue;
            const matchesMode = !modeValue || record.mode_name === modeValue; // 모드 필터링 추가
            
            return matchesSong && matchesDifficulty && matchesMode;
        });
        
        // 페이지 초기화 및 다시 표시
        currentPage = 1;
        updatePagination();
        displayRankings();
    }
    
    // 필터링이 시작됨을 표시하는 시각적 피드백
    function showFilteringFeedback() {
        // 필터 버튼에 활성 클래스 추가
        filterBtn.classList.add('active');
        
        // 짧은 시간 후 클래스 제거 (애니메이션 효과)
        setTimeout(() => {
            filterBtn.classList.remove('active');
        }, 300);
    }
    
    // 이벤트 리스너
    
    // 필터 버튼 클릭
    filterBtn.addEventListener('click', () => {
        showFilteringFeedback();
        applyFilters();
    });
    
    // 검색 입력 시 엔터 키
    songFilter.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            showFilteringFeedback();
            applyFilters();
        }
    });
    
    // 난이도 필터 변경 시 자동 필터링
    difficultyFilter.addEventListener('change', () => {
        showFilteringFeedback();
        applyFilters();
    });
    
    // 모드 필터 변경 시 자동 필터링
    modeFilter.addEventListener('change', () => {
        showFilteringFeedback();
        applyFilters();
    });
    
    // 이전 페이지 버튼 클릭
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            displayRankings();
        }
    });
    
    // 다음 페이지 버튼 클릭
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            displayRankings();
        }
    });
});
