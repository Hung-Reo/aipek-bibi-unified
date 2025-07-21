// /static/js/controllers/lesson-plan/modules/feedback-manager.js
// Refactor from file chính lesson-plan-ui.js (14-May)

export class FeedbackManager {
    constructor() {
        // Khởi tạo trạng thái
        this.setupCompleted = false;
        this.retryAttempts = 0;
    }

    // Di chuyển phương thức addFeedbackForm từ dòng 2084-2180
    addFeedbackForm(contentElement, topic, tabType) {
        if (!contentElement) {
            console.warn('Không tìm thấy contentElement khi thêm form phản hồi');
            return;
        }
        
        // XÓA TẤT CẢ form feedback cũ để tránh trùng lặp
        const existingFeedbacks = contentElement.querySelectorAll('.feedback-section, .feedback-container, .teacher-feedback');
        if (existingFeedbacks.length > 0) {
            existingFeedbacks.forEach(form => form.remove());
        }
        
        // Tạo container cho feedback - SỬ DỤNG KIỂU DÁNG GIỐNG GRAMMAR
        const feedbackSection = document.createElement('div');
        feedbackSection.className = 'feedback-section';
        feedbackSection.style.marginTop = '30px';
        feedbackSection.style.backgroundColor = '#f9f9f9';
        feedbackSection.style.borderRadius = '8px';
        feedbackSection.style.padding = '15px 20px';
        feedbackSection.style.border = '1px solid #eee';
        
        // Tạo HTML cho form giống hệt grammar - ĐẢM BẢO STARS VÀ TEXTAREA ĐÚNG ĐỊNH DẠNG
        feedbackSection.innerHTML = `
            <div class="feedback-header">
                <h4>📝 Phản hồi của giáo viên</h4>
                <p class="feedback-subtitle">Đánh giá nội dung để giúp chúng tôi cải thiện</p>
            </div>
            
            <div class="feedback-rating">
                <p>Mức độ hữu ích:</p>
                <div class="star-rating">
                    <span class="star" data-rating="1">★</span>
                    <span class="star" data-rating="2">★</span>
                    <span class="star" data-rating="3">★</span>
                    <span class="star" data-rating="4">★</span>
                    <span class="star" data-rating="5">★</span>
                </div>
                <span class="rating-text">Chưa đánh giá</span>
            </div>
            
            <div class="feedback-comment">
                <textarea placeholder="Ý kiến của bạn về nội dung này..." rows="3" style="width: 100%; resize: none; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
            </div>
            
            <div class="feedback-actions">
                <button class="feedback-submit-btn" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500; margin-top: 10px;">Gửi phản hồi</button>
            </div>
        `;
        
        // Thêm vào container được chỉ định
        contentElement.appendChild(feedbackSection);
        
        // Thêm CSS cho sao đánh giá - ĐẢM BẢO MÀU SẮC ĐÚNG
        const stars = feedbackSection.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.color = '#ccc';
            star.style.cursor = 'pointer';
            star.style.fontSize = '24px';
            star.style.transition = 'color 0.2s ease';
            star.style.display = 'inline-block';
            star.style.margin = '0 3px';
        });
        
        // Thêm sự kiện cho sao đánh giá
        let selectedRating = 0;
        const ratingText = feedbackSection.querySelector('.rating-text');
        
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = '#ccc';
                    }
                });
            });
            
            star.addEventListener('mouseout', () => {
                stars.forEach((s, index) => {
                    if (index < selectedRating) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = '#ccc';
                    }
                });
            });
            
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-rating'));
                
                stars.forEach((s, index) => {
                    if (index < selectedRating) {
                        s.style.color = '#FFD700';
                    } else {
                        s.style.color = '#ccc';
                    }
                });
                
                // Cập nhật text
                const ratingTexts = [
                    'Chưa đánh giá',
                    'Không hữu ích',
                    'Hơi hữu ích',
                    'Khá hữu ích',
                    'Hữu ích',
                    'Rất hữu ích'
                ];
                ratingText.textContent = ratingTexts[selectedRating];
            });
        });
        
        // Thêm sự kiện cho nút gửi
        const submitBtn = feedbackSection.querySelector('.feedback-submit-btn');
        const textarea = feedbackSection.querySelector('textarea');
        
        submitBtn.addEventListener('click', () => {
            if (selectedRating === 0) {
                alert('Vui lòng chọn mức độ đánh giá');
                return;
            }
            
            const comment = textarea.value.trim();
            
            // Sử dụng feedbackManager để lưu nhưng giữ UI tự tạo
            if (window.feedbackManager) {
                try {
                    window.feedbackManager.init(topic, tabType);
                    window.feedbackManager.saveFeedback(selectedRating, comment);
                    
                    // Hiển thị thông báo thành công
                    const thankYouMessage = document.createElement('div');
                    thankYouMessage.className = 'feedback-thank-you';
                    thankYouMessage.innerHTML = `
                        <p style="color: #4CAF50; font-weight: 500;"><i class="fas fa-check-circle"></i> Cảm ơn phản hồi của bạn!</p>
                    `;
                    
                    // Thay thế form bằng thông báo
                    feedbackSection.innerHTML = '';
                    feedbackSection.appendChild(thankYouMessage);
                    
                    // Tự động ẩn sau 3 giây
                    setTimeout(() => {
                        feedbackSection.style.display = 'none';
                    }, 3000);
                    
                } catch (error) {
                    console.error('Lỗi khi gửi phản hồi:', error);
                    alert('Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại sau.');
                }
            } else {
                console.warn('FeedbackManager không tồn tại');
                alert('Không thể gửi phản hồi. Vui lòng thử lại sau.');
            }
        });
    }

    // Di chuyển phương thức handleFeedbackSubmit từ dòng 2182-2251
    handleFeedbackSubmit(submitBtn, statusElement, textarea, topic, tabType, rating, comment) {
        // Kiểm tra xem có đủ dữ liệu không
        if (!rating || rating < 1) {
            statusElement.style.display = 'block';
            statusElement.style.color = '#f44336';
            statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Vui lòng đánh giá số sao';
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
            return;
        }
        
        console.log(`Gửi phản hồi: ${rating} sao, chủ đề: ${topic}, loại: ${tabType}, nội dung: ${comment}`);
        
        // Hiển thị trạng thái đang xử lý
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        submitBtn.disabled = true;
        
        // Chuẩn bị dữ liệu feedback theo định dạng chung
        const feedbackData = {
            id: `lesson_feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'lesson_plan',
            subtype: tabType || 'main',
            topic: topic || 'Giáo án',
            rating: parseInt(rating),
            comment: comment || '',
            timestamp: new Date().toISOString(),
            language: document.documentElement.lang || 'vi'
        };
        
        // THAY ĐỔI: Chỉ sử dụng FeedbackManager để lưu dữ liệu
        if (window.feedbackManager && window.feedbackManager.saveFeedback) {
            try {
                // Sử dụng FeedbackManager để lưu feedback
                window.feedbackManager.saveFeedback(rating, comment);
                console.log('✅ Đã gửi qua FeedbackManager');
                
                // Phát sự kiện để thông báo cho các module khác
                const feedbackEvent = new CustomEvent('feedbackSubmitted', { 
                    detail: feedbackData 
                });
                document.dispatchEvent(feedbackEvent);
                
                // Hiển thị thông báo thành công
                statusElement.style.display = 'block';
                statusElement.style.color = '#4CAF50';
                statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Phản hồi của bạn đã được gửi thành công!';
                
                // Vô hiệu hóa form sau khi gửi
                textarea.disabled = true;
                textarea.style.backgroundColor = '#f5f5f5';
                
                // Cập nhật nút
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Đã gửi';
                submitBtn.style.backgroundColor = '#888';
                
                // Lưu trạng thái đã gửi
                const feedbackSection = submitBtn.closest('.feedback-section');
                if (feedbackSection) {
                    feedbackSection.dataset.submitted = 'true';
                }
            } catch (error) {
                console.error('Lỗi khi gửi phản hồi:', error);
                
                // Hiển thị thông báo lỗi
                statusElement.style.display = 'block';
                statusElement.style.color = '#f44336';
                statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Có lỗi xảy ra, vui lòng thử lại sau';
                
                // Khôi phục nút
                submitBtn.innerHTML = 'Gửi phản hồi';
                submitBtn.disabled = false;
            }
        } else {
            console.error('FeedbackManager không khả dụng');
            
            // Hiển thị thông báo lỗi
            statusElement.style.display = 'block';
            statusElement.style.color = '#f44336';
            statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Không thể gửi phản hồi, vui lòng thử lại sau';
            
            // Khôi phục nút
            submitBtn.innerHTML = 'Gửi phản hồi';
            submitBtn.disabled = false;
        }
    }

    // Di chuyển phương thức setupRatingStars từ dòng 2253-2265
    setupRatingStars() {
        try {
            console.log('Đang thiết lập sao đánh giá...');
            
            // Tìm hoặc tạo container sao đánh giá
            let starContainers = [];
            
            // Tìm kiếm với selector đúng - CẢ feedback-stars VÀ star-rating
            const possibleSelectors = ['.feedback-stars', '.star-rating', '.feedback-rating .star-rating'];
            
            // Thử từng selector
            for (const selector of possibleSelectors) {
                const containers = document.querySelectorAll(selector);
                if (containers.length > 0) {
                    console.log(`Tìm thấy ${containers.length} container sao với selector ${selector}`);
                    containers.forEach(container => starContainers.push(container));
                }
            }
            
            // Nếu không tìm thấy, tìm trong các tab output
            if (starContainers.length === 0) {
                const outputAreas = [
                    document.getElementById('main-output'),
                    document.getElementById('supplementary-output')
                ];
                
                outputAreas.forEach(area => {
                    if (area) {
                        // Tìm trong tất cả các feedback section
                        const feedbackSections = area.querySelectorAll('.feedback-section');
                        
                        feedbackSections.forEach(section => {
                            const starRating = section.querySelector('.star-rating');
                            if (starRating) {
                                console.log(`Tìm thấy star-rating trong feedback-section`);
                                starContainers.push(starRating);
                            }
                        });
                    }
                });
            }
            
            // Nếu vẫn không tìm thấy, tạo mới container
            if (starContainers.length === 0) {
                console.log('Không tìm thấy container sao, đang tạo mới...');
                
                // Tìm các feedback section đã tồn tại nhưng không có star-rating
                const feedbackSections = document.querySelectorAll('.feedback-section');
                
                if (feedbackSections.length > 0) {
                    // Tạo và thêm star-rating vào feedback section
                    feedbackSections.forEach(section => {
                        if (!section.querySelector('.star-rating')) {
                            const starRatingDiv = document.createElement('div');
                            starRatingDiv.className = 'star-rating';
                            starRatingDiv.innerHTML = `
                                <span class="star" data-rating="1">★</span>
                                <span class="star" data-rating="2">★</span>
                                <span class="star" data-rating="3">★</span>
                                <span class="star" data-rating="4">★</span>
                                <span class="star" data-rating="5">★</span>
                            `;
                            
                            // Tìm vị trí thích hợp để chèn
                            const feedbackHeader = section.querySelector('.feedback-header');
                            if (feedbackHeader) {
                                section.insertBefore(starRatingDiv, feedbackHeader.nextSibling);
                            } else {
                                section.appendChild(starRatingDiv);
                            }
                            
                            console.log('Đã tạo thành công container sao mới');
                            starContainers.push(starRatingDiv);
                        }
                    });
                } else {
                    // Không tìm thấy feedback section, tìm tab output hiện tại để thêm vào
                    const currentOutput = document.querySelector('.tab-content.active');
                    
                    if (currentOutput) {
                        // Tạo toàn bộ feedback section mới
                        const newFeedbackSection = document.createElement('div');
                        newFeedbackSection.className = 'feedback-section';
                        newFeedbackSection.innerHTML = `
                            <div class="feedback-header">
                                <h4>📝 Phản hồi của giáo viên</h4>
                                <p class="feedback-subtitle">Đánh giá nội dung để giúp chúng tôi cải thiện</p>
                            </div>
                            
                            <div class="feedback-rating">
                                <p>Mức độ hữu ích:</p>
                                <div class="star-rating">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                                <span class="rating-text">Chưa đánh giá</span>
                            </div>
                            
                            <div class="feedback-comment">
                                <textarea placeholder="Ý kiến của bạn về nội dung này..." rows="3"></textarea>
                            </div>
                            
                            <div class="feedback-actions">
                                <button class="feedback-submit-btn">Gửi phản hồi</button>
                            </div>
                        `;
                        
                        // Thêm vào output hiện tại
                        currentOutput.appendChild(newFeedbackSection);
                        
                        // Lấy container sao từ section mới
                        const starRating = newFeedbackSection.querySelector('.star-rating');
                        if (starRating) {
                            console.log('Đã tạo thành công container sao mới trong section mới');
                            starContainers.push(starRating);
                        }
                    } else {
                        console.warn('Không tìm thấy tab output hiện tại để thêm feedback');
                        this.retryRatingSetup(2); // Thử lại 2 lần
                        return;
                    }
                }
            }
            
            if (starContainers.length === 0) {
                console.warn('Không thể tìm hoặc tạo container sao');
                this.retryRatingSetup(2); // Thử lại 2 lần
                return;
            }
            
            console.log(`Xử lý ${starContainers.length} container sao`);
            this.processStarContainers(starContainers);
            this.setupCompleted = true;
        } catch (error) {
            console.error('Lỗi khi thiết lập sao đánh giá:', error);
            // Không retry trong trường hợp lỗi để tránh vòng lặp vô tận
        }
    }
    
    // Di chuyển phương thức retryRatingSetup từ dòng 2267-2289 
    retryRatingSetup(maxRetries = 3) {
        this.retryCount = this.retryCount || 0;
        if (this.retryCount < maxRetries) {
            this.retryCount++;
            console.log(`Thử lại lần ${this.retryCount}...`);
            setTimeout(() => {
                this.setupRatingStars();
            }, 1000);
        } else {
            console.log(`Đã hết số lần thử thiết lập sao đánh giá`);
            this.retryCount = 0; // Reset để lần sau có thể thử lại
        }
    }
    
    // Di chuyển phương thức processStarContainers từ dòng 2291-2354
    processStarContainers(containers) {
        containers.forEach(container => {
            const stars = container.querySelectorAll('.star');
            
            if (stars.length === 0) {
                console.warn('Không tìm thấy sao trong container!');
                return;
            }
            
            console.log(`Container có ${stars.length} sao`);
            
            // Xóa tất cả các lớp và sự kiện cũ
            stars.forEach(star => {
                star.classList.remove('selected');
                
                // Thiết lập style trực tiếp - ĐẢM BẢO MẠNH HƠN
                star.style.color = 'transparent';
                star.style.webkitTextStroke = '1px #aaa';
                star.style.cursor = 'pointer';
                star.style.fontSize = '24px';
                star.style.transition = 'all 0.2s ease';
                star.style.display = 'inline-block';
                star.style.margin = '0 3px';
                
                // Clone và thay thế để xóa tất cả event listeners cũ
                const newStar = star.cloneNode(true);
                star.parentNode.replaceChild(newStar, star);
            });
            
            // Lấy lại danh sách stars sau khi clone
            const refreshedStars = container.querySelectorAll('.star');
            
            // Thêm sự kiện mới
            refreshedStars.forEach((star, index) => {
                // Hover effect
                star.addEventListener('mouseenter', () => {
                    for (let i = 0; i <= index; i++) {
                        refreshedStars[i].style.color = '#FFD700';
                        refreshedStars[i].style.webkitTextStroke = '1px #e0b000';
                        refreshedStars[i].style.textShadow = '0 0 5px rgba(255, 215, 0, 0.5)';
                    }
                });
                
                star.addEventListener('mouseleave', () => {
                    refreshedStars.forEach((s, i) => {
                        if (!s.classList.contains('selected')) {
                            s.style.color = 'transparent';
                            s.style.webkitTextStroke = '1px #aaa';
                            s.style.textShadow = 'none';
                        }
                    });
                });
                
                // Click event
                star.addEventListener('click', () => {
                    refreshedStars.forEach(s => {
                        s.classList.remove('selected');
                        s.style.color = 'transparent';
                        s.style.webkitTextStroke = '1px #aaa';
                        s.style.textShadow = 'none';
                    });
                    
                    for (let i = 0; i <= index; i++) {
                        refreshedStars[i].classList.add('selected');
                        refreshedStars[i].style.color = '#FFD700';
                        refreshedStars[i].style.webkitTextStroke = '1px #e0b000';
                        refreshedStars[i].style.textShadow = '0 0 5px rgba(255, 215, 0, 0.5)';
                    }
                    
                    // Lưu giá trị đánh giá
                    container.dataset.rating = index + 1;
                });
            });
        });
    }

    // Phương thức mới để kiểm tra xem setup đã hoàn thành chưa
    isSetupCompleted() {
        return this.setupCompleted;
    }

    // Phương thức mới để khởi tạo feedback manager (tương thích với window.feedbackManager)
    init(topic, tabType) {
        this.topic = topic || 'Giáo án';
        this.tabType = tabType || 'main';
        console.log(`FeedbackManager khởi tạo với chủ đề: ${this.topic}, loại: ${this.tabType}`);
    }

    // Phương thức mới để lưu feedback (tương thích với window.feedbackManager)
    saveFeedback(rating, comment) {
        // Lưu feedback vào localStorage để có thể xem lại sau
        try {
            const feedbackId = `lesson_feedback_${Date.now()}`;
            const feedbackData = {
                id: feedbackId,
                topic: this.topic,
                tabType: this.tabType,
                rating: parseInt(rating),
                comment: comment || '',
                timestamp: new Date().toISOString()
            };
            
            // Lấy danh sách feedback hiện có
            let feedbacks = JSON.parse(localStorage.getItem('bibi_feedbacks') || '[]');
            
            // Thêm feedback mới
            feedbacks.push(feedbackData);
            
            // Lưu lại
            localStorage.setItem('bibi_feedbacks', JSON.stringify(feedbacks));
            
            console.log('✅ Đã lưu phản hồi:', feedbackData);
            
            // Phát sự kiện feedback đã được lưu
            const feedbackEvent = new CustomEvent('feedbackSaved', { 
                detail: feedbackData 
            });
            document.dispatchEvent(feedbackEvent);
            
            return true;
        } catch (error) {
            console.error('Lỗi khi lưu phản hồi:', error);
            throw error;
        }
    }
}