// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Header from './components/Header/Header';
import JoinScreen from './components/JoinScreen/JoinScreen';
import ChatInterface from './components/ChatInterface/ChatInterface';
import furiaLogo from './assets/img/logo-furia.svg';
import './App.css';

const SOCKET_SERVER_URL = 'http://localhost:5000';

// Lista de salas disponíveis
const AVAILABLE_ROOMS = [
  "#PartidaAoVivo", "#Memes", "#Notícias", "#DiscussõesTáticas"
];

function App() {
  const [username, setUsername] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(AVAILABLE_ROOMS[0]); // Sala padrão
  const [currentRoom, setCurrentRoom] = useState(''); // Sala que realmente entrou
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('appTheme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // --- LÓGICA DO SOCKET ---
  useEffect(() => {
    if (socketRef.current) return;

    console.log('Tentando conectar ao servidor Socket.IO...');
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      // reconnection: true, // Garante que tente reconectar
      // reconnectionDelay: 1000,
      // reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('Conectado! SID:', socket.id);
      setIsConnected(true);
      // Tenta re-entrar na sala se já estava em uma e reconectou
      if (currentRoom && username) {
         console.log(`Reconectado. Tentando re-entrar na sala ${currentRoom} como ${username}`);
         socket.emit('join', { username, room: currentRoom });
         // Limpa mensagens antigas para evitar confusão ou espera histórico
         setChatMessages([]);
      }
    };

    const handleDisconnect = (reason) => { /* ... (igual antes) ... */
        console.log('Desconectado:', reason);
        setIsConnected(false);
        setIsJoined(false);
        setCurrentRoom(''); // Limpa sala atual ao desconectar
        // Adiciona mensagem apenas se não for desconexão intencional (opcional)
        if (reason !== 'io client disconnect') {
             setChatMessages([{ _id: generateId(), type: 'system', text: 'Você foi desconectado.' }]);
        }
    };
    const handleConnectError = (err) => { /* ... (igual antes) ... */
        console.error('Erro de conexão:', err);
        if (!isConnected) {
            alert(`Falha ao conectar ao chat: ${SOCKET_SERVER_URL}. Verifique o servidor.`);
        }
        setIsConnected(false);
        setCurrentRoom('');
    };
    const handleHistory = (history) => { /* ... (igual antes) ... */
        console.log(`Histórico recebido para sala ${currentRoom}:`, history.length);
        setChatMessages(history.map(msg => ({ ...msg, _id: msg._id || generateId() })));
    };
    const handleNewMessage = (newMessage) => { /* ... (igual antes) ... */
        // Não precisa mais filtrar por sala, backend já faz isso
        console.log('Nova mensagem na sala:', newMessage.text);
        setChatMessages((prev) => [...prev, { ...newMessage, _id: generateId(), type: 'user' }]);
    };
    const handleUserJoined = (data) => { /* ... (igual antes, talvez ajustar texto) ... */
        console.log('User joined sala:', data.username);
        // Só mostra se não for o próprio usuário que acabou de dar join
        if (data.sid !== socket.id) {
             setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} entrou na sala.` }]);
        }
    };
    const handleUserLeft = (data) => { /* ... (igual antes, talvez ajustar texto) ... */
        console.log('User left sala:', data.username);
        setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} saiu da sala.` }]);
    };
    const handleJoinError = (data) => { // Listener para erro de join
        console.error("Erro ao entrar na sala:", data.message);
        alert(`Erro ao entrar na sala: ${data.message}`);
        setIsJoined(false); // Garante que não fique no estado "joined"
        setCurrentRoom('');
    };


    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message_history', handleHistory);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('join_error', handleJoinError); // Adiciona listener de erro

    return () => {
      console.log("Limpando listeners e desconectando...");
       // Remove todos os listeners específicos
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message_history', handleHistory);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('join_error', handleJoinError);
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []); // Roda só uma vez


  useEffect(() => { /* ... (scroll igual antes) ... */
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Atualizado para enviar NOME e SALA
  const handleJoin = (e) => {
    e?.preventDefault();
    console.log('--- handleJoin Iniciado ---'); // Log 1
    console.log('Estado atual: isConnected=', isConnected, 'username=', username, 'selectedRoom=', selectedRoom); // Log 2

    if (username.trim() && selectedRoom && socketRef.current && isConnected) {
      console.log('[handleJoin] Condições OK. Emitindo join...'); // Log 3
      socketRef.current.emit('join', {
          username: username.trim(),
          room: selectedRoom
      });
      setChatMessages([]); // Limpa mensagens
      console.log('[handleJoin] Definindo isJoined=true e currentRoom=', selectedRoom); // Log 4
      setIsJoined(true);
      setCurrentRoom(selectedRoom);
      console.log('[handleJoin] Estados definidos.'); // Log 5
    } else {
      console.log('[handleJoin] Condições NÃO atendidas.'); // Log 6
      if (!isConnected) {
         console.error("Tentativa de join falhou: Não conectado");
         alert('Ainda conectando...');
      } else if (!username.trim()){
        console.error("Tentativa de join falhou: Username vazio");
        alert('Nome de usuário inválido.');
      } else if (!selectedRoom){
         console.error("Tentativa de join falhou: Sala não selecionada");
         alert('Selecione uma sala.');
      } else {
         console.error("Tentativa de join falhou: Socket não pronto?");
      }
    }
     console.log('--- handleJoin Finalizado ---'); // Log 7
  };


  const handleSendMessage = (e) => { /* ... (igual antes) ... */
    e.preventDefault();
    if (message.trim() && socketRef.current && isConnected && isJoined) {
      socketRef.current.emit('send_message', { message: message.trim() });
      setMessage('');
    }
  };

  const isMyMessage = useCallback((msg) => { /* ... (igual antes) ... */
    return socketRef.current && msg.sid && msg.sid === socketRef.current.id;
  }, [isConnected]);

  return (
    <div className="App">
      <Header
        logoSrc={furiaLogo}
        theme={theme}
        toggleTheme={toggleTheme}
        currentRoom={currentRoom} // Passa a sala atual para o Header
      />

      <main className="main-content">
        {!isJoined || !currentRoom ? ( // Mostra JoinScreen se não entrou OU não tem sala definida
          <JoinScreen
            username={username}
            setUsername={setUsername}
            selectedRoom={selectedRoom}     // Passa sala selecionada
            setSelectedRoom={setSelectedRoom} // Passa função para atualizar sala
            availableRooms={AVAILABLE_ROOMS} // Passa lista de salas
            handleJoin={handleJoin}
            isConnected={isConnected}
          />
        ) : (
          <ChatInterface
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            isMyMessage={isMyMessage}
            messagesEndRef={messagesEndRef}
            isConnected={isConnected}
          />
        )}
      </main>
    </div>
  );
}

export default App;