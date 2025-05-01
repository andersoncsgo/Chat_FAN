// src/components/Header/Header.jsx
import React from 'react';
import styles from './Header.module.css';

// Recebe currentRoom também
function Header({ logoSrc, theme, toggleTheme, currentRoom }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* Mostra a sala atual se estiver em uma */}
        <span>{currentRoom ? `Sala: ${currentRoom}` : 'FURIA Chat'}</span>
      </div>
      <div className={styles.headerCenter}>
        <img src={logoSrc} alt="FURIA Logo" className={styles.logoImg} />
      </div>
      <div className={styles.headerRight}>
        <button onClick={toggleTheme} className={styles.themeToggleButton} title="Alternar Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

export default Header;