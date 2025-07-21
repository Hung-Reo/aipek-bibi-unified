// Module giao tiếp với API
import { GrammarRAG } from './grammar-rag.js';

export class GrammarAPI {
    constructor() {
      this.apiEndpoint = "/api/chat";
      // Khởi tạo RAG service
      this.ragService = new GrammarRAG({
        debug: true, // Bật debug trong quá trình phát triển
        enabled: true // Mặc định bật RAG
      });
    }
    
    // Kiểm tra trạng thái RAG
    isRAGAvailable() {
      return this.ragService.isRAGAvailable();
    }
    
    // Cập nhật trạng thái RAG
    async updateRAGStatus() {
      return await this.ragService.checkConnection();
    }

    // SAU: Sửa lại hoàn toàn phương thức streamBiBiResponse
    async streamBiBiResponse(messages, onChunk, options = {}) {
      const perfMetrics = {
        startTime: Date.now(),
        ragStartTime: 0,
        ragEndTime: 0,
        openaiStartTime: 0,
        openaiEndTime: 0,
        totalTime: 0
      };
      
      // Thêm điểm đánh dấu trong quá trình xử lý
      perfMetrics.ragStartTime = Date.now();
      // Trước khi gọi RAG search
      
      perfMetrics.ragEndTime = Date.now();
      // Sau khi có kết quả RAG
      
      perfMetrics.openaiStartTime = Date.now();
      // Trước khi gọi OpenAI API
      
      perfMetrics.openaiEndTime = Date.now();
      // Sau khi hoàn thành streaming
      
      perfMetrics.totalTime = Date.now() - perfMetrics.startTime;
      console.log('📊 Performance metrics:', {
          total: `${perfMetrics.totalTime}ms`,
          rag: `${perfMetrics.ragEndTime - perfMetrics.ragStartTime}ms`,
          openai: `${perfMetrics.openaiEndTime - perfMetrics.openaiStartTime}ms`
      });
        
      // Các biến để theo dõi kết quả
      let fullResponse = '';
      let ragResults = null;
      let startTime = Date.now();
      let ragPromise = null; // Thêm biến để theo dõi promise RAG
      
      // Đảm bảo ragInfo luôn có cấu trúc chuẩn
      const ragInfo = {
        usedRAG: false,
        attempted: this.ragService.isAvailable,
        searching: options.useRAG !== false && this.ragService.isAvailable, // Thêm trạng thái đang tìm kiếm
        startTime: Date.now(), // Thêm thời gian bắt đầu tìm kiếm
        error: null,
        sources: [],
        namespaces: []
      };

      // Thông báo trạng thái tìm kiếm ban đầu cho UI
      if (options.useRAG !== false && this.ragService.isAvailable) {
        // Gửi thông báo đang tìm kiếm ngay từ đầu
        setTimeout(() => onChunk('', fullResponse, ragInfo), 100);
      }
      
      try {
        console.log('🚀 Bắt đầu xử lý yêu cầu với RAG:', options.useRAG !== false && this.ragService.isAvailable);
        
        // BƯỚC 1: Bắt đầu tìm kiếm RAG bất đồng bộ (không đợi kết quả)
        if (options.useRAG !== false && this.ragService.isAvailable && messages.length > 0) {
          const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
          
          if (lastUserMessageIndex !== -1) {
            const userMessage = messages[lastUserMessageIndex];
            let queryForRag = options.ragQuery || userMessage.content;
            
            // Xử lý truy vấn cho tất cả các tab
            if (queryForRag.includes('_tab')) {
              // Trích xuất chủ đề từ truy vấn tab
              const tabParts = queryForRag.split('_tab ');
              const actualQuery = tabParts[1] || '';
              
              // Thêm từ khóa bổ sung dựa trên loại tab
              let enhancedQuery = actualQuery;
              if (queryForRag.includes('examples_tab')) {
                enhancedQuery = `ví dụ ${actualQuery}`;
              } else if (queryForRag.includes('exercises_tab')) {
                enhancedQuery = `bài tập ${actualQuery}`;
              } else if (queryForRag.includes('mistakes_tab')) {
                enhancedQuery = `lỗi thường gặp ${actualQuery}`;
              }
              
              console.log('🔍 Tìm kiếm RAG cho tab với truy vấn nâng cao:', enhancedQuery);
              queryForRag = enhancedQuery; // Sử dụng truy vấn đã nâng cao
            }
            
            console.log('🔍 Bắt đầu tìm kiếm RAG bất đồng bộ cho:', queryForRag);
            
            // Bắt đầu tìm kiếm RAG trong background (không đợi kết quả)
            const searchOptions = {
              maxResults: 3,
              timeout: 20000, // Tăng timeout từ 8s lên 15s
              namespaces: ["bibi_sgk", "bibi_ctgd"], // Tìm kiếm trên nhiều namespace
              skipCache: options.skipCache || false
            };

            // Lưu promise để xử lý sau, KHÔNG đợi
            ragPromise = this.ragService.search(queryForRag, searchOptions);

            // THÊM MỚI: Xử lý kết quả RAG sớm với .then()
            ragPromise.then(results => {
              if (results && results.success && results.results && results.results.length > 0) {
                console.log(`✅ RAG early notify: Tìm thấy ${results.results.length} kết quả từ ${results.successNamespaces.length} namespaces`);
                
                // Cập nhật ragInfo với kết quả và đánh dấu đã hoàn tất tìm kiếm
                ragInfo.searching = false;
                ragInfo.endTime = Date.now();
                ragInfo.usedRAG = true;
                ragInfo.sources = results.results.map(result => {
                  const namespace = result.namespace || 'unknown';
                  const sourceName = this.ragService.getNamespaceDisplayName(namespace);
                  const source = result.metadata?.source || 'Tài liệu';
                  return `${sourceName} - ${source}`;
                });
                ragInfo.namespaces = [...new Set(results.results.map(r => r.namespace))];
                
                // Thông báo cho UI cập nhật hiển thị nguồn NGAY LẬP TỨC
                onChunk('', fullResponse, ragInfo);
              }
            }).catch(err => {
              console.warn("⚠️ RAG early notify failed:", err);
              ragInfo.error = err.message;
              ragInfo.searching = false;
              ragInfo.endTime = Date.now();
              
              // Cập nhật UI với thông tin lỗi
              onChunk('', fullResponse, ragInfo);
            });
          }
        }
        
        // BƯỚC 2: Gọi API OpenAI ngay lập tức mà không đợi RAG
        console.log('🚀 Gọi API streaming với model (không đợi RAG):', options.model || "gpt-4.1");
        
        // Sử dụng messages ban đầu (không có RAG) để bắt đầu streaming ngay
        const initialMessages = [...messages];

        // Tính kích thước của messages để theo dõi
        const messagesSize = JSON.stringify(messages).length;
        console.log(`📊 Kích thước messages: ${messagesSize/1024} KB`);

        // Nếu kích thước prompt quá lớn, cắt bớt context
        let optimizedMessages = [...messages];
        if (messagesSize > 100000) { // Nếu lớn hơn ~100KB
            console.log(`⚠️ Messages quá lớn (${messagesSize/1024}KB), tối ưu hóa...`);
            
            // Tìm và tối ưu hóa user message cuối cùng
            for (let i = optimizedMessages.length - 1; i >= 0; i--) {
                if (optimizedMessages[i].role === 'user') {
                    let content = optimizedMessages[i].content;
                    
                    // Nếu content chứa thông tin RAG, cắt bớt
                    if (content.includes("Sử dụng các thông tin sau đây")) {
                        // Giữ tối đa 2000 ký tự thông tin RAG
                        const parts = content.split("Câu hỏi gốc:");
                        if (parts.length === 2) {
                            const context = parts[0].substring(0, 2000) + "...\n\n";
                            const question = parts[1];
                            optimizedMessages[i].content = context + "Câu hỏi: " + question;
                            console.log(`✂️ Đã cắt ngắn context RAG từ ${content.length} xuống ${optimizedMessages[i].content.length} ký tự`);
                        }
                    }
                    break;
                }
            }
        }

        const response = await fetch(this.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: optimizedMessages, // Sử dụng messages đã tối ưu
            model: options.model || "gpt-4.1",
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
            stream: true
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Lỗi API");
        }
        
        // BƯỚC 3: Xử lý streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        
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
                  fullResponse += content;
                  onChunk(content, fullResponse);
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        }
        
        // BƯỚC 4: Báo cáo kết quả và thống kê
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Streaming hoàn tất sau ${totalTime.toFixed(2)}s, tổng ${fullResponse.length} ký tự`);
        
        // BƯỚC 5: Kiểm tra lại trạng thái RAG cuối cùng
        console.log('📊 Trạng thái RAG cuối cùng:', {
          usedRAG: ragInfo.usedRAG,
          sourcesCount: ragInfo.sources.length,
          namespacesCount: ragInfo.namespaces.length
        });
        
        // Kiểm tra xem có kết quả RAG không (nếu ragPromise tồn tại)
        if (ragPromise) {
          try {
            // Đợi tối đa 10 giây cho kết quả RAG (không làm chậm trả về kết quả)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("RAG timeout")), 50000)
            );
            
            // Đợi kết quả RAG hoặc timeout, cái nào đến trước
            ragResults = await Promise.race([ragPromise, timeoutPromise]);
            
            // Xử lý kết quả RAG nếu nhận được
            if (ragResults && ragResults.success && ragResults.results && ragResults.results.length > 0) {
              console.log(`✅ Tìm thấy ${ragResults.results.length} kết quả RAG từ ${ragResults.successNamespaces.length} namespaces (sau khi đã stream)`);
              
              // Cập nhật ragInfo với kết quả và đánh dấu đã hoàn tất tìm kiếm
              ragInfo.searching = false;  // Đánh dấu đã hoàn tất tìm kiếm
              ragInfo.endTime = Date.now(); // Lưu thời điểm hoàn tất
              ragInfo.usedRAG = true;
              ragInfo.sources = ragResults.results.map(result => {
                const namespace = result.namespace || 'unknown';
                const sourceName = this.ragService.getNamespaceDisplayName(namespace);
                const source = result.metadata?.source || 'Tài liệu';
                return `${sourceName} - ${source}`;
              });
              ragInfo.namespaces = [...new Set(ragResults.results.map(r => r.namespace))];

              console.log(`✅ Đã cập nhật ragInfo với ${ragInfo.sources.length} sources từ ${ragInfo.namespaces.length} namespaces (sau streaming)`);

              // Thông báo cho UI cập nhật hiển thị nguồn
              onChunk('', fullResponse, ragInfo);
            }
          } catch (ragError) {
            console.warn('⚠️ Lỗi hoặc timeout khi đợi kết quả RAG:', ragError);
            ragInfo.error = ragError.message;
            ragInfo.searching = false;  // Đánh dấu đã hoàn tất tìm kiếm dù bị lỗi
            ragInfo.endTime = Date.now();
            // Thông báo cho UI cập nhật về trạng thái lỗi
            onChunk('', fullResponse, ragInfo);
          }
        }
        
        // Cập nhật thông tin RAG vào kết quả cuối cùng
        console.log('📊 Trạng thái RAG cuối cùng:', {
          usedRAG: ragInfo.usedRAG,
          sourcesCount: ragInfo.sources.length,
          namespacesCount: ragInfo.namespaces.length
        });

        // Nếu vẫn đang trong trạng thái tìm kiếm sau khi xử lý, đánh dấu là đã hoàn tất
        if (ragInfo.searching) {
          ragInfo.searching = false;
          ragInfo.endTime = Date.now();
          // Thông báo cho UI cập nhật về việc không có kết quả
          onChunk('', fullResponse, ragInfo);
          console.log('ℹ️ Không tìm thấy kết quả RAG sau thời gian chờ');
        }

        // Trả về kết quả hoàn chỉnh
        return {
          content: fullResponse,
          ragInfo: ragInfo
        };
        
      } catch (error) {
        console.error("❌ Lỗi trong streamBiBiResponse:", error);
        throw error;
      }
    }
}