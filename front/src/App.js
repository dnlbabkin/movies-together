import './App.css';
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid"


function App(){
  const [roomId, setRoomId] = useState('')
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || uuidv4())
  const [joined, setJoined] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const ws = useRef(null)


  useEffect(() => {
    localStorage.setItem('userId', userId)
  }, [userId]);

  const createRoom = async () => {
    try {
      const response = await fetch(`http://localhost:8080/createRoom?roomId=${roomId}`)
      if (response.ok) {
        console.log(`Room ${roomId} created`)
        setJoined(true);
        localStorage.setItem("roomId", roomId)
      } else {
        console.error(`Failed to create room: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error creating room:", error)
    }
  }

  const joinRoom = () => {
    if (ws.current) {
      ws.current.close();
    }

    console.log(`Joining room ${roomId} with user ${userId}`);

    ws.current = new WebSocket(`ws://localhost:8080/joinRoom/${roomId}/${userId}`)
    ws.current.onopen = () => {
      console.log("Connected to WebSocket")
    }
    ws.current.onmessage = (event) => {
      setCurrentUrl(event.data)
    }
    ws.current.onerror = (error) => {
      console.log("WebSocket error: ", error)
    }
    ws.current.onclose = () => {
      console.log("WebSocket connection close")
    }

    setJoined(true)
  }

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    } else {
      console.error("WebSocket is not open. Cannot send message")
    }
  }

  const leaveRoom = async () => {
    if (ws.current) {
      ws.current.close();
    }
    try {
      const response = await fetch(`http://localhost:8080/leaveRoom/${roomId}/${userId}`);
      if (response.ok) {
        console.log(`User ${userId} left room ${roomId}`);
        setJoined(false);
        setCurrentUrl('');
        window.location.href = '/';
      } else {
        console.error(`Failed to leave room: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  return (
      <div className="container">
        {!joined ? (
            <div className="centered">
              <div className="input-group">
                <input
                    type="text"
                    placeholder="Room Id"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={createRoom}>Создать комнату</button>
                <button onClick={joinRoom}>Присоединиться к комнате</button>
              </div>
            </div>
        ) : (
            <div className="centered">
              <div className="input-group">
                <input
                    type="text"
                    placeholder="Video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                />
                <button onClick={() => sendMessage(videoUrl)}>Отправить ссылку на видео</button>
                <button onClick={leaveRoom}>Выйти</button>
              </div>
              {currentUrl && (
                  <div className="video-container">
                    <iframe
                        src={currentUrl}
                        allowFullScreen
                        title="Shared video"
                    ></iframe>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}

export default App;
