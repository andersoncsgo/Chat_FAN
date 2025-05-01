// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Importe os novos componentes
import Header from './components/Header/Header';
import JoinScreen from './components/JoinScreen/JoinScreen';
import ChatInterface from './components/ChatInterface/ChatInterface';

// Importe o logo
import furiaLogo from './assets/img/logo-furia.svg'; // Caminho atualizado

// Importe os estilos globais (ajustaremos ele)
import './App.css';

// Conecte ao IP da sua máquina onde o backend está rodando
const SOCKET_SERVER_URL = 'http://localhost:5000'; // <-- MUDE AQUI SE NECESSÁRIO (IP local se for mobile)

// Interface/Tipo para mensagem (mesmo se for JS, ajuda a entender)
// interface ChatMessage { _id?: string; username?: string; text: string; sid?: string; type?: 'system' | 'user'; }

function App() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]); // Array de ChatMessage
  const [isConnected, setIsConnected] = useState(false); // Novo estado para conexão
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // Para rolar para o final

  // Função para gerar ID simples (substitua por UUID em produção)
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Conecta ao Socket.IO e configura listeners
  useEffect(() => {
    console.log('Tentando conectar ao servidor Socket.IO...');
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5, // Tenta reconectar
    });

    socketRef.current.on('connect', () => {
      console.log('Conectado com sucesso! SID:', socketRef.current.id);
      setIsConnected(true);
      // Se já tinha um nome de usuário e reconectou, entra novamente
      if (username && !isJoined) {
         socketRef.current.emit('join', { username });
         // Não seta isJoined aqui, espera a confirmação ou lógica de join
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Desconectado:', reason);
      setIsConnected(false);
      setIsJoined(false); // Sai do chat ao desconectar
       setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: 'Você foi desconectado.' }]);
      // Poderia tentar reconectar manualmente ou mostrar aviso
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Erro de conexão:', err);
      setIsConnected(false);
      // Mostra aviso apenas se não estava conectado antes para evitar spam
      if (!isConnected) {
          // Poderia mostrar um Toast/Snackbar em vez de alert
           alert(`Não foi possível conectar ao servidor de chat: ${SOCKET_SERVER_URL}. Verifique o backend e o endereço.`);
      }

    });

    // Listener para o histórico inicial (pode vir vazio se o server não guardar)
    socketRef.current.on('message_history', (history) => {
      console.log('Histórico recebido:', history);
      setChatMessages(history.map(msg => ({ ...msg, _id: msg._id || generateId() }))); // Garante _id
    });

    // Listener para novas mensagens
    socketRef.current.on('new_message', (newMessage) => {
      console.log('Nova mensagem:', newMessage);
      setChatMessages((prevMessages) => [
          ...prevMessages,
          { ...newMessage, _id: generateId(), type: 'user' } // Garante _id e type
      ]);
    });

     // Listener para usuário entrou
     socketRef.current.on('user_joined', (data) => {
      console.log('Usuário entrou:', data.username);
      // Evita adicionar mensagem se o próprio usuário entrou (opcional)
      if (data.sid !== socketRef.current?.id) {
           setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} entrou no chat!` }]);
      }
     });

    // Listener para usuário saiu
    socketRef.current.on('user_left', (data) => {
      console.log('Usuário saiu:', data.username);
       setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} saiu do chat.` }]);
    });


    // Função de limpeza ao desmontar o componente
    return () => {
      if (socketRef.current?.connected) {
        console.log('Desconectando do servidor Socket.IO...');
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [username]); // Adiciona username como dependência para tentar re-join


  // Rola para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]); // Roda sempre que chatMessages mudar


  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() && socketRef.current && isConnected) {
      socketRef.current.emit('join', { username: username.trim() });
      setIsJoined(true); // Assume que entrou (idealmente esperar confirmação do server)
       setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `Você entrou como ${username.trim()}.` }]);
    } else if (!isConnected) {
         alert('Ainda conectando ao servidor, tente novamente em um instante.');
    } else {
      alert('Por favor, insira um nome de usuário válido.');
    }
  };


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socketRef.current && isConnected && isJoined) {
      socketRef.current.emit('send_message', { message: message.trim() });
      setMessage('');
    } else {
        console.log('Não foi possível enviar. Verifique a conexão e se está no chat.');
    }
  };

  // Função para determinar se a mensagem é do usuário atual
  // Usar useCallback para otimizar, especialmente se passar para muitos filhos
  const isMyMessage = useCallback((msg) => {
      // Verifica se o socket existe e se o SID da mensagem bate com o SID atual
      return socketRef.current && msg.sid && msg.sid === socketRef.current.id;
  }, [isConnected]); // Recria a função se o estado de conexão mudar (socket.id pode mudar)


  return (
    <div className="App">
      <Header logoSrc={furiaLogo} /> {/* Passa o logo importado */}

      <main className="main-content"> {/* Wrapper para o conteúdo principal */}
        {!isJoined ? (
          <JoinScreen
            username={username}
            setUsername={setUsername}
            handleJoin={handleJoin}
            isConnected={isConnected} // Passa o estado de conexão
          />
        ) : (
          <ChatInterface
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            isMyMessage={isMyMessage}
            messagesEndRef={messagesEndRef}
            isConnected={isConnected} // Passa o estado de conexão
          />
        )}
      </main>
    </div>
  );
}

export default App;