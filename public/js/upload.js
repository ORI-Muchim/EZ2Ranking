document.addEventListener('DOMContentLoaded', () => {
    // 인증 상태 확인 및 UI 업데이트
    checkAuthStatus().then(user => {
        if (!user) {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            window.location.href = '/login.html?redirect=upload';
            return;
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
    
    // 탭 전환 처리
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // 모든 탭 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // 선택한 탭 활성화
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // 카메라 탭인 경우 카메라 초기화
            if (tabId === 'photo') {
                initCamera();
            } else {
                // 카메라 탭이 아닌 경우 카메라 정지
                stopCamera();
            }
            
            // 결과 컨테이너 숨기기
            document.querySelector('.result-container').style.display = 'none';
        });
    });
    
    // 카메라 초기화 및 제어
    const cameraPreview = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const cameraCapture = document.getElementById('camera-capture');
    let stream = null;
    
    // 카메라 초기화 함수
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            cameraPreview.srcObject = stream;
            captureBtn.style.display = 'block';
            retakeBtn.style.display = 'none';
        } catch (error) {
            console.error('카메라 접근 오류:', error);
            showError('카메라 접근에 실패했습니다. 카메라 접근 권한을 확인해주세요.');
        }
    }
    
    // 카메라 정지 함수
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }
    
    // 사진 촬영 버튼 이벤트
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            // 캔버스에 비디오 프레임 캡처
            const context = cameraCapture.getContext('2d');
            cameraCapture.width = cameraPreview.videoWidth;
            cameraCapture.height = cameraPreview.videoHeight;
            context.drawImage(cameraPreview, 0, 0, cameraCapture.width, cameraCapture.height);
            
            // 카메라 프리뷰 숨기고 캡처 이미지 표시
            cameraPreview.style.display = 'none';
            cameraCapture.style.display = 'block';
            
            // 버튼 상태 변경
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'block';
            
            // 결과 컨테이너 표시
            document.querySelector('.result-container').style.display = 'block';
            
            // 이미지 분석 (실제로는 API 호출하여 분석)
            analyzeImage(cameraCapture.toDataURL('image/jpeg'));
        });
    }
    
    // 다시 촬영 버튼 이벤트
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            // 캡처 이미지 숨기고 카메라 프리뷰 표시
            cameraCapture.style.display = 'none';
            cameraPreview.style.display = 'block';
            
            // 버튼 상태 변경
            retakeBtn.style.display = 'none';
            captureBtn.style.display = 'block';
            
            // 결과 컨테이너 숨기기
            document.querySelector('.result-container').style.display = 'none';
        });
    }
    
    // 파일 업로드 처리
    const fileDropArea = document.getElementById('file-drop-area');
    const fileInput = document.getElementById('file-input');
    const fileSelectBtn = document.getElementById('file-select-btn');
    const filePreviewImage = document.getElementById('file-preview-image');
    const filePreview = document.querySelector('.file-preview');
    const fileChangeBtn = document.getElementById('file-change-btn');
    
    // 파일 선택 버튼 클릭 이벤트
    if (fileSelectBtn) {
        fileSelectBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // 파일 입력 변경 이벤트
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 드래그 앤 드롭 이벤트
    if (fileDropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            fileDropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            fileDropArea.classList.remove('highlight');
        }
        
        fileDropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                handleFiles(files);
            }
        }
    }
    
    // 파일 선택 처리
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    // DNG 파일인지 확인하는 함수
    function isDngFile(file) {
        return file.name.toLowerCase().endsWith('.dng');
    }
    
    // 로딩 상태 표시 함수
    function showLoading(message = '처리 중...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>${message}</p>
        `;
        loadingDiv.style.display = 'flex';
        loadingDiv.style.flexDirection = 'column';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.textAlign = 'center';
        
        // 로딩 메시지 표시 위치 결정
        const activePane = document.querySelector('.tab-pane.active');
        activePane.insertBefore(loadingDiv, activePane.firstChild);
        
        return loadingDiv;
    }
    
    // 로딩 상태 제거 함수
    function hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }
    
    // DNG를 JPG로 변환하는 함수로 수정
    async function convertDngToJpg(file) {
        const loadingElement = showLoading('DNG 파일을 변환 중입니다...');
        
        try {
            // FormData 객체 생성
            const formData = new FormData();
            formData.append('dngFile', file);
            
            // 서버에 DNG 파일 전송하여 JPG로 변환 요청
            const response = await fetch('/api/convert/dng-to-jpg', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('DNG 파일 변환 중 오류가 발생했습니다.');
            }
            
            const data = await response.json();
            
            // 변환된 JPG 파일의 URL을 반환
            return data.jpgDataUrl;
        } catch (error) {
            console.error('DNG 변환 오류:', error);
            throw error;
        } finally {
            hideLoading(loadingElement);
        }
    }
    
    // 파일 처리
    async function handleFiles(files) {
        const file = files[0];
        
        // 파일 유효성 검사
        if (!file.type.startsWith('image/') && !isDngFile(file)) {
            showError('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        if (file.size > 200 * 1024 * 1024) { // 200MB 제한
            showError('이미지 크기는 200MB 이하여야 합니다.');
            return;
        }
        
        try {
            let imageDataUrl;
            
            // DNG 파일인 경우 JPG로 변환
            if (isDngFile(file)) {
                imageDataUrl = await convertDngToJpg(file); // 함수 이름 변경
            } else {
                // 일반 이미지 파일인 경우 FileReader로 읽기
                imageDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(new Error('파일 읽기 오류'));
                    reader.readAsDataURL(file);
                });
            }
            
            // 파일 미리보기 업데이트
            filePreviewImage.src = imageDataUrl;
            fileDropArea.style.display = 'none';
            filePreview.style.display = 'block';
            
            // 결과 컨테이너 표시
            document.querySelector('.result-container').style.display = 'block';
            
            // 이미지 분석
            analyzeImage(imageDataUrl);
            
        } catch (error) {
            console.error('파일 처리 오류:', error);
            showError(error.message || '파일 처리 중 오류가 발생했습니다.');
        }
    }
    
    // 다른 파일 선택 버튼 이벤트
    if (fileChangeBtn) {
        fileChangeBtn.addEventListener('click', () => {
            filePreview.style.display = 'none';
            fileDropArea.style.display = 'block';
            fileInput.value = '';
            
            // 결과 컨테이너 숨기기
            document.querySelector('.result-container').style.display = 'none';
        });
    }
    
    async function analyzeImage(imageData) {
        // Show loading state
        const resultContainer = document.querySelector('.result-container');
        const originalContent = resultContainer.innerHTML;
        resultContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>이미지 분석 중...</p>
            </div>
        `;
        
        try {
            // First upload the image to get a URL
            const imageUrl = await uploadImage(imageData);
            
            // Then call your backend API that will forward the request to Gemini
            const response = await fetch('/api/records/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageUrl })
            });
            
            if (!response.ok) {
                throw new Error('이미지 분석 중 오류가 발생했습니다.');
            }
            
            const data = await response.json();
            
            // Restore the original container content
            resultContainer.innerHTML = originalContent;
            
            // Store the uploaded image URL in a hidden field
            const imageUrlField = document.createElement('input');
            imageUrlField.type = 'hidden';
            imageUrlField.id = 'uploaded-image-url';
            imageUrlField.value = imageUrl;
            resultContainer.appendChild(imageUrlField);
            
            // Populate form fields with the analysis results
            populateFormWithAnalysisResults(data);
            
            // Show the result container
            resultContainer.style.display = 'block';
            
            // Attach event listeners to buttons
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.addEventListener('click', submitRecord);
            }
            
            const cancelBtn = document.getElementById('cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    // Hide result container
                    document.querySelector('.result-container').style.display = 'none';
                    
                    // Check which tab is active
                    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
                    
                    if (activeTab === 'photo') {
                        // For photo tab, click retake button
                        document.getElementById('retake-btn').click();
                    } else {
                        // For file tab, click change file button
                        document.getElementById('file-change-btn').click();
                    }
                });
            }
        } catch (error) {
            console.error('이미지 분석 오류:', error);
            resultContainer.innerHTML = originalContent;
            showError(error.message || '이미지 분석 중 오류가 발생했습니다.');
        }
    }

    function populateFormWithAnalysisResults(analysisData) {
        // Extract values from the analysis data (with defaults for missing values)
        const {
            songName,
            modeName,
            difficultyType,
            difficultyLevel,
            rank,
            score,
            accuracy
        } = analysisData;
        
        // Populate form fields
        const songTitleInput = document.getElementById('song-title');
        if (songTitleInput && songName) songTitleInput.value = songName;
        
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect && difficultyType) {
            const options = Array.from(difficultySelect.options);
            const option = options.find(opt => opt.value === difficultyType);
            if (option) difficultySelect.value = difficultyType;
        }
        
        const difficultyLevelInput = document.getElementById('difficulty-level');
        if (difficultyLevelInput && difficultyLevel) difficultyLevelInput.value = difficultyLevel;
        
        const modeSelect = document.getElementById('mode');
        if (modeSelect && modeName) {
            const options = Array.from(modeSelect.options);
            const option = options.find(opt => opt.value === modeName);
            if (option) modeSelect.value = modeName;
        }
        
        const scoreInput = document.getElementById('score');
        if (scoreInput && score) scoreInput.value = score;
        
        const gradeSelect = document.getElementById('grade');
        if (gradeSelect && rank) {
            const options = Array.from(gradeSelect.options);
            const option = options.find(opt => opt.value === rank);
            if (option) gradeSelect.value = rank;
        }
        
        // If there's an accuracy field, populate it
        const accuracyInput = document.getElementById('accuracy');
        if (accuracyInput && accuracy) accuracyInput.value = accuracy;
    }
    
    // 기록 제출 함수
    async function submitRecord() {
        const songTitle = document.getElementById('song-title').value;
        const difficulty = document.getElementById('difficulty').value;
        const difficultyLevel = document.getElementById('difficulty-level').value; // 추가된 필드
        const modeName = document.getElementById('mode').value;
        const score = document.getElementById('score').value;
        const grade = document.getElementById('grade').value;
        const accuracy = document.getElementById('accuracy')?.value || null;
        const combo = document.getElementById('combo')?.value || null;
        
        // 유효성 검사 (난이도 레벨도 필요한 경우 검사)
        if (!songTitle) {
          showError('곡 이름을 입력해주세요.');
          return;
        }
        if (!difficulty) {
          showError('난이도를 선택해주세요.');
          return;
        }
        if (!difficultyLevel) {
          showError('난이도 레벨을 입력해주세요.');
          return;
        }
        if (!modeName) {
          showError('모드를 선택해주세요.');
          return;
        }
        if (!score) {
          showError('점수를 입력해주세요.');
          return;
        }
        if (score < 0 || score > 1200000) {
          showError('유효한 점수 범위가 아닙니다.');
          return;
        }
        if (!grade) {
          showError('등급을 선택해주세요.');
          return;
        }
        
        const imageUrl = document.getElementById('uploaded-image-url')?.value;
        if (!imageUrl) {
          showError('이미지가 필요합니다. 사진을 촬영하거나 파일을 업로드해주세요.');
          return;
        }
        
        // 제출 버튼 상태 변경
        const submitBtn = document.getElementById('submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = '등록 중...';
        submitBtn.disabled = true;
        
        try {
            // 기록 데이터 생성 (난이도 레벨 포함)
            const recordData = {
              songTitle,
              difficulty,
              difficultyLevel: parseInt(difficultyLevel),
              modeName,
              score: parseInt(score),
              grade,
              accuracy: accuracy ? parseFloat(accuracy) : null,
              combo: combo ? parseInt(combo) : null,
              imageUrl
            };
            
            const response = await fetch('/api/records/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(recordData)
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '기록 등록 중 오류가 발생했습니다.');
            }
            
            const data = await response.json();
            showSuccess('기록이 성공적으로 등록되었습니다.');
            setTimeout(() => {
              window.location.href = '/records.html';
            }, 3000);
            
          } catch (error) {
            console.error('기록 등록 오류:', error);
            showError(error.message || '기록 등록 중 오류가 발생했습니다.');
            
            // 버튼 상태 복원
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }    
    
    // 이미지 업로드 함수
    async function uploadImage(imageData) {
        try {
            // 서버 API에 이미지 데이터 전송
            const response = await fetch('/api/records/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageData })
            });
            
            if (!response.ok) {
                throw new Error('이미지 업로드 중 오류가 발생했습니다.');
            }
            
            const data = await response.json();
            return data.imageUrl;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            throw error;
        }
    }

    // 기록 등록 함수
    async function submitRecordToServer(recordData) {
        try {
            // 서버 API에 기록 데이터 전송
            const response = await fetch('/api/records/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recordData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '기록 등록 중 오류가 발생했습니다.');
            }
            
            return await response.json();
        } catch (error) {
            console.error('기록 등록 오류:', error);
            throw error;
        }
    }
    
    // 에러 메시지 표시 함수
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.backgroundColor = 'rgba(255, 79, 79, 0.1)';
        errorDiv.style.color = '#ff4f4f';
        errorDiv.style.padding = '12px 15px';
        errorDiv.style.borderRadius = 'var(--border-radius)';
        errorDiv.style.marginBottom = '20px';
        errorDiv.style.textAlign = 'center';
        
        // 에러 메시지 표시 위치 결정
        const container = document.querySelector('.result-container');
        if (container && container.style.display !== 'none') {
            // 결과 컨테이너가 표시 중이면 그 안에 표시
            container.insertBefore(errorDiv, container.firstChild);
        } else {
            // 아니면 활성화된 탭 콘텐츠 안에 표시
            const activePane = document.querySelector('.tab-pane.active');
            activePane.insertBefore(errorDiv, activePane.firstChild);
        }
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // 성공 메시지 표시 함수
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.backgroundColor = 'rgba(79, 255, 122, 0.1)';
        successDiv.style.color = '#4fff7a';
        successDiv.style.padding = '12px 15px';
        successDiv.style.borderRadius = 'var(--border-radius)';
        successDiv.style.marginBottom = '20px';
        successDiv.style.textAlign = 'center';
        
        // 성공 메시지 표시 위치
        const container = document.querySelector('.result-container');
        container.insertBefore(successDiv, container.firstChild);
    }
    
    // 페이지 언로드 시 카메라 정지
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
    
    // 초기 탭에 따라 카메라 초기화
    if (document.querySelector('.tab-btn.active').getAttribute('data-tab') === 'photo') {
        initCamera();
    }
    
    // CSS 스타일 추가 (로딩 스피너)
    const style = document.createElement('style');
    style.textContent = `
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 177, 0, 0.3);
            border-radius: 50%;
            border-top-color: var(--accent-primary);
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .highlight {
            border-color: var(--accent-primary);
            background-color: rgba(255, 177, 0, 0.05);
        }
    `;
    document.head.appendChild(style);

    // 모바일 메뉴 토글
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
});
