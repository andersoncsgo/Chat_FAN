from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here!' # Troque por uma chave segura se for para produção
CORS(app, resources={r"/*": {"origins": "*"}}) # Permite conexões de qualquer origem (ajuste se necessário)

# Use eventlet como servidor assíncrono para melhor performance com WebSockets
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- Dados Simples (em memória, para o exemplo) ---
# Em um app real, você usaria um banco de dados
users = {} # Guarda os usuários conectados { sid: username }
messages = [] # Histórico simples de mensagens

# --- Eventos Socket.IO ---

@socketio.on('connect')
def handle_connect():
    """Chamado quando um novo cliente se conecta."""
    sid = request.sid
    print(f'Cliente conectado: {sid}')
    # Envia o histórico inicial de mensagens para o novo cliente
    emit('message_history', messages, room=sid)
    # Poderia pedir um 'join' aqui com um username

@socketio.on('disconnect')
def handle_disconnect():
    """Chamado quando um cliente se desconecta."""
    sid = request.sid
    username = users.pop(sid, 'Alguém')
    print(f'Cliente desconectado: {sid} ({username})')
    # Informa aos outros que o usuário saiu (opcional)
    emit('user_left', {'username': username}, broadcast=True)


@socketio.on('join')
def handle_join(data):
    """Cliente informa seu nome de usuário."""
    sid = request.sid
    username = data.get('username', f'User_{sid[:4]}')
    users[sid] = username
    print(f'Usuário {username} entrou (SID: {sid})')
    # Informa a todos (inclusive o próprio usuário) que ele entrou
    emit('user_joined', {'username': username}, broadcast=True)


@socketio.on('send_message')
def handle_send_message(data):
    """Recebe uma mensagem de um cliente e a retransmite para todos."""
    sid = request.sid
    username = users.get(sid, f'User_{sid[:4]}') # Pega o nome de usuário ou um padrão
    message_text = data.get('message')

    if not message_text:
        return # Ignora mensagens vazias

    print(f'Mensagem recebida de {username}: {message_text}')

    message_data = {
        'username': username,
        'text': message_text,
        'sid': sid # Pode ser útil para identificar o remetente no frontend
    }

    # Adiciona ao histórico (limite o tamanho em produção)
    messages.append(message_data)
    if len(messages) > 100: # Limita o histórico às últimas 100 mensagens
         messages.pop(0)

    # Emite a mensagem para TODOS os clientes conectados
    emit('new_message', message_data, broadcast=True)

# --- Rota HTTP (Opcional, para teste) ---
@app.route('/')
def index():
    return "Servidor Flask-SocketIO para o Chat FURIA está rodando!"

if __name__ == '__main__':
    print("Iniciando servidor Flask-SocketIO na porta 5000...")
    # Use socketio.run para iniciar corretamente com o servidor eventlet
    # host='0.0.0.0' permite conexões de outras máquinas na rede local
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    # Se eventlet der problema, tente:
    # socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)