// main.js - Điều phối và khởi tạo ứng dụng

import { initTabs } from '/static/js/views/tabs.js';
import { getBiBiResponse } from '/static/js/controllers/api.js';
import {
    saveConversationHistory,
    loadConversationHistory,
    saveUserLevel,
    loadUserLevel
} from '/static/js/models/storage.js';
import { handleFileUpload } from '/static/js/models/file-handler.js';
import {
    appendMessage,
    showLoading,
    removeLoading,
    showNotification
} from '/static/js/views/ui.js';

// Báo cáo cho debug
console.log("main.js loaded");

// Khởi tạo ứng dụng
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - Initializing app");
    
    // Khởi tạo các phần tử DOM
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileUpload = document.getElementById("file-upload");
    const micBtn = document.getElementById("mic-btn");

    // Kiểm tra xem trang hiện tại có các phần tử cần thiết không
    if (!chatBox) {
        console.error("Chat box not found!");
        return;
    }

    if (!userInput || !sendBtn) {
        console.error("Input elements not found!");
        return;
    }

    // Báo cáo thành công tìm thấy các phần tử
    console.log("UI elements found");

    // Khởi tạo tabs
    initTabs();

    // Khởi tạo trạng thái
    let conversationHistory = loadConversationHistory() || [];
    let userLevel = loadUserLevel();

    // Xác định trình độ người dùng dựa trên độ dài câu hỏi
    function determineUserLevel(msg) {
        const wordCount = msg.split(/\s+/).length;
        if (wordCount <= 5) {
            return "beginner";
        } else if (wordCount <= 12) {
            return "intermediate";
        } else {
            return "advanced";
        }
    }

    // Tạo nội dung prompt hệ thống phù hợp với trình độ người dùng
    function getSystemMessageForLevel(level) {
        if (level === "beginner") {
            return "Bạn là một trợ lý AI dạy tiếng Anh cho học sinh trình độ sơ cấp. Hãy sử dụng ngôn ngữ đơn giản, câu văn ngắn gọn và dễ hiểu. Hãy phản hồi bằng tiếng Việt một cách thân thiện, sinh động và sử dụng emoji để làm cho câu trả lời hấp dẫn hơn. Nếu nội dung có hướng dẫn hoặc danh sách, hãy trình bày từng bước một. Sau khi giải thích, hãy đưa ra một bài tập hoặc câu hỏi ngắn để kiểm tra sự hiểu biết của người học. Nếu người học trả lời, hãy đánh giá câu trả lời đó đúng hay sai và giải thích lý do.";
        } else if (level === "intermediate") {
            return "Bạn là một trợ lý AI dạy tiếng Anh cho học sinh trình độ trung cấp. Hãy giải thích chi tiết hơn so với trình độ sơ cấp và sử dụng từ vựng phong phú hơn một chút, nhưng vẫn đảm bảo dễ hiểu. Hãy phản hồi bằng tiếng Việt một cách thân thiện, sinh động và sử dụng emoji để làm cho câu trả lời hấp dẫn hơn. Nếu nội dung có hướng dẫn hoặc danh sách, hãy trình bày từng bước một. Sau khi giải thích, hãy đưa ra một bài tập hoặc câu hỏi ngắn để kiểm tra sự hiểu biết của người học. Nếu người học trả lời, hãy đánh giá câu trả lời đó đúng hay sai và giải thích lý do.";
        } else {
            return "Bạn là một trợ lý AI dạy tiếng Anh cho học sinh trình độ nâng cao. Hãy đưa ra giải thích chuyên sâu hơn và có thể sử dụng một số thuật ngữ chuyên ngành khi cần thiết, nhưng vẫn đảm bảo dễ hiểu. Hãy phản hồi bằng tiếng Việt một cách thân thiện, sinh động và sử dụng emoji để làm cho câu trả lời hấp dẫn hơn. Nếu nội dung có hướng dẫn hoặc danh sách, hãy trình bày từng bước một. Sau khi giải thích, hãy đưa ra một bài tập hoặc câu hỏi ngắn để kiểm tra sự hiểu biết của người học. Nếu người học trả lời, hãy đánh giá câu trả lời đó đúng hay sai và giải thích lý do.";
        }
    }

    // Xử lý sự kiện gửi tin nhắn
    sendBtn.addEventListener("click", async () => {
        const message = userInput.value.trim();
        if (message) {
            appendMessage("user", message);
            userInput.value = "";
            
            // Kiểm tra và thiết lập trình độ người dùng lần đầu
            if (!userLevel) {
                const normalizedMsg = message.toLowerCase();
                if (normalizedMsg.includes("sơ cấp") || normalizedMsg === "1" || normalizedMsg.includes("beginner")) {
                    userLevel = "beginner";
                } else if (normalizedMsg.includes("trung cấp") || normalizedMsg === "2" || normalizedMsg.includes("intermediate")) {
                    userLevel = "intermediate";
                } else if (normalizedMsg.includes("nâng cao") || normalizedMsg === "3" || normalizedMsg.includes("advanced")) {
                    userLevel = "advanced";
                } else {
                    userLevel = determineUserLevel(message);
                }
                
                // Lưu trình độ người dùng
                saveUserLevel(userLevel);
                
                // Thêm tin nhắn hệ thống phù hợp với trình độ
                conversationHistory = [{ role: "system", content: getSystemMessageForLevel(userLevel) }];

                if (normalizedMsg === "1" || normalizedMsg === "2" || normalizedMsg === "3" ||
                    normalizedMsg.includes("tiểu học") || normalizedMsg.includes("thcs") ||
                    normalizedMsg.includes("thpt") || normalizedMsg.includes("beginner") ||
                    normalizedMsg.includes("intermediate") || normalizedMsg.includes("advanced")) {
                    
                    const levelName = userLevel === "beginner" ? "Tiểu học" : (userLevel === "intermediate" ? "THCS" : "THPT");
                    appendMessage("bibi", `Đã thiết lập trình độ tiếng Anh ${levelName}. Bạn hãy đặt câu hỏi để bắt đầu nhé! 😊`);
                    return; // chờ người dùng đặt câu hỏi tiếp theo
                } else {
                    // Người dùng không chọn mức cụ thể, đã tự xác định và thêm tin nhắn người dùng vào lịch sử
                    conversationHistory.push({ role: "user", content: message });
                }
            } else {
                // Đã có trình độ người dùng -> thêm tin nhắn người dùng vào lịch sử
                conversationHistory.push({ role: "user", content: message });
            }

            // Hiển thị trạng thái đang tìm câu trả lời
            const loadingDiv = showLoading();

            try {
                const reply = await getBiBiResponse(conversationHistory);
                
                // Xóa thông báo "đang tìm câu trả lời"
                removeLoading(loadingDiv);
                
                // Thêm phản hồi của AI vào lịch sử
                conversationHistory.push({ role: "assistant", content: reply });
                
                // Lưu lịch sử hội thoại
                saveConversationHistory(conversationHistory);
                
                // Kiểm tra đáp án đúng/sai trong phản hồi
                let feedbackClass = "";
                const replyLower = reply.trim().toLowerCase();
                if (replyLower.startsWith("đúng") || replyLower.startsWith("chính xác") ||
                    replyLower.startsWith("bạn đã trả lời đúng") || replyLower.startsWith("hoàn toàn chính xác")) {
                    feedbackClass = "correct-answer";
                } else if (replyLower.startsWith("sai") || replyLower.startsWith("chưa") ||
                           replyLower.startsWith("không đúng") || replyLower.startsWith("rất tiếc")) {
                    feedbackClass = "wrong-answer";
                }
                
                // Hiển thị tin nhắn phản hồi của AI (kèm định dạng đúng/sai nếu có)
                appendMessage("bibi", reply, feedbackClass);
            } catch (error) {
                console.error("Lỗi khi lấy phản hồi:", error);
                removeLoading(loadingDiv);
                appendMessage("bibi", "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.");
            }
        }
    });

    // Gửi tin khi nhấn Enter
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });

    // Tin nhắn chào mừng ban đầu (chỉ hiển thị nếu không có lịch sử)
    if (conversationHistory.length === 0) {
        appendMessage("bibi", "Chào bạn! 👋 Trước khi bắt đầu, hãy chọn trình độ tiếng Anh của bạn (nhập 1 - Tiểu học, 2 - THCS, 3 - THPT) hoặc cứ đặt câu hỏi và tôi sẽ tự đánh giá nhé.");
    } else {
        // Hiển thị lại lịch sử hội thoại nếu có
        conversationHistory.forEach(msg => {
            if (msg.role === 'user') {
                appendMessage('user', msg.content);
            } else if (msg.role === 'assistant') {
                let feedbackClass = "";
                const replyLower = msg.content.trim().toLowerCase();
                if (replyLower.startsWith("đúng") || replyLower.startsWith("chính xác")) {
                    feedbackClass = "correct-answer";
                } else if (replyLower.startsWith("sai") || replyLower.startsWith("chưa") || replyLower.startsWith("không đúng")) {
                    feedbackClass = "wrong-answer";
                }
                appendMessage('bibi', msg.content, feedbackClass);
            }
        });
    }
});