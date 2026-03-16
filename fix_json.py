import json
import os

filepath = r'c:\Users\NeoMissio\Documents\Trilha-Campeoes\src\data\questions.json'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the structural mistakes from previous partial edits
# We know the top has "subjects": { "math": { "grades": ...
# But we need to ensure it closes properly before adding portuguese

try:
    # If the JSON is currently invalid, let's try to parse it loosely or fix braces
    # Actually, let's just use the fact that it was originally valid before line 2 changed.
    # We replaced line 2 with '"subjects": { "math": { "grades": {'
    
    # Let's try to parse what we have. If it fails, we fix the tail.
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        # It'sLikely missing closing braces for math and subjects
        content_fixed = content.strip()
        if not content_fixed.endswith('}}}'):
            # Basic fix: remove last } (root) and add the necessary closings
            # Root { subjects { math { grades { content } } } }
            # Wait, 2140 was } (root). 2139 was } (grades). 2138 was } (1-2).
            # So it closed grades, but not math and subjects.
            content_fixed = content_fixed.rstrip('}') + '}}}'
            data = json.loads(content_fixed)

    # Now data is correct. Add portuguese.
    port_data = {
        "grades": {
            "1-2": {
                "Normal": [
                    { "question": "Qual é a primeira letra da palavra BOLA?", "answer": "B", "options": ["B", "P", "D", "L"] },
                    { "question": "Quantas vogais tem a palavra UVA?", "answer": "2", "options": ["1", "2", "3", "0"] },
                    { "question": "Qual destas palavras começa com a letra M?", "answer": "Macaco", "options": ["Bola", "Macaco", "Dente", "Sapo"] },
                    { "question": "Qual é a última letra da palavra ABACAXI?", "answer": "I", "options": ["A", "E", "I", "O"] },
                    { "question": "Identifique o objeto: Serve para escrever.", "answer": "Lápis", "options": ["Mesa", "Lápis", "Cadeira", "Cola"] },
                    { "question": "Qual animal faz 'MUUU'?", "answer": "Vaca", "options": ["Vaca", "Cavalo", "Cachorro", "Ovelha"] },
                    { "question": "Com qual letra escrevemos AVIÃO?", "answer": "A", "options": ["A", "B", "C", "V"] },
                    { "question": "Qual destes é um meio de transporte?", "answer": "Carro", "options": ["Cadeira", "Prato", "Carro", "Árvore"] },
                    { "question": "Qual é a cor do céu em um dia limpo?", "answer": "Azul", "options": ["Verde", "Azul", "Rosa", "Preto"] },
                    { "question": "Complete a palavra: ___CO (animal que galopa)", "answer": "Cavalo", "options": ["Gato", "Pato", "Cavalo", "Vaca"] }
                ],
                "Green": [
                    { "question": "Qual é o feminino de MENINO?", "answer": "Menina", "options": ["Meninas", "Homem", "Menina", "Mulher"] },
                    { "question": "Qual é o plural de MÃO?", "answer": "Mãos", "options": ["Mãoes", "Mãos", "Mãis", "Mãosinhas"] },
                    { "question": "Separe em sílabas: SAPO", "answer": "SA-PO", "options": ["S-A-P-O", "SAP-O", "SA-PO", "S-APO"] },
                    { "question": "Qual é a primeira sílaba de PIPOCA?", "answer": "PI", "options": ["PA", "PO", "PI", "CA"] },
                    { "question": "Qual palavra tem 3 sílabas?", "answer": "Boneca", "options": ["Pai", "Casa", "Boneca", "Flor"] },
                    { "question": "Qual destas palavras tem 'CH'?", "answer": "Chave", "options": ["Xícara", "Chave", "Sapo", "Bola"] },
                    { "question": "Quantas sílabas tem a palavra PÉ?", "answer": "1", "options": ["1", "2", "3", "0"] },
                    { "question": "Qual o aumentativo de CASA?", "answer": "Casarão", "options": ["Casinha", "Casebre", "Casarão", "Casas"] },
                    { "question": "Qual é o feminino de LEÃO?", "answer": "Leoa", "options": ["Leãozinha", "Leoa", "Onça", "Tigre"] },
                    { "question": "Qual destas palavras é um nome próprio?", "answer": "Maria", "options": ["Mesa", "Maria", "Gato", "Cidade"] }
                ],
                "Red": [
                    { "question": "Qual palavra rima com GATO?", "answer": "Rato", "options": ["Casa", "Pulo", "Rato", "Bolo"] },
                    { "question": "Qual palavra rima com JANELA?", "answer": "Panela", "options": ["Mesa", "Panela", "Porta", "Chão"] },
                    { "question": "Qual palavra rima com BALÃO?", "answer": "Mão", "options": ["Pé", "Mão", "Sol", "Mar"] },
                    { "question": "Qual rima com AMOR?", "answer": "Flor", "options": ["Dia", "Céu", "Flor", "Pão"] },
                    { "question": "Qual rima com CANÇÃO?", "answer": "Coração", "options": ["Pé", "Coração", "Lua", "Voz"] },
                    { "question": "Qual rima com ESCOLA?", "answer": "Sacola", "options": ["Caderno", "Sacola", "Lápis", "Livro"] },
                    { "question": "Qual rima com JARDIM?", "answer": "Pudim", "options": ["Rosa", "Pudim", "Verde", "Sol"] },
                    { "question": "Qual rima com CASTELO?", "answer": "Martelo", "options": ["Rei", "Fada", "Martelo", "Porta"] },
                    { "question": "O que rima com SOL?", "answer": "Girassol", "options": ["Lua", "Girassol", "Mar", "Rio"] },
                    { "question": "O que rima com PÃO?", "answer": "Mão", "options": ["Pé", "Mão", "Olho", "Nariz"] }
                ],
                "Yellow": [
                    { "question": "O que o cachorro faz?", "answer": "Late", "options": ["Mia", "Late", "Canta", "Pula"] },
                    { "question": "Onde mora o peixe?", "answer": "Na água", "options": ["Na terra", "No ninho", "Na água", "Na casa"] },
                    { "question": "O rato roeu a roupa do ___.", "answer": "Rei", "options": ["Gato", "Rei", "Pato", "Cão"] },
                    { "question": "Qual é o antônimo de ALTO?", "answer": "Baixo", "options": ["Grande", "Baixo", "Largo", "Fino"] },
                    { "question": "Qual é o sinônimo de FELIZ?", "answer": "Contente", "options": ["Triste", "Bravo", "Contente", "Cansado"] },
                    { "question": "O sol nasce no ___.", "answer": "Leste", "options": ["Norte", "Sul", "Leste", "Oeste"] },
                    { "question": "Qual é o oposto de NOITE?", "answer": "Dia", "options": ["Lua", "Dia", "Escuro", "Frio"] },
                    { "question": "Quem entrega as cartas?", "answer": "Carteiro", "options": ["Médico", "Carteiro", "Padeiro", "Professor"] },
                    { "question": "Onde guardamos os livros na escola?", "answer": "Mochila", "options": ["Mochila", "Geladeira", "Fogão", "Cama"] },
                    { "question": "Qual o plural de Cidadão?", "answer": "Cidadãos", "options": ["Cidadões", "Cidadãos", "Cidadãs", "Cidadãos"] }
                ]
            }
        }
    }

    data['subjects']['portuguese'] = port_data

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Success: Portuguese content injected and JSON fixed.")

except Exception as e:
    print(f"Error: {e}")
