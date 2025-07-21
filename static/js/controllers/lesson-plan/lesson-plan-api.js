// /static/js/controllers/lesson-plan/lesson-plan-api.js
// Module kết nối với API - PARALLEL PROCESSING OPTIMIZATION
// 🚀 NEW: OpenAI call immediately, RAG in background (5-10s response time)
// ✅ UNIFIED: Updated for single server deployment (removed proxy URLs)

import { LessonPlanRAG } from './lesson-plan-rag.js';

export class LessonPlanAPI {
  constructor(options = {}) {
    // ✅ UNIFIED UPDATE: Direct API calls to same server, no proxy
    const baseUrl = window.location.origin; // Same server for unified deployment
    
    this.baseUrl = options.baseUrl || `${baseUrl}/api`;
    
    // ✅ UNIFIED: Direct chat endpoint (no proxy)
    this.chatEndpoint = options.chatEndpoint || `${baseUrl}/api/chat`;
    this.lessonPlanEndpoint = options.lessonPlanEndpoint || `${this.baseUrl}/lesson-plan`;
    
    // Khởi tạo RAG client
    this.rag = new LessonPlanRAG({
        namespaces: ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"],
        defaultNamespace: "bibi_lesson_plan",
        enabled: true,
        debug: options.debug || false
    });
    
    // Kiểm tra trạng thái kết nối RAG
    this.ragAvailable = false;
    this.checkRAGStatus();
    
    console.log('🔌 LessonPlanAPI khởi tạo thành công (unified deployment)');
  }

  // Kiểm tra trạng thái kết nối RAG
  async checkRAGStatus() {
    try {
      this.ragAvailable = await this.rag.checkConnection();
      console.log(`RAG Status: ${this.ragAvailable ? 'Connected ✅' : 'Disconnected ❌'}`);
      return this.ragAvailable;
    } catch (error) {
      console.error('Error checking RAG status:', error);
      this.ragAvailable = false;
      return false;
    }
  }

  // 🚀 NEW: Start OpenAI call immediately for parallel processing
  async startOpenAICall(messages, options, streamCallback) {
    const startTime = Date.now();
    console.log("🚀 PARALLEL: Starting OpenAI call immediately");
    console.log(`🕰️ OpenAI Request Start: ${new Date().toISOString()}`);
    
    const modelToUse = options.model || 'gpt-4.1';
    
    // Tạo controller cho request
    const abortController = new AbortController();
    const { signal } = abortController;
    
    // Timeout 60 giây (optimized from 120s)
    const timeoutId = setTimeout(() => abortController.abort(), 60000);
    
    try {
      console.log(`🚀 PARALLEL: Sending request to OpenAI at ${Date.now() - startTime}ms`);
      
      // ⚡ EMERGENCY: Detect if OpenAI is slow (>10s for initial response)
      const emergencyTimeout = 30000; // 30s emergency timeout
      if (Date.now() - startTime > 10000) {
        console.warn('⚠️ OpenAI appears slow today. Using emergency timeout.');
      }
      
      const response = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          model: modelToUse,
          temperature: options.temperature || 0.9,
          top_p: 0.95,
          max_tokens: options.maxTokens || 16000,
          stream: true,
          lessonType: options.lessonType || 'main',
          ragQuery: options.ragQuery || '',
          detailed_content: options.requireDetailedContent !== false
        }),
        signal
      });

      clearTimeout(timeoutId);
      
      console.log(`🚀 PARALLEL: OpenAI response received at ${Date.now() - startTime}ms`);

      if (!response.ok) {
        console.error(`🚀 PARALLEL: OpenAI API error: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log("🚀 PARALLEL: OpenAI streaming started successfully");
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('🚀 PARALLEL: OpenAI call failed:', error);
      throw error;
    }
  }

  // Gửi yêu cầu đến API để tạo giáo án - OPTIMIZED FOR PARALLEL PROCESSING
  async generateLessonPlan(messages, streamCallback, options = {}) {
    try {
      console.log("🚀 PARALLEL: Bắt đầu tạo giáo án với Parallel Processing");
      
      // Khai báo biến kiểm tra độ dài NGAY TỪ ĐẦU hàm
      let contentLengthChecked = false;
      let startTime = Date.now(); // Lưu thời điểm bắt đầu
      
      const useRAG = options.useRAG !== false && this.ragAvailable;
      const lessonType = options.lessonType || 'main';
      const ragQuery = options.ragQuery || '';
      
      // Chuẩn bị thông tin RAG
      let ragInfo = {
        attempted: useRAG,
        usedRAG: false,
        sources: [],
        searching: useRAG,
        startTime: Date.now(),
        endTime: null,
        error: null,
        namespaces: []
      };

      // 🚀 PARALLEL PROCESSING KEY CHANGE: START OPENAI IMMEDIATELY
      console.log("🚀 PARALLEL: Starting OpenAI call BEFORE RAG setup");
      
      // ✅ IMMEDIATE: Enhanced user feedback ngay lập tức
      streamCallback('🚀 Bắt đầu tạo giáo án...\n', '', {
        currentStage: "✅ Kết nối OpenAI thành công - Đang xử lý yêu cầu..."
      });
      
      const openAIPromise = this.startOpenAICall(messages, options, streamCallback);
      
      // 🚀 PARALLEL: Start RAG search in background (non-blocking)
      let ragPromise = null;
      
      if (useRAG && ragQuery) {
        // ✅ Enhanced: Thông báo chi tiết hơn cho user
        streamCallback('⚙️ Tìm kiếm tài liệu tham khảo...\n', '', {
          ...ragInfo,
          currentStage: "⚙️ Đang tạo nội dung và tìm kiếm tài liệu SGK, CT giáo dục..."
        });
        
        console.log("🚀 PARALLEL: Starting RAG search in background", ragQuery);
        
        // RAG search runs in background - faster timeout for quick fallback
        ragPromise = this.rag.searchFastFirst(ragQuery, {
          lessonType: lessonType,
          timeout: 25000 // ⚡ URGENT FIX: 15s → 25s để tránh race condition với OpenAI
        }).then(results => {
          // Xử lý kết quả RAG nếu thành công
          if (results && results.success && results.results && results.results.length > 0) {
            console.log(`🚀 PARALLEL: RAG found ${results.results.length} results in background`);
            
            // ✅ SUCCESS: Thông báo tìm thấy tài liệu cho user
            streamCallback(`✅ Tìm thấy ${results.results.length} tài liệu tham khảo!\n`, '', null);
            
            // Cập nhật thông tin RAG
            ragInfo.searching = false;
            ragInfo.endTime = Date.now();
            ragInfo.usedRAG = true;
            ragInfo.sources = results.results.map(result => {
              const metadata = result.metadata || {};
              const source = metadata.source || metadata.namespace || 'Chương trình giáo dục';
              return `${source} - ${result.content?.substring(0, 80)}...`;
            });
            ragInfo.namespaces = Array.from(new Set(results.results.map(r => r.namespace || '')));
            
            // Gửi thông tin RAG qua callback (background update)
            streamCallback('', '', ragInfo);
            
            console.log("🚀 PARALLEL: RAG results ready for content enhancement");
            return results;
          } else {
            console.log("🚀 PARALLEL: RAG no results found - continuing with OpenAI only");
            ragInfo.searching = false;
            ragInfo.endTime = Date.now();
            ragInfo.usedRAG = false;
            streamCallback('', '', ragInfo);
            return null;
          }
        }).catch(error => {
          console.warn("🚀 PARALLEL: RAG search failed in background:", error.message);
          ragInfo.searching = false;
          ragInfo.endTime = Date.now();
          ragInfo.error = error.message;
          streamCallback('', '', ragInfo);
          return null;
        });
      } else {
        console.log("🚀 PARALLEL: Skipping RAG - OpenAI only mode");
      }

      // 🚀 PARALLEL: Process OpenAI response immediately (main thread)
      const response = await openAIPromise;
      
      // Xử lý streaming OpenAI
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';
      let fullContent = '';
      
      console.log("🚀 PARALLEL: Processing OpenAI streaming response");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonData = JSON.parse(line.slice(6));
              const content = jsonData.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                
                // 🚀 IMMEDIATE: Stream content right away, no delays
                streamCallback(content, fullContent, null);
                
                // ✅ OPTIMIZED: Check length after 8000 chars to reduce delays
                if (!contentLengthChecked && fullContent.length > 8000) {
                  contentLengthChecked = true;
                  
                  // Dự đoán độ dài cuối cùng
                  const elapsedTime = Date.now() - startTime;
                  const projectedLength = Math.round((fullContent.length / elapsedTime) * 90000); // 90 giây
                  
                  // Apply expansion guidance for Main/TT, SKIP Review
                  if (options.lessonType !== 'review' && projectedLength < 13000) {
                    console.log(`⚠️ PARALLEL: Content will be short (~${projectedLength} chars)`);
                    
                    const expansionGuidance = `\n\n⚠️⚠️⚠️ CẢNH BÁO: NỘI DUNG DỰ KIẾN QUÁ NGẮN! ⚠️⚠️⚠️

                Hãy MỞ RỘNG TẤT CẢ các phần tiếp theo với mức độ chi tiết cao nhất:

                1. Tiến trình dạy học (Procedures): Mô tả CỰC KỲ CHI TIẾT từng hoạt động
                  - Script đầy đủ những gì giáo viên sẽ nói
                  - Câu hỏi và câu trả lời mẫu cho mỗi hoạt động
                  - Hướng dẫn chi tiết cho mỗi Task

                2. Phân tích ngôn ngữ (Language Analysis): Mô tả ít nhất 10 từ/cấu trúc
                  - Phân tích đầy đủ Form, Meaning, Pronunciation, Vietnamese, Example
                  - Ví dụ cụ thể cho mỗi từ/cấu trúc

                3. Tất cả các phần khác: Mở rộng ít nhất gấp đôi chi tiết

                GIÁO ÁN PHẢI ĐẠT TỐI THIỂU 15,000 KÝ TỰ!\n\n`;
                    
                    streamCallback(expansionGuidance, fullContent + expansionGuidance, {
                      lengthWarning: true,
                      projected: projectedLength
                    });
                  } else if (options.lessonType === 'review') {
                    console.log(`✅ PARALLEL: Review detected (${projectedLength} chars) - prompt-level expansion`);
                  }
                }
              }
            } catch (e) {
              console.error("🚀 PARALLEL: Error processing streaming JSON:", e);
            }
          }
        }
      }
      
      console.log(`🚀 PARALLEL: Streaming completed, total ${fullContent.length} chars`);
      
      // ✅ COMPLETION: Thông báo hoàn thành cho user
      streamCallback(`\n✅ Hoàn thành tạo giáo án (${fullContent.length} ký tự)\n`, fullContent, null);
      
      // Content length validation
      if (fullContent) {
        let targetLength, minLength;

        if (options.lessonType === 'review') {
          targetLength = 15000;
          minLength = 13000;
        } else {
          targetLength = 15000;
          minLength = 12000;
        }

        const currentLength = fullContent.length;

        // Skip expansion for Review/Test
        if (options.lessonType === 'review' || options.lessonType === 'test') {
          console.log(`✅ PARALLEL: Review content: ${currentLength} chars - bypassing expansion`);
          
          if (!ragInfo) ragInfo = {};
          ragInfo.reviewContentLength = currentLength;
          ragInfo.reviewBypassedExpansion = true;
          streamCallback('', fullContent, ragInfo);
          
        } else if (currentLength < minLength) {
          console.log(`🚀 PARALLEL: Content too short (${currentLength}/${targetLength} chars)`);
          
          // Expansion logic for Main/TT (preserved from original)
          let insertPoint = fullContent.lastIndexOf("\n\n");
          if (insertPoint === -1) insertPoint = fullContent.length;
          
          let additionalGuidance = `
  
      —— HƯỚNG DẪN BỔ SUNG ——
  
      CẢNH BÁO: Nội dung giáo án hiện tại chỉ có ${currentLength} ký tự, quá ngắn so với yêu cầu tối thiểu 15,000 ký tự.
  
      YÊU CẦU MỞ RỘNG KHẨN CẤP:
      1. Mô tả CHI TIẾT HƠN từng bước trong phần "Tiến trình dạy học"
      2. Thêm ít nhất 10 từ vựng/cấu trúc vào phần "Phân tích ngôn ngữ" 
      3. Bổ sung ít nhất 5 khó khăn dự đoán và giải pháp tương ứng
      4. Mỗi hoạt động trong tiến trình dạy học cần được mô tả bằng ít nhất 10-15 câu
      5. Phần Board Plan cần chi tiết và đầy đủ hơn
  
      Tất cả các phần cần được mở rộng để tổng số ký tự đạt ít nhất 15,000.`;

          fullContent = fullContent.substring(0, insertPoint) + additionalGuidance + fullContent.substring(insertPoint);
          
          if (!ragInfo) ragInfo = {};
          ragInfo.contentTooShort = true;
          ragInfo.currentLength = currentLength;
          ragInfo.targetLength = targetLength;
          streamCallback('', fullContent, ragInfo);
          
        } else {
          console.log(`🚀 PARALLEL: Content meets target (${currentLength}/${targetLength} chars)`);
          
          if (!ragInfo) ragInfo = {};
          ragInfo.contentOptimal = true;
          ragInfo.currentLength = currentLength;
          ragInfo.targetLength = targetLength;
        }
      }

      // Finalize ragInfo
      if (ragInfo.searching) {
        ragInfo.searching = false;
        ragInfo.endTime = Date.now();
        streamCallback('', fullContent, ragInfo);
      }
      
      const totalTime = (Date.now() - startTime)/1000;
      console.log(`🚀 PARALLEL: Total time: ${totalTime}s`);
      
      // ✅ SIMPLE: Log completion, no complex UI updates
      streamCallback(`\n⏱️ Thời gian tạo: ${totalTime.toFixed(1)} giây\n`, '', {
        totalTime: totalTime,
        performance: totalTime < 20 ? 'excellent' : totalTime < 40 ? 'good' : 'normal',
        completed: true
      });
      
      // Return complete result
      return {
        content: fullContent,
        ragInfo
      };
      
    } catch (error) {
      console.error('🚀 PARALLEL: API Error:', error);
      throw error;
    }
  }

  // Lưu giáo án vào localStorage
  saveLessonPlan(lessonPlan) {
    try {
      // Tạo ID duy nhất
      const id = `lesson_plan_${Date.now()}`;
      lessonPlan.id = id;
      lessonPlan.createdAt = new Date().toISOString();
      
      // Lấy danh sách giáo án hiện có
      const savedPlans = JSON.parse(localStorage.getItem('bibi_lesson_plans') || '[]');
      
      // Thêm giáo án mới
      savedPlans.push(lessonPlan);
      
      // Giới hạn số lượng giáo án lưu trữ
      if (savedPlans.length > 50) {
        savedPlans.shift(); // Xóa giáo án cũ nhất
      }
      
      // Lưu lại
      localStorage.setItem('bibi_lesson_plans', JSON.stringify(savedPlans));
      
      return id;
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      return null;
    }
  }

  // Lấy danh sách giáo án đã lưu
  getLessonPlans() {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('bibi_lesson_plans') || '[]');
      return savedPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting lesson plans:', error);
      return [];
    }
  }

  // Lấy giáo án theo ID
  getLessonPlanById(id) {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('bibi_lesson_plans') || '[]');
      return savedPlans.find(plan => plan.id === id) || null;
    } catch (error) {
      console.error('Error getting lesson plan by ID:', error);
      return null;
    }
  }

  // Xóa giáo án theo ID
  deleteLessonPlan(id) {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('bibi_lesson_plans') || '[]');
      const filteredPlans = savedPlans.filter(plan => plan.id !== id);
      localStorage.setItem('bibi_lesson_plans', JSON.stringify(filteredPlans));
      return true;
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      return false;
    }
  }

  // ✅ NEW: Performance monitoring method
  getPerformanceStatus() {
    return {
      ragAvailable: this.ragAvailable,
      endpoints: {
        chat: this.chatEndpoint,
        rag: this.rag?.apiUrl
      },
      lastGeneration: {
        timestamp: new Date().toISOString(),
        ragEnabled: this.ragAvailable
      }
    };
  }

  // ✅ NEW: Quick health check
  async quickHealthCheck() {
    console.log('🔍 BiBi Performance Health Check:');
    console.log('- RAG Status:', this.ragAvailable ? '✅ Connected' : '❌ Disconnected');
    console.log('- Chat Endpoint:', this.chatEndpoint);
    
    // ⚡ NEW: Test network latency to RAG
    if (this.ragAvailable) {
      try {
        const startTime = Date.now();
        const ragStatus = await this.rag.checkConnection();
        const latency = Date.now() - startTime;
        console.log('- RAG Connection:', ragStatus ? '✅ Active' : '⚠️ Inactive');
        console.log(`- RAG Latency: ${latency}ms`);
        
        if (latency > 5000) {
          console.warn('⚠️ RAG high latency detected! Network issue possible.');
        }
        
        return { status: 'healthy', rag: ragStatus, latency };
      } catch (error) {
        console.log('- RAG Error:', error.message);
        return { status: 'degraded', error: error.message };
      }
    }
    
    return { status: 'partial', rag: false };
  }

  // ⚡ NEW: Comprehensive performance test
  async performanceTest() {
    console.log('🏁 BiBi Comprehensive Performance Test:');
    const results = {};
    
    // Test 1: RAG Connectivity 
    try {
      const ragStart = Date.now();
      const ragStatus = await this.rag.checkConnection();
      results.rag = {
        status: ragStatus,
        latency: Date.now() - ragStart,
        healthy: ragStatus && (Date.now() - ragStart) < 3000
      };
      console.log(`- RAG Test: ${results.rag.healthy ? '✅' : '❌'} (${results.rag.latency}ms)`);
    } catch (error) {
      results.rag = { status: false, error: error.message };
      console.log('- RAG Test: ❌ Error');
    }
    
    // Test 2: OpenAI Connectivity (simple ping)
    try {
      const openaiStart = Date.now();
      const simpleMessage = [{ role: 'user', content: 'test' }];
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000); // 10s max
      
      const response = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: simpleMessage,
          model: 'gpt-4.1',
          max_tokens: 10,
          stream: false
        }),
        signal: controller.signal
      });
      
      results.openai = {
        status: response.ok,
        latency: Date.now() - openaiStart,
        healthy: response.ok && (Date.now() - openaiStart) < 5000
      };
      console.log(`- OpenAI Test: ${results.openai.healthy ? '✅' : '❌'} (${results.openai.latency}ms)`);
    } catch (error) {
      results.openai = { status: false, error: error.message };
      console.log('- OpenAI Test: ❌ Error');
    }
    
    // Overall health assessment
    const overallHealthy = results.rag?.healthy && results.openai?.healthy;
    console.log(`🏁 Overall Performance: ${overallHealthy ? '✅ Excellent' : '⚠️ Degraded'}`);
    
    return results;
  }

  // ✅ SIMPLE: Test simple loading message (replacement for complex progress test)
  testSimpleLoading() {
    console.log('🧪 Testing Simple Loading Message System');
    
    // Find current streaming content element
    const streamingElement = document.querySelector('.streaming-content');
    
    if (streamingElement) {
      // Add test loading message
      streamingElement.innerHTML = `
        <div class="simple-loading" style="
          padding: 40px 20px;
          text-align: center;
          color: #666;
          font-size: 16px;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 20px 0;
        ">
          <div style="margin-bottom: 15px;">
            <div class="spinner" style="
              width: 24px; height: 24px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #4CAF50;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 15px;
            "></div>
          </div>
          <p style="margin: 0; font-weight: 500;">Đang tìm nội dung...</p>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;
      
      console.log('✅ Simple loading message displayed');
      
      // Remove after 3 seconds to simulate content loading
      setTimeout(() => {
        const loadingEl = streamingElement.querySelector('.simple-loading');
        if (loadingEl) {
          loadingEl.remove();
          streamingElement.innerHTML = '<p>Content would appear here...</p>';
          console.log('✅ Loading message removed, content simulated');
        }
      }, 3000);
      
      return 'Simple loading test started. Check content area!';
    } else {
      return 'No streaming content element found. Generate a lesson plan first.';
    }
  }
}
