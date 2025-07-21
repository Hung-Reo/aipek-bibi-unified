// feedback.js - Module quản lý feedback
export class FeedbackManager {
    constructor() {
      this.storageKey = 'bibi_feedback_data';
      this.currentTopic = '';
      this.currentTabType = '';
    }
  
    // Khởi tạo manager với thông tin hiện tại
    init(topic, tabType) {
      this.currentTopic = topic;
      this.currentTabType = tabType;
      return this;
    }
  
    // Tạo và hiển thị form feedback
    renderFeedbackForm(containerElement) {
      if (!containerElement) return;
  
      // Tạo container cho form
      const feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'feedback-container';
      
      // Tạo HTML cho form
      feedbackContainer.innerHTML = `
        <div class="feedback-header">
          <h4>📝 Phản hồi của giáo viên</h4>
          <p class="feedback-subtitle">Đánh giá nội dung để giúp chúng tôi cải thiện</p>
        </div>
        
        <div class="feedback-rating">
          <p>Mức độ hữu ích:</p>
          <div class="star-rating">
            <span class="star" data-rating="1">&#9733;</span>
            <span class="star" data-rating="2">&#9733;</span>
            <span class="star" data-rating="3">&#9733;</span>
            <span class="star" data-rating="4">&#9733;</span>
            <span class="star" data-rating="5">&#9733;</span>
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
      
      // Thêm vào container được chỉ định
      containerElement.appendChild(feedbackContainer);
      
      // Thêm event listeners
      this._addEventListeners(feedbackContainer);
      
      return feedbackContainer;
    }
    
    // Thêm các sự kiện cho form
    _addEventListeners(container) {
      if (!container) return;
      
      // Xử lý đánh giá sao
      const stars = container.querySelectorAll('.star');
      const ratingText = container.querySelector('.rating-text');
      let selectedRating = 0;
      
      stars.forEach(star => {
        star.addEventListener('mouseover', () => {
          const rating = parseInt(star.getAttribute('data-rating'));
          this._highlightStars(stars, rating);
        });
        
        star.addEventListener('mouseout', () => {
          this._highlightStars(stars, selectedRating);
        });
        
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.getAttribute('data-rating'));
          this._highlightStars(stars, selectedRating);
          
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
      
      // Xử lý nút gửi
      const submitButton = container.querySelector('.feedback-submit-btn');
      const commentTextarea = container.querySelector('textarea');
      
      submitButton.addEventListener('click', () => {
        const comment = commentTextarea.value.trim();
        
        if (selectedRating === 0) {
          alert('Vui lòng chọn mức độ đánh giá');
          return;
        }
        
        this.saveFeedback(selectedRating, comment);
        
        // Reset form và hiển thị thông báo
        this._resetForm(container);
        this._showThankYouMessage(container);
      });
    }
    
    // Đánh dấu sao khi hover/click
    _highlightStars(stars, rating) {
      stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
          star.classList.add('selected');
        } else {
          star.classList.remove('selected');
        }
      });
    }
    
    // Reset form sau khi gửi
    _resetForm(container) {
      container.querySelector('textarea').value = '';
      this._highlightStars(container.querySelectorAll('.star'), 0);
      container.querySelector('.rating-text').textContent = 'Chưa đánh giá';
    }
    
    // Hiển thị thông báo cảm ơn
    _showThankYouMessage(container) {
      const thankYouMessage = document.createElement('div');
      thankYouMessage.className = 'feedback-thank-you';
      thankYouMessage.innerHTML = `
        <p><i class="fas fa-check-circle"></i> Cảm ơn phản hồi của bạn!</p>
      `;
      
      // Thay thế form bằng thông báo
      container.innerHTML = '';
      container.appendChild(thankYouMessage);
      
      // Sau 3 giây, tự động ẩn phần feedback
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 3000);
    }
    
    // Lưu feedback vào localStorage
    saveFeedback(rating, comment) {
      // Tạo đối tượng feedback mới
      const feedback = {
        id: Date.now().toString(),
        topic: this.currentTopic,
        tabType: this.currentTabType,
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString(),
        language: document.documentElement.lang || 'vi'
      };
      
      // Lấy dữ liệu hiện có
      let feedbacks = this.getAllFeedbacks();
      
      // Thêm feedback mới
      feedbacks.push(feedback);
      
      // Lưu lại vào localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(feedbacks));
      
      console.log(`✅ Đã lưu feedback: ${rating} sao, chủ đề: ${this.currentTopic}`);
      
      return feedback;
    }
    
    // Lấy tất cả feedback từ localStorage
    getAllFeedbacks() {
      const storedData = localStorage.getItem(this.storageKey);
      return storedData ? JSON.parse(storedData) : [];
    }
    
    // Lấy feedback theo chủ đề
    getFeedbacksByTopic(topic) {
      const feedbacks = this.getAllFeedbacks();
      return feedbacks.filter(item => item.topic === topic);
    }
    
    // Lấy feedback theo loại tab
    getFeedbacksByTabType(tabType) {
      const feedbacks = this.getAllFeedbacks();
      return feedbacks.filter(item => item.tabType === tabType);
    }
    
    // Xóa feedback theo ID
    deleteFeedback(id) {
      let feedbacks = this.getAllFeedbacks();
      feedbacks = feedbacks.filter(item => item.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(feedbacks));
    }
    
    // Xuất tất cả feedback sang CSV
    exportToCSV() {
      const feedbacks = this.getAllFeedbacks();
      
      if (feedbacks.length === 0) {
        alert('Không có dữ liệu feedback để xuất');
        return;
      }
      
      // Tạo header CSV
      const headers = ['ID', 'Chủ đề', 'Loại tab', 'Đánh giá', 'Nội dung', 'Thời gian', 'Ngôn ngữ'];
      
      // Tạo dữ liệu CSV
      let csvContent = headers.join(',') + '\n';
      
      feedbacks.forEach(item => {
        // Xử lý comment để tránh lỗi CSV (thay thế dấu phẩy và xuống dòng)
        const safeComment = item.comment ? `"${item.comment.replace(/"/g, '""')}"` : '';
        
        const row = [
          item.id,
          item.topic,
          item.tabType,
          item.rating,
          safeComment,
          item.timestamp,
          item.language
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      // Tạo blob và download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bibi_feedback_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }