// Module xử lý giao diện user
export class GrammarUI {
  constructor(outputAreaId, loadingIndicatorId, uiMode = 'modern') {
    this.outputArea = document.getElementById(outputAreaId);
    this.loadingIndicator = document.getElementById(loadingIndicatorId);
    this.isLoading = false;
    this.startLoadingTime = 0;
    this.uiMode = uiMode;
    
    console.log(`🖌️ GrammarUI khởi tạo với chế độ: ${this.uiMode}`);
  }
  
  // Hiển thị loading placeholder thông minh
  showLoading() {
    this.isLoading = true;
    this.startLoadingTime = Date.now();
    
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
    
    // Chọn template placeholder dựa trên chế độ UI
    let placeholderTemplate;
    
    if (this.uiMode === 'modern') {
      placeholderTemplate = `
        <div class="grammar-card">
          <div class="loading-placeholder placeholder-title"></div>
          
          <h3>Đang chuẩn bị nội dung...</h3>
          
          <div class="loading-placeholder placeholder-paragraph" style="width: 95%"></div>
          <div class="loading-placeholder placeholder-paragraph" style="width: 88%"></div>
          
          <h4 style="margin-top: 20px;">Cấu trúc ngữ pháp</h4>
          <div class="loading-placeholder placeholder-paragraph" style="width: 90%"></div>
          <div class="loading-placeholder placeholder-paragraph" style="width: 75%"></div>
          
          <h4 style="margin-top: 20px;">Ví dụ minh họa</h4>
          <div class="placeholder-list">
            <div class="loading-placeholder placeholder-list-item" style="width: 85%"></div>
            <div class="loading-placeholder placeholder-list-item" style="width: 90%"></div>
            <div class="loading-placeholder placeholder-list-item" style="width: 80%"></div>
          </div>
          
          <div class="loading-placeholder placeholder-paragraph" style="width: 60%; margin-top: 20px;"></div>
        </div>
      `;
    } else {
      // Template cho giao diện classic
      placeholderTemplate = `
        <div class="grammar-card classic-style">
          <div class="loading-placeholder placeholder-title"></div>
          
          <h3>Đang chuẩn bị nội dung...</h3>
          
          <div class="loading-placeholder placeholder-paragraph" style="width: 95%"></div>
          <div class="loading-placeholder placeholder-paragraph" style="width: 88%"></div>
          
          <h4 style="margin-top: 20px;">Cấu trúc ngữ pháp</h4>
          <div class="loading-placeholder placeholder-paragraph" style="width: 90%"></div>
          <div class="loading-placeholder placeholder-paragraph" style="width: 75%"></div>
        </div>
      `;
    }
    
    this.outputArea.innerHTML = placeholderTemplate;
  }

