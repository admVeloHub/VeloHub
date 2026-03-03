#!/usr/bin/env python3
"""
Script para importar dados de Procon do Excel para MongoDB
VERSION: v1.1.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team

Uso:
  python importar_procon_excel.py [--dry-run]

Mapeamento de colunas:
A -> codigoProcon
B -> cpf
C -> nome
D -> dataProcon
E -> motivoReduzido
F -> produto
G -> solucaoApresentada
H -> processoAdministrativo (com regras específicas)
I -> processoEncerrado (se houver informação)
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
# Procurar .env na raiz do projeto
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
env_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=env_path)

# Verificar modo dry-run
DRY_RUN = '--dry-run' in sys.argv

# Configuração MongoDB
MONGO_URI = os.getenv('MONGO_ENV')
if not MONGO_URI and not DRY_RUN:
    print("❌ Erro: MONGO_ENV não configurada")
    print("   Configure MONGO_ENV no arquivo .env ou como variável de ambiente")
    sys.exit(1)

DB_NAME = 'hub_ouvidoria'
COLLECTION_NAME = 'reclamacoes_procon'

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
    """Remove formatação do CPF, deixando apenas números"""
    if pd.isna(cpf):
        return None
    
    # Se for número (float/int), converter diretamente para string sem decimais
    if isinstance(cpf, (int, float)):
        # Converter para int primeiro para remover .0
        cpf_int = int(cpf)
        cpf_str = str(cpf_int)
    else:
        cpf_str = str(cpf).strip()
    
    # Remove tudo que não é número
    cpf_limpo = re.sub(r'\D', '', cpf_str)
    
    # Se tiver menos de 11 dígitos, preencher com zeros à esquerda (Excel remove zeros à esquerda)
    if len(cpf_limpo) < 11:
        cpf_limpo = cpf_limpo.zfill(11)
    
    # Validar se tem 11 dígitos
    if len(cpf_limpo) == 11:
        return cpf_limpo
    elif len(cpf_limpo) > 11:
        # Se tiver mais de 11 dígitos, pegar apenas os primeiros 11 dígitos
        return cpf_limpo[:11]
    else:
        return None

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
            for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d']:
                try:
                    return datetime.strptime(data.strip(), fmt)
                except:
                    continue
        except:
            pass
    
    # Se for número (dias desde 1900-01-01 no Excel)
    try:
        if isinstance(data, (int, float)):
            return datetime(1900, 1, 1) + pd.Timedelta(days=int(data) - 2)
    except:
        pass
    
    return None

def processar_coluna_h(valor_h, valor_i=None):
    """
    Processa a coluna H conforme regras especificadas:
    - "Cliente desistiu" -> clienteDesistiu = true
    - "Sim", "Sim", "Procon marcou como 'NÃO ATENDIDA'", "Sim, porém encerrado" -> processoAdministrativo = "Sim - Status Não Atendido"
    - "Encerrado", "Procon marcou como 'ATENDIDA'", etc -> processoAdministrativo = "Não - Status Atendido"
    - "Subsídios enviados à..." -> processoAdministrativo = "Sim - Status Não Atendido", encaminhadoJuridico = true
    """
    if pd.isna(valor_h):
        return {
            'processoAdministrativo': '',
            'clienteDesistiu': False,
            'encaminhadoJuridico': False,
            'processoEncaminhadoResponsavel': ''
        }
    
    valor_str = str(valor_h).strip()
    valor_lower = valor_str.lower()
    
    resultado = {
        'processoAdministrativo': '',
        'clienteDesistiu': False,
        'encaminhadoJuridico': False,
        'processoEncaminhadoResponsavel': ''
    }
    
    # Cliente desistiu
    if 'cliente desistiu' in valor_lower:
        resultado['clienteDesistiu'] = True
    
    # Subsídios enviados
    if 'subsídios enviados' in valor_lower or 'subsidios enviados' in valor_lower:
        resultado['processoAdministrativo'] = 'Sim - Status Não Atendido'
        resultado['encaminhadoJuridico'] = True
        
        if 'celcoin' in valor_lower:
            resultado['processoEncaminhadoResponsavel'] = 'Celcoin'
        elif 'tadeu' in valor_lower or 'dr tadeu' in valor_lower:
            resultado['processoEncaminhadoResponsavel'] = 'Tadeu'
        elif 'aline' in valor_lower:
            resultado['processoEncaminhadoResponsavel'] = 'Aline'
        
        return resultado
    
    # Status "Não Atendido"
    nao_atendido_patterns = [
        'sim',
        'procon marcou como "não atendida"',
        'procon marcou como não atendida',
        'sim, porém encerrado',
        'sim, porem encerrado'
    ]
    
    if any(pattern in valor_lower for pattern in nao_atendido_patterns):
        resultado['processoAdministrativo'] = 'Sim - Status Não Atendido'
        return resultado
    
    # Status "Atendido"
    atendido_patterns = [
        'encerrado',
        'procon marcou como "atendida"',
        'procon marcou como atendida',
        'sem manifestação do procon',
        'falta de interação do consumidor',
        'resolvido',
        'cliente marcou como resolvido'
    ]
    
    if any(pattern in valor_lower for pattern in atendido_patterns):
        resultado['processoAdministrativo'] = 'Não - Status Atendido'
        return resultado
    
    # Se não encontrou padrão, deixar vazio
    return resultado

def processar_linha(row, responsavel='Sistema'):
    """Processa uma linha da planilha e retorna documento MongoDB"""
    
    # Mapeamento de colunas reais da planilha:
    # 'CÓDIGO:' (0) → A
    # 'CPF:' (1) → B
    # 'NOME: ' (2) → C
    # 'Data Procon:' (3) → D
    # 'Assunto:' (4) → E
    # 'Produto: ' (5) → F
    # 'Solução apresentada:' (6) → G
    # 'Processo administrativo' (7) → H
    # 'Progresso do Processo' (8) → I
    
    # Processar coluna H (Processo administrativo)
    col_h = row.get('Processo administrativo') if 'Processo administrativo' in row.index else None
    col_i = row.get('Progresso do Processo') if 'Progresso do Processo' in row.index else None
    col_h_result = processar_coluna_h(col_h, col_i)
    
    # Processar data de encerramento (coluna I - 'Progresso do Processo')
    processoEncerrado = False
    dataProcessoEncerrado = None
    valor_i = col_i
    if valor_i is not None and not pd.isna(valor_i):
        # Se for string, verificar se não está vazia
        if isinstance(valor_i, str):
            valor_i_str = valor_i.strip().lower()
            if valor_i_str and valor_i_str not in ['', 'nan', 'none']:
                processoEncerrado = True
                # Tentar extrair data se houver
                data_i = formatar_data(valor_i)
                if data_i:
                    dataProcessoEncerrado = data_i
        # Se for número ou datetime, considerar como data
        elif isinstance(valor_i, (int, float, datetime)):
            processoEncerrado = True
            data_i = formatar_data(valor_i)
            if data_i:
                dataProcessoEncerrado = data_i
    
    # Construir documento usando nomes reais das colunas
    doc = {
        'nome': str(row.get('NOME: ', '') or '').strip() if 'NOME: ' in row.index and not pd.isna(row.get('NOME: ')) else '',
        'cpf': limpar_cpf(row.get('CPF:') if 'CPF:' in row.index else None),
        'telefones': {
            'lista': []
        },
        'email': '',
        'observacoes': '',
        'responsavel': responsavel,
        
        # Campos específicos Procon
        'codigoProcon': str(row.get('CÓDIGO:', '') or '').strip() if 'CÓDIGO:' in row.index and not pd.isna(row.get('CÓDIGO:')) else '',
        'dataProcon': formatar_data(row.get('Data Procon:') if 'Data Procon:' in row.index else None),
        'produto': str(row.get('Produto: ', '') or '').strip() if 'Produto: ' in row.index and not pd.isna(row.get('Produto: ')) else '',
        'motivoReduzido': str(row.get('Assunto:', '') or '').strip() if 'Assunto:' in row.index and not pd.isna(row.get('Assunto:')) else '',
        'motivoDetalhado': '',
        'solucaoApresentada': str(row.get('Solução apresentada:', '') or '').strip() if 'Solução apresentada:' in row.index and not pd.isna(row.get('Solução apresentada:')) else '',
        
        # Campos da coluna H processados
        'processoAdministrativo': col_h_result['processoAdministrativo'],
        'clienteDesistiu': col_h_result['clienteDesistiu'],
        'encaminhadoJuridico': col_h_result['encaminhadoJuridico'],
        'processoEncaminhadoResponsavel': col_h_result['processoEncaminhadoResponsavel'],
        'processoEncaminhadoData': None,  # Não há data na planilha
        
        # Campos da coluna I
        'processoEncerrado': processoEncerrado,
        'dataProcessoEncerrado': dataProcessoEncerrado,
        
        'registrosReclameAqui': '',
        'anexos': [],
        
        # Tratativa N1 (vazios para Procon)
        'acionouCentral': False,
        'protocolosCentral': [],
        'n2SegundoNivel': False,
        'protocolosN2': [],
        'reclameAqui': False,
        'protocolosReclameAqui': [],
        'procon': True,
        'protocolosProcon': [],
        
        'Finalizado': {
            'Resolvido': None,
            'dataResolucao': None
        },
        
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }
    
    # Validar campos obrigatórios
    if not doc['cpf'] or len(doc['cpf']) != 11:
        return None  # CPF inválido, pular linha
    
    if not doc['codigoProcon']:
        return None  # Código Procon obrigatório
    
    return doc

def main():
    """Função principal"""
    print('🚀 Iniciando importação Procon Excel → MongoDB...')
    print(f'   Modo: {"DRY-RUN (apenas validação)" if DRY_RUN else "IMPORTAÇÃO REAL"}')
    print(f'   Collection: {COLLECTION_NAME}\n')
    
    # Caminho da planilha (relativo à raiz do projeto)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    planilha_path = os.path.join(
        project_root,
        'dados procon',
        'Copy of Planilha RA e Procon acompanhamento 2026.xlsx'
    )
    
    if not os.path.exists(planilha_path):
        print(f"❌ Erro: Planilha não encontrada em: {planilha_path}")
        sys.exit(1)
    
    print(f"📖 Lendo planilha: {planilha_path}")
    
    try:
        # Ler aba "Procons"
        df = pd.read_excel(planilha_path, sheet_name='Procons', header=0)
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
                doc = processar_linha(row)
                if doc:
                    documentos.append(doc)
                else:
                    linhas_ignoradas += 1
                    if linhas_ignoradas <= 20:  # Mostrar primeiras 20 linhas ignoradas
                        cpf_val = row.get('CPF:') if 'CPF:' in row.index else None
                        codigo_val = row.get('CÓDIGO:') if 'CÓDIGO:' in row.index else None
                        cpf_limpo = limpar_cpf(cpf_val) if cpf_val is not None else None
                        motivo = []
                        if not cpf_limpo or len(cpf_limpo) != 11:
                            motivo.append(f"CPF inválido: {cpf_val}")
                        if not codigo_val or pd.isna(codigo_val) or str(codigo_val).strip() == '':
                            motivo.append(f"Código Procon vazio: {codigo_val}")
                        print(f"⚠️ Linha {idx + 2} ignorada: {', '.join(motivo) if motivo else 'dados inválidos'}")
            except Exception as e:
                erros += 1
                print(f"❌ Erro ao processar linha {idx + 2}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        if linhas_ignoradas > 10:
            print(f"⚠️ ... e mais {linhas_ignoradas - 10} linhas ignoradas")
        
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
                    collection.create_index('codigoProcon')
                except Exception as e:
                    print(f"   Índice 'codigoProcon' já existe ou erro: {str(e)[:50]}")
                
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
                print("📋 Exemplos de processamento da coluna H:")
                exemplos_h = {}
                for doc in documentos[:50]:  # Primeiros 50 para análise
                    proc_adm = doc.get('processoAdministrativo', '')
                    chave = f"{proc_adm}_{doc.get('clienteDesistiu')}_{doc.get('encaminhadoJuridico')}_{doc.get('processoEncaminhadoResponsavel', '')}"
                    if chave not in exemplos_h:
                        exemplos_h[chave] = {
                            'processoAdministrativo': proc_adm,
                            'clienteDesistiu': doc.get('clienteDesistiu', False),
                            'encaminhadoJuridico': doc.get('encaminhadoJuridico', False),
                            'processoEncaminhadoResponsavel': doc.get('processoEncaminhadoResponsavel', ''),
                            'processoEncerrado': doc.get('processoEncerrado', False)
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
