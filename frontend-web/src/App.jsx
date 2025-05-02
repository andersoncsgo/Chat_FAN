// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Header from './components/Header/Header';
import JoinScreen from './components/JoinScreen/JoinScreen';
import ChatInterface from './components/ChatInterface/ChatInterface';
import furiaLogo from './assets/img/logo-furia.svg'; // Certifique-se que o caminho está correto
import './App.css';

// URL do backend na Render (ou localhost para teste local)
const SOCKET_SERVER_URL = 'https://chat-fan.onrender.com';
// const SOCKET_SERVER_URL = 'http://localhost:5000'; // Para teste local

// Lista de salas disponíveis
const AVAILABLE_ROOMS = [
  "#PartidaAoVivo", "#Memes", "#Notícias", "#DiscussõesTáticas"
];

function App() {
  // Estados do componente
  const [username, setUsername] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(AVAILABLE_ROOMS[0]); // Sala selecionada no <select>
  const [currentRoom, setCurrentRoom] = useState(''); // Sala em que o usuário está atualmente conectado
  const [isJoined, setIsJoined] = useState(false); // Flag se o usuário entrou numa sala
  const [message, setMessage] = useState(''); // Mensagem atual no input
  const [chatMessages, setChatMessages] = useState([]); // Array com histórico de mensagens da sala
  const [isConnected, setIsConnected] = useState(false); // Status da conexão WebSocket
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light'); // Estado do tema (light/dark)

  // Refs para elementos
  const socketRef = useRef(null); // Referência para o objeto do socket
  const messagesEndRef = useRef(null); // Referência para scroll automático

  // --- Gerenciamento do Tema ---
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('appTheme', newTheme);
      return newTheme;
    });
  };

  // Aplica a classe do tema ao body quando o tema muda
  useEffect(() => {
    document.body.className = ''; // Limpa classes anteriores
    document.body.classList.add(`${theme}-theme`);
  }, [theme]);

  // --- Função Utilitária ---
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // --- Lógica de Conexão e Listeners do Socket.IO ---
  useEffect(() => {
    // Previne múltiplas conexões se o efeito rodar novamente (ex: StrictMode)
    if (socketRef.current) return;

    console.log('Tentando conectar ao servidor Socket.IO...');
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'], // Força WebSocket para evitar problemas de polling
      reconnectionAttempts: 5,   // Tenta reconectar algumas vezes
    });
    socketRef.current = socket; // Armazena a instância do socket na ref

    // ---- Handlers de Eventos do Socket ----
    const handleConnect = () => {
      console.log('Conectado ao servidor! SID:', socket.id);
      setIsConnected(true);
      // Tenta re-entrar automaticamente na sala se já estava em uma e reconectou
      if (currentRoom && username) {
         console.log(`Reconectado. Tentando re-entrar na sala ${currentRoom} como ${username}`);
         socket.emit('join', { username, room: currentRoom });
         setChatMessages([]); // Limpa mensagens antigas ao re-entrar
      }
    };

    const handleDisconnect = (reason) => {
      console.log('Desconectado do servidor:', reason);
      setIsConnected(false);
      setIsJoined(false); // Desloga o usuário do estado 'joined'
      setCurrentRoom(''); // Limpa a sala atual
      // Mostra mensagem de desconexão apenas se não foi intencional
      if (reason !== 'io client disconnect') {
           setChatMessages([{ _id: generateId(), type: 'system', text: 'Você foi desconectado. Tentando reconectar...' }]);
      }
    };

    const handleConnectError = (err) => {
      console.error('Erro de conexão com Socket.IO:', err);
      // Mostra alerta apenas se não estava previamente conectado
      if (!isConnected) {
          alert(`Não foi possível conectar ao servidor de chat: ${SOCKET_SERVER_URL}. Verifique se o backend está rodando e a URL está correta.`);
      }
      setIsConnected(false);
      setCurrentRoom(''); // Reseta sala em caso de erro grave
    };

    const handleHistory = (history) => {
      console.log(`Histórico recebido para sala ${currentRoom}:`, history.length);
      // Mapeia o histórico recebido, garantindo um _id único para cada mensagem
      setChatMessages(history.map(msg => ({ ...msg, _id: msg._id || generateId() })));
    };

    const handleNewMessage = (newMessage) => {
      console.log('Nova mensagem recebida na sala:', newMessage.text);
      // Adiciona a nova mensagem ao estado, garantindo _id e tipo
      setChatMessages((prev) => [...prev, { ...newMessage, _id: generateId(), type: 'user' }]);
    };

    const handleUserJoined = (data) => {
      console.log('Usuário entrou na sala:', data.username);
      // Adiciona mensagem de sistema apenas se não for o próprio usuário
      if (data.sid !== socket.id) {
           setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} entrou na sala.` }]);
      }
    };

    const handleUserLeft = (data) => {
      console.log('Usuário saiu da sala:', data.username);
      setChatMessages((prev) => [...prev, { _id: generateId(), type: 'system', text: `${data.username} saiu da sala.` }]);
    };

    const handleJoinError = (data) => {
      console.error("Erro ao tentar entrar na sala:", data.message);
      alert(`Erro ao entrar na sala: ${data.message}`);
      // Reseta o estado para voltar à tela de join
      setIsJoined(false);
      setCurrentRoom('');
    };

    // ---- Registrando os Listeners ----
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message_history', handleHistory);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('join_error', handleJoinError);

    // ---- Função de Limpeza (Cleanup) ----
    // Executada quando o componente App é desmontado
    return () => {
      console.log("Desmontando App: Limpando listeners e desconectando socket...");
      // Remove todos os listeners para evitar vazamentos de memória
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message_history', handleHistory);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('join_error', handleJoinError);
      // Desconecta o socket se ainda estiver conectado
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null; // Limpa a referência
    };
  }, []); // Array de dependências vazio: Roda este efeito SOMENTE na montagem inicial do App

  // --- Efeito para Scroll Automático ---
  useEffect(() => {
    // Rola para o final da lista de mensagens suavemente sempre que chatMessages mudar
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- Handlers de Ações do Usuário ---

  /**
   * Chamado quando o usuário submete o formulário de Join.
   * Emite o evento 'join' para o backend com nome e sala selecionada.
   */
  const handleJoin = (e) => {
    e?.preventDefault(); // Previne recarregamento da página se 'e' for um evento
    console.log('--- Tentativa de Join ---');
    console.log('Estado atual: isConnected=', isConnected, 'username=', username, 'selectedRoom=', selectedRoom);

    // Validações antes de emitir
    if (username.trim() && selectedRoom && socketRef.current && isConnected) {
      console.log('[handleJoin] Emitindo evento join...');
      socketRef.current.emit('join', {
          username: username.trim(),
          room: selectedRoom
      });
      setChatMessages([]); // Limpa mensagens da sala anterior ao entrar
      setIsJoined(true);    // Define que o usuário entrou
      setCurrentRoom(selectedRoom); // Define a sala atual
      console.log('[handleJoin] Estados atualizados: isJoined=true, currentRoom=', selectedRoom);
    } else {
      // Mensagens de erro específicas para o usuário
      console.log('[handleJoin] Falha nas condições de join.');
      if (!isConnected) {
         alert('Não foi possível conectar ao servidor. Tente recarregar a página.');
      } else if (!username.trim()){
        alert('Por favor, insira um nome de usuário válido.');
      } else if (!selectedRoom){
         alert('Por favor, selecione uma sala para entrar.');
      } else {
         alert('Ocorreu um erro inesperado ao tentar entrar.');
      }
    }
     console.log('--- Fim da Tentativa de Join ---');
  };

  /**
   * Chamado quando o usuário submete o formulário de envio de mensagem.
   * Emite o evento 'send_message' para o backend.
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && socketRef.current && isConnected && isJoined) {
      socketRef.current.emit('send_message', { message: trimmedMessage });
      setMessage(''); // Limpa o campo de input após enviar
    } else {
        console.warn('Não foi possível enviar mensagem. Condições não atendidas:', {trimmedMessage, isConnected, isJoined});
    }
  };

  /**
   * Chamado quando o usuário clica em um botão de sala diferente da atual.
   * Emite 'join' para o backend (que cuida da troca) e atualiza o estado local.
   */
   const handleSwitchRoom = (newRoom) => {
    if (newRoom === currentRoom || !isConnected || !socketRef.current || !isJoined) {
      // Não faz nada se for a mesma sala, desconectado, sem socket ou não "joined"
      console.log("Troca de sala ignorada:", {newRoom, currentRoom, isConnected, isJoined});
      return;
    }
    console.log(`Iniciando troca para sala ${newRoom} como ${username}`);

    // Emite o evento 'join' para o backend com a nova sala
    socketRef.current.emit('join', { username: username, room: newRoom });

    // Atualiza o estado do frontend para refletir a mudança imediatamente
    setCurrentRoom(newRoom);
    setSelectedRoom(newRoom); // Sincroniza o select (se visível)
    setMessage('');       // Limpa o campo de mensagem
    setChatMessages([]);  // Limpa as mensagens da sala antiga
    // Adiciona uma mensagem de sistema local para feedback
    setChatMessages([{ _id: generateId(), type: 'system', text: `Entrando na sala ${newRoom}...` }]);
  };

  /**
   * Chamado quando o usuário clica no logo no Header.
   * Reseta o estado para voltar à tela de Join.
   */
  const handleGoToJoinScreen = () => {
    console.log("Retornando para a tela de Join...");
    // Desconectar força a limpeza de estados pelo listener 'disconnect'
    if (socketRef.current?.connected) {
        // Envia uma mensagem de desconexão explícita para o servidor saber (opcional)
        // socketRef.current.emit('leave_chat'); // Se tivesse um evento customizado
        socketRef.current.disconnect(); // Dispara o listener 'disconnect'
    }
    // Reseta estados manualmente para garantir a volta à tela de Join
    setIsJoined(false);
    setCurrentRoom('');
    setUsername(''); // Limpa username para forçar nova entrada
    setChatMessages([]); // Limpa mensagens
    // Define a sala padrão selecionada novamente
    setSelectedRoom(AVAILABLE_ROOMS[0]);
  };

  // --- Função Auxiliar (Memoizada) ---
  /**
   * Verifica se uma mensagem foi enviada pelo usuário atual.
   * Usa useCallback para otimizar performance, evitando recriação desnecessária.
   */
  const isMyMessage = useCallback((msg) => {
    return socketRef.current && msg.sid && msg.sid === socketRef.current.id;
  }, [isConnected]); // Recria a função apenas se o status de conexão mudar


  // --- Renderização do Componente ---
  return (
    <div className="App"> {/* Classe para estilos gerais do App */}
      <Header
        logoSrc={furiaLogo} // Passa o logo importado
        theme={theme}       // Passa o tema atual (light/dark)
        toggleTheme={toggleTheme} // Passa a função para trocar o tema
        currentRoom={currentRoom} // Passa a sala atual para exibir no header
        handleGoToJoinScreen={handleGoToJoinScreen} // Passa a função para voltar ao Join
      />

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Renderização Condicional: Mostra JoinScreen ou ChatInterface */}
        {!isJoined || !currentRoom ? (
          // Se não estiver 'joined' ou sem sala definida, mostra a tela de entrada
          <JoinScreen
            username={username}
            setUsername={setUsername}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            availableRooms={AVAILABLE_ROOMS}
            handleJoin={handleJoin}
            isConnected={isConnected} // Para habilitar/desabilitar inputs
          />
        ) : (
          // Se estiver 'joined' e com sala definida, mostra a interface do chat
          <ChatInterface
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            isMyMessage={isMyMessage}
            messagesEndRef={messagesEndRef} // Para scroll automático
            isConnected={isConnected} // Para habilitar/desabilitar inputs/botões
            // Passa dados/funções das salas para a interface
            availableRooms={AVAILABLE_ROOMS}
            currentRoom={currentRoom}
            handleSwitchRoom={handleSwitchRoom}
          />
        )}
      </main>
    </div>
  );
}

export default App;