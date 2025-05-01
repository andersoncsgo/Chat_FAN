// src/components/JoinScreen/JoinScreen.jsx
import React from 'react';
import styles from './JoinScreen.module.css';

function JoinScreen({
  username,
  setUsername,
  selectedRoom,      // Recebe sala selecionada
  setSelectedRoom,   // Recebe função para mudar sala
  availableRooms,    // Recebe lista de salas
  handleJoin,
  isConnected
}) {
  return (
    <div className={styles.joinContainer}>
      <form onSubmit={handleJoin} className={styles.joinForm}>
        <h2 className={styles.title}>Entrar no Chat FURIA</h2>
        {!isConnected && <p className={styles.errorText}>⚠️ Conectando ao servidor...</p>}

        {/* Input Username */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite seu nome de usuário"
          maxLength="20"
          required
          disabled={!isConnected}
          className={styles.input}
        />

        {/* Seletor de Sala */}
        <div className={styles.roomSelector}>
          <label htmlFor="room-select" className={styles.roomLabel}>Escolha a Sala:</label>
          <select
            id="room-select"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={!isConnected}
            className={styles.select}
            required
          >
            {/* <option value="" disabled>-- Selecione uma sala --</option> */}
            {availableRooms.map(room => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de Join */}
        <button
          type="submit"
          disabled={!isConnected || !username.trim() || !selectedRoom} // Desabilita sem nome ou sala
          className={styles.button}
        >
          Entrar na Sala
        </button>
      </form>
    </div>
  );
}

export default JoinScreen;