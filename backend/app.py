# backend/app.py
import uuid  # Importa o módulo uuid
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import eventlet

# Inicialização do Flask e Configurações
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here!' # Use uma chave segura em produção
CORS(app, resources={r"/*": {"origins": "*"}}) # Permite conexões de qualquer origem

# Inicialização do SocketIO com Eventlet para melhor performance assíncrona
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- Armazenamento de Dados (Em Memória) ---
# Estrutura principal para guardar dados por sala
rooms_data = {}
# Exemplo da estrutura interna:
# rooms_data = {
#     '#Geral': {
#         'users': {sid1: 'UserA', sid2: 'UserB'}, # Mapeia SID para username
#         'messages': [ # Lista de mensagens da sala
#             {'username': 'UserA', 'text': 'Olá!', 'sid': sid1, '_id': 'uuid1'},
#             # ... mais mensagens
#         ]
#     },
#     # ... outras salas
# }

# Limite de mensagens a serem guardadas no histórico por sala
MAX_MESSAGES_PER_ROOM = 100

# --- Funções Auxiliares (Helpers) ---

def get_user_room(sid):
    """
    Encontra e retorna o nome da sala em que um usuário (identificado pelo seu SID) está.
    Retorna None se o usuário não for encontrado em nenhuma sala.
    """
    for room_name, data in rooms_data.items():
        if sid in data.get('users', {}): # Verifica se 'users' existe antes de acessar
            return room_name
    return None

def add_message_to_room(room_name, message_data):
    """
    Adiciona uma nova mensagem ao histórico da sala especificada.
    Garante que o histórico não exceda MAX_MESSAGES_PER_ROOM.
    """
    if room_name in rooms_data:
        # Garante que a lista de mensagens existe
        if 'messages' not in rooms_data[room_name]:
            rooms_data[room_name]['messages'] = []

        room_messages = rooms_data[room_name]['messages']
        room_messages.append(message_data)

        # Mantém o histórico dentro do limite definido
        if len(room_messages) > MAX_MESSAGES_PER_ROOM:
            # Mantém apenas as últimas MAX_MESSAGES_PER_ROOM mensagens
            rooms_data[room_name]['messages'] = room_messages[-MAX_MESSAGES_PER_ROOM:]
            # Alternativa (mais eficiente para listas grandes):
            # del room_messages[:-MAX_MESSAGES_PER_ROOM]
    else:
        print(f"[Erro: add_message_to_room] Tentando adicionar mensagem a sala inexistente '{room_name}'")

# --- Event Handlers do Socket.IO ---

@socketio.on('connect')
def handle_connect():
    """
    Chamado quando um novo cliente estabelece uma conexão WebSocket.
    Apenas registra a conexão no log; o cliente precisa enviar 'join' para entrar numa sala.
    """
    sid = request.sid
    print(f'[Connect] Cliente conectado: {sid}')
    # Poderia emitir uma lista de salas disponíveis aqui, se desejado:
    # available_rooms = list(rooms_data.keys()) # Ou uma lista pré-definida
    # emit('available_rooms', available_rooms, room=sid)

@socketio.on('disconnect')
def handle_disconnect():
    """
    Chamado quando um cliente se desconecta.
    Remove o usuário da sala em que estava e notifica os outros na sala.
    """
    sid = request.sid
    room_name = get_user_room(sid) # Encontra a sala do usuário que desconectou
    username = 'Alguém' # Nome padrão caso não encontre

    if room_name and room_name in rooms_data:
        # Garante que 'users' existe antes de tentar remover
        if sid in rooms_data[room_name].get('users', {}):
            username = rooms_data[room_name]['users'].pop(sid) # Remove e pega o nome
            print(f'[Disconnect] Cliente desconectado: {sid} ({username}) da sala {room_name}')
            # Notifica os outros usuários *naquela sala específica* que ele saiu
            emit('user_left', {'username': username}, to=room_name, include_self=False) # Usa 'to' para direcionar
            # O leave_room(room_name) é tratado automaticamente pelo Flask-SocketIO no disconnect
        else:
             print(f'[Disconnect] Cliente {sid} desconectou, mas não estava listado nos usuários da sala {room_name}')
    else:
        print(f'[Disconnect] Cliente desconectado: {sid} (não encontrado em nenhuma sala)')

