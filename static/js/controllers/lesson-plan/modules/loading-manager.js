// /static/js/controllers/lesson-plan/modules/loading-manager.js
// Refactor from file chính lesson-plan-ui.js (14-May)

export class LoadingManager {
    constructor(loadingIndicator) {
        this.loadingIndicator = loadingIndicator;
        this.isLoading = false;
        this.startLoadingTime = 0;
        this.progressStage = 0;
        this.progressStartTime = 0;
        this.progressInterval = null;
    }

    // Di chuyển phương thức showLoading từ dòng 510-603
    showLoading(lessonType, outputArea) {
        this.isLoading = true;
        this.startLoadingTime = Date.now();
        
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
        
        // Chọn template placeholder dựa trên loại giáo án
        let placeholderTemplate;
        
        // Hiển thị giai đoạn tìm kiếm
        placeholderTemplate = `
            <div class="lesson-plan-card">
                <div class="loading-placeholder placeholder-title"></div>
                
                <h3>🎯 Đang tạo giáo án cho bạn...</h3>
                <p style="color: #666; font-size: 14px; margin: 5px 0 15px 0;">
                    <i class="fas fa-clock"></i> Dự kiến: 1-2 phút | Nội dung sẽ hiển thị từng phần
                </p>
                
                <div class="loading-status">
                    <div class="status-progress">
                        <div class="progress-bar">
                            <div class="progress-indicator"></div>
                        </div>
                    </div>
                    <div class="status-steps">
                        <div class="status-step active" id="step-searching">
                            <i class="fas fa-search"></i> Đang tìm kiếm tài liệu
                        </div>
                        <div class="status-step" id="step-generating">
                            <i class="fas fa-pen"></i> Đang soạn nội dung
                        </div>
                        <div class="status-step" id="step-formatting">
                            <i class="fas fa-list"></i> Đang định dạng giáo án
                        </div>
                    </div>
                </div>
                
                <div class="loading-placeholder placeholder-paragraph" style="width: 95%"></div>
                <div class="loading-placeholder placeholder-paragraph" style="width: 88%"></div>
                
                <h4 style="margin-top: 20px;">Mục tiêu bài học</h4>
                <div class="loading-placeholder placeholder-paragraph" style="width: 90%"></div>
                <div class="loading-placeholder placeholder-paragraph" style="width: 75%"></div>
                
                <h4 style="margin-top: 20px;">Các hoạt động</h4>
                <div class="placeholder-list">
                    <div class="loading-placeholder placeholder-list-item" style="width: 85%"></div>
                    <div class="loading-placeholder placeholder-list-item" style="width: 90%"></div>
                    <div class="loading-placeholder placeholder-list-item" style="width: 80%"></div>
                </div>
                
                <div class="rag-status-container">
                    <div id="rag-badge" class="rag-badge rag-searching">
                        <span class="rag-badge-icon"><i class="fas fa-database"></i></span>
                    </div>
                    <div class="rag-status-message" id="rag-status-message">
                        <i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm từ Chương trình giáo dục<span class="typing-dots">...</span>
                    </div>
                    <div id="rag-status-text" class="rag-status-text"></div>
                    <ul id="rag-sources-list" class="rag-sources-list" style="display: none;"></ul>
                </div>
            </div>
        `;
        
        // Hiển thị placeholder
        if (outputArea) {
            outputArea.innerHTML = placeholderTemplate;
            
            // Bắt đầu animation cho progress bar
            this.startProgressAnimation();
        }
    }
    
    // Di chuyển phương thức startProgressAnimation từ dòng 604-658
    startProgressAnimation() {
        const progressIndicator = document.querySelector('.progress-indicator');
        if (!progressIndicator) return;
        
        // Thiết lập ban đầu
        progressIndicator.style.width = '0%';
        progressIndicator.style.backgroundColor = '#4CAF50'; // Màu xanh lá
        
        // Khởi tạo biến để theo dõi giai đoạn
        this.progressStage = 0;
        this.progressStartTime = Date.now();
        
        // Xóa interval cũ nếu có
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // Khởi tạo animation theo giai đoạn
        setTimeout(() => {
            // Giai đoạn 1: 0% -> 30% nhanh (5s) - Màu xanh lá
            progressIndicator.style.transition = 'width 5s ease-out, background-color 1s';
            progressIndicator.style.width = '30%';
            
            // Thiết lập interval để cập nhật từng giai đoạn
            this.progressInterval = setInterval(() => {
                const elapsedTime = Date.now() - this.progressStartTime;
                
                // Giai đoạn 2: 30% -> 60% (10s) - Vẫn màu xanh lá
                if (elapsedTime > 5000 && this.progressStage < 1) {
                    this.progressStage = 1;
                    progressIndicator.style.transition = 'width 10s ease, background-color 1s';
                    progressIndicator.style.width = '60%';
                }
                // Giai đoạn 3: 60% -> 75% (10s) - Chuyển sang màu xanh dương
                else if (elapsedTime > 15000 && this.progressStage < 2) {
                    this.progressStage = 2;
                    progressIndicator.style.backgroundColor = '#2196F3'; // Màu xanh dương
                    progressIndicator.style.transition = 'width 10s linear, background-color 1s';
                    progressIndicator.style.width = '75%';
                }
                // Giai đoạn 4: 75% -> 85% (10s) - Chuyển sang màu cam
                else if (elapsedTime > 25000 && this.progressStage < 3) {
                    this.progressStage = 3;
                    progressIndicator.style.backgroundColor = '#FF9800'; // Màu cam
                    progressIndicator.style.transition = 'width 15s linear, background-color 1s';
                    progressIndicator.style.width = '85%';
                }
                // Giai đoạn 5: 85% -> 90% (15s) - Giữ màu cam
                else if (elapsedTime > 35000 && this.progressStage < 4) {
                    this.progressStage = 4;
                    progressIndicator.style.transition = 'width 15s linear';
                    progressIndicator.style.width = '90%';
                }
                
                // Cập nhật các step indicators
                this.updateProgressSteps(this.progressStage);
                
            }, 1000); // Kiểm tra mỗi giây
        }, 200);
    }

    // Di chuyển phương thức updateProgressSteps từ dòng 659-709
    updateProgressSteps(stage) {
        // Tìm các phần tử bước
        const searchingStep = document.getElementById('step-searching');
        const generatingStep = document.getElementById('step-generating');
        const formattingStep = document.getElementById('step-formatting');
        
        if (!searchingStep || !generatingStep || !formattingStep) return;
        
        // Cập nhật trạng thái active dựa vào stage
        
        // Giai đoạn 0-1: Đang tìm kiếm
        if (stage < 2) {
            searchingStep.classList.add('active');
            searchingStep.classList.remove('completed');
            generatingStep.classList.remove('active', 'completed');
            formattingStep.classList.remove('active', 'completed');
            
            // Cập nhật nội dung chi tiết hơn
            const timeElapsed = Math.floor((Date.now() - this.progressStartTime) / 1000);
            searchingStep.innerHTML = `<i class="fas fa-search"></i> Đang tìm kiếm tài liệu (${timeElapsed}s)`;
        }
        // Giai đoạn 2-3: Đang soạn nội dung
        else if (stage < 4) {
            searchingStep.classList.remove('active');
            searchingStep.classList.add('completed');
            searchingStep.innerHTML = `<i class="fas fa-check"></i> Đã tìm thấy tài liệu`;
            
            generatingStep.classList.add('active');
            generatingStep.classList.remove('completed');
            formattingStep.classList.remove('active', 'completed');
            
            // Thời gian còn lại ước tính
            const timeElapsed = Math.floor((Date.now() - this.progressStartTime) / 1000);
            const estimatedTotal = 45; // Giả định tổng thời gian khoảng 45 giây
            const remaining = Math.max(0, estimatedTotal - timeElapsed);
            
            generatingStep.innerHTML = `<i class="fas fa-pen"></i> Đang soạn nội dung (còn ~${remaining}s)`;
        }
        // Giai đoạn 4+: Đang định dạng
        else {
            searchingStep.classList.remove('active');
            searchingStep.classList.add('completed');
            searchingStep.innerHTML = `<i class="fas fa-check"></i> Đã tìm thấy tài liệu`;
            
            generatingStep.classList.remove('active');
            generatingStep.classList.add('completed');
            generatingStep.innerHTML = `<i class="fas fa-check"></i> Đã soạn nội dung`;
            
            formattingStep.classList.add('active');
            formattingStep.innerHTML = `<i class="fas fa-list"></i> Đang hoàn thiện giáo án...`;
        }
    }
  
    // Di chuyển phương thức hideLoading từ dòng 711-721
    hideLoading() {
        this.isLoading = false;
        const loadingTime = (Date.now() - this.startLoadingTime) / 1000;
        console.log(`⏱️ Thời gian phản hồi: ${loadingTime.toFixed(2)}s`);
        
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        
        // Xóa interval nếu có
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    // Phương thức mới để cập nhật tiến trình thủ công
    updateProgress(percentage, stage) {
        const progressIndicator = document.querySelector('.progress-indicator');
        if (!progressIndicator) return;
        
        // Cập nhật độ rộng của thanh tiến trình
        progressIndicator.style.transition = 'width 1s ease-out';
        progressIndicator.style.width = `${percentage}%`;
        
        // Cập nhật giai đoạn
        if (stage !== undefined && stage !== this.progressStage) {
            this.progressStage = stage;
            this.updateProgressSteps(stage);
        }
    }
    
    // Phương thức mới để reset tiến trình
    resetProgress() {
        const progressIndicator = document.querySelector('.progress-indicator');
        if (!progressIndicator) return;
        
        // Reset độ rộng và màu
        progressIndicator.style.transition = 'none';
        progressIndicator.style.width = '0%';
        progressIndicator.style.backgroundColor = '#4CAF50';
        
        // Reset giai đoạn
        this.progressStage = 0;
        this.progressStartTime = Date.now();
        
        // Cập nhật các bước
        this.updateProgressSteps(0);
    }
}