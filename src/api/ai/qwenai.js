const axios = require('axios');
const https = require('https');

module.exports = function(app) {
    // QwenAI class
    class QwenAI {
        constructor() {
            this.baseUrl = 'https://chat.qwen.ai';
            this.headers = {
                'Content-Type': 'application/json; charset=UTF-8',
                'bx-umidtoken': 'T2gAEiuOoZvJxP93Q4GS7ePK1xfzdFNWlPJU2Aqj1o1-VEtR2om7K3yL0W8B0_gTcdQ=',
                'bx-ua': '231!QYp3/4mUxi3+jj1vE+3BnMEjUq/YvqY2leOxacSC80vTPuB9lMZY9mRWFzrwLEV0PmcfY4rL2JFHeKTCyUQdACIzKZBlsbAyXt6Iz8TQ7ck9CIZgeOBOVaRK66GQqw/G9pMRBb28c0I6pXxeCmhbOvfWSOef25DQ3i/As+f0zSerWr2t0UuhjaYE9CndHUwSfovxr41pl4oI0haRMHhotOE6JZL9BstITi58O40Q3km+0QD3yE3oHFx4ETugG6LCC5k+++3+qHS+bxPsj++5Xi+468z+QXgUoVoVhkob8CG4+IeWeAMWYio+04QDmo6Ho+4jAb93GsVc0mXLJ9iU19FRDYdLNeBjlNK48ClAU8g5Wj1p+9r2RXIX+bK1PqHrxmQFIf2aHLSrwXI5t7bHzBiaK1ooObpU+OVXX6U+n4euc5TzqmYN3nllKRGNUmj5Ws9KVOnU9st6dSGPEcCsOQ3gASFbd/LW7pKUpO+NVjxK2QLNHwzXdkdqdpoWzlv8UBmp0eciO3tIb1cKt7/9/v1qeG/HvesVJbWjxW6F8Co1YQ8LVoTD4SNrNNIhnjTwEh/ObsagSnYTtbfglv+rOFDRgYkTMYog0C5Oc9Q+tMjHwh5cbI0UHO9E9WG9mRmWsI6UIUVHCuUTZ7nkR/A7fGackGOp9Wx0xa3soelLqN/Ph6dQGFfq9UAR+GKYMmPl6A4XFTy8YVJ6vYKMC4jwSeb/TMeKj/TFleyu6H9s0Hik5Un/u95Ak7Azk4ijAQYw43faK8KKVGm4AiUyCYUifSqISsfvRDN2fyUQjGpGUjB3RuWn6VoX+k0pb/hCBTK+oh97pYSuPNJmOcNUhUvT5oA99Ram7SAS8/+w/cHFX/ZhBoAMZ8FbUS6yrxGW1x+uedLRTiWG1R+Q52xBlV7J8WHE+2ItaJuuFBrcMnzXGCXGk49Qm6FogvpJ7CDFZKeWi3qDIAQyEcQVJQKLW9uwoJzGKJtNoUhQVNT+J/ixgMVFIMzH6cXn79K3Y1J+cSA0DCi7ihjvnIqJytzqdGxnOGmfitRXaDN3f58YrvsHJJEYqTBa2UWDvppv1toH4dCWNEC6CHve6aVa5PhHQsOYAAf0Ug72pOmX1C85FBITHQk+1rY3GJ5zLkbisBa/EwdWg0BgiPFGJGntuH4uj1cD/4baSHtCJax2HIs6CPjyXog7/hICYYVdga/JNdKQj+yeU31vOMSjNBJSftltyimgj0gl2x+o0ETUYzCVo5bydEywc5e1wd2YHrEjfP8u21JyYlCtmqlLoeU9UrfnZWDI+4A9M84rAtNNkZk4VSxEYcSb8OxuOHwSdXwOi8bTvy7a+as3qqaoi6oz8vJLTaLQtcQHlfmGp2i2mtzx++0l5Mc0dO/Mn6B5HWrlo6oAFb4gj502zY8UrGNUWXiv6kT511/Qw0RO/RZh09bL/qES='
            };
        }

        async createChat() {
            const url = `${this.baseUrl}/api/v2/chats/new`;
            const body = {
                title: "New Chat",
                models: ["qwen3-235b-a22b"],
                chat_mode: "guest",
                chat_type: "t2t",
                timestamp: Date.now()
            };
            try {
                const response = await axios.post(url, body, { headers: this.headers });
                this.chat_id = response.data.data.id;
                return this.chat_id;
            } catch (err) {
                return null;
            }
        }

        async fetchCompletion(message = "hai") {
            const chat_id = this.chat_id;
            if (!chat_id) return null;

            const data = JSON.stringify({
                stream: true,
                incremental_output: true,
                chat_id: chat_id,
                chat_mode: "guest",
                model: "qwen3-235b-a22b",
                parent_id: null,
                messages: [
                    {
                        fid: chat_id,
                        parentId: null,
                        childrenIds: [],
                        role: "user",
                        content: message,
                        user_action: "chat",
                        files: [],
                        timestamp: Date.now(),
                        models: ["qwen3-235b-a22b"],
                        chat_type: "t2t",
                        feature_config: { thinking_enabled: false, output_schema: "phase" },
                        extra: { meta: { subChatType: "t2t" } },
                        sub_chat_type: "t2t",
                        parent_id: null
                    }
                ],
                timestamp: Date.now()
            });

            const options = {
                hostname: 'chat.qwen.ai',
                path: `/api/v2/chat/completions?chat_id=${chat_id}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                    ...this.headers
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    let result = '';
                    res.on('data', chunk => {
                        const lines = chunk.toString().split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                                        result += json.choices[0].delta.content;
                                    }
                                } catch (e) {}
                            }
                        }
                    });
                    res.on('end', () => resolve(result));
                });

                req.on('error', err => reject(err));
                req.write(data);
                req.end();
            });
        }
    }

    // QwenAI endpoint
    app.get('/ai/qwen', async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }

            const qwen = new QwenAI();
            await qwen.createChat();
            const result = await qwen.fetchCompletion(text);

            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });
};
