// /static/js/controllers/api_rag.js
// Module xử lý RAG API cho BiBi

class RAGService {
    constructor(options = {}) {
        // Sử dụng proxy API qua server.js thay vì kết nối trực tiếp đến Streamlit
        this.apiUrl = options.apiUrl || "/api/rag";
        this.namespace = options.namespace || "bibi_sgk";
        this.defaultTopK = options.topK || 3;
        this.isEnabled = options.enabled !== false; // Mặc định bật RAG
        this.debug = options.debug || false;
        
        // Thêm trạng thái kết nối
        this.connectionStatus = "unknown"; // "connected", "disconnected", "unknown"
        this.checkConnection();
    }
    
    /**
     * Kiểm tra kết nối đến RAG API
     * @returns {Promise<boolean>} - Trạng thái kết nối
     */
    async checkConnection() {
        try {
            if (this.debug) {
                console.log('🔄 Đang kiểm tra kết nối RAG API...');
            }
            
            const response = await fetch('/api/status/fastapi');
            const data = await response.json();
            
            this.connectionStatus = data.status === 'ok' ? "connected" : "disconnected";
            
            if (this.debug) {
                console.log(`🔄 Trạng thái kết nối RAG: ${this.connectionStatus}`, data);
            }
            
            return this.connectionStatus === "connected";
        } catch (error) {
            console.error('Lỗi kiểm tra kết nối RAG:', error);
            this.connectionStatus = "disconnected";
            return false;
        }
    }

    /**
     * Tìm kiếm tài liệu liên quan từ API RAG
     * @param {string} query - Câu truy vấn
     * @param {object} options - Các tùy chọn bổ sung
     * @returns {Promise<object>} - Kết quả tìm kiếm
     */
    async search(query, options = {}) {
        if (!this.isEnabled) {
            return { success: false, disabled: true, results: [] };
        }
    
        try {
            const namespace = options.namespace || this.namespace;
            const topK = options.topK || this.defaultTopK;
            const searchAll = options.searchAll || true; // Mặc định tìm kiếm trong tất cả namespace
            
            // Sử dụng query parameters thay vì body
            const url = new URL(this.apiUrl);
            url.searchParams.append("query", query);
            url.searchParams.append("namespace", namespace);
            url.searchParams.append("top_k", topK);
            url.searchParams.append("search_all", searchAll.toString());
            
            // Thêm timestamp để tránh cache
            url.searchParams.append("_t", Date.now());
            
            if (this.debug) {
                console.log('🔍 RAG Search:', { query, namespace, topK, url: url.toString() });
            }
            
            const response = await fetch(url.toString());
            const data = await response.json();
            
            if (data.status === 'error') {
                console.error('RAG API Error:', data.message);
                return { success: false, error: data.message, results: [] };
            }
            
            if (this.debug) {
                console.log('✅ RAG Results:', data);
            }
            
            return {
                success: true,
                results: data.results || [],
                query: data.query,
                namespace: data.namespace
            };
        } catch (error) {
            console.error('Error connecting to RAG API:', error);
            return {
                success: false,
                error: 'Không thể kết nối đến RAG API: ' + error.message,
                results: []
            };
        }
    }

    /**
     * Tăng cường prompt với thông tin từ RAG
     * @param {string} originalPrompt - Prompt ban đầu
     * @param {object} ragResults - Kết quả từ search RAG
     * @returns {string} - Prompt đã được tăng cường
     */
    enhancePrompt(originalPrompt, ragResults) {
        if (!ragResults || !ragResults.success || !ragResults.results || ragResults.results.length === 0) {
            return originalPrompt;
        }

        // Tạo phần context từ kết quả RAG
        const context = ragResults.results
            .map(doc => {
                const source = doc.metadata && doc.metadata.source ? `[Nguồn: ${doc.metadata.source}]` : '';
                return `${doc.content} ${source}`.trim();
            })
            .join('\n\n');

        // Tăng cường prompt với context
        return `Sử dụng các thông tin sau đây để trả lời:\n\n${context}\n\n${originalPrompt}`;
    }
}

// Khởi tạo và xuất instance mặc định
const ragService = new RAGService({
    debug: true // Bật debug mode trong quá trình phát triển
});

// Export để sử dụng trong các module khác
window.ragService = ragService;