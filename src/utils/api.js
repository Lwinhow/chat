import axios from "axios";

const API_KEY = '';  // 填入 DeepSeek key：https://platform.deepseek.com/api_keys
const API_URL = 'https://api.deepseek.com/v1';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
});

export default {
    getCompletion(model, messages) {
        return apiClient.post(`/chat/completions`, {
            model: model,
            messages: messages
        });
    }
};
