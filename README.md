# Tradutor Bilíngue — Aprenda Lendo

Extensão Manifest V3 para mostrar traduções abaixo do original. A tradução sem cores não exige chave de API. O alinhamento contextual por cores exige uma API de IA configurada. Usa a API Translator do navegador e baixa os modelos de idioma quando necessário. O suporte depende do navegador, computador e par de idiomas; Chrome desktop é o alvo principal. Edge só funciona se disponibilizar a mesma API. Não funciona no Chrome Android.

## Instalação
1. Baixe o repositório em **Code → Download ZIP** e extraia-o.
2. No Chrome do computador, abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique **Carregar sem compactação** e selecione a pasta extraída do repositório que contém `manifest.json`.
5. Abra uma página, clique na extensão, escolha os idiomas e clique **Traduzir página**.
6. Mantenha o painel aberto até concluir; fechá-lo interrompe o processamento. A tradução já inserida continua visível. Use **Remover traduções** para limpar.

## Como aparece
Original: I enjoy learning new languages.
Tradução abaixo: Eu gosto de aprender novos idiomas.

Parágrafos com `<br>` são tratados linha a linha. Cada tradução é inserida junto à quebra de linha correspondente, preservando os nós originais. Textos originais, links e eventos não são substituídos. A extensão acrescenta elementos, portanto a altura da página aumenta.

## Escopo e limitações
- Parágrafos, títulos, listas, células e contêineres simples visíveis; até 500 blocos por execução.
- Não lê campos editáveis, código, navegação, imagens, PDFs, páginas internas, iframes ou Shadow DOM.
- Não detecta automaticamente o idioma: selecione o idioma do texto. Páginas com vários idiomas exigem atenção.
- Conteúdo carregado depois exige nova execução. Blocos alterados durante a tradução são ignorados.
- Tradução automática pode conter erros. Não é um tradutor oficial ou certificado.
- Não há telemetria. No modo por cores, original e tradução são enviados à API configurada. Idiomas e configurações ficam no armazenamento local.
- Permissões básicas: `activeTab`, `scripting` e `storage`. Acesso à página ao clicar; acesso opcional à API somente após autorização do domínio configurado.

## Verificação manual
Sirva a pasta por HTTP: `python -m http.server 8000`, depois abra `http://localhost:8000/demo.html`.
Traduza inglês → português. Confira títulos, links, linhas e texto em negrito. O botão deve continuar funcionando. Traduza novamente e confira que não duplica blocos. Remova e confira que o conteúdo original continua intacto.

Validação entregue: sintaxe JavaScript, manifest JSON e testes do alinhamento (mudança de ordem, repetições, limites de palavras, ausência de correspondência, espaços e maiúsculas). A execução da API/modelo e o comportamento visual precisam ser verificados no Chrome desktop; não foram testados em navegador real nesta entrega.

Referência técnica: https://developer.chrome.com/docs/ai/translator-api

## Versão 1.2 — alinhamento de sentido
Não usa grupos fixos de palavras, dicionário de exemplos ou tradução isolada de fragmentos. A IA recebe o original e a tradução completos e propõe unidades de sentido equivalentes. A mesma unidade recebe a mesma cor nas duas linhas, mesmo com ordem e quantidade de palavras diferentes. Uma unidade pode ocupar vários trechos separados. Cada unidade local tem uma cor distinta, com até 12 grupos por linha. As cores podem reaparecer em outras linhas.

### Configuração necessária para cores
Abra **Configurar IA para cores**, informe a URL completa de Chat Completions, o modelo e, quando exigida, sua chave. O serviço precisa aceitar mensagens de Chat Completions e `response_format: {type: "json_object"}`. Clique **Salvar e autorizar API**. A extensão solicita acesso apenas ao domínio informado. Aceita HTTPS ou HTTP em localhost. Pode usar um servidor compatível próprio, local ou hospedado.

O texto original e a tradução são enviados ao serviço escolhido. A chave fica em `chrome.storage.local`, sem sincronização; esse armazenamento não é um cofre criptografado. A API pode cobrar por uso. A tradução continua sendo feita pelo Translator do navegador. Sem API configurada, desative as cores para usar apenas a tradução. Não há chave ou fornecedor pré-configurado.

