import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css'; // Criaremos este arquivo para estilos básicos

// Conecte ao IP da sua máquina onde o backend está rodando
// Se estiver rodando tudo localmente, pode ser 'http://localhost:5000'
// Se o celular/emulador precisar acessar, use o IP da rede local (ex: 'http://192.168.1.105:5000')
const SOCKET_SERVER_URL = 'http://localhost:5000'; // <-- MUDE AQUI SE NECESSÁRIO

function App() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // Para rolar para o final

  // Conecta ao Socket.IO e configura listeners
  useEffect(() => {
    // Só conecta se ainda não estiver conectado
    if (!socketRef.current) {
      console.log('Conectando ao servidor Socket.IO...');
      // Inicializa a conexão
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'], // Força WebSocket para evitar problemas de polling
      });

      // Listener para o histórico inicial
      socketRef.current.on('message_history', (history) => {
        console.log('Histórico recebido:', history);
        setChatMessages(history);
      });

      // Listener para novas mensagens
      socketRef.current.on('new_message', (newMessage) => {
        console.log('Nova mensagem recebida:', newMessage);
        // Atualiza o estado adicionando a nova mensagem
        // É importante usar a forma funcional do setState aqui para garantir
        // que estamos usando o estado mais recente das mensagens.
        setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      });

       // Listener para usuário entrou
       socketRef.current.on('user_joined', (data) => {
        console.log('Usuário entrou:', data.username);
        setChatMessages((prevMessages) => [
            ...prevMessages,
            { type: 'system', text: `${data.username} entrou no chat!` }
        ]);
      });

      // Listener para usuário saiu
      socketRef.current.on('user_left', (data) => {
        console.log('Usuário saiu:', data.username);
         setChatMessages((prevMessages) => [
            ...prevMessages,
            { type: 'system', text: `${data.username} saiu do chat.` }
        ]);
      });

      // Listener para erros de conexão
      socketRef.current.on('connect_error', (err) => {
        console.error('Erro de conexão:', err);
        alert(`Não foi possível conectar ao servidor de chat: ${SOCKET_SERVER_URL}. Verifique se o backend está rodando e o endereço está correto.`);
      });

      socketRef.current.on('connect', () => {
         console.log('Conectado com sucesso! SID:', socketRef.current.id);
      });

       socketRef.current.on('disconnect', (reason) => {
        console.log('Desconectado:', reason);
        setIsJoined(false); // Reseta o estado de joined
         setChatMessages((prevMessages) => [
            ...prevMessages,
            { type: 'system', text: `Você foi desconectado.` }
        ]);
      });
    }

    // Função de limpeza ao desmontar o componente
    return () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Desconectando do servidor Socket.IO...');
        socketRef.current.disconnect();
        socketRef.current = null; // Limpa a referência
      }
    };
  }, []); // Roda apenas uma vez na montagem


  // Rola para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]); // Roda sempre que chatMessages mudar


  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join', { username });
      setIsJoined(true);
    } else if (!socketRef.current || !socketRef.current.connected) {
         alert('Não conectado ao servidor de chat. Tente recarregar a página.');
    } else {
      alert('Por favor, insira um nome de usuário.');
    }
  };


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socketRef.current && socketRef.current.connected && isJoined) {
      console.log(`Enviando mensagem: ${message}`);
      // Emite o evento 'send_message' para o servidor
      socketRef.current.emit('send_message', { message: message });
      // Limpa o campo de input
      setMessage('');
    } else if (!isJoined) {
        alert('Você precisa entrar no chat primeiro!');
    } else {
        console.log('Não foi possível enviar. Mensagem vazia ou socket desconectado.');
    }
  };

  // Função para determinar se a mensagem é do usuário atual
  const isMyMessage = useCallback((msg) => {
      return socketRef.current && msg.sid === socketRef.current.id;
  }, []); // Não tem dependências que mudam frequentemente


  return (
    <div className="App">
      <h1>FURIA Chat  🐾</h1> {/* "Fan" em coreano, referência à FURIA */}

      {!isJoined ? (
        <form onSubmit={handleJoin} className="join-form">
           <h2>Entre no Chat</h2>
           <input
             type="text"
             value={username}
             onChange={(e) => setUsername(e.target.value)}
             placeholder="Digite seu nome de usuário"
             maxLength="20"
             required
           />
           <button type="submit">Entrar</button>
        </form>
      ) : (
        <div className="chat-container">
            <div className="chat-messages">
            {chatMessages.map((msg, index) => (
                <div
                    key={index}
                    className={`message ${
                        msg.type === 'system' ? 'system' :
                        isMyMessage(msg) ? 'my-message' : 'other-message'
                    }`}
                >
                {msg.type !== 'system' && <span className="username">{isMyMessage(msg) ? 'Você' : msg.username}:</span>}
                {msg.text}
                </div>
            ))}
            {/* Elemento invisível para ajudar a rolar */}
            <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
            />
            <button type="submit">Enviar</button>
            </form>
      </div>
      )}
    </div>
  );
}

export default App;