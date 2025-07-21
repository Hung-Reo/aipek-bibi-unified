// /static/js/controllers/lesson-plan/modules/rag-status-manager.js
// Refactor from file chính lesson-plan-ui.js (14-May)
export class RAGStatusManager {
    constructor() {
        this.namespaceMap = {
            'bibi_sgk': 'Sách giáo khoa',
            'bibi_ctgd': 'Chương trình giáo dục',
            'bibi_lesson_plan': 'Mẫu giáo án',
        };
    }

    // Di chuyển phương thức updateRagStatus từ dòng 722-816
    updateStatus(ragInfo) {
        if (!ragInfo) return;
        
        const ragBadge = document.getElementById('rag-badge');
        const ragStatusText = document.getElementById('rag-status-text');
        const ragSourcesList = document.getElementById('rag-sources-list');
        const progressIndicator = document.querySelector('.progress-indicator');
        
        if (!ragBadge || !ragStatusText) return;
        
        // Cập nhật biểu tượng RAG
        if (ragInfo.searching) {
            // Đang tìm kiếm
            const timeElapsed = ragInfo.timeElapsed || Math.floor((Date.now() - ragInfo.startTime) / 1000);
            const currentStage = ragInfo.currentStage || "Đang tìm kiếm...";
            
            // Cập nhật trạng thái tiến trình nếu ở giai đoạn tìm kiếm
            if (progressIndicator && timeElapsed > 10) {
                // Đẩy nhanh tiến trình nếu tìm kiếm kéo dài
                progressIndicator.style.transition = 'width 3s ease';
                progressIndicator.style.width = '45%';
            }
            
            ragBadge.className = 'rag-badge rag-searching';
            ragBadge.title = `RAG: Đang tìm kiếm (${timeElapsed}s)`;
            
            // Hiển thị trạng thái tìm kiếm chi tiết và sinh động hơn
            let searchingMessage = `Đang tìm kiếm tài liệu từ ${this.getNamespaceDisplayName(ragInfo.searchingNamespace || 'bibi_ctgd')}...`;
            
            // Điều chỉnh thông báo dựa trên thời gian
            if (timeElapsed > 20) {
                searchingMessage = 'Đang tìm kiếm thông tin chi tiết (có thể mất thêm thời gian)...';
            } else if (timeElapsed > 10) {
                searchingMessage = 'Đang tìm và phân tích tài liệu liên quan...';
            }
            
            // Thêm thông tin tìm thấy nếu có
            if (ragInfo.foundCount) {
                searchingMessage += ` (đã tìm thấy ${ragInfo.foundCount} kết quả)`;
            }
            
            // Ước tính thời gian còn lại
            let remainingTime = '';
            if (timeElapsed > 5) {
                const estimatedTotal = Math.min(40, timeElapsed * 1.5); // Ước tính tổng thời gian
                const remaining = Math.max(0, Math.round(estimatedTotal - timeElapsed));
                if (remaining > 0) {
                    remainingTime = ` - còn khoảng ${remaining}s`;
                }
            }
            
            ragStatusText.innerHTML = `
                <div class="rag-searching-animation">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
                <div class="rag-status-detail">
                    ${searchingMessage}
                    <span class="rag-time">(${timeElapsed}s${remainingTime})</span>
                    ${ragInfo.priorityFound ? '<span class="rag-found">✓ Đã tìm thấy từ CTGD</span>' : ''}
                </div>
            `;
            
            // Đánh dấu nếu đã tìm thấy một số kết quả
            if (ragInfo.partialResults && progressIndicator) {
                progressIndicator.classList.add('priority-found');
            }
            
            ragStatusText.style.display = 'block';
        } else if (ragInfo.usedRAG) {
            // Đã tìm thấy và sử dụng RAG
            
            // Đẩy tiến trình lên ~85% khi đã có kết quả RAG
            if (progressIndicator) {
                progressIndicator.style.transition = 'width 1s ease-out, background-color 1s';
                progressIndicator.style.backgroundColor = '#4CAF50'; // Chuyển về màu xanh lá
                progressIndicator.style.width = '85%';
            }
            
            ragBadge.className = 'rag-badge rag-found';
            ragBadge.title = `RAG: Đã sử dụng ${ragInfo.namespaces?.join(', ')}`;
            
            // Hiển thị danh sách nguồn với thông tin phong phú hơn
            if (ragInfo.sources && ragInfo.sources.length > 0) {
                // Hiển thị tối đa 5 nguồn để không chiếm quá nhiều không gian
                const displaySources = ragInfo.sources.slice(0, 5);
                const hasMore = ragInfo.sources.length > 5;
                
                ragSourcesList.innerHTML = displaySources.map(source => {
                    // Tách nguồn và trích đoạn nếu có
                    const parts = source.split(' - ');
                    const sourceName = parts[0];
                    const excerpt = parts.length > 1 ? parts[1] : '';
                    
                    return `
                        <li class="rag-source-item">
                            <span class="rag-source-icon">📚</span> 
                            <strong>${sourceName}</strong>
                            ${excerpt ? `<span class="source-excerpt">${excerpt}</span>` : ''}
                        </li>
                    `;
                }).join('') + (hasMore ? `<li class="rag-source-more">+ ${ragInfo.sources.length - 5} nguồn khác</li>` : '');
                
                ragSourcesList.style.display = 'block';
            }
            
            // Hiển thị thông báo thành công với đánh giá chất lượng
            let qualityMessage = '';
            if (ragInfo.sources && ragInfo.sources.length > 3) {
                qualityMessage = '<span class="rag-quality high">Chất lượng cao</span>';
            } else if (ragInfo.sources && ragInfo.sources.length > 0) {
                qualityMessage = '<span class="rag-quality medium">Chất lượng khá</span>';
            }
            
            ragStatusText.innerHTML = `
                <div class="rag-success">
                    <span class="rag-check">✓</span> Giáo án được tạo dựa trên:
                    ${ragInfo.namespaces?.map(ns => `<span class="rag-namespace">${this.getNamespaceDisplayName(ns)}</span>`).join(', ')}
                    ${qualityMessage}
                </div>
            `;
            ragStatusText.style.display = 'block';
        } else if (ragInfo.error) {
            // Có lỗi khi tìm kiếm
            ragBadge.className = 'rag-badge rag-error';
            ragBadge.title = `RAG: Lỗi - ${ragInfo.error}`;
            
            // Hiển thị thông báo lỗi chi tiết hơn
            ragStatusText.innerHTML = `
                <div class="rag-error-container">
                    <span class="rag-error-text">⚠️ ${ragInfo.error}</span>
                    <div class="rag-error-help">Hệ thống sẽ tiếp tục tạo giáo án dựa trên AI.</div>
                </div>
            `;
            ragStatusText.style.display = 'block';
            
            // Cập nhật trạng thái tiến trình nếu có lỗi
            if (progressIndicator) {
                progressIndicator.style.backgroundColor = '#F44336'; // Màu đỏ
                setTimeout(() => {
                    // Chuyển lại màu và tiếp tục tiến trình
                    progressIndicator.style.backgroundColor = '#FF9800'; // Màu cam
                    progressIndicator.style.width = '70%';
                }, 1000);
            }
        } else if (ragInfo.endTime) {
            // Đã tìm kiếm nhưng không tìm thấy kết quả
            ragBadge.className = 'rag-badge rag-no-results';
            ragBadge.title = 'RAG: Không tìm thấy kết quả phù hợp';
            
            // Hiển thị thông báo không tìm thấy với gợi ý
            ragStatusText.innerHTML = `
                <div class="rag-no-results-container">
                    <span class="rag-no-results-text">Không tìm thấy thông tin phù hợp từ CTGD</span>
                    <div class="rag-suggestion">Giáo án sẽ được tạo dựa trên kiến thức của AI</div>
                </div>
            `;
            ragStatusText.style.display = 'block';
            
            // Cập nhật trạng thái tiến trình nếu không có kết quả
            if (progressIndicator) {
                // Đẩy tiến trình lên ~50% để cho biết đã kết thúc giai đoạn tìm kiếm
                progressIndicator.style.transition = 'width 2s ease-out';
                progressIndicator.style.width = '50%';
            }
        } else {
            // Trạng thái mặc định
            ragBadge.className = 'rag-badge rag-inactive';
            ragBadge.title = 'RAG: Không sử dụng';
            ragStatusText.style.display = 'none';
            ragSourcesList.style.display = 'none';
        }
    }