@socketio.on('join')
def handle_join(data):
    """
    Chamado quando um cliente envia o evento 'join' para entrar numa sala.
    Espera receber 'username' e 'room' nos dados.
    """
    sid = request.sid
    username = data.get('username', f'User_{sid[:4]}').strip() # Remove espaços extras
    room_name = data.get('room')

    # Validação básica dos dados recebidos
    if not username:
         emit('join_error', {'message': 'Nome de usuário inválido.'}, room=sid)
         print(f"[Join Error] SID {sid} tentou entrar com username vazio.")
         return
    if not room_name:
        emit('join_error', {'message': 'Nome da sala é obrigatório.'}, room=sid)
        print(f"[Join Error] SID {sid} ({username}) tentou entrar sem sala.")
        return

    # --- Lógica de Troca de Sala ---
    # Verifica se o usuário já está em alguma sala
    old_room = get_user_room(sid)
    if old_room:
        # Se já está na sala que quer entrar, não faz nada (ou envia só histórico)
        if old_room == room_name:
             print(f"[Join] Usuário {username} (SID: {sid}) já está na sala {room_name}.")
             # Reenvia histórico caso tenha perdido mensagens
             history = rooms_data.get(room_name, {}).get('messages', [])
             emit('message_history', history, room=sid)
             return
        else:
             # Remove da sala antiga no nosso dict e no SocketIO
             if old_room in rooms_data and sid in rooms_data[old_room].get('users', {}):
                 del rooms_data[old_room]['users'][sid]
                 print(f"[Switch Room] Usuário {username} removido da sala antiga: {old_room}")
             leave_room(old_room) # Faz o SocketIO sair da sala antiga
             # Notifica a sala antiga
             emit('user_left', {'username': username}, to=old_room, include_self=False)


    # --- Lógica de Entrada na Nova Sala ---
    # Cria a estrutura da sala se for a primeira vez
    if room_name not in rooms_data:
        rooms_data[room_name] = {'users': {}, 'messages': []}
        print(f"[Room Created] Sala '{room_name}' foi criada.")

    # Adiciona o usuário ao nosso dict e à sala do SocketIO
    rooms_data[room_name].setdefault('users', {})[sid] = username
    join_room(room_name) # Faz o SocketIO entrar na sala nova
    print(f'[Join] Usuário {username} (SID: {sid}) entrou na sala: {room_name}')

    # Envia o histórico da *nova* sala *apenas* para quem acabou de entrar
    history = rooms_data[room_name].get('messages', [])
    emit('message_history', history, room=sid)

    # Notifica todos os usuários *na nova sala* (incluindo quem entrou) sobre a entrada
    emit('user_joined', {'username': username, 'sid': sid}, to=room_name)

@socketio.on('send_message')
def handle_send_message(data):
    """
    Chamado quando um cliente envia uma mensagem.
    A mensagem é adicionada ao histórico da sala e retransmitida para todos na sala.
    """
    sid = request.sid
    room_name = get_user_room(sid) # Encontra a sala do remetente

    if not room_name:
        print(f"[Send Error] Mensagem de SID {sid} sem sala definida.")
        # Poderia emitir um erro de volta
        return

    username = rooms_data[room_name]['users'].get(sid, f'User_{sid[:4]}')
    message_text = data.get('message', '').strip() # Pega a mensagem e remove espaços

    if not message_text:
        print(f"[Send Info] Mensagem vazia ignorada de {username} na sala {room_name}.")
        return # Ignora mensagens vazias

    print(f'[Message In] Sala [{room_name}] De [{username}]: {message_text}')

    # Cria o objeto da mensagem com um ID único
    message_data = {
        'username': username,
        'text': message_text,
        'sid': sid,
        '_id': str(uuid.uuid4()) # Gera UUID único
    }

    # Adiciona ao histórico da sala (respeitando o limite)
    add_message_to_room(room_name, message_data)

    # Emite a mensagem para TODOS os clientes conectados *naquela sala*
    emit('new_message', message_data, to=room_name)

# --- Rota HTTP Simples (Opcional) ---
@app.route('/')
def index():
    """Rota básica para verificar se o servidor está no ar."""
    return "Servidor Flask-SocketIO para o Chat FURIA (com salas e UUID) está rodando!"

# --- Ponto de Entrada Principal ---
if __name__ == '__main__':
    print("=================================================")
    print(" Iniciando servidor Flask-SocketIO com Salas ")
    print(" Escutando em http://0.0.0.0:5000 ")
    print("=================================================")
    # Usa socketio.run para iniciar corretamente com eventlet
    # host='0.0.0.0' permite conexões de outras máquinas na rede
    # debug=True ativa o debugger e auto-reload (útil em desenvolvimento)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)