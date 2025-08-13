# VeloHub - Portal de Processos

## 📋 Descrição
Portal de processos com chatbot integrado, sistema de notícias e suporte ao usuário.

## 🚀 Como Executar

### Versão Padrão (v1)
```bash
npm start
```

### Versão v2 (Nova Interface)
```bash
npm run start:v2
```

## 🔧 Correções Realizadas

### Problema Identificado
- O arquivo `velohub_v2.html` continha código React mas tinha extensão `.html`
- Isso causava erros de sintaxe e problemas de execução
- O código estava misturado e não funcionava corretamente

### Solução Implementada
1. **Conversão do código**: Convertido o código do `velohub_v2.html` para um componente React adequado (`src/App_v2.js`)
2. **Estrutura organizada**: Separado os componentes em arquivos apropriados
3. **Sistema de versões**: Implementado um sistema para alternar entre versões usando variáveis de ambiente
4. **Configuração do Tailwind**: Verificado que o modo escuro está configurado corretamente

## 📁 Estrutura do Projeto

```
src/
├── App.js          # Versão original
├── App_v2.js       # Nova versão (convertida do velohub_v2.html)
├── index.js        # Ponto de entrada (detecta versão automaticamente)
├── index.css       # Estilos globais
├── services/       # Serviços de API
└── lib/           # Bibliotecas e configurações
```

## 🎨 Funcionalidades

### Versão v2 (Nova)
- ✅ Interface moderna com modo escuro
- ✅ Chatbot integrado com feedback
- ✅ Sistema de notícias críticas
- ✅ Navegação entre páginas
- ✅ Componentes responsivos
- ✅ Integração com Lucide React icons

### Componentes Principais
- **Header**: Navegação e busca
- **HomePage**: Dashboard com notícias e status
- **ProcessosPage**: Chatbot com FAQ
- **ApoioPage**: Página de suporte
- **Chatbot**: Interface de chat com feedback

## 🛠️ Tecnologias Utilizadas
- React 18
- Tailwind CSS
- Lucide React (ícones)
- MongoDB (backend)

## 📝 Scripts Disponíveis
- `npm start` - Executa versão padrão
- `npm run start:v2` - Executa versão v2
- `npm run build` - Build da versão padrão
- `npm run build:v2` - Build da versão v2
- `npm run server` - Executa servidor backend
- `npm run backend` - Executa servidor backend alternativo

## 🔍 Status da Correção
✅ **Problema resolvido**: O arquivo `velohub_v2.html` foi convertido corretamente para React
✅ **Estrutura organizada**: Código separado em componentes adequados
✅ **Sistema de versões**: Implementado sistema para alternar entre versões
✅ **Funcionalidade preservada**: Todas as funcionalidades da versão original mantidas

## 🚨 Evitando Loops Agressivos
- Implementado sistema de detecção de versão automática
- Código organizado em componentes separados
- Documentação clara para evitar confusão
- Estrutura de projeto padronizada