    // Di chuyển phương thức getNamespaceDisplayName từ dòng 818-828
    getNamespaceDisplayName(namespace) {
        return this.namespaceMap[namespace] || namespace;
    }
    
    // Phương thức mới để tạo badge RAG
    createRAGBadge(type, sources = []) {
        let badgeType = type || 'disabled';
        let tooltipText = '';
        
        switch (badgeType) {
            case 'success':
                tooltipText = 'Nội dung được trích từ sách giáo khoa và chương trình giáo dục thông qua hệ thống RAG';
                return `<span class="rag-badge rag-success tooltip">📚 RAG<span class="tooltip-text">${tooltipText}</span></span>`;
            
            case 'fallback':
                tooltipText = 'Nội dung được tạo bởi AI do không tìm thấy thông tin liên quan trong sách giáo khoa';
                return `<span class="rag-badge rag-fallback tooltip">🤖 AI<span class="tooltip-text">${tooltipText}</span></span>`;
            
            default:
                tooltipText = 'Nội dung được tạo hoàn toàn bởi AI';
                return `<span class="rag-badge rag-disabled tooltip">🤖 AI<span class="tooltip-text">${tooltipText}</span></span>`;
        }
    }
    
    // Phương thức mới để tạo danh sách nguồn
    createSourcesList(sources = []) {
        if (!sources || sources.length === 0) return '';
        
        // Loại bỏ các nguồn trùng lặp
        const uniqueSources = Array.from(new Set(sources.map(source => {
            const parts = source.split(' - ');
            return parts[0];
        })));
        
        return `
            <div class="rag-sources-simple">
                <h4>🔍 Nguồn tham khảo:</h4>
                <ul class="simple-source-list">
                    ${uniqueSources.map(source => `<li>${source}</li>`).join('')}
                </ul>
            </div>
        `;
    }
}