# 🌐 Túnel Público para MFEs - Guia Nível Empresa

## 📋 **O que isso faz?**

Expõe seus MFEs locais (localhost) para a **internet pública** usando túneis HTTP profissionais, simulando ambiente de produção com URLs reais.

---

## 🚀 **Quick Start**

### **1. Instale uma ferramenta de túnel (escolha uma):**

#### ✅ **Cloudflared (RECOMENDADO - Nível Enterprise)**
```bash
# Windows (com chocolatey)
choco install cloudflared

# Mac
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

#### **Localtunnel (Alternativa - NPM)**
```bash
npm install -g localtunnel
```

#### **ngrok (Alternativa - Comercial)**
Download: https://ngrok.com/download

---

### **2. Execute o script:**

```bash
# Primeiro, inicie todos os MFEs normalmente
bash run-native-shell.sh

# Em outro terminal, crie os túneis públicos
bash expose-public.sh
```

### **3. Acesse com URLs públicas:**

```
http://localhost:9100/?env=public
```

---

## 📊 **Comparação de Ferramentas**

| Ferramenta | Grátis | Múltiplos Túneis | Velocidade | Enterprise |
|------------|--------|------------------|------------|------------|
| **Cloudflared** | ✅ Ilimitado | ✅ Sim | ⚡ Muito rápido | ✅ Zero-Trust |
| **Localtunnel** | ✅ Sim | ✅ Sim | 🐢 Médio | ❌ Community |
| **ngrok** | ⚠️ 1 túnel | ⚠️ Pago | ⚡ Rápido | ✅ Enterprise |

---

## 🎯 **Casos de Uso**

### **1. Testes em dispositivos móveis**
```bash
# Gera URLs públicas
bash expose-public.sh

# Acesse do celular
https://abc123.trycloudflare.com
```

### **2. Demo para clientes**
```bash
# URLs públicas temporárias
# Expires quando você parar o script
```

### **3. Testes cross-browser reais**
```bash
# BrowserStack, LambdaTest, etc
# Podem acessar as URLs públicas
```

### **4. Webhook testing**
```bash
# APIs externas podem chamar suas URLs
# Útil para: Stripe webhooks, OAuth callbacks, etc
```

---

## 🔧 **Configuração Avançada**

### **Forçar ferramenta específica:**

```bash
# Usar cloudflared
TUNNEL_TOOL=cloudflared bash expose-public.sh

# Usar localtunnel
TUNNEL_TOOL=localtunnel bash expose-public.sh
```

### **Customizar portas expostas:**

Edite `expose-public.sh`:
```bash
PORTS=(9001 9101 9201 9301 9302 9303 9310 9400)
```

---

## 🛡️ **Segurança**

### ⚠️ **IMPORTANTE:**

1. **Túneis são temporários** - Expiram quando você para o script
2. **Não committar** `remotes.public.json` (já está no .gitignore)
3. **Não expor dados sensíveis** - Apenas para dev/demo
4. **Rate limiting** - Cloudflare tem proteção automática

### **Melhores Práticas:**

```bash
# ✅ BOM: Dev/demo temporário
bash expose-public.sh

# ❌ RUIM: Produção (use deploy real)
# Túneis são para testes, não prod!
```

---

## 🐛 **Troubleshooting**

### **Timeout ao criar túnel:**
```bash
# Verifique se a porta está rodando
curl http://localhost:9101/mfe1.js

# Se não responder, inicie os MFEs primeiro
bash run-native-shell.sh
```

### **URL não funciona:**
```bash
# Verifique os logs
cat .run-logs/tunnel-9101.log

# Reinicie o túnel
kill $(cat .run-logs/tunnel-*.pid)
bash expose-public.sh
```

### **Cloudflared não encontrado:**
```bash
# Adicione ao PATH (Windows Git Bash)
export PATH="/c/Program Files/cloudflared:$PATH"
```

---

## 📈 **Performance Esperada**

| Cenário | Localhost | Túnel Cloudflare | Túnel Localtunnel |
|---------|-----------|------------------|-------------------|
| **Latência adicional** | 0ms | +50-150ms | +100-300ms |
| **Bandwidth** | Ilimitado | 100 Mbps | Variável |
| **Uptime** | 100% | 99.9% | ~95% |

---

## 🔗 **Exemplo de Uso Completo**

```bash
# Terminal 1: Inicia todos os MFEs
bash run-native-shell.sh

# Terminal 2: Cria túneis públicos
bash expose-public.sh

# Output esperado:
# 🌐 [expose-public] Expondo MFEs publicamente...
# ✅ Usando: cloudflared
# 🔗 Criando túnel cloudflared para porta 9101 (nf)...
#   ✅ https://abc-def-123.trycloudflare.com
# ...
# 🚀 Para usar as URLs públicas, acesse:
#    http://localhost:9100/?env=public
```

---

## 🎓 **Referências Enterprise**

- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Localtunnel:** https://theboroer.github.io/localtunnel-www/
- **ngrok:** https://ngrok.com/docs

---

## 💡 **Dicas Pro**

### **1. Alias para facilitar:**
```bash
# Adicione no seu ~/.bashrc ou ~/.zshrc
alias mfe-public="bash expose-public.sh"
```

### **2. Script combo:**
```bash
# Crie run-public.sh
bash run-native-shell.sh &
sleep 30  # Aguarda MFEs iniciarem
bash expose-public.sh
```

### **3. Monitoramento:**
```bash
# Ver logs em tempo real
tail -f .run-logs/tunnel-*.log
```

---

## ✅ **Checklist de Deploy**

Antes de compartilhar URLs públicas:

- [ ] Todos MFEs rodando (`bash run-native-shell.sh`)
- [ ] Túneis criados (`bash expose-public.sh`)
- [ ] URLs públicas funcionando (teste no browser)
- [ ] `remotes.public.json` gerado
- [ ] Shell acessível com `?env=public`

---

**Pronto! Seus MFEs agora estão acessíveis publicamente! 🚀**
