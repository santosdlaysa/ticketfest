# Lumera Mobile App

Aplicativo mobile React Native para o sistema Lumera de venda de ingressos.

## Tecnologias

- **React Native 0.81** com Expo 54
- **TypeScript 5.9**
- **React Navigation 7** (navegação)
- **React Native Paper** (componentes UI)
- **Zustand** (gerenciamento de estado)
- **Axios** (requisições HTTP)
- **Expo Secure Store** (armazenamento seguro)
- **Expo Notifications** (notificações push)
- **Sentry** (monitoramento de erros)

## Funcionalidades Implementadas

- Sistema de autenticação (Login/Registro)
- Navegação AuthStack vs MainStack
- Bottom Tabs (Home, Ingressos, Pedidos, Perfil)
- Tema personalizado
- Integração com API backend
- Notificações push
- Armazenamento seguro de tokens

## Estrutura do Projeto

```
mobile/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── screens/          # Telas do app
│   │   ├── auth/         # Login, Register
│   │   ├── events/       # HomeScreen (lista de eventos)
│   │   ├── tickets/      # MyTicketsScreen
│   │   ├── orders/       # OrdersScreen
│   │   └── profile/      # ProfileScreen
│   ├── navigation/       # Configuração de navegação
│   ├── services/         # API client (axios)
│   ├── stores/           # Zustand stores (auth, cart)
│   ├── types/            # TypeScript types
│   ├── theme/            # Tema e estilos globais
│   └── utils/            # Utilitários
├── assets/               # Ícones e imagens
├── app.json              # Configuração do Expo
├── index.ts              # Entry point
└── package.json
```

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend Lumera rodando (porta 4000)

## Iniciando o Projeto

```bash
# 1. Navegue até a pasta mobile
cd mobile

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm start
```

Após executar `npm start`, o Expo abrirá um menu com opções:
- Pressione `a` para abrir no Android Emulator
- Pressione `i` para abrir no iOS Simulator (requer macOS)
- Pressione `w` para abrir no navegador
- Escaneie o QR code com o app Expo Go para testar no celular

## Executando o App

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o Expo dev server |
| `npm run android` | Executa no Android (emulador ou device) |
| `npm run ios` | Executa no iOS Simulator (requer macOS) |
| `npm run web` | Executa no navegador |

### Usando Expo Go (recomendado)

1. Instale o [Expo Go](https://expo.dev/client) no seu celular (iOS/Android)
2. Execute `npm start` no terminal
3. Escaneie o QR code com a câmera (iOS) ou app Expo Go (Android)

**Importante**: Para acessar o backend do celular físico:
- Backend e celular devem estar na mesma rede WiFi
- Configure o IP local em `src/services/api.ts`
- Exemplo: `http://192.168.1.100:4000/api`

### Nota para Android Emulator

O localhost do backend é acessado via `10.0.2.2:4000` no emulador Android (já configurado).

## Configuração da API

Edite o arquivo `src/services/api.ts` para configurar a URL do backend:

```typescript
const API_URL = __DEV__
  ? 'http://10.0.2.2:4000/api'  // Android Emulator
  // ? 'http://192.168.1.100:4000/api'  // Device real (use seu IP)
  : 'https://api.lumera.com/api'; // Produção
```

## Testando

1. Certifique-se que o backend está rodando na porta 4000
2. Crie uma conta nova na tela de Registro ou use uma conta existente do sistema web

## Debug

```bash
# Limpar cache do Expo
npx expo start -c

# Ver logs detalhados
npx expo start --dev-client
```

## Documentação

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand](https://github.com/pmndrs/zustand)
