# TicketFest Mobile App

Aplicativo mobile React Native para o sistema TicketFest de venda de ingressos.

## 🚀 Tecnologias

- **React Native** com Expo
- **TypeScript**
- **React Navigation** 6 (navegação)
- **React Native Paper** (componentes UI)
- **Zustand** (gerenciamento de estado)
- **Axios** (requisições HTTP)
- **AsyncStorage** (armazenamento local)

## 📱 Funcionalidades Implementadas (Fase 1)

- ✅ Estrutura base do projeto
- ✅ Sistema de autenticação (Login/Registro)
- ✅ Navegação AuthStack vs MainStack
- ✅ Bottom Tabs (Home, Ingressos, Pedidos, Perfil)
- ✅ Tema personalizado
- ✅ Integração com API backend

## 🏗️ Estrutura do Projeto

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
│   ├── types/            # TypeScript types (reuso do web)
│   ├── theme/            # Tema e estilos globais
│   └── utils/            # Utilitários
├── App.tsx               # Entry point
└── package.json
```

## 🔧 Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Backend TicketFest rodando (porta 4000)

### Instalação

```bash
# Navegue até a pasta mobile
cd mobile

# Instale as dependências (já foi feito)
npm install

# Inicie o servidor de desenvolvimento
npm start
```

## 📲 Executando o App

### iOS (requer macOS)

```bash
npm run ios
```

### Android

```bash
npm run android
```

**Nota para Android Emulator**: Se estiver usando emulador Android, o localhost do backend precisa ser acessado via `10.0.2.2:4000` ao invés de `localhost:4000`. Isso já está configurado no arquivo `src/services/api.ts`.

### Web (para testes)

```bash
npm run web
```

### Usando Expo Go (recomendado para início)

1. Instale o app Expo Go no seu celular:
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Execute `npm start` no terminal

3. Escaneie o QR code com:
   - **iOS**: Câmera nativa
   - **Android**: App Expo Go

4. **IMPORTANTE**: Para que o app mobile acesse o backend:
   - Backend e celular devem estar na mesma rede WiFi
   - Atualize o IP no arquivo `src/services/api.ts` para o IP local da máquina que roda o backend
   - Exemplo: `http://192.168.1.100:4000/api`

## 🔑 Configuração da API

Edite o arquivo `src/services/api.ts` para configurar a URL do backend:

```typescript
const API_URL = __DEV__
  ? 'http://10.0.2.2:4000/api'  // Android Emulator
  // ? 'http://192.168.1.100:4000/api'  // Device real (use IP da máquina)
  : 'https://api.ticketfest.com/api'; // Produção
```

## 🧪 Testando o Login

Para testar o aplicativo, você pode:

1. **Criar conta nova**: Use a tela de Registro
2. **Usar conta existente**: Se já tem conta no sistema web

O backend deve estar rodando na porta 4000.

## 📝 Próximas Fases

### Fase 2: Eventos e Compra (4-5 dias)
- [ ] Lista de eventos com busca e filtros
- [ ] Detalhes do evento
- [ ] Carrinho de compras
- [ ] Checkout com Stripe

### Fase 3: Meus Ingressos (2-3 dias)
- [ ] Lista de ingressos
- [ ] Visualização de QR Code
- [ ] Cache offline

### Fase 4: Scanner QR (Organizadores) (3-4 dias)
- [ ] Scanner de QR Code
- [ ] Validação de ingressos
- [ ] Estatísticas

### Fase 5: Features Avançadas
- [ ] Notificações push
- [ ] Apple Wallet / Google Pay
- [ ] Mapas

## 🐛 Debug

### Logs

```bash
# Ver logs do app
npx expo start --dev-client

# Limpar cache
npx expo start -c
```

### Reset do AsyncStorage

Se precisar limpar os dados salvos localmente, desinstale e reinstale o app ou use:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## 📚 Documentação Útil

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand](https://github.com/pmndrs/zustand)

## 👨‍💻 Desenvolvimento

Este app foi desenvolvido seguindo as melhores práticas de React Native e reutilizando types e lógica do frontend web sempre que possível.

### Scripts Disponíveis

```bash
npm start          # Inicia o Expo
npm run android    # Roda no Android
npm run ios        # Roda no iOS
npm run web        # Roda no navegador
```

## 📄 Licença

Este projeto faz parte do sistema TicketFest.