  // Ẩn trạng thái loading
  hideLoading() {
    this.isLoading = false;
    const loadingTime = (Date.now() - this.startLoadingTime) / 1000;
    console.log(`Thời gian phản hồi: ${loadingTime.toFixed(2)}s`);
    
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  // Định dạng nội dung Markdown sang HTML
  formatContent(content, options = {}) {
    if (!content) return '';
    
    // Xác định ngôn ngữ, mặc định là tiếng Việt
    const language = options.language || 'vi';
    
    // Định dạng cơ bản từ Markdown sang HTML
    let formatted = content
      // Headings
      .replace(/###\s+(.*?)$/gm, '<h3>$1</h3>') 
      .replace(/##\s+(.*?)$/gm, '<h2>$1</h2>')
      .replace(/#\s+(.*?)$/gm, '<h1>$1</h1>')
      
      // Lists
      .replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>')
      .replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li>$2</li>') // Ordered lists
      .replace(/(<li>.*?<\/li>(\n|$))+/g, '<ul>$&</ul>')
      
      // Formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      
      // Tables if needed
      .replace(/\|\s*(.*?)\s*\|/g, '<td>$1</td>')
      .replace(/(<td>.*?<\/td>)+/g, '<tr>$&</tr>')
      .replace(/(<tr>.*?<\/tr>)+/g, '<table>$&</table>')
      
      // Paragraphs and line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already HTML
    if (!formatted.startsWith('<')) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    // Xử lý định dạng song ngữ (khi language=both)
    if (language === 'both' && content.includes('(') && content.includes(')')) {
      // Tìm các phần trong ngoặc - thường là phần tiếng Anh trong nội dung song ngữ
      formatted = formatted.replace(/\(([^()]+)\)/g, function(match, p1) {
        return `<span class="en-content">(${p1})</span>`;
      });
    }
    
    // Thêm các lớp CSS dựa vào chế độ UI
    if (this.uiMode === 'modern') {
      // Thêm class hiện đại cho các thành phần
      formatted = formatted
        .replace(/<h1>/g, '<h1 class="modern-title-large">')
        .replace(/<h2>/g, '<h2 class="modern-title">')
        .replace(/<h3>/g, '<h3 class="modern-subtitle">')
        .replace(/<ul>/g, '<ul class="modern-list">')
        .replace(/<ol>/g, '<ol class="modern-list">')
        .replace(/<p>/g, '<p class="modern-paragraph">')
        .replace(/<table>/g, '<table class="modern-table">')
        .replace(/<code>/g, '<code class="modern-code">');
    }
    
    return formatted;
  }

  // Hiển thị kết quả
  showResult(title, content, promptType) {
    const formattedContent = this.formatContent(content);
    
    // Chọn template dựa vào chế độ UI
    let resultTemplate;
    
    if (this.uiMode === 'modern') {
      resultTemplate = `
        <div class="grammar-card">
          <h3 data-action="${promptType}">${title}</h3>
          <div class="grammar-content">${formattedContent}</div>
        </div>
      `;
    } else {
      // Template cho giao diện classic
      resultTemplate = `
        <div class="grammar-card classic-style">
          <h3 data-action="${promptType}">${title}</h3>
          <div class="grammar-content classic-style">${formattedContent}</div>
        </div>
      `;
    }
    
    this.outputArea.innerHTML = resultTemplate;
  }

  // Hiển thị lỗi
  showError(error) {
    this.outputArea.innerHTML = `
      <div class="error">
        <p>Có lỗi xảy ra. Vui lòng thử lại.</p>
        <p class="error-details">${error.message || 'Không có thông tin chi tiết'}</p>
      </div>`;
  }
  
  // Thêm vào class GrammarUI trong grammar-ui.js
  initStreamingUI(title, promptType, outputAreaId = null) {
    // Chọn template dựa vào chế độ UI
    let streamingTemplate;
    
    // Sử dụng outputAreaId được cung cấp hoặc mặc định
    const outputArea = outputAreaId ? document.getElementById(outputAreaId) : this.outputArea;
    if (!outputArea) {
      console.error(`Không tìm thấy khu vực output: ${outputAreaId}`);
      return null;
    }
    
    if (this.uiMode === 'modern') {
      streamingTemplate = `
        <div class="grammar-card">
          <h3 data-action="${promptType}">${title}</h3>
          <div id="streaming-content-${promptType}" class="grammar-content streaming-content"></div>
        </div>
      `;
    } else {
      // Template cho giao diện classic
      streamingTemplate = `
        <div class="grammar-card classic-style">
          <h3 data-action="${promptType}">${title}</h3>
          <div id="streaming-content-${promptType}" class="grammar-content streaming-content classic-style"></div>
        </div>
      `;
    }
    
    outputArea.innerHTML = streamingTemplate;
    return document.getElementById(`streaming-content-${promptType}`);
  }

  // Phương thức cập nhật nội dung streaming với hỗ trợ RAG
  updateStreamingContent(contentElement, newContent, fullContent, ragInfo = null) {
    // Định dạng Markdown ngay khi nhận được nội dung
    const formattedContent = this.formatContent(fullContent);
    contentElement.innerHTML = formattedContent;
    
    // THÊM MỚI: Xử lý hiển thị RAG sớm nếu có thông tin
    if (ragInfo && ragInfo.usedRAG === true && ragInfo.sources && ragInfo.sources.length > 0) {
      // Kiểm tra xem đã có hiển thị RAG chưa
      const hasRagBadge = contentElement.querySelector('.rag-badge');
      const hasRagSources = contentElement.querySelector('.rag-sources, .rag-sources-simple, .early-rag-notice');
      
      // Thêm badge RAG sớm nếu chưa có
      if (!hasRagBadge) {
        const h3Element = contentElement.closest('.grammar-card')?.querySelector('h3');
        if (h3Element && !h3Element.querySelector('.rag-badge')) {
          const badgeHtml = `<span class="rag-badge rag-success tooltip">📚 RAG<span class="tooltip-text">Nội dung được trích từ sách giáo khoa thông qua hệ thống RAG</span></span>`;
          h3Element.innerHTML += ' ' + badgeHtml;
          console.log('✅ Đã thêm badge RAG sớm trong quá trình streaming');
        }
      }
      
      // Hiển thị thông báo nguồn RAG sớm nếu chưa có
      if (!hasRagSources) {
        const ragNotice = document.createElement('div');
        ragNotice.className = 'early-rag-notice';
        ragNotice.innerHTML = `
          <div style="margin: 15px 0; padding: 8px 12px; background-color: rgba(76, 175, 80, 0.1); 
                      border-left: 4px solid #4CAF50; border-radius: 4px;">
            <p><strong>📚 Đã tìm thấy ${ragInfo.sources.length} tài liệu liên quan</strong></p>
          </div>
        `;
        contentElement.appendChild(ragNotice);
        console.log('✅ Đã thêm thông báo RAG sớm trong quá trình streaming');
      }
    }
    
    // Tự động cuộn xuống
    contentElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  // Phương thức hiển thị nguồn RAG
  renderRAGSources(ragInfo, container) {
    if (!ragInfo || !ragInfo.usedRAG || !ragInfo.sources || ragInfo.sources.length === 0) {
      return;
    }
    
    // Tạo phần hiển thị nguồn RAG
    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'rag-sources';
    
    // Tạo tiêu đề
    let sourcesHTML = '<h4>🔍 Nguồn tham khảo:</h4>';
    
    // Nhóm các nguồn theo namespace
    const namespaceSources = {};
    
    // Icon cho từng loại namespace
    const namespaceIcons = {
      'Sách giáo khoa': '📚',
      'Chương trình giảng dạy': '👨‍🏫',
      'Ngữ pháp tiếng Anh': '📝',
      'Nguồn bổ sung': '📋'
    };
    
    // Nhóm nguồn theo namespace
    ragInfo.sources.forEach((source) => {
      // Trích xuất tên namespace từ nguồn (format "Namespace - Content")
      const parts = source.split(' - ');
      if (parts.length >= 2) {
        const namespace = parts[0].trim();
        const content = parts.slice(1).join(' - ').trim();
        
        if (!namespaceSources[namespace]) {
          namespaceSources[namespace] = [];
        }
        namespaceSources[namespace].push(content);
      } else {
        // Nếu không có format chuẩn, hiển thị nguyên nguồn
        if (!namespaceSources['Khác']) {
          namespaceSources['Khác'] = [];
        }
        namespaceSources['Khác'].push(source);
      }
    });
    
    // Tạo HTML cho từng nhóm namespace
    sourcesHTML += '<div class="source-groups">';
    
    for (const namespace in namespaceSources) {
      const sources = namespaceSources[namespace];
      
      // Chọn icon phù hợp
      const icon = namespaceIcons[namespace] || '📄';
      
      sourcesHTML += `
        <div class="source-group">
          <h5 class="source-group-title">
            <span class="source-group-icon">${icon}</span> ${namespace}
          </h5>
          <div class="source-group-items">
      `;
      
      // Thêm từng nguồn trong nhóm
      sources.forEach((source, index) => {
        sourcesHTML += `<div class="source-item" data-index="${index + 1}">${source}</div>`;
      });
      
      sourcesHTML += `
          </div>
        </div>
      `;
    }
    
    sourcesHTML += '</div>';
    sourcesContainer.innerHTML = sourcesHTML;
    
    // Thêm vào container
    container.appendChild(sourcesContainer);
    
    // Thêm sự kiện hiển thị tooltip cho nguồn
    const sourceItems = sourcesContainer.querySelectorAll('.source-item');
    sourceItems.forEach(item => {
      const sourceName = item.closest('.source-group')?.querySelector('.source-group-title')?.textContent.trim() || 'Nguồn';
      item.addEventListener('mouseover', () => {
        item.title = `Thông tin từ ${sourceName}`;
      });
    });
    
    return sourcesContainer;
  }

  // Thêm phương thức hoàn tất streaming
  finalizeStreamingContent(contentElement, fullContent, ragInfo = null) {
    if (!contentElement) return;
    
    // Định dạng lần cuối
    let formattedContent = this.formatContent(fullContent);

    // Khởi tạo biến quan trọng
    let badgeType = 'disabled'; // Giá trị mặc định
    let badgeHtml = '';
    let tooltipText = '';
    
    // Xử lý ragInfo ngay từ đầu để đảm bảo nhất quán
    if (ragInfo) {
      // Kiểm tra và khởi tạo ragInfo.sources nếu cần
      if (!ragInfo.sources || !Array.isArray(ragInfo.sources)) {
        ragInfo.sources = [];
        console.log('⚠️ ragInfo.sources không hợp lệ, khởi tạo mảng rỗng');
      }

      // LOGIC ĐƠN GIẢN VÀ RÕ RÀNG:
      // 1. Nếu có sources, đặt usedRAG = true và badgeType = 'success'
      // 2. Nếu usedRAG = true nhưng không có sources, vẫn đặt badgeType = 'success'
      // 3. Nếu đã cố gắng RAG nhưng không có kết quả, đặt badgeType = 'fallback'
      // 4. Mặc định là 'disabled'
      
      if (ragInfo.sources.length > 0) {
        // Có sources là điều kiện đủ để xác định usedRAG = true và badge = success
        ragInfo.usedRAG = true;
        badgeType = 'success';
        console.log('✅ Có sources, đặt usedRAG = true và badge = "success"');
      } else if (ragInfo.usedRAG === true) {
        // Nếu không có sources nhưng usedRAG = true, vẫn đặt badge = success
        badgeType = 'success';
        console.log('⚠️ usedRAG = true nhưng không có sources - vẫn đặt badge = "success"');
      } else if (ragInfo.attempted) {
        // Đã thử RAG nhưng không thành công
        badgeType = 'fallback';
        console.log('ℹ️ Đã thử dùng RAG nhưng không có kết quả - badge = "fallback"');
      } else {
        // Không sử dụng RAG
        badgeType = 'disabled';
        console.log('ℹ️ Không sử dụng RAG - badge = "disabled"');
      }

      // Đặt tooltip và badgeHtml dựa trên badgeType
      if (badgeType === 'success') {
        tooltipText = 'Nội dung được trích từ sách giáo khoa thông qua hệ thống RAG';
        badgeHtml = `<span class="rag-badge rag-success tooltip">📚 RAG<span class="tooltip-text">${tooltipText}</span></span>`;
      } else if (badgeType === 'fallback') {
        tooltipText = 'Nội dung được tạo bởi AI do không tìm thấy thông tin liên quan trong sách giáo khoa';
        badgeHtml = `<span class="rag-badge rag-fallback tooltip">🤖 AI<span class="tooltip-text">${tooltipText}</span></span>`;
      } else {
        tooltipText = 'Nội dung được tạo hoàn toàn bởi AI';
        badgeHtml = `<span class="rag-badge rag-disabled tooltip">🤖 AI<span class="tooltip-text">${tooltipText}</span></span>`;
      }
      
      // Lưu giá trị badgeType để sử dụng sau này
      this.currentBadgeType = badgeType;
      
      console.log(`🏷️ Đã xác định badge: type=${badgeType}, usedRAG=${ragInfo.usedRAG}, sourcesLength=${ragInfo.sources.length}`);
    }

    // Tìm thẻ h3 đầu tiên để thêm badge
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>/;
    const h3Match = formattedContent.match(h3Regex);

    // Thêm badge vào tiêu đề
    if (h3Match && badgeHtml) {
      console.log(`🏷️ Thêm badge "${badgeType}" vào tiêu đề`);
      formattedContent = formattedContent.replace(
        h3Regex, 
        `<h3${h3Match[0].substring(3, h3Match[0].indexOf('>'))}>${h3Match[1]} ${badgeHtml}</h3>`
      );
    }
    
    // PHẦN HIGHLIGHT NỘI DUNG
    if (ragInfo) {
      // Xác định rõ ràng điều kiện để highlight
      const shouldHighlight = badgeType === 'success';
      
      if (shouldHighlight) {
        try {
          // Đảm bảo usedRAG = true
          ragInfo.usedRAG = true;
          
          // Tạo thông báo RAG
          const sourcesText = ragInfo.sources.length > 1 
            ? `${ragInfo.sources.length} nguồn tài liệu`
            : (ragInfo.sources.length === 1 ? "1 nguồn tài liệu" : "tài liệu giáo khoa");
          
          const ragNotice = `
            <div class="rag-highlight" style="margin-bottom: 20px; padding: 10px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; border-radius: 4px;">
              <p><strong>📚 Nội dung dựa trên dữ liệu thực từ sách giáo khoa</strong></p>
              <p>Thông tin được trích xuất từ ${sourcesText}.</p>
            </div>
          `;
          
          // Chèn thông báo RAG sau tiêu đề h3 hoặc ở đầu nội dung
          if (formattedContent.includes('</h3>')) {
            const h3EndIndex = formattedContent.indexOf('</h3>') + 5;
            const before = formattedContent.substring(0, h3EndIndex);
            const after = formattedContent.substring(h3EndIndex);
            formattedContent = before + ragNotice + after;
            console.log("✅ Đã chèn thông báo RAG sau tiêu đề h3");
          } else {
            formattedContent = ragNotice + formattedContent;
            console.log("✅ Đã chèn thông báo RAG ở đầu nội dung");
          }
          
          // Đánh dấu các đoạn văn đầu tiên
          const paragraphs = [];
          const paragraphRegex = /<p[^>]*>((?!class="rag-highlight")[^<]*)<\/p>/g;
          let match;
          
          // Reset regex và thu thập các đoạn văn
          paragraphRegex.lastIndex = 0;
          while ((match = paragraphRegex.exec(formattedContent)) !== null) {
            if (match[1] && match[1].trim().length > 30) {
              paragraphs.push({
                index: match.index,
                fullMatch: match[0],
                content: match[1]
              });
            }
          }
          
          console.log(`🔍 Tìm thấy ${paragraphs.length} đoạn văn để đánh dấu`);
          
          // Đánh dấu 2 đoạn văn đầu tiên
          let markedCount = 0;
          for (let i = 0; i < Math.min(2, paragraphs.length); i++) {
            const para = paragraphs[i];
            const originalHTML = para.fullMatch;
            const highlightedHTML = `<p class="rag-highlight">${para.content}</p>`;
            
            const startIndex = formattedContent.indexOf(originalHTML);
            if (startIndex !== -1) {
              const before = formattedContent.substring(0, startIndex);
              const after = formattedContent.substring(startIndex + originalHTML.length);
              formattedContent = before + highlightedHTML + after;
              markedCount++;
            }
          }
          
          console.log(`✅ Đánh dấu ${markedCount} đoạn văn thành công`);
          
        } catch (error) {
          console.error('❌ Lỗi khi đánh dấu nội dung:', error);
          
          formattedContent += `
            <div class="content-source-summary">
              <p><span class="content-source-icon">📚</span> <em>Thông tin được tham khảo từ tài liệu giáo dục</em></p>
            </div>
          `;
        }
      } else {
        console.log('ℹ️ Không đánh dấu nội dung vì không đủ điều kiện highlight (badgeType ≠ success)');
      }
    }
    
    // Cập nhật nội dung với định dạng mới
    contentElement.innerHTML = formattedContent;
    
    // Thêm debugging chi tiết
    console.log('📊 DEBUG - RAG Info:', {
      usedRAG: ragInfo?.usedRAG,
      attempted: ragInfo?.attempted,
      sources: ragInfo?.sources?.length || 0,
      badgeType: this.currentBadgeType,
      badgeHTML: badgeHtml ? 'có' : 'không',
      h3Match: h3Match ? 'có' : 'không'
    });

    // Kiểm tra hiển thị sau khi đã render
    setTimeout(() => {
      const highlightedElements = contentElement.querySelectorAll('.rag-highlight, .content-rag, .content-mixed');
      console.log(`🔍 Số phần tử được đánh dấu: ${highlightedElements.length}`);
      
      const badge = contentElement.querySelector('.rag-badge');
      console.log(`🏷️ Badge: ${badge ? 'Có' : 'Không'}`);
      
      // Đảm bảo hiển thị đúng khi có kết quả RAG
      if (ragInfo?.usedRAG === true) {
        // Kiểm tra nhanh tình trạng hiển thị
        const badgeExists = !!badge;
        const badgeTypeCorrect = this.currentBadgeType === 'success';
        const badgeClassCorrect = badge && badge.className.includes('rag-success');
        
        console.log(`🔍 Kiểm tra hiển thị RAG: badgeExists=${badgeExists}, badgeType=${this.currentBadgeType}, highlightCount=${highlightedElements.length}, sources=${ragInfo.sources?.length || 0}`);
        
        // Sửa lỗi hiển thị nếu cần
        if (!badgeExists || !badgeTypeCorrect || !badgeClassCorrect || highlightedElements.length === 0) {
          console.warn(`⚠️ Cần khắc phục hiển thị: usedRAG = true, badgeExists = ${badgeExists}, badgeType = ${this.currentBadgeType}, highlightElements = ${highlightedElements.length}`);
          
          // Đảm bảo badge type đúng
          this.currentBadgeType = 'success';
          
          // Thêm badge nếu không có hoặc không đúng
          if (!badgeExists || !badgeClassCorrect) {
            if (badge) badge.remove();
            
            console.log('🔄 Thêm badge success khẩn cấp');
            const sourcesCount = ragInfo.sources?.length || 0;
            const emergencyBadge = `<div class="rag-badge rag-success" style="display:inline-block;margin:10px 0;padding:5px 10px;background:#4CAF50;color:white;border-radius:4px;">
              📚 Nội dung từ RAG (${sourcesCount} nguồn)
            </div>`;
            
            contentElement.insertAdjacentHTML('afterbegin', emergencyBadge);
          }
          
          // Thêm highlight nếu không có
          if (highlightedElements.length === 0) {
            console.log('🔄 Thêm highlight khẩn cấp');
            
            const sourcesCount = ragInfo.sources?.length || 0;
            const sourcesText = sourcesCount > 0 ? `từ ${sourcesCount} nguồn tài liệu` : "từ tài liệu giáo khoa";
            
            const emergencyHighlight = `<div class="rag-highlight" style="margin-bottom: 20px; padding: 10px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; border-radius: 4px;">
              <p><strong>📚 Nội dung dựa trên dữ liệu thực từ sách giáo khoa</strong></p>
              <p>Thông tin được trích xuất ${sourcesText}.</p>
            </div>`;
            
            // Thêm vào vị trí phù hợp
            if (contentElement.querySelector('.rag-badge')) {
              contentElement.querySelector('.rag-badge').insertAdjacentHTML('afterend', emergencyHighlight);
            } else {
              contentElement.insertAdjacentHTML('afterbegin', emergencyHighlight);
            }
          }
        } else {
          console.log('✅ Badge và highlight đã được hiển thị đúng');
        }
      }
    }, 100);

    // Thêm hiệu ứng hoàn thành và các nút hành động
    contentElement.classList.add('stream-complete');
    setTimeout(() => {
      contentElement.classList.remove('stream-complete');
      contentElement.classList.remove('streaming-content');
      
      // THÊM MỚI: Cảnh báo về nội dung AI
      const disclaimerElement = document.createElement('div');
      disclaimerElement.className = 'ai-disclaimer';
      disclaimerElement.innerHTML = `
        <div style="margin: 25px 0 15px; padding: 10px 15px; background-color: rgba(255, 193, 7, 0.1); 
                    border-left: 4px solid #FFC107; border-radius: 4px; font-size: 0.9em; color: #555;">
          <p><strong>⚠️ Lưu ý:</strong> Hệ thống được kết nối với OpenAI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.</p>
        </div>
      `;
      contentElement.appendChild(disclaimerElement);

      // Thêm nút hành động (phần này giữ nguyên)
      if (this.uiMode === 'modern') {
        if (!contentElement.querySelector('.action-buttons-container')) {
          const actionsContainer = document.createElement('div');
          actionsContainer.className = 'action-buttons-container';
          actionsContainer.innerHTML = `
            <button class="action-button export-word-btn" title="Xuất Word">
              <i class="fas fa-file-word"></i> Xuất Word
            </button>
            <button class="action-button export-pdf-btn" title="Xuất PDF">
              <i class="fas fa-file-pdf"></i> Xuất PDF
            </button>
          `;
          
          contentElement.appendChild(actionsContainer);
          
          const exportWordBtn = actionsContainer.querySelector('.export-word-btn');
          if (exportWordBtn) {
            exportWordBtn.addEventListener('click', () => {
              this.exportToWord(contentElement, fullContent);
            });
          }
          
          const exportPdfBtn = actionsContainer.querySelector('.export-pdf-btn');
          if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
              this.exportToPdf(contentElement);
            });
          }
          
          const chatBtn = actionsContainer.querySelector('.chat-btn');
          if (chatBtn) {
            chatBtn.addEventListener('click', () => {
              const followUpChat = document.getElementById('follow-up-chat');
              if (followUpChat) {
                followUpChat.style.display = 'block';
                const chatInput = followUpChat.querySelector('#chat-input');
                if (chatInput) chatInput.focus();
                
                const chatCount = followUpChat.querySelector('#chat-count');
                if (chatCount) {
                  const maxQuestions = 5;
                  chatCount.textContent = maxQuestions;
                }
              }
            });
          }
        }
      }
      // Thêm form feedback
      const h3Element = contentElement.closest('.grammar-card')?.querySelector('h3');
      const topic = h3Element ? h3Element.textContent.replace(/^[^a-zA-Z0-9\u00C0-\u1EF9]+\s*/, '') : '';
      const tabType = h3Element ? h3Element.getAttribute('data-action') || '' : '';

      // Thêm form feedback
      this.addFeedbackForm(contentElement, topic, tabType);

    }, 500);
    
    // Thay thế bằng phương pháp hiển thị đơn giản và nhanh hơn
    if (ragInfo && ragInfo.sources && ragInfo.sources.length > 0) {
      // Hiển thị nguồn đơn giản, không phân tích phức tạp
      const simpleSourceContainer = document.createElement('div');
      simpleSourceContainer.className = 'rag-sources-simple';
      simpleSourceContainer.innerHTML = `
        <h4>🔍 Nguồn tham khảo:</h4>
        <ul class="simple-source-list">
          ${Array.from(new Set(ragInfo.sources.map(source => {
            const parts = source.split(' - ');
            return parts.length > 1 ? parts[1] : source;
          }))).map(source => `<li>${source}</li>`).join('')}
        </ul>
      `;
      contentElement.appendChild(simpleSourceContainer);
    }
}

  // Phương thức kiểm tra và tạo các phần tử DOM cần thiết
  ensureDOMElements() {
    if (!this.outputArea) {
      console.error('Không tìm thấy khu vực output. Kiểm tra ID:', this.outputAreaId);
      return false;
    }
    
    // Kiểm tra xem container có class phù hợp với chế độ giao diện không
    const container = document.querySelector('.bibi-grammar-app');
    if (container) {
      if (this.uiMode === 'modern') {
        container.classList.remove('classic-ui');
      } else {
        container.classList.add('classic-ui');
      }
    }
    
    return true;
  }

  // Thêm phương thức mới xử lý đa ngôn ngữ
  applyLanguageFormatting(content, language = 'vi') {
    if (!content) return '';
    
    switch(language) {
      case 'en':
        // Nếu ngôn ngữ là tiếng Anh, xóa nội dung tiếng Việt nếu có
        // Giả định nội dung tiếng Anh thường nằm trong ngoặc
        return content.replace(/([^(]+)\s*\(([^)]+)\)/g, '$2')
                    .replace(/\(\)/g, ''); // Xóa cặp ngoặc rỗng
        
      case 'both':
        // Định dạng song ngữ với phân cách trực quan
        return content.replace(/([^(]+)\s*\(([^)]+)\)/g, 
                            '<div class="bilingual-item"><div class="vi-content">$1</div><div class="en-content">$2</div></div>');
        
      case 'vi':
      default:
        // Mặc định giữ tiếng Việt, xóa phần tiếng Anh trong ngoặc
        return content.replace(/([^(]+)\s*\([^)]+\)/g, '$1')
                    .replace(/\(\)/g, '');
    }
  }

  // Phương thức cập nhật khi chuyển đổi ngôn ngữ
  updateLanguage(language) {
    document.querySelectorAll('.grammar-content').forEach(contentEl => {
      // Lấy nội dung gốc từ data attribute nếu có
      const originalContent = contentEl.getAttribute('data-original-content');
      if (originalContent) {
        // Định dạng lại với ngôn ngữ mới
        contentEl.innerHTML = this.formatContent(originalContent, { language });
      }
    });
    
    // Cập nhật trạng thái các nút ngôn ngữ
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id.endsWith(language));
    });
  }

  // Phương thức xuất PDF
  exportToPdf(contentElement) {
    try {
      // Chuẩn bị trang cho việc in
      const currentTitle = document.title;
      const originalContent = document.body.innerHTML;
      
      // Tạo một div ẩn để chứa nội dung cần in
      const printDiv = document.createElement('div');
      printDiv.className = 'print-container';
      
      // Thêm header cho bản in
      const header = document.createElement('div');
      header.className = 'print-header';
      header.innerHTML = `
        <div class="print-logo">🤖 BiBi - Trợ lý AI Giáo dục K12</div>
        <div class="print-date">Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</div>
      `;
      printDiv.appendChild(header);
      
      // Thêm nội dung chính
      const mainContent = document.createElement('div');
      mainContent.className = 'print-content';
      // Sao chép nội dung từ contentElement
      mainContent.innerHTML = contentElement.innerHTML;
      // Loại bỏ các nút không cần thiết khi in
      mainContent.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
      printDiv.appendChild(mainContent);
      
      // Thêm footer
      const footer = document.createElement('div');
      footer.className = 'print-footer';
      footer.innerHTML = `<div>Tạo bởi BiBi - Trợ lý AI Giáo dục K12</div>`;
      printDiv.appendChild(footer);
      
      // Thêm thẻ style để đảm bảo định dạng khi in
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Thêm div in ấn vào body
      document.body.appendChild(printDiv);
      
      // Hiển thị thông báo cho người dùng
      const exportBtn = contentElement.querySelector('.export-pdf-btn');
      if (exportBtn) {
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
      }
      
      // Đặt tiêu đề trang để hiển thị khi lưu PDF
      const h3Element = contentElement.querySelector('h3');
      if (h3Element) {
        document.title = h3Element.textContent.trim();
      }
      
      // Chờ một chút để CSS được áp dụng
      setTimeout(() => {
        // In trang
        window.print();
        
        // Khôi phục lại trạng thái ban đầu
        document.body.removeChild(printDiv);
        document.head.removeChild(style);
        document.title = currentTitle;
        
        if (exportBtn) {
          exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Xuất PDF';
        }
      }, 300);
    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error);
      alert('Có lỗi khi xuất PDF. Vui lòng thử lại sau.');
    }
  }

  // Phương thức xuất Word
  exportToWord(contentElement, rawContent) {
    try {
      // Hiển thị thông báo cho người dùng
      const exportBtn = contentElement.querySelector('.export-word-btn');
      if (exportBtn) {
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
      }
      
      // Lấy tiêu đề từ phần tử h3 đầu tiên hoặc dùng tiêu đề mặc định
      const h3Element = contentElement.querySelector('h3');
      const title = h3Element ? h3Element.textContent.trim() : 'BiBi - Tài liệu ngữ pháp';
      
      // Phương pháp đơn giản: tạo blob từ HTML
      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; }
            h1, h2, h3 { color: #2E74B5; }
            h1 { font-size: 18pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            ul, ol { margin-left: 2cm; }
            li { margin-bottom: 5px; }
            .rag-sources { margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px; }
            .rag-source-item { padding-left: 10px; border-left: 2px solid #4CAF50; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${contentElement.innerHTML}
          <p style="text-align:center; margin-top:30px; color:#777; font-size:9pt;">
            Tạo bởi BiBi - Trợ lý AI Giáo dục K12
          </p>
        </body>
        </html>
      `;
      
      // Tạo blob và tạo link tải xuống
      const blob = new Blob([template], {type: 'application/msword'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title}.doc`;
      
      // Thêm vào body, click và xóa
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Khôi phục nút
      if (exportBtn) {
        setTimeout(() => {
          exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
        }, 1000);
      }
    } catch (error) {
      console.error('Lỗi khi xuất Word:', error);
      alert('Có lỗi khi xuất Word. Vui lòng thử lại sau.');
      
      // Khôi phục nút nếu có lỗi
      const exportBtn = contentElement.querySelector('.export-word-btn');
      if (exportBtn) {
        exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
      }
    }
  }
  
  // Phương thức kiểm tra xem nội dung có phần đáng kể từ AI không
  hasSignificantAIContent(content, ragInfo) {
    if (!content || !ragInfo || !ragInfo.sources) return false;
    
    // Tính tỷ lệ nội dung RAG
    let ragContentRatio = 0;
    
    // Duyệt qua các nguồn RAG
    ragInfo.sources.forEach(source => {
      // Trích xuất nội dung từ nguồn (loại bỏ phần "Nguồn:" và "Độ liên quan:")
      const sourceContent = source.replace(/\([^)]*\)/g, '').trim();
      
      // Kiểm tra xem nội dung nguồn có xuất hiện trong nội dung đầy đủ không
      if (sourceContent && sourceContent.length > 20) {
        // Tính tỷ lệ dựa trên độ dài
        const matchRatio = this.calculateContentMatchRatio(content, sourceContent);
        ragContentRatio += matchRatio;
      }
    });
    
    // Nếu tỷ lệ dưới 50%, coi là có phần đáng kể từ AI
    return ragContentRatio < 0.5;
  }

  // Tính tỷ lệ trùng khớp giữa nội dung và nguồn
  calculateContentMatchRatio(fullContent, sourceContent) {
    // Chuyển đổi thành văn bản thuần túy để so sánh
    const plainFullContent = fullContent.replace(/\s+/g, ' ').toLowerCase();
    const plainSourceContent = sourceContent.replace(/\s+/g, ' ').toLowerCase();
    
    // Đếm số từ nguồn xuất hiện trong nội dung đầy đủ
    let matchedWords = 0;
    const sourceWords = plainSourceContent.split(' ');
    
    sourceWords.forEach(word => {
      if (word.length > 3 && plainFullContent.includes(word)) {
        matchedWords++;
      }
    });
    
    return matchedWords / sourceWords.length;
  }

  // Phương thức đánh dấu nội dung dựa trên nguồn
  markContentBySource(formattedContent, originalContent, ragInfo, badgeType) {
    // Nếu không có thông tin RAG, trả về nguyên bản
    if (!ragInfo || !ragInfo.sources || ragInfo.sources.length === 0) {
      return formattedContent;
    }
    
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/g;
    let markedContent = formattedContent;
    let paragraphs = [];
    let match;
    
    // Thu thập tất cả các đoạn văn
    while ((match = paragraphRegex.exec(formattedContent)) !== null) {
      paragraphs.push({
        fullMatch: match[0],
        content: match[1],
        isRAG: false
      });
    }
    
    // Duyệt qua từng nguồn RAG
    ragInfo.sources.forEach(source => {
      // Trích xuất nội dung từ nguồn
      const sourceContent = source.replace(/\([^)]*\)/g, '').trim();
      
      if (sourceContent && sourceContent.length > 20) {
        // Kiểm tra từng đoạn văn
        paragraphs.forEach((para, index) => {
          if (!para.isRAG) {
            // Kiểm tra đơn giản: nếu đoạn văn chứa một phần đáng kể của nguồn
            const paraText = para.content.replace(/<[^>]*>/g, '');
            
            if (this.hasSignificantOverlap(paraText, sourceContent)) {
              paragraphs[index].isRAG = true;
            }
          }
        });
      }
    });
    
    // Thay thế các đoạn văn với lớp phù hợp
    paragraphs.forEach(para => {
      const sourceClass = para.isRAG ? 
        (badgeType === 'mixed' ? 'content-mixed' : 'content-rag') : 
        'content-ai';
      
      const sourceIcon = para.isRAG ? 
        '<span class="content-source-icon">📚</span>' : 
        '<span class="content-source-icon">🤖</span>';
      
      const newPara = para.fullMatch.replace(
        /<p[^>]*>(.*?)<\/p>/,
        `<p class="${sourceClass}">${sourceIcon}$1</p>`
      );
      
      markedContent = markedContent.replace(para.fullMatch, newPara);
    });
    
    // Thêm phần tóm tắt nguồn vào cuối
    const ragCount = paragraphs.filter(p => p.isRAG).length;
    const aiCount = paragraphs.length - ragCount;
    const totalCount = paragraphs.length;
    
    const ragPercent = Math.round((ragCount / totalCount) * 100);
    const aiPercent = 100 - ragPercent;
    
    // Thêm tóm tắt nguồn
    const sourceSummary = `
      <div class="content-source-summary">
        <h4>📊 Tóm tắt nguồn nội dung:</h4>
        <div class="progress-bar">
          <div class="progress-fill-rag" style="width: ${ragPercent}%"></div>
          <div class="progress-fill-ai" style="width: ${aiPercent}%"></div>
        </div>
        <div class="source-percentages">
          <span><span class="content-source-icon">📚</span> Sách giáo khoa: ${ragPercent}%</span> |
          <span><span class="content-source-icon">🤖</span> AI: ${aiPercent}%</span>
        </div>
      </div>
    `;
    
    return markedContent + sourceSummary;
  }

  // Kiểm tra nếu có sự trùng lặp đáng kể giữa hai đoạn văn bản
  hasSignificantOverlap(text1, text2) {
    // Chuyển đổi thành văn bản thuần túy và tách thành từ
    const words1 = text1.toLowerCase().replace(/\s+/g, ' ').split(' ');
    const words2 = text2.toLowerCase().replace(/\s+/g, ' ').split(' ');
    
    // Đếm số từ trùng lặp
    let matchCount = 0;
    const minLength = 4; // Chỉ đếm từ có độ dài tối thiểu để tránh từ phổ biến
    
    words1.forEach(word => {
      if (word.length >= minLength && words2.includes(word)) {
        matchCount++;
      }
    });
    
    // Tính tỷ lệ trùng lặp
    const overlapRatio = matchCount / Math.min(words1.length, words2.length);
    
    // Trả về true nếu tỷ lệ trùng lặp > 30%
    return overlapRatio > 0.3;
  }

  // Phương thức để hiển thị form feedback
  addFeedbackForm(contentElement, topic, tabType) {
    if (!contentElement) return;
    
    // Kiểm tra xem đã có form feedback chưa
    if (contentElement.querySelector('.feedback-container')) {
      return;
    }
    
    // Tạo container cho feedback
    const feedbackSection = document.createElement('div');
    feedbackSection.className = 'feedback-section';
    
    // Thêm vào cuối nội dung
    contentElement.appendChild(feedbackSection);
    
    // Khởi tạo và hiển thị form feedback
    if (window.feedbackManager) {
      window.feedbackManager.init(topic, tabType).renderFeedbackForm(feedbackSection);
    } else {
      console.warn('FeedbackManager không tồn tại');
    }
  }
}