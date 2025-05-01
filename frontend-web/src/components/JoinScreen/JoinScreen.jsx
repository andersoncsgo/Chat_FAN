// src/components/JoinScreen/JoinScreen.jsx
import React from 'react';
import styles from './JoinScreen.module.css';

function JoinScreen({ username, setUsername, handleJoin, isConnected }) {
  return (
    <div className={styles.joinContainer}>
      <form onSubmit={handleJoin} className={styles.joinForm}>
        <h2 className={styles.title}>Entre no Chat FURIA</h2>
        {!isConnected && <p className={styles.errorText}>⚠️ Conectando ao servidor...</p>}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite seu nome de usuário"
          maxLength="20"
          required
          disabled={!isConnected} // Desabilita se não conectado
          className={styles.input}
        />
        <button
          type="submit"
          disabled={!isConnected || !username.trim()} // Desabilita se não conectado ou sem username
          className={styles.button}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default JoinScreen;