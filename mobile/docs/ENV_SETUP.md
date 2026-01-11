# Configuração de Variáveis de Ambiente - Mobile

Este guia explica como configurar e usar variáveis de ambiente no aplicativo mobile React Native/Expo.

## Opções de Configuração

Para projetos Expo, existem algumas formas de configurar variáveis de ambiente:

### Opção 1: Usar app.config.js (Recomendado para Expo)

1. Renomeie `app.json` para `app.config.js`
2. Configure as variáveis de ambiente:

```javascript
export default {
  expo: {
    name: "Lumera",
    slug: "lumera",
    version: "1.0.0",
    // ... resto da configuração
    extra: {
      apiUrl: process.env.API_URL || 'http://192.168.1.100:3000/api',
      baseUrl: process.env.BASE_URL || 'http://192.168.1.100:3000',
    }
  }
}
```

3. Acesse as variáveis no código:

```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

### Opção 2: Usar react-native-dotenv (Mais simples)

1. Instale o pacote:

```bash
npm install --save-dev react-native-dotenv
# ou
yarn add -D react-native-dotenv
```

2. Crie um arquivo `babel.config.js` na raiz do projeto mobile:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }]
    ]
  };
};
```

3. Crie um arquivo de tipagem `env.d.ts` na pasta `src`:

```typescript
declare module '@env' {
  export const API_URL: string;
  export const BASE_URL: string;
  export const NODE_ENV: string;
  export const USE_MOCK_DATA: string;
  export const API_TIMEOUT: string;
}
```

4. Use no código:

```typescript
import { API_URL, BASE_URL } from '@env';

const api = axios.create({
  baseURL: API_URL,
});
```

### Opção 3: Hardcode no código (Atual)

Atualmente, a URL da API está hardcoded em `src/services/api.ts`:

```typescript
const API_URL = __DEV__
  ? 'http://192.168.100.136:3000/api'
  : 'https://api.Lumera.com/api';
```

Para mudar o IP:
1. Abra `src/services/api.ts`
2. Altere a linha 30 com o IP da sua máquina
3. Reinicie o app com `npm start`

## Como Descobrir o IP da Sua Máquina

### Windows
```bash
ipconfig
```
Procure por "IPv4 Address" na interface de rede ativa (geralmente WiFi ou Ethernet)

### Mac/Linux
```bash
ifconfig
# ou
ip addr show
```

### Via Expo
Quando você roda `npm start`, o Expo mostra o IP no terminal:
```
Metro waiting on exp://192.168.1.100:8081
```

## Arquivo .env

Crie um arquivo `.env` na raiz do projeto mobile baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e substitua `192.168.1.100` pelo IP da sua máquina.

## Ambientes Diferentes

Você pode criar diferentes arquivos de ambiente:

- `.env.development` - Para desenvolvimento local
- `.env.staging` - Para ambiente de homologação
- `.env.production` - Para produção

E usar a variável `APP_ENV` para alternar entre eles.

## Segurança

1. Nunca commit o arquivo `.env` (já está no `.gitignore`)
2. Commit apenas o `.env.example` com valores de exemplo
3. Não coloque senhas ou tokens secretos no código
4. Use variáveis de ambiente para informações sensíveis

## Troubleshooting

### Erro "Unable to resolve module @env"
- Certifique-se de que instalou o `react-native-dotenv`
- Verifique se o `babel.config.js` está configurado corretamente
- Limpe o cache do Metro: `npx expo start --clear`

### Não consegue conectar na API
- Verifique se o backend está rodando
- Confirme que o IP no `.env` ou `api.ts` está correto
- No Android físico, certifique-se de estar na mesma rede WiFi
- No iOS/Android emulador, use o IP da máquina (não localhost)
- Desabilite o firewall temporariamente para testar

### App não atualiza após mudar .env
- Pare o servidor com Ctrl+C
- Limpe o cache: `npx expo start --clear`
- Reconstrua o app se necessário
