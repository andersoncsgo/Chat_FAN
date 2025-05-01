// src/components/Header/Header.jsx
import React from 'react';
import styles from './Header.module.css'; // Usaremos CSS Modules

// Recebe o caminho do logo como propriedade
function Header({ logoSrc }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* Pode adicionar links ou breadcrumbs aqui depois */}
        <span>FURIA Chat</span>
      </div>
      <div className={styles.headerCenter}>
        <img src={logoSrc} alt="FURIA Logo" className={styles.logoImg} />
      </div>
      <div className={styles.headerRight}>
        {/* Pode adicionar ícones ou status de conexão aqui depois */}
      </div>
    </header>
  );
}

export default Header;