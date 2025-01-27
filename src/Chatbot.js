import React, { useState, useRef, useEffect } from "react";
import './Chatbot.css';
import { motion } from "framer-motion";
import loginLogo from './logo.png';
import userImage from './user.png';
import teamImage1 from './team1.png';
import teamImage2 from './team2.png';
import teamImage3 from './team3.png';

const AboutModal = ({ onClose }) => (
    <div className="modal-overlay">
        <div className="modal-content">
            <h2>About AI Doctor</h2>
            <p>AI Doctor is your smart assistant for Healthy Life, powered by AI technology.</p>
            <h4>Developed by</h4>
            <div className="team-container">
                <div className="team-member">
                    <img src={teamImage1} alt="Team Member 1"/>
                    <h4>Md Rahmat ali</h4>
                </div>
                <div className="team-member">
                    <img src={teamImage2} alt="Team Member 2"/>
                    <h4>Suman</h4>
                </div>
                <div className="team-member">
                    <img src={teamImage3} alt="Team Member 3"/>
                    <h4>Ankit Roy</h4>
                </div>
            </div>
            <button onClick={onClose}>Close</button>
        </div>
    </div>
);

const Chatbot = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [messages, setMessages] = useState([{ sender: "bot", text: "I am AI Doctor,Trained by Rahmat ali. How can I assist you today?" }]);
    const [input, setInput] = useState("");
    const [filePreview, setFilePreview] = useState(null);
     const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const chatBodyRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogin = () => setIsLoggedIn(true);
    const handleLogout = () => setIsLoggedIn(false);
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }

        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.user-menu-container')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [messages, isDropdownOpen]);


     const formatMessage = (text) => {
        const paragraphs = text.split("\n\n"); // Split by double newlines
        return paragraphs.map((p, index) => <p key={index}>{p.trim()}</p>);
    };


   const handleSend = async () => {
        if (!input.trim() && !filePreview && !file) return;
        console.log("Handle Send Called!");

        const userMessage = input;
        setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
        setInput("");
        setLoading(true);
        setErrorMessage("");

        try {
           let botMessage = "";
            if (input.trim().toLowerCase() === "who are you") {
                 botMessage = "I am AI Doctor, developed by Rahmat ali.";
            }
            else if (file) {
                 // If there's a file, send it to the Python backend
                const formData = new FormData();
                formData.append('image', file);
                 const imageResponse = await fetch('http://localhost:5001/api/analyze-image', {
                            method: 'POST',
                            body: formData,
                        });
                        if (!imageResponse.ok) {
                            const errorData = await imageResponse.json();
                            const message = errorData?.details || errorData?.message || `API error: ${imageResponse.status} - Unknown error`;
                            throw new Error(message);
                         }
                         const imageData = await imageResponse.json();
                        botMessage = imageData.result;
                  setFile(null);
                  setFilePreview(null);
                }
             else {
                // If no file, send text to Gemini AI server
                const response = await fetch('http://localhost:5001/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: input }),
                 });

                    if (!response.ok) {
                        const errorData = await response.json();
                         const message = errorData?.details || errorData?.message || `API error: ${response.status} - Unknown error`;
                         throw new Error(message);
                     }
                    const data = await response.json();
                    botMessage = data.botMessage;
            }

            if (botMessage) {
                setMessages((prev) => [...prev, { sender: "bot", text: botMessage.replace(/\*\*/g, '') }]);
            } else {
                throw new Error("Unexpected response structure");
            }
        } catch (error) {
            console.error("Error:", error.message);
            setErrorMessage(`Sorry, I couldn't process your request. Please try again later. Details: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
          if (selectedFile) {
            setFilePreview(URL.createObjectURL(selectedFile));
            setFile(selectedFile);
            setMessages((prev) => [...prev, { sender: "user", text: `File attached: ${selectedFile.name}` }]);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsVoiceRecording(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.start();

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsVoiceRecording(false);
            };

            recognition.onerror = (event) => {
                setIsVoiceRecording(false);
                console.error("Speech recognition error: ", event.error);
                setErrorMessage(`Voice recognition error: ${event.error}`);
            };

            recognition.onend = () => {
                setIsVoiceRecording(false);
                console.log("Speech recognition ended.");
            };
        } else {
            alert("Voice recognition is not supported in this browser.");
        }
    };

   return (
        <div className="chatbot-container">
            {!isLoggedIn ? (
                <motion.div
                    className="login-screen"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                   <div className="login-logo-container">
                        <img src={loginLogo} alt="Logo" />
                    </div>
                    <h2>Welcome to AI Doctor</h2>
                    <p>"Your Smart AI Docs for Health Assistant"</p>
                    <button onClick={handleLogin}>Login</button>
                </motion.div>
            ) : (
                <motion.div
                    className="chatbot"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="chat-header">
                        <h1>AI Doctor</h1>
                        <p className="slogan">"Your Smart Docs Analysis and Checkup your health"</p>
                        <div className="chat-header-buttons">
                            <button onClick={() => setShowAbout(true)}>About</button>
                        </div>

                        <div className="user-menu-container">
                            <div className="user-image-header" onClick={toggleDropdown}>
                                <img src={userImage} alt="User" />
                            </div>
                            <div className={`user-dropdown ${isDropdownOpen ? 'active' : ''}`}>
                                <button>Accounts</button>
                                <button>Chats</button>
                                <button>App Language</button>
                                <button>Help</button>
                                <button>Notifications</button>
                                <button onClick={handleLogout}>Logout</button>
                            </div>
                        </div>
                    </div>

                    <div className="chat-body" ref={chatBodyRef}>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                className={`message ${msg.sender === "user" ? "user" : "bot"}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                            >
                               {msg.sender === 'bot' ? formatMessage(msg.text) : msg.text }
                            </motion.div>
                        ))}
                        {filePreview && (
                            <motion.div
                                className="message user"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img src={filePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: '10px' }} />
                            </motion.div>
                        )}
                    </div>

                    <div className="chat-footer">
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <button onClick={() => document.getElementById("fileInput").click()}>📎</button>
                        <button onClick={handleVoiceInput}>
                            {isVoiceRecording ? "Recording..." : "🎤"}
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={loading}
                        />
                        <button onClick={handleSend} disabled={loading}>
                            {loading ? "Sending..." : "Send"}
                        </button>
                    </div>

                    {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
                    {errorMessage && <div className="error">{errorMessage}</div>}
                </motion.div>
            )}
        </div>
    );
};

export default Chatbot;
