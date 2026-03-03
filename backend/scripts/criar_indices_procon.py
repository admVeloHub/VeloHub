#!/usr/bin/env python3
"""
Script para criar índices na collection reclamacoes_procon
VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
"""

import os
import sys
from pymongo import MongoClient
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

MONGO_URI = os.getenv('MONGO_ENV')
if not MONGO_URI:
    print("❌ Erro: MONGO_ENV não configurada")
    sys.exit(1)

DB_NAME = 'hub_ouvidoria'
COLLECTION_NAME = 'reclamacoes_procon'

def main():
    print('🔍 Criando índices na collection reclamacoes_procon...\n')
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        print(f"✅ Conectado ao MongoDB: {DB_NAME}.{COLLECTION_NAME}\n")
        
        # Listar índices existentes
        indices_existentes = collection.list_indexes()
        print("📋 Índices existentes:")
        for idx in indices_existentes:
            print(f"   - {idx['name']}: {idx.get('key', {})}")
        print()
        
        # Criar índices (apenas se não existirem)
        indices_para_criar = [
            ('cpf', 'cpf'),
            ('codigoProcon', 'codigoProcon'),
            ('telefones.lista', 'telefones.lista'),
            ('email', 'email'),
            ('createdAt', 'createdAt')
        ]
        
        print("🔧 Criando/verificando índices...")
        for nome_campo, campo in indices_para_criar:
            try:
                # Verificar se já existe
                existe = False
                for idx in collection.list_indexes():
                    if idx['name'] == f'{campo}_1' or (campo == 'telefones.lista' and idx['name'] == 'telefones.lista_1'):
                        existe = True
                        break
                
                if not existe:
                    collection.create_index(campo)
                    print(f"   ✅ Índice '{campo}' criado")
                else:
                    print(f"   ⚠️  Índice '{campo}' já existe")
            except Exception as e:
                print(f"   ❌ Erro ao criar índice '{campo}': {str(e)[:100]}")
        
        print("\n✅ Processo concluído\n")
        
        # Listar índices finais
        print("📋 Índices finais:")
        for idx in collection.list_indexes():
            print(f"   - {idx['name']}: {idx.get('key', {})}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
