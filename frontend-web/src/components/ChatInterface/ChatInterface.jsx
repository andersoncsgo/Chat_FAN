// src/components/ChatInterface/ChatInterface.jsx
import React from 'react';
import styles from './ChatInterface.module.css';

function ChatInterface({
  chatMessages,
  message,
  setMessage,
  handleSendMessage,
  isMyMessage,
  messagesEndRef,
  isConnected,
}) {
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {chatMessages.map((msg, index) => (
          <div
            key={msg._id || index} // Use _id se existir, senão index
            className={`${styles.message} ${
              msg.type === 'system'
                ? styles.system
                : isMyMessage(msg)
                ? styles.myMessage
                : styles.otherMessage
            }`}
          >
            {msg.type !== 'system' && (
              <span className={styles.username}>
                {isMyMessage(msg) ? 'Você' : msg.username}:
              </span>
            )}
            {msg.text}
          </div>
        ))}
        {/* Elemento invisível para ajudar a rolar */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isConnected ? "Digite sua mensagem..." : "Reconectando..."}
          className={styles.input}
          disabled={!isConnected} // Desabilita se não conectado
        />
        <button
            type="submit"
            className={styles.button}
            disabled={!isConnected || !message.trim()} // Desabilita se não conectado ou msg vazia
        >
            Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;