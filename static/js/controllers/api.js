// ✅ UPDATED: Remove proxy, direct API calls
// Import RAG service (đảm bảo api_rag.js được load trước api.js)
// Thêm định nghĩa hàm getBiBiResponse trước khi export
async function getBiBiResponse(messages, options = {}) {
  try {
    // Hợp nhất options mặc định và tùy chọn được truyền vào
    const apiOptions = {
      model: options.model || "gpt-4.1",
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      useRAG: options.useRAG !== false, // Mặc định sử dụng RAG
      ...options
    };

    // Áp dụng RAG nếu được bật và có ragService
    if (apiOptions.useRAG && window.ragService && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      
      if (lastUserMessage) {
        try {
          console.log('🔄 Đang tìm kiếm thông tin RAG...');
          const ragResults = await window.ragService.search(lastUserMessage.content);
          
          if (ragResults.success && ragResults.results.length > 0) {
            console.log('✅ Đã tìm thấy thông tin RAG liên quan');
            // Tạo bản sao của messages để không ảnh hưởng đến mảng gốc
            const enhancedMessages = [...messages];
            // Tìm và cập nhật message cuối cùng của user
            for (let i = enhancedMessages.length - 1; i >= 0; i--) {
              if (enhancedMessages[i].role === 'user') {
                enhancedMessages[i] = {
                  ...enhancedMessages[i],
                  content: window.ragService.enhancePrompt(enhancedMessages[i].content, ragResults)
                };
                break;
              }
            }
            // Sử dụng enhancedMessages thay cho messages gốc
            messages = enhancedMessages;
          } else {
            console.log('ℹ️ Không tìm thấy thông tin RAG liên quan');
          }
        } catch (ragError) {
          console.warn('⚠️ Lỗi khi sử dụng RAG, tiếp tục không có RAG:', ragError);
        }
      }
    }
    
    console.log('🔄 Streaming request to API with options:', {
      model: options.model,
      temperature: options.temperature,
      stream: true,
      messagesLength: messages.length
    });
    
    console.log('🔄 Streaming request to API with options:', {
      model: options.model,
      temperature: options.temperature,
      stream: true,
      messagesLength: messages.length
    });
    console.time('API Call Duration');
    // ✅ UPDATED: Direct API call to unified server
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        ...apiOptions
      })
    });
    
    const data = await response.json();
    console.timeEnd('API Call Duration');
    
    if (data.error) {
      throw new Error(data.error.message || "API error");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Không thể kết nối tới API: " + error.message);
  }
}

// Thêm vào api.js cũ
async function streamBiBiResponse(messages, updateCallback, options = {}) {
  try {
    const apiOptions = {
      model: options.model || "gpt-4.1",
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: true,
      ...options
    };
    console.log('🚀 API.js loaded successfully')
    console.log('Sending streaming request');
    // ✅ UPDATED: Direct API call to unified server
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        ...apiOptions
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    // Xử lý streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (updateCallback) updateCallback(content, fullText);
            }
          } catch (e) {
            console.warn('Error parsing SSE data:', e);
          }
        }
      }
    }
    
    return fullText;
  } catch (error) {
    console.error("API Streaming Error:", error);
    throw new Error("Không thể kết nối tới API streaming: " + error.message);
  }
}

// Thêm định nghĩa cho getSpeechToken để tránh lỗi
async function getSpeechToken() {
  try {
    // ✅ UPDATED: Direct API call to unified server
    const response = await fetch("/api/speech-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await response.json();
  } catch (error) {
    console.error("Speech Token Error:", error);
    throw new Error("Không thể lấy token cho speech: " + error.message);
  }
}

// Xuất các hàm
window.getBiBiResponse = getBiBiResponse;
window.streamBiBiResponse = streamBiBiResponse;
window.getSpeechToken = getSpeechToken;