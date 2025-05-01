// src/utils/emojiParser.jsx
import React from 'react';
import styles from './emojiParser.module.css'; // CSS para os emojis

// --- IMPORTE SUAS IMAGENS DE EMOJI AQUI ---
import badfallenEmoji from '../assets/img/badfallen.webp';
// import furiaLogoEmoji from '../assets/img/furia-icon.png'; // Exemplo
// import ksceratoEmoji from '../assets/img/kscerato-art.webp'; // Exemplo

// Mapeamento: Código do Emoji -> Imagem Importada
const customEmojiMap = {
  ':badfallen:': badfallenEmoji,
  // ':furia:': furiaLogoEmoji,
  // ':kscerato:': ksceratoEmoji,
  // Adicione mais emojis aqui
};

// Regex para encontrar os códigos de emoji (ex: :nome_emoji:)
// Garante que tenha ':' no início e fim, e caracteres válidos no meio
const emojiRegex = /(:[a-zA-Z0-9_+-]+?:)/g;

// Componente ou função para parsear a mensagem
export function parseEmojis(text) {
  if (!text) return '';

  // Divide o texto pelo regex, mantendo os delimitadores (emojis)
  const parts = text.split(emojiRegex);

  return parts.map((part, index) => {
    // Verifica se a parte é um código de emoji conhecido
    if (customEmojiMap[part]) {
      return (
        <img
          key={index}
          src={customEmojiMap[part]}
          alt={part} // Texto alternativo é o código
          className={styles.customEmoji} // Aplica estilo CSS
        />
      );
    }
    // Se não for emoji, retorna o texto normal
    return part;
  });
}