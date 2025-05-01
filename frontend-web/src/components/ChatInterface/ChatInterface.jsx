// src/components/ChatInterface/ChatInterface.jsx
import React, { useRef } from 'react'; // Adiciona useRef para focar input
import styles from './ChatInterface.module.css';
import { parseEmojis } from '../../utils/emojiParser'; // Assume que este utilitário existe

// Importa a imagem para o botão de emoji
import badfallenEmojiImg from '../../assets/img/badfallen.webp'; // Certifique-se que o caminho está correto

function ChatInterface({
  chatMessages,
  message,
  setMessage,
  handleSendMessage,
  isMyMessage,
  messagesEndRef,
  isConnected,
  // --- Novas props para Salas ---
  availableRooms, // Recebe a lista de salas disponíveis
  currentRoom,    // Recebe a sala atual do usuário
  handleSwitchRoom, // Recebe a função para trocar de sala
}) {
  // Ref para poder focar o campo de input programaticamente
  const inputRef = useRef(null);

  /**
   * Adiciona um código de emoji ao final do texto no campo de input
   * e foca o campo novamente.
   * @param {string} emojiCode - O código do emoji a ser adicionado (ex: ':badfallen:')
   */
  const addEmoji = (emojiCode) => {
    setMessage((prev) => prev + emojiCode); // Concatena o código ao estado atual
    inputRef.current?.focus(); // Tenta focar o input (o '?' evita erro se inputRef.current for null)
  };

  return (
    <div className={styles.chatContainer}>
        {/* --- Seção de Seleção/Visualização de Salas --- */}
        <div className={styles.roomListContainer}>
            <span className={styles.roomListTitle}>Salas:</span>
            {/*
             * CORREÇÃO: Adicionado '|| []'
             * Garante que, mesmo se availableRooms for undefined momentaneamente,
             * o .map() será chamado em um array vazio, evitando o erro.
            */}
            {(availableRooms || []).map(room => (
                <button
                    key={room} // Chave única para cada botão da lista
                    onClick={() => handleSwitchRoom(room)} // Chama a função passada por props ao clicar
                    // Aplica classes CSS: base, e 'activeRoom' se for a sala atual
                    className={`${styles.roomButton} ${room === currentRoom ? styles.activeRoom : ''}`}
                    // Desabilita o botão se for a sala atual ou se estiver desconectado
                    disabled={room === currentRoom || !isConnected}
                    title={`Entrar na sala ${room}`} // Tooltip para acessibilidade
                >
                    {room} {/* Mostra o nome da sala no botão */}
                </button>
            ))}
        </div>

      {/* --- Área de Exibição das Mensagens --- */}
      <div className={styles.chatMessages}>
        {/* Mapeia o array de mensagens para renderizar cada uma */}
        {chatMessages.map((msg, index) => (
           <div
            key={msg._id || index} // Usa _id se disponível (do backend), senão o índice como fallback
            // Aplica classes CSS dinâmicas baseadas no tipo e origem da mensagem
            className={`${styles.message} ${
              msg.type === 'system'
                ? styles.system // Mensagem do sistema
                : isMyMessage(msg)
                ? styles.myMessage // Mensagem do próprio usuário
                : styles.otherMessage // Mensagem de outro usuário
            }`}
          >
            {/* Mostra o nome do usuário apenas se não for mensagem do sistema */}
            {msg.type !== 'system' && (
              <span className={styles.username}>
                {isMyMessage(msg) ? 'Você' : msg.username}: {/* Mostra 'Você' ou o nome */}
              </span>
            )}
            {/* Renderiza o texto: usa parseEmojis se for msg de usuário, senão texto normal */}
            {msg.type === 'system' ? msg.text : parseEmojis(msg.text)}
          </div>
        ))}
        {/* Div vazia no final para ajudar o scroll automático a funcionar */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Formulário de Envio de Mensagem com Botão Emoji --- */}
      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        {/* Campo de Input de Texto */}
        <input
          ref={inputRef} // Associa a ref criada ao elemento input
          type="text"
          value={message} // Controlado pelo estado 'message'
          onChange={(e) => setMessage(e.target.value)} // Atualiza o estado ao digitar
          placeholder={isConnected ? "Digite sua mensagem..." : "Reconectando..."} // Placeholder dinâmico
          className={styles.input}
          disabled={!isConnected} // Desabilita se desconectado
        />
        {/* Botão para Adicionar Emoji Personalizado */}
        <button
          type="button" // Impede que o botão submeta o formulário por padrão
          onClick={() => addEmoji(':badfallen:')} // Chama a função addEmoji com o código
          className={styles.emojiButton}
          disabled={!isConnected} // Desabilita se desconectado
          title="Adicionar emoji BadFallen" // Tooltip
        >
           {/* Mostra a imagem do emoji importada */}
           <img src={badfallenEmojiImg} alt=":badfallen:" className={styles.emojiButtonIcon} />
        </button>
        {/* Botão de Enviar Mensagem */}
        <button
            type="submit" // Tipo padrão para botão de formulário
            className={styles.sendButton} // Classe CSS específica
            // Desabilita se desconectado ou se a mensagem (sem espaços) estiver vazia
            disabled={!isConnected || !message.trim()}
        >
            Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;