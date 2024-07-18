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
    const response = await fetch(`/createRoom?roomID=${roomId}`,{
      headers: { 'Content-Type': 'application/json' },
      credentials: "include"
    })
    if (response.ok) {
      console.log(`Room ${roomId} created`)
      setJoined(true)
      localStorage.setItem('roomId', roomId)
    } else {
      console.error(`Failed to create room: ${response.statusText}`);
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
