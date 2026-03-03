#!/usr/bin/env python3
"""
Script para importar dados de Ação Judicial do Excel para MongoDB
VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team

Uso:
  python importar_acao_judicial_excel.py [--dry-run] [--arquivo CAMINHO_ARQUIVO]

Mapeamento de colunas:
A -> nroProcesso
B -> empresaAcionada
C -> cpf
D -> nome
E -> dataEntrada
F -> produto
G -> motivoReduzido (array, pode conter múltiplos valores separados por vírgula ou ponto-e-vírgula)
H -> audiencia (boolean) e dataAudiencia (Date)
  - Se mencionado "Sim", ou se possuir apenas uma data, ou "Sim" seguido de data -> audiencia = true
  - Se "Não" ou "Extinto" -> audiencia = false
  - Qualquer data anterior a janeiro de 2026 deve ser posicionada no ano de 2025
"""

import os
import sys
import pandas as pd
from pymongo import MongoClient
from datetime import datetime
import re
import json
from dotenv import load_dotenv

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Carregar variáveis de ambiente
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
env_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=env_path)

# Verificar modo dry-run
DRY_RUN = '--dry-run' in sys.argv

# Verificar arquivo customizado
arquivo_customizado = None
if '--arquivo' in sys.argv:
    idx = sys.argv.index('--arquivo')
    if idx + 1 < len(sys.argv):
        arquivo_customizado = sys.argv[idx + 1]

# Configuração MongoDB
MONGO_URI = os.getenv('MONGO_ENV')
if not MONGO_URI and not DRY_RUN:
    print("❌ Erro: MONGO_ENV não configurada")
    print("   Configure MONGO_ENV no arquivo .env ou como variável de ambiente")
    sys.exit(1)

DB_NAME = 'hub_ouvidoria'
COLLECTION_NAME = 'reclamacoes_judicial'

def converter_datetime_para_str(obj):
    """Converte datetime para string para JSON serialization"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: converter_datetime_para_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [converter_datetime_para_str(item) for item in obj]
    return obj

def limpar_cpf(cpf):
    """
    Remove formatação do CPF, deixando apenas números
    Aceita valores vazios e letras - retorna string vazia se não conseguir extrair 11 dígitos
    """
    if pd.isna(cpf):
        return ''  # Aceitar vazio
    
    # Se for número (float/int), converter para int PRIMEIRO para remover .0 antes de qualquer processamento
    if isinstance(cpf, (int, float)):
        # Converter para int para remover decimais (.0) - isso garante que não teremos .0 na string
        try:
            cpf_int = int(cpf)
            cpf_limpo = str(cpf_int)
        except (ValueError, OverflowError):
            return ''  # Se não conseguir converter, retornar vazio
    else:
        # Se for string, limpar e converter
        cpf_str = str(cpf).strip()
        # Remove tudo que não é número
        cpf_limpo = re.sub(r'\D', '', cpf_str)
    
    # Se tiver menos de 11 dígitos, preencher com zeros à esquerda (Excel remove zeros à esquerda)
    if len(cpf_limpo) < 11:
        cpf_limpo = cpf_limpo.zfill(11)
    
    # Validar se tem exatamente 11 dígitos
    if len(cpf_limpo) == 11:
        return cpf_limpo
    else:
        # Se não tem 11 dígitos, retornar vazio (aceitar valores inválidos como vazio)
        return ''

def formatar_data(data):
    """Converte data do Excel para formato Date do MongoDB"""
    if pd.isna(data):
        return None
    
    # Se já for datetime
    if isinstance(data, datetime):
        return data
    
    # Se for string, tentar converter
    if isinstance(data, str):
        try:
            # Tentar vários formatos comuns
            for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d/%m/%y', '%d-%m-%y']:
                try:
                    data_obj = datetime.strptime(data.strip(), fmt)
                    # Se a data for anterior a janeiro de 2026, ajustar para 2025
                    if data_obj.year < 2026:
                        data_obj = data_obj.replace(year=2025)
                    return data_obj
                except:
                    continue
        except:
            pass
    
    # Se for número (dias desde 1900-01-01 no Excel)
    try:
        if isinstance(data, (int, float)):
            data_obj = datetime(1900, 1, 1) + pd.Timedelta(days=int(data) - 2)
            # Se a data for anterior a janeiro de 2026, ajustar para 2025
            if data_obj.year < 2026:
                data_obj = data_obj.replace(year=2025)
            return data_obj
    except:
        pass
    
    return None

def extrair_data_de_texto(texto):
    """Extrai data de um texto que pode conter 'Sim' e uma data"""
    if pd.isna(texto):
        return None
    
    # Se já for datetime, retornar diretamente
    if isinstance(texto, datetime):
        if texto.year < 2026:
            texto = texto.replace(year=2025)
        return texto
    
    texto_str = str(texto).strip()
    
    # Padrões de data comuns (incluindo formato "dd/mm, às hh:mm")
    padroes_data = [
        r'\d{1,2}/\d{1,2}/\d{4}',  # dd/mm/yyyy
        r'\d{1,2}-\d{1,2}-\d{4}',  # dd-mm-yyyy
        r'\d{4}-\d{1,2}-\d{1,2}',  # yyyy-mm-dd
        r'\d{1,2}/\d{1,2}/\d{2}',  # dd/mm/yy
        r'\d{1,2}/\d{1,2}',        # dd/mm (assumir ano atual ou 2025)
    ]
    
    for padrao in padroes_data:
        match = re.search(padrao, texto_str)
        if match:
            data_str = match.group()
            # Se for formato dd/mm sem ano, adicionar 2025
            if re.match(r'^\d{1,2}/\d{1,2}$', data_str):
                data_str = f"{data_str}/2025"
            data_obj = formatar_data(data_str)
            if data_obj:
                return data_obj
    
    return None

def processar_coluna_h(valor_h):
    """
    Processa a coluna H conforme regras especificadas:
    - Se mencionado "Sim", ou se possuir apenas uma data, ou "Sim" seguido de data -> audiencia = true
    - Se "Não" ou "Extinto" -> audiencia = false
    - Qualquer data anterior a janeiro de 2026 deve ser posicionada no ano de 2025
    """
    if pd.isna(valor_h):
        return {
            'audiencia': False,
            'dataAudiencia': None
        }
    
    # Se já for datetime, considerar como audiência com data
    if isinstance(valor_h, datetime):
        data_ajustada = valor_h
        if data_ajustada.year < 2026:
            data_ajustada = data_ajustada.replace(year=2025)
        return {
            'audiencia': True,
            'dataAudiencia': data_ajustada
        }
    
    valor_str = str(valor_h).strip()
    valor_lower = valor_str.lower()
    
    # Verificar se é "Não" ou "Extinto"
    if 'não' in valor_lower or 'nao' in valor_lower or 'extinto' in valor_lower:
        return {
            'audiencia': False,
            'dataAudiencia': None
        }
    
    # Verificar se contém "Sim" ou uma data
    tem_sim = 'sim' in valor_lower
    data_extraida = extrair_data_de_texto(valor_h)  # Passar valor original para extrair datetime também
    
    if tem_sim or data_extraida:
        return {
            'audiencia': True,
            'dataAudiencia': data_extraida
        }
    
    # Se não encontrou padrão, assumir false
    return {
        'audiencia': False,
        'dataAudiencia': None
    }

def processar_motivos(motivos_str):
    """
    Processa a coluna G que pode conter múltiplos motivos separados por vírgula ou ponto-e-vírgula
    Retorna array de strings
    """
    if pd.isna(motivos_str):
        return []
    
    motivos_str = str(motivos_str).strip()
    if not motivos_str:
        return []
    
    # Limpar e filtrar motivos válidos com mapeamento de variações
    motivos_validos = {
        'juros': 'Juros',
        'juros abusivos': 'Juros',
        'chave pix': 'Chave Pix',
        'chavepix': 'Chave Pix',
        'retirada chave pix': 'Chave Pix',
        'retirado chave pix': 'Chave Pix',
        'restituição bb': 'Restituição BB',
        'restituicao bb': 'Restituição BB',
        'relatório': 'Relatório',
        'relatorio': 'Relatório',
        'repetição indébito': 'Repetição Indébito',
        'repeticao indebito': 'Repetição Indébito',
        'superendividamento': 'Superendividamento',
        'desconhece contratação': 'Desconhece Contratação',
        'desconhece contratacao': 'Desconhece Contratação'
    }
    
    motivos_processados = []
    motivo_lower = motivos_str.lower()
    
    # Primeiro, tentar match parcial para cada motivo válido
    for chave, valor in motivos_validos.items():
        if chave in motivo_lower:
            if valor not in motivos_processados:
                motivos_processados.append(valor)
    
    # Se não encontrou match parcial, tentar separar por vírgula, ponto-e-vírgula ou "e"
    if not motivos_processados:
        # Separar por vírgula, ponto-e-vírgula ou " e "
        motivos = re.split(r'[,;]|\s+e\s+', motivos_str)
        for motivo in motivos:
            motivo_limpo = motivo.strip().lower()
            # Verificar match parcial para cada motivo válido
            for chave, valor in motivos_validos.items():
                if chave in motivo_limpo:
                    if valor not in motivos_processados:
                        motivos_processados.append(valor)
                    break
    
    return motivos_processados

def processar_linha(row, responsavel='Sistema'):
    """Processa uma linha da planilha e retorna documento MongoDB"""
    
    # Mapeamento de colunas reais da planilha:
    # 'Processo ' → A (nroProcesso)
    # 'Coluna 1' → B (empresaAcionada) - pode não existir
    # 'CPF:' → C (cpf)
    # 'NOME:' → D (nome)
    # 'Data ' → E (dataEntrada)
    # 'Produto' → F (produto)
    # 'Motivo' → G (motivoReduzido)
    # 'Audiência: ' → H (audiencia e dataAudiencia)
    # 'Subsidios ' → subsidios
    
    # Processar coluna H (Audiência)
    col_h = row.get('Audiência: ') if 'Audiência: ' in row.index else row.get('Audiência') if 'Audiência' in row.index else None
    col_h_result = processar_coluna_h(col_h)
    
    # Processar motivos (coluna G)
    motivos = processar_motivos(row.get('Motivo') if 'Motivo' in row.index else None)
    
    # Processar empresa acionada (coluna B - pode não existir, tentar inferir de outras colunas)
    empresa_acionada = ''
    if 'Coluna 1' in row.index and not pd.isna(row.get('Coluna 1')):
        empresa_val = str(row.get('Coluna 1')).strip()
        if 'velotax' in empresa_val.lower():
            empresa_acionada = 'Velotax'
        elif 'celcoin' in empresa_val.lower():
            empresa_acionada = 'Celcoin'
    
    # Processar número do processo (aceitar qualquer valor, incluindo vazio e letras)
    processo_raw = row.get('Processo ', '') if 'Processo ' in row.index else ''
    if pd.isna(processo_raw):
        processo_str = ''
    else:
        processo_str = str(processo_raw).strip()
    
    # Construir documento
    doc = {
        'nome': str(row.get('NOME:', '') or '').strip() if 'NOME:' in row.index and not pd.isna(row.get('NOME:')) else '',
        'cpf': limpar_cpf(row.get('CPF:') if 'CPF:' in row.index else None) or '',  # Aceitar vazio
        'telefones': {
            'lista': []
        },
        'email': '',
        'observacoes': '',
        'responsavel': responsavel,
        
        # Campos específicos Ação Judicial
        # Aceitar qualquer valor (incluindo vazio e letras) - sem validação de formato
        'nroProcesso': processo_str,
        'empresaAcionada': empresa_acionada,
        'dataEntrada': formatar_data(row.get('Data ') if 'Data ' in row.index else None),
        'produto': str(row.get('Produto', '') or '').strip() if 'Produto' in row.index and not pd.isna(row.get('Produto')) else '',
        'motivoReduzido': motivos,  # Array de motivos
        'motivoDetalhado': '',
        
        # Campos da coluna H processados
        'audiencia': col_h_result['audiencia'],
        'dataAudiencia': col_h_result['dataAudiencia'],
        'situacaoAudiencia': '',
        
        'subsidios': str(row.get('Subsidios ', '') or '').strip() if 'Subsidios ' in row.index and not pd.isna(row.get('Subsidios ')) else '',
        'outrosProtocolos': '',
        'anexos': [],
        
        # Tratativa N1 (vazios para Ação Judicial)
        'acionouCentral': False,
        'protocolosCentral': [],
        'n2SegundoNivel': False,
        'protocolosN2': [],
        'reclameAqui': False,
        'protocolosReclameAqui': [],
        'procon': False,
        'protocolosProcon': [],
        
        'Finalizado': {
            'Resolvido': None,
            'dataResolucao': None
        },
        
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    
    # Não há validação obrigatória - aceitar qualquer registro que tenha pelo menos algum dado
    # CPF e nroProcesso podem estar vazios ou conter letras
    
    return doc

def main():
    """Função principal"""
    print('🚀 Iniciando importação Ação Judicial Excel → MongoDB...')
    print(f'   Modo: {"DRY-RUN (apenas validação)" if DRY_RUN else "IMPORTAÇÃO REAL"}')
    print(f'   Collection: {COLLECTION_NAME}\n')
    
    # Caminho da planilha
    if arquivo_customizado:
        planilha_path = arquivo_customizado
    else:
        # Caminho padrão (relativo à raiz do projeto)
        planilha_path = os.path.join(
            project_root,
            'dados procon',
            'Copy of Planilha RA e Procon acompanhamento 2026.xlsx'
        )
    
    if not os.path.exists(planilha_path):
        print(f"❌ Erro: Planilha não encontrada em: {planilha_path}")
        print(f"   Use --arquivo CAMINHO para especificar outro arquivo")
        sys.exit(1)
    
    print(f"📖 Lendo planilha: {planilha_path}")
    
    try:
        # Listar todas as abas disponíveis
        excel_file = pd.ExcelFile(planilha_path)
        print(f"📋 Abas disponíveis na planilha: {excel_file.sheet_names}\n")
        
        # Tentar encontrar aba de Ação Judicial/Processos
        aba_encontrada = None
        for aba in excel_file.sheet_names:
            aba_lower = aba.lower()
            if 'ação judicial' in aba_lower or 'acao judicial' in aba_lower or 'processos' in aba_lower or 'judicial' in aba_lower:
                aba_encontrada = aba
                break
        
        if not aba_encontrada:
            # Se não encontrou, usar primeira aba
            aba_encontrada = excel_file.sheet_names[0]
            print(f"⚠️  Aba específica de Ação Judicial não encontrada, usando primeira aba: {aba_encontrada}\n")
        else:
            print(f"✅ Usando aba: {aba_encontrada}\n")
        
        # Ler aba encontrada
        df = pd.read_excel(planilha_path, sheet_name=aba_encontrada, header=0)
        print(f"✅ Planilha lida: {len(df)} linhas encontradas")
        print(f"📋 Colunas encontradas: {list(df.columns)}")
        print(f"📋 Número de colunas: {len(df.columns)}\n")
        
        # Conectar ao MongoDB apenas se não for dry-run
        client = None
        collection = None
        if not DRY_RUN:
            print(f"🔌 Conectando ao MongoDB...")
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]
            print(f"✅ Conectado ao MongoDB: {DB_NAME}.{COLLECTION_NAME}\n")
        else:
            print("⚠️  [DRY-RUN] Pulando conexão com MongoDB\n")
        
        # Processar linhas
        documentos = []
        linhas_ignoradas = 0
        erros = 0
        
        print("🔄 Processando registros...\n")
        
        for idx, row in df.iterrows():
            try:
                # Aceitar qualquer linha que tenha Processo preenchido (mesmo que vazio ou com letras)
                # Ou que tenha CPF ou Nome preenchido
                processo_val = row.get('Processo ', '') if 'Processo ' in row.index else ''
                cpf_val = row.get('CPF:', '') if 'CPF:' in row.index else ''
                nome_val = row.get('NOME:', '') if 'NOME:' in row.index else ''
                
                # Verificar se pelo menos um campo principal está preenchido
                tem_processo = pd.notna(processo_val) and str(processo_val).strip() != ''
                tem_cpf = pd.notna(cpf_val) and str(cpf_val).strip() != ''
                tem_nome = pd.notna(nome_val) and str(nome_val).strip() != ''
                
                # Se todas as colunas principais estão vazias, ignorar linha
                if not (tem_processo or tem_cpf or tem_nome):
                    linhas_ignoradas += 1
                    continue
                
                # Processar linha - sempre retorna documento (sem validação obrigatória)
                doc = processar_linha(row)
                if doc:  # Garantir que doc não é None
                    documentos.append(doc)
                else:
                    linhas_ignoradas += 1
            except Exception as e:
                erros += 1
                print(f"❌ Erro ao processar linha {idx + 2}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        if linhas_ignoradas > 20:
            print(f"⚠️ ... e mais {linhas_ignoradas - 20} linhas ignoradas")
        
        print(f"\n✅ {len(df)} registros processados")
        print(f"   Válidos: {len(documentos)}")
        print(f"   Ignorados: {linhas_ignoradas}")
        print(f"   Erros: {erros}\n")
        
        if not documentos:
            print("❌ Nenhum documento válido para inserir")
            if client:
                client.close()
            sys.exit(1)
        
        # Inserir documentos ou mostrar preview
        if len(documentos) > 0:
            if not DRY_RUN:
                print("💾 Inserindo documentos no MongoDB...")
                
                # Inserir em batches de 1000
                batch_size = 1000
                total_inseridos = 0
                for i in range(0, len(documentos), batch_size):
                    batch = documentos[i:i + batch_size]
                    resultado = collection.insert_many(batch)
                    total_inseridos += len(resultado.inserted_ids)
                    print(f"   Inseridos: {min(i + batch_size, len(documentos))}/{len(documentos)}")
                
                print("✅ Documentos inseridos\n")
                
                # Criar índices (apenas se não existirem)
                print("🔍 Criando índices...")
                try:
                    collection.create_index('cpf')
                except Exception as e:
                    print(f"   Índice 'cpf' já existe ou erro: {str(e)[:50]}")
                
                try:
                    collection.create_index('nroProcesso')
                except Exception as e:
                    print(f"   Índice 'nroProcesso' já existe ou erro: {str(e)[:50]}")
                
                try:
                    collection.create_index('telefones.lista')
                except Exception as e:
                    print(f"   Índice 'telefones.lista' já existe ou erro: {str(e)[:50]}")
                
                try:
                    collection.create_index('email')
                except Exception as e:
                    print(f"   Índice 'email' já existe ou erro: {str(e)[:50]}")
                
                try:
                    collection.create_index('createdAt')
                except Exception as e:
                    print(f"   Índice 'createdAt' já existe ou erro: {str(e)[:50]}")
                
                print("✅ Índices verificados/criados\n")
            else:
                print(f"⚠️  [DRY-RUN] Inseriria {len(documentos)} documentos")
                print(f"   Primeiro documento de exemplo:")
                doc_exemplo = converter_datetime_para_str(documentos[0])
                print(json.dumps(doc_exemplo, indent=2, ensure_ascii=False))
                print()
                
                # Mostrar alguns exemplos de diferentes tipos de processamento
                print("📋 Exemplos de processamento da coluna H (Audiência):")
                exemplos_h = {}
                for doc in documentos[:50]:
                    audiencia = doc.get('audiencia', False)
                    data_audiencia = doc.get('dataAudiencia')
                    chave = f"{audiencia}_{data_audiencia is not None}"
                    if chave not in exemplos_h:
                        exemplos_h[chave] = {
                            'audiencia': audiencia,
                            'dataAudiencia': data_audiencia.isoformat() if data_audiencia else None
                        }
                
                for exemplo in exemplos_h.values():
                    print(f"   - {exemplo}")
                print()
        
        # Resumo final
        print("=" * 70)
        print("📊 RESUMO DA IMPORTAÇÃO")
        print("=" * 70)
        print(f"Registros processados: {len(df)}")
        print(f"Registros válidos: {len(documentos)}")
        print(f"Registros inseridos: {0 if DRY_RUN else len(documentos)}")
        print(f"Registros ignorados: {linhas_ignoradas}")
        print(f"Erros: {erros}")
        print("=" * 70)
        
        if DRY_RUN:
            print("\n⚠️  MODO DRY-RUN: Nenhum dado foi inserido realmente")
            print("   Execute sem --dry-run para realizar a importação real\n")
        else:
            print("\n✅ Importação concluída com sucesso!\n")
        
        if client:
            client.close()
            print("🔌 Conexão MongoDB fechada")
        
    except Exception as e:
        print(f"❌ Erro durante importação: {str(e)}")
        import traceback
        traceback.print_exc()
        if client:
            client.close()
        sys.exit(1)

if __name__ == '__main__':
    main()
