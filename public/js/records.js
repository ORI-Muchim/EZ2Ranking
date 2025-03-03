document.addEventListener('DOMContentLoaded', () => {
    // 초기 변수 설정
    let currentPage = 1;
    const itemsPerPage = 12;
    let totalPages = 1;
    let recordsData = [];
    let filteredData = [];
    let currentRecord = null;
    
    // DOM 요소
    const recordsList = document.querySelector('.records-list');
    const totalRecordsCount = document.getElementById('total-records-count');
    const bestScoreElement = document.getElementById('best-score');
    const sRanksCount = document.getElementById('s-ranks-count');
    const recentRecordDate = document.getElementById('recent-record-date');
    const songFilter = document.getElementById('song-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const sortFilter = document.getElementById('sort-filter');
    const filterBtn = document.querySelector('.filter-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const loadingContainer = document.querySelector('.loading-container');
    const noRecordsMessage = document.querySelector('.no-records');
    const noResultsMessage = document.querySelector('.no-results');
    const authRequired = document.querySelector('.auth-required');
    const recordModal = document.getElementById('record-detail-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    
    // 페이지 로드 시 인증 상태 확인
    checkAuthStatus().then(user => {
        if (user) {
            // 인증된 상태면 기록 데이터 로드
            loadRecordsData();
        } else {
            // 인증되지 않은 상태면 인증 필요 메시지 표시
            showAuthRequired();
        }
    }).catch(error => {
        console.error('인증 상태 확인 오류:', error);
        showAuthRequired();
    });
    
    // 인증 필요 메시지 표시
    function showAuthRequired() {
        // records-data는 표시된 상태로 유지하고, 그 위에 auth-required 오버레이 표시
        document.querySelector('.auth-required').classList.remove('hidden');
        
        // 로딩 컨테이너가 있으면 숨김
        if (loadingContainer) {
            loadingContainer.classList.add('hidden');
        }
    }
    
    // 기록 데이터 로드
    async function loadRecordsData() {
        showLoading();
        
        try {
            // API 호출
            const response = await fetch('/api/records/user');
            
            if (!response.ok) {
                throw new Error('기록 데이터를 불러오는데 실패했습니다.');
            }
            
            const data = await response.json();
            recordsData = data;
            
            // 기록이 없으면 메시지 표시
            if (recordsData.length === 0) {
                showNoRecords();
                return;
            }
            
            // 통계 정보 업데이트
            updateStats(recordsData);
            
            // 초기 필터링된 데이터는 전체 데이터
            filteredData = [...recordsData];
            
            // 기본 정렬 (최신순)
            sortRecords('date-desc');
            
            // 페이지 정보 업데이트
            updatePagination();
            
            // 데이터 표시
            displayRecords();
            
        } catch (error) {
            console.error('기록 데이터 로드 오류:', error);
            showError('기록 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    // 로딩 표시
    function showLoading() {
        loadingContainer.classList.remove('hidden');
        recordsList.classList.add('hidden');
        noRecordsMessage.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
    }
    
    // 기록 없음 메시지 표시
    function showNoRecords() {
        loadingContainer.classList.add('hidden');
        recordsList.classList.add('hidden');
        noRecordsMessage.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        
        // Check if the filters and pagination elements exist before hiding them
        const filtersElement = document.querySelector('.records-filters');
        const paginationElement = document.querySelector('.records-pagination');
        
        if (filtersElement) filtersElement.classList.add('hidden');
        if (paginationElement) paginationElement.classList.add('hidden');
        
        // Safely update statistics elements with null checks
        if (totalRecordsCount) totalRecordsCount.textContent = '0';
        if (bestScoreElement) bestScoreElement.textContent = '0';
        if (sRanksCount) sRanksCount.textContent = '0';
        if (recentRecordDate) recentRecordDate.textContent = '-';
    }
    
    // 결과 없음 메시지 표시
    function showNoResults() {
        loadingContainer.classList.add('hidden');
        recordsList.classList.add('hidden');
        noRecordsMessage.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        document.querySelector('.records-pagination').classList.add('hidden');
    }
    
    // 에러 표시
    function showError(message) {
        loadingContainer.classList.add('hidden');
        recordsList.classList.add('hidden');
        
        // 에러 메시지 엘리먼트가 없으면 생성
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            document.querySelector('.records-data').appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    // 통계 정보 업데이트
    function updateStats(records) {
        // 총 기록 수
        totalRecordsCount.textContent = records.length.toString();
        
        // 최고 점수
        const bestScore = Math.max(...records.map(record => record.score));
        bestScoreElement.textContent = formatNumber(bestScore);
        
        // 최근 기록 (날짜 기준으로 정렬)
        const sortedByDate = [...records].sort((a, b) => new Date(b.play_date) - new Date(a.play_date));
        
        if (sortedByDate.length > 0) {
            recentRecordDate.textContent = formatDate(sortedByDate[0].play_date);
        } else {
            recentRecordDate.textContent = '-';
        }
    }
    
    // 기록 표시
    function displayRecords() {
        loadingContainer.classList.add('hidden');
        
        // 결과가 없으면 메시지 표시
        if (filteredData.length === 0) {
            showNoResults();
            return;
        }
        
        recordsList.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        document.querySelector('.records-pagination').classList.remove('hidden');
        
        // 리스트 내용 초기화
        recordsList.innerHTML = '';
        
        // 현재 페이지의 아이템 범위 계산
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
        
        // 현재 페이지의 아이템 표시
        for (let i = startIndex; i < endIndex; i++) {
            const record = filteredData[i];
            
            const recordCard = document.createElement('div');
            recordCard.className = 'record-card';
            recordCard.setAttribute('data-record-id', record.record_id);
            
            // 썸네일 영역
            const thumbnail = document.createElement('div');
            thumbnail.className = 'record-thumbnail';
            
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = record.image_url || '/images/default-record.jpg';
            thumbnailImg.alt = record.song_title;
            
            // 등급 배지
            if (record.grade) {
                const gradeBadge = document.createElement('div');
                gradeBadge.className = `record-grade grade-${record.grade}`;
                gradeBadge.textContent = record.grade;
                thumbnail.appendChild(gradeBadge);
            }
            
            thumbnail.appendChild(thumbnailImg);
            
            // 상세 정보 영역
            const details = document.createElement('div');
            details.className = 'record-details';
            
            const songTitle = document.createElement('div');
            songTitle.className = 'record-song';
            songTitle.textContent = record.song_title;
            
            const meta = document.createElement('div');
            meta.className = 'record-meta';
            
            const difficulty = document.createElement('div');
            difficulty.className = 'record-difficulty';
            difficulty.textContent = '난이도: ';
            
            const difficultyBadge = document.createElement('span');
            difficultyBadge.className = `difficulty-badge difficulty-${record.difficulty_name}`;
            difficultyBadge.textContent = record.difficulty_name;
            difficulty.appendChild(difficultyBadge);
            
            const date = document.createElement('div');
            date.className = 'record-date';
            date.textContent = formatDate(record.play_date);
            
            meta.appendChild(difficulty);
            meta.appendChild(date);
            
            // 점수와 모드를 포함하는 컨테이너
            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'score-container';
            
            const score = document.createElement('div');
            score.className = 'record-score';
            score.textContent = formatNumber(record.score);
            
            // In the displayRecords function where you create record cards
            const modeName = document.createElement('div');
            modeName.className = 'record-mode';
            modeName.textContent = record.mode_name || '';
            
            // 점수와 모드 이름을 컨테이너에 추가
            scoreContainer.appendChild(score);
            scoreContainer.appendChild(modeName);
            
            details.appendChild(songTitle);
            details.appendChild(meta);
            details.appendChild(scoreContainer); // 점수와 모드가 포함된 컨테이너 추가
            
            // 카드 구성
            recordCard.appendChild(thumbnail);
            recordCard.appendChild(details);
            
            // 카드 클릭 이벤트 (모달 표시)
            recordCard.addEventListener('click', () => {
                showRecordDetail(record.record_id);
            });
            
            // 리스트에 카드 추가
            recordsList.appendChild(recordCard);
        }
        
        // 페이지네이션 업데이트
        updatePaginationButtons();
    }

    // 모달 닫기 함수 추가
    function closeRecordDetailModal() {
        const modal = document.getElementById('record-detail-modal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }
    
    // 기록 상세 정보 모달 표시
    function showRecordDetail(recordId) {
        // API 호출로 기록 상세 정보 가져오기
        fetch(`/api/records/${recordId}`)
        .then(response => response.json())
        .then(record => {
            // 모달 요소 업데이트 - 각 요소가 존재하는지 확인 후 업데이트
            const songTitleElement = document.getElementById('modal-song-title');
            if (songTitleElement) songTitleElement.textContent = record.song_title;
            
            const difficultyElement = document.getElementById('modal-difficulty');
            if (difficultyElement) difficultyElement.textContent = record.difficulty_name;
            
            // 모드 이름 표시 추가
            const modeElement = document.getElementById('modal-mode');
            if (modeElement) modeElement.textContent = record.mode_name || '-';
            
            const scoreElement = document.getElementById('modal-score');
            if (scoreElement) scoreElement.textContent = record.score.toLocaleString();
            
            const gradeElement = document.getElementById('modal-grade');
            if (gradeElement) {
            gradeElement.textContent = record.grade;
            gradeElement.className = `info-value grade grade-${record.grade}`;
            }
            
            const dateElement = document.getElementById('modal-date');
            if (dateElement) dateElement.textContent = new Date(record.play_date).toLocaleDateString();
            
            // 이미지 설정 - 요소가 존재하는지 확인
            const recordImg = document.getElementById('modal-record-img');
            if (recordImg) {
            if (record.image_url) {
                recordImg.src = record.image_url;
                recordImg.classList.remove('hidden');
            } else {
                recordImg.src = '/images/record-placeholder.jpg';
                recordImg.classList.remove('hidden');
            }
            }
            
            // 현재 기록 ID 저장 (삭제/수정용)
            currentRecordId = record.record_id;
            
            // 모달 표시
            const modal = document.getElementById('record-detail-modal');
            if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
            
            // 닫기 버튼 이벤트 추가
            const closeButton = modal.querySelector('.modal-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                modal.classList.remove('show');
                modal.classList.add('hidden');
                });
            }
            
            // 모달 외부 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                modal.classList.remove('show');
                modal.classList.add('hidden');
                }
            });
            }
        })
        .catch(error => {
            console.error('기록 상세 정보 로딩 오류:', error);
            alert('기록을 불러오는 중 오류가 발생했습니다.');
        });
    }
    
    // 기록 삭제 확인 모달 표시
    function showDeleteConfirmation() {
        // 상세 모달 숨기기
        recordModal.classList.remove('show');
        
        // 삭제 확인 모달 표시
        deleteConfirmModal.classList.add('show');
        
        // 모달 닫기 버튼 이벤트
        const closeButton = deleteConfirmModal.querySelector('.modal-close-btn');
        closeButton.addEventListener('click', () => {
            deleteConfirmModal.classList.remove('show');
        });
        
        // 취소 버튼 이벤트
        const cancelButton = document.getElementById('cancel-delete-btn');
        cancelButton.addEventListener('click', () => {
            deleteConfirmModal.classList.remove('show');
        });
        
        // 삭제 확인 버튼 이벤트
        const confirmButton = document.getElementById('confirm-delete-btn');
        confirmButton.addEventListener('click', deleteRecord);
        
        // 모달 외부 클릭 시 닫기
        deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === deleteConfirmModal) {
                deleteConfirmModal.classList.remove('show');
            }
        });
    }
    
    // 기록 삭제 함수
    async function deleteRecord() {
        if (!currentRecord) return;
        
        // 버튼 상태 변경
        const confirmButton = document.getElementById('confirm-delete-btn');
        const originalText = confirmButton.textContent;
        confirmButton.textContent = '삭제 중...';
        confirmButton.disabled = true;
        
        try {
            // API 호출 (실제 구현에서는 서버에 삭제 요청)
            const response = await fetch(`/api/records/${currentRecord.record_id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('기록 삭제에 실패했습니다.');
            }
            
            // 삭제 성공 처리
            deleteConfirmModal.classList.remove('show');
            
            // 데이터에서 해당 기록 제거
            recordsData = recordsData.filter(record => record.record_id !== currentRecord.record_id);
            filteredData = filteredData.filter(record => record.record_id !== currentRecord.record_id);
            
            // 기록이 없으면 메시지 표시
            if (recordsData.length === 0) {
                showNoRecords();
                return;
            }
            
            // 통계 정보 업데이트
            updateStats(recordsData);
            
            // 페이지 정보 업데이트
            updatePagination();
            
            // 데이터 표시
            displayRecords();
            
            // 삭제 성공 메시지 표시
            showSuccessMessage('기록이 성공적으로 삭제되었습니다.');
            
        } catch (error) {
            console.error('기록 삭제 오류:', error);
            showErrorMessage('기록 삭제 중 오류가 발생했습니다.');
            
            // 버튼 상태 복원
            confirmButton.textContent = originalText;
            confirmButton.disabled = false;
        }
    }
    
    // 기록 수정 페이지로 이동
    function redirectToUpdatePage(recordId) {
        window.location.href = `/upload.html?mode=edit&record=${recordId}`;
    }
    
    // 성공 메시지 표시
    // 성공 메시지 표시
    function showSuccessMessage(message) {
        // 메시지 엘리먼트 생성
        const messageEl = document.createElement('div');
        messageEl.className = 'success-message';
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translateX(-50%)';
        messageEl.style.padding = '12px 20px';
        messageEl.style.backgroundColor = 'rgba(79, 255, 122, 0.1)';
        messageEl.style.color = 'var(--success-color)';
        messageEl.style.borderRadius = 'var(--border-radius)';
        messageEl.style.border = '1px solid var(--success-color)';
        messageEl.style.zIndex = '1000';
        
        // 문서에 추가
        document.body.appendChild(messageEl);
        
        // 3초 후 제거
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 500);
        }, 3000);
    }
    
    // 에러 메시지 표시
    function showErrorMessage(message) {
        // 메시지 엘리먼트 생성
        const messageEl = document.createElement('div');
        messageEl.className = 'error-message';
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translateX(-50%)';
        messageEl.style.padding = '12px 20px';
        messageEl.style.backgroundColor = 'rgba(255, 79, 79, 0.1)';
        messageEl.style.color = 'var(--error-color)';
        messageEl.style.borderRadius = 'var(--border-radius)';
        messageEl.style.border = '1px solid var(--error-color)';
        messageEl.style.zIndex = '1000';
        
        // 문서에 추가
        document.body.appendChild(messageEl);
        
        // 3초 후 제거
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 500);
        }, 3000);
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
    
    // 기록 정렬
    function sortRecords(sortBy) {
        switch (sortBy) {
            case 'date-desc': // 날짜 (최신순)
                filteredData.sort((a, b) => new Date(b.play_date) - new Date(a.play_date));
                break;
            case 'date-asc': // 날짜 (오래된순)
                filteredData.sort((a, b) => new Date(a.play_date) - new Date(b.play_date));
                break;
            case 'score-desc': // 점수 (높은순)
                filteredData.sort((a, b) => b.score - a.score);
                break;
            case 'score-asc': // 점수 (낮은순)
                filteredData.sort((a, b) => a.score - b.score);
                break;
            default:
                filteredData.sort((a, b) => new Date(b.play_date) - new Date(a.play_date));
        }
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
        const modeValue = document.getElementById('mode-filter').value; // 모드 필터 값 추가
        
        // 검색어, 난이도, 모드에 따라 필터링
        filteredData = recordsData.filter(record => {
            const matchesSong = !songText || record.song_title.toLowerCase().includes(songText);
            const matchesDifficulty = !difficultyValue || record.difficulty_name === difficultyValue;
            const matchesMode = !modeValue || record.mode_name === modeValue; // 모드 필터링 추가
            
            return matchesSong && matchesDifficulty && matchesMode;
        });
        
        // 정렬 옵션 적용
        sortRecords(sortFilter.value);
        
        // 페이지 초기화 및 다시 표시
        currentPage = 1;
        updatePagination();
        displayRecords();
    }
    
    // 이벤트 리스너
        
    // 필터 버튼 클릭
    filterBtn.addEventListener('click', () => {
        applyFilters();
    });

    // 검색 입력 시 엔터 키
    songFilter.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // 정렬 변경
    sortFilter.addEventListener('change', () => {
        applyFilters();
    });

    // 난이도 필터 변경
    difficultyFilter.addEventListener('change', () => {
        applyFilters();
    });

    // 모드 필터 변경
    document.getElementById('mode-filter').addEventListener('change', () => {
        applyFilters();
    });

    // 이전 페이지 버튼 클릭
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            displayRecords();
        }
    });

    document.addEventListener('click', (e) => {
        // 닫기 버튼 클릭 확인
        if (e.target.matches('.modal-close-btn') || e.target.closest('.modal-close-btn')) {
          const modal = e.target.closest('.modal');
          if (modal && modal.id === 'record-detail-modal') {
            closeRecordDetailModal();
          }
        }
    });
    
    // URL 매개변수 확인 (성공 메시지 표시용)
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('success') && urlParams.get('success') === 'upload') {
        showSuccessMessage('기록이 성공적으로 등록되었습니다.');
    }
    
    if (urlParams.has('success') && urlParams.get('success') === 'update') {
        showSuccessMessage('기록이 성공적으로 수정되었습니다.');
    }
});
