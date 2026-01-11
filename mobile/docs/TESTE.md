# 🧪 Guia de Testes - Lumera Mobile

## ✅ Correções Aplicadas

### Problema Identificado
```
java.lang.string cannot be cast to java.lang.boolean
```

### Solução
O erro foi causado pelo uso incorreto de `IconButton` do React Native Paper como `tabBarIcon` no React Navigation.

**Antes (incorreto):**
```tsx
<IconButton icon="home" iconColor={color} size={size} />
```

**Depois (correto):**
```tsx
<MaterialCommunityIcons name="home" size={size} color={color} />
```

Os ícones do React Navigation devem usar componentes de ícone diretamente (como `MaterialCommunityIcons` do `@expo/vector-icons`), não componentes de botão.

### Pacotes Instalados Adicionalmente
- `react-native-web` - Suporte web
- `react-dom` - React DOM para web
- `@expo/metro-runtime` - Runtime do Metro
- `react-native-screens@4.16.0` - Versão corrigida
- `react-native-svg@15.12.1` - Versão corrigida

## 🚀 Como Testar o App

### Pré-requisitos
1. ✅ Backend rodando na porta 4000
2. ✅ Dependências instaladas (já feito)
3. ✅ Expo instalado

### Opção 1: Dispositivo Real (Recomendado)

#### Passo 1: Instale o Expo Go
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Passo 2: Configure o IP do Backend
Edite `mobile/src/services/api.ts`:

```typescript
const API_URL = __DEV__
  ? 'http://SEU_IP_LOCAL:4000/api'  // Ex: 'http://192.168.1.100:4000/api'
  : 'https://api.Lumera.com/api';
```

Para descobrir seu IP:
- **Windows**: `ipconfig` (procure IPv4)
- **Mac/Linux**: `ifconfig` ou `ip addr`

#### Passo 3: Inicie o Expo
```bash
cd mobile
npm start
```

#### Passo 4: Escaneie o QR Code
- **iOS**: Use a câmera nativa
- **Android**: Use o app Expo Go

### Opção 2: Emulador Android

#### Passo 1: Configure o IP
Use `10.0.2.2` para acessar localhost do host:

```typescript
const API_URL = __DEV__
  ? 'http://10.0.2.2:4000/api'
  : 'https://api.Lumera.com/api';
```

#### Passo 2: Inicie o Expo
```bash
cd mobile
npm start
```

#### Passo 3: Pressione 'a' para Android
O app será instalado e iniciado automaticamente.

### Opção 3: Simulador iOS (requer macOS)

```bash
cd mobile
npm run ios
```

### Opção 4: Web (para testes rápidos)

```bash
cd mobile
npm run web
```

Ou pressione 'w' após executar `npm start`.

**Nota**: A versão web pode ter limitações (ex: câmera, notificações).

## 🧪 Roteiro de Testes

### 1. Teste de Registro
1. Abra o app
2. Clique em "Não tem conta? Cadastre-se"
3. Preencha os dados:
   - Nome: Seu Nome
   - Email: teste@email.com
   - Telefone: (opcional)
   - CPF: (opcional)
   - Senha: 123456
   - Confirmar Senha: 123456
4. Clique em "Cadastrar"
5. ✅ Deve ser direcionado para a tela principal (HomeTabs)

### 2. Teste de Login
1. Faça logout (botão "Sair" na Home)
2. Na tela de login, insira:
   - Email: teste@email.com
   - Senha: 123456
3. Clique em "Entrar"
4. ✅ Deve ser direcionado para a tela principal

### 3. Teste de Navegação
1. Verifique se os 4 tabs estão visíveis:
   - 🏠 Eventos
   - 🎫 Ingressos
   - 🧾 Pedidos
   - 👤 Perfil
2. Clique em cada tab
3. ✅ Deve navegar entre as telas (placeholders por enquanto)

### 4. Teste de Persistência
1. Feche o app completamente
2. Abra novamente
3. ✅ Deve continuar logado (não pedir login novamente)

### 5. Teste de Validação
Na tela de login/registro:
- Deixe campos vazios → ✅ Deve mostrar erros
- Digite email inválido → ✅ Deve mostrar erro
- Digite senha < 6 caracteres → ✅ Deve mostrar erro
- Senhas não conferem → ✅ Deve mostrar erro

## 🐛 Troubleshooting

### App não conecta ao backend

**Erro**: "Network request failed"

**Soluções**:
1. Verifique se o backend está rodando (`http://localhost:4000`)
2. Certifique-se de que o celular e PC estão na mesma rede WiFi
3. Verifique se o IP em `api.ts` está correto
4. Teste se consegue acessar `http://SEU_IP:4000/api/events` do navegador do celular

### App não inicia

**Erro**: "Unable to resolve module..."

**Solução**:
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c  # -c para limpar cache
```

### Erro de versão de pacotes

```bash
cd mobile
npx expo install --fix
```

### Metro Bundler travado

```bash
# Kill Metro
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
killall node

# Limpar cache e reiniciar
cd mobile
npx expo start -c
```

## 📊 Status de Funcionalidades

### ✅ Implementado (Fase 1)
- [x] Autenticação (Login/Registro)
- [x] Persistência de sessão
- [x] Navegação bottom tabs
- [x] Tema customizado
- [x] Validação de formulários
- [x] Integração com API backend

### 🚧 Em Desenvolvimento (Próximas Fases)
- [ ] Lista de eventos
- [ ] Detalhes do evento
- [ ] Carrinho de compras
- [ ] Checkout
- [ ] Meus ingressos com QR Code
- [ ] Scanner de QR (organizadores)

## 📝 Notas Importantes

1. **O backend DEVE estar rodando** para o app funcionar
2. **Use uma conta de teste** - não use credenciais reais
3. **Modo DEV** - O app está em modo desenvolvimento (verá logs no console)
4. **Hot Reload** - Mudanças no código atualizam automaticamente

## 🔧 Comandos Úteis

```bash
# Iniciar Expo
npm start

# Limpar cache
npm start -- --clear

# Rodar em Android
npm run android

# Rodar em iOS (macOS)
npm run ios

# Rodar na web
npm run web

# Reinstalar dependências
rm -rf node_modules && npm install

# Ver logs do dispositivo
npx expo start --dev-client
```

## 📱 Screenshots Esperados

### Tela de Login
- Logo "Lumera"
- Campos de Email e Senha
- Botão "Entrar"
- Link "Não tem conta? Cadastre-se"

### Tela de Registro
- Título "Criar Conta"
- Campos: Nome, Email, Telefone, CPF, Senha, Confirmar Senha
- Botão "Cadastrar"
- Link "Já tem conta? Faça login"

### Home (após login)
- Mensagem "Bem-vindo, [Nome]!"
- Botão "Sair"
- Bottom navigation com 4 tabs

## ✅ Checklist de Testes

Marque conforme testa:

- [ ] App inicia sem erros
- [ ] Tela de login aparece
- [ ] Consegue criar conta nova
- [ ] Consegue fazer login
- [ ] Bottom tabs funcionam
- [ ] Logout funciona
- [ ] Reabrir app mantém login
- [ ] Validações de formulário funcionam
- [ ] Não há erros no console

Se todos os itens estiverem marcados, a Fase 1 está 100% funcional! 🎉

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Verifique o console do Expo
3. Consulte a [documentação do Expo](https://docs.expo.dev/)
4. Veja os arquivos:
   - `mobile/README.md` - Documentação geral
   - `mobile/src/services/api.ts` - Configuração da API