### Validação e falhas
A resposta deve reproduzir exatamente os dois textos, com segmentos contíguos, sem omissões ou reescritas, IDs válidos e correspondentes nos dois idiomas. Dados inválidos são rejeitados; o texto fica neutro com aviso. Falha HTTP ou tempo limite interrompe o uso da API naquela execução, mas permite continuar a tradução. Correspondências incertas também ficam neutras. A validação estrutural não garante que a análise semântica da IA esteja correta.

As cores do original usam CSS Custom Highlight, sem substituir nós de texto. A remoção também limpa os destaques. Sites que estilizam highlights podem interferir. Depois de atualizar a extensão, recarregue a página visitada. Mantenha o painel aberto durante o processamento.

### Testes
Execute `node tests/alignment.test.cjs` para verificar quantidades diferentes de palavras, mudança de ordem, unidades descontínuas, repetições, neutralidade, Unicode e respostas inválidas. São testes de contrato com respostas simuladas; não medem a qualidade linguística de um modelo real. Sintaxe JavaScript também validada. A integração com uma API real e a aparência no Chrome ainda não foram testadas nesta entrega.

## Versão 1.3 — original e tradução intercalados em trechos curtos
Parágrafos contínuos são divididos em frases e trechos menores, priorizando pontuação e limites de palavras. Cada tradução é inserida imediatamente após o trecho original correspondente. O texto original não é reescrito nem substituído por uma cópia. A inserção pode dividir nós de texto para abrir espaço entre frases; elementos originais e seus eventos permanecem. Ao remover, todos os elementos acrescentados e destaques são apagados; a divisão interna dos nós de texto pode permanecer, com o mesmo conteúdo original.

Escolha **Bem curtos** (até 80 caracteres, padrão), **Curtos** (até 100) ou **Médios** (até 160). Esse limite é do trecho original; a tradução pode ser mais longa. A quantidade de linhas visuais depende da largura e fonte do site: não se garante uma única linha em telas estreitas. Trechos são traduzidos individualmente, o que pode reduzir o contexto de frases longas divididas.

Atualização: extraia o novo ZIP, substitua os arquivos da pasta instalada, clique em **Recarregar** na extensão em `chrome://extensions` e recarregue também a página visitada.

Validação adicional: `node tests/reading.test.cjs`. Verifica o parágrafo relatado, limites de tamanho, offsets exatos, texto repetido, quebras de linha, idiomas sem espaços, Unicode e palavras muito longas. Os testes de alinhamento continuam passando. A inserção e aparência em navegador real ainda precisam ser verificadas.

## Versão 1.4 — janela de leitura
Padrões: **Bem curtos** selecionado e **Associar trechos por cores** desmarcado. Nenhuma API é acionada por padrão.

Depois de traduzir, clique em **Abrir janela de leitura**. Uma janela independente apresenta os textos em cartões limpos, sem os estilos do site. Ajuste o tamanho da letra. A janela permite:
- **Pares de texto**: original e tradução completos em pares curtos.
- **Correspondências da IA**: coloca cada unidade de sentido do original acima da unidade traduzida na mesma coluna. Mantém cores correspondentes, aceita mudanças de ordem e equivalências de várias palavras. Depende de alinhamentos gerados ao traduzir com IA ativada. Trechos sem alinhamento usam o modo de pares; lacunas ficam marcadas com “—”. A tradução contextual completa permanece abaixo das colunas.
- **Palavra sobre tradução · local**: clique para iniciar tradução local de cada palavra. Dispensa IA/API e coloca a tradução diretamente abaixo da palavra em uma coluna. Traduz palavras isoladas; não é um alinhamento das palavras na tradução contextual e pode errar sentidos ambíguos, flexões e expressões. A tradução completa da frase permanece disponível abaixo.

O conteúdo para leitura fica no armazenamento temporário da sessão do navegador e é substituído ao iniciar uma nova tradução. Não é sincronizado. A janela continua aberta depois que o painel da extensão fecha. Pode abrir traduções parciais já concluídas; a janela mantém uma cópia do estado de abertura.

Teste adicional: `node tests/reader.test.cjs`. Verifica colunas com ordem diferente, lacunas neutras, grupos de palavras, pontuação e tokenização em vários idiomas. A interface e tradução real continuam exigindo verificação no Chrome.
