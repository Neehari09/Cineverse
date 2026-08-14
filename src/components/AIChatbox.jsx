import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getNowPlayingMovies, searchMovies, getMovieDetails } from '../api/tmdb';
import './AIChatbox.css';
function IconChat() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
    );
}

function IconClose() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );
}

const SYSTEM_PROMPT = {
    role: "system",
    content: "You are CineBot, a strict movie discovery assistant for CineVerse. " +
             "You ONLY answer questions related to movies, TV shows, cinema, directors, actors, and the CineVerse app itself. " +
             "IMPORTANT INSTRUCTION: For your very first response to the user, you MUST start your response with exactly: 'according to movie database.....' and then continue your answer. " +
             "If the user asks you anything else (such as writing Python code, generating recipes, mathematical equations, general history, programming help, etc.), you MUST decline politely but firmly. " +
             "Do not write code, do not explain coding concepts, and do not solve non-movie-related problems. " +
             "For example: 'I am CineBot, and I can only help you with movie-related queries. Let\'s talk about movies instead!' " +
             "Keep answers engaging, conversational, and tailored to movie lovers."
};

const TOOLS = [
    {
        type: "function",
        function: {
            name: "get_now_playing_movies",
            description: "Get a list of movies currently playing in theaters. Use this when the user asks about what's in theaters or now playing.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "search_movies",
            description: "Search for movies by a query string. Use this when the user asks for a specific movie or movies related to a keyword.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The search query (e.g., 'Inception', 'Action movies')" },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_movie_details",
            description: "Get detailed information about a specific movie by its TMDB ID.",
            parameters: {
                type: "object",
                properties: {
                    movie_id: { type: "integer", description: "The TMDB movie ID." },
                },
                required: ["movie_id"],
            },
        },
    },
];

export default function AIChatbox() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Hi! I am CineBot. How can I help you discover movies today?' }
    ]);
    const [apiHistory, setApiHistory] = useState([SYSTEM_PROMPT]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const chatBodyRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        
        const userText = input;
        setInput('');
        setLoading(true);

        // Update UI messages
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);

        // Ensure the system prompt has the latest URL context
        const dynamicSystemPrompt = {
            ...apiHistory[0],
            content: SYSTEM_PROMPT.content + `\n\nContext: The user is currently viewing the URL path: ${location.pathname}. Use this context to answer questions about 'this page' or 'this movie'.`
        };

        // Update API history
        const newHistory = [dynamicSystemPrompt, ...apiHistory.slice(1), { role: 'user', content: userText }];
        setApiHistory(newHistory);

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!apiKey) {
                throw new Error("Groq API key not found. Please set VITE_GROQ_API_KEY in your .env file.");
            }

            let data;
            let message;
            let response;
            
            try {
                response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: newHistory,
                        tools: TOOLS,
                        tool_choice: "auto",
                        temperature: 0.7,
                        max_tokens: 512
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || "Failed to fetch response from Groq.");
                }

                data = await response.json();
                message = data.choices[0]?.message;
            } catch (err) {
                // If Groq API fails to parse a tool call internally (often happens on short messages like "yes"), 
                // it throws a 400. We should fallback to a standard text completion without tools.
                console.warn("Tool call failed, retrying without tools...", err);
                response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: newHistory,
                        temperature: 0.7,
                        max_tokens: 512
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || "Failed to fetch fallback response from Groq.");
                }
                data = await response.json();
                message = data.choices[0]?.message;
            }

            if (message?.tool_calls) {
                // Append the assistant's tool_call to the history
                newHistory.push(message);

                // Execute each tool call
                for (const toolCall of message.tool_calls) {
                    const funcName = toolCall.function.name;
                    let args = {};
                    try {
                        args = JSON.parse(toolCall.function.arguments || "{}");
                    } catch (parseErr) {
                        console.error("Failed to parse tool arguments", parseErr);
                    }
                    let toolResult = "";

                    try {
                        if (funcName === "get_now_playing_movies") {
                            const movies = await getNowPlayingMovies(1);
                            toolResult = JSON.stringify(movies.map(m => ({ id: m.id, title: m.title, rating: m.vote_average })));
                        } else if (funcName === "search_movies") {
                            const res = await searchMovies(args.query || "", 1);
                            toolResult = JSON.stringify(res.results.map(m => ({ id: m.id, title: m.title, rating: m.vote_average })));
                        } else if (funcName === "get_movie_details") {
                            if (!args.movie_id) throw new Error("Missing movie_id argument");
                            try {
                                const res = await getMovieDetails(args.movie_id);
                                toolResult = JSON.stringify({ title: res.title, overview: res.overview, genres: res.genres, release_date: res.release_date, rating: res.vote_average });
                            } catch (e) {
                                toolResult = "Movie not found. Please try another query.";
                            }
                        } else {
                            toolResult = "Function not found.";
                        }
                    } catch (err) {
                        toolResult = `Error: ${err.message}`;
                    }

                    newHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: funcName,
                        content: toolResult
                    });
                }

                // Send the tool results back to Groq
                response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: newHistory,
                        temperature: 0.7,
                        max_tokens: 512
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || "Failed to fetch secondary response.");
                }
                data = await response.json();
                message = data.choices[0]?.message;
            }

            const aiResponseText = message?.content || "Sorry, I couldn't process that.";

            setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
            setApiHistory([...newHistory, { role: 'assistant', content: aiResponseText }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cv-ai-chat-container">
            {isOpen && (
                <div className="cv-ai-chat-window">
                    <div className="cv-ai-chat-header">
                        <h4>CineBot AI</h4>
                        <button onClick={toggleChat} className="cv-ai-chat-close"><IconClose /></button>
                    </div>
                    <div className="cv-ai-chat-body" ref={chatBodyRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`cv-ai-chat-msg ${msg.sender === 'ai' ? 'cv-ai-msg' : 'cv-user-msg'}`}>
                                {msg.sender === 'ai' ? (
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="cv-ai-chat-msg cv-ai-msg cv-typing-indicator">
                                CineBot is thinking...
                            </div>
                        )}
                    </div>
                    <form className="cv-ai-chat-input" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Ask about movies..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>Send</button>
                    </form>
                </div>
            )}
            
            <button className="cv-ai-chat-btn" onClick={toggleChat} title="Chat with AI">
                {isOpen ? <IconClose /> : <IconChat />}
            </button>
        </div>
    );
}
