-- Seed dos 38 scripts de atendimento já aplicados em produção.
-- (Mirrors the data already inserted directly on the vbgozbqbixofqvwnnuxh project.)

INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Entrada', 'Lead chega pelo WhatsApp perguntando sobre internet', 'Olá, [nome]! Aqui é o [atendente], da Fibron – Raul Soares. 😊

Que ótimo que entrou em contato! Trabalhamos com internet fibra óptica — velocidade real, Wi-Fi 6, sem quedas e com suporte aqui em Raul Soares.

Para confirmar a disponibilidade no seu endereço:
📍 Qual sua rua + bairro?

Já apresento as opções! 👇', NULL, 1, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Entrada', 'Lead chega por indicação', 'Olá, [nome]! Aqui é o [atendente], da Fibron – Raul Soares. 😊

Que bom que [quem indicou] te recomendou! Quem já é cliente conhece bem o serviço. 😄

Me fala: você quer conhecer nossos planos de fibra óptica ou tem alguma dúvida específica?', NULL, 2, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Fechamento', 'Cliente aceitou — coletar dados e agendar instalação', 'Perfeito! Fico feliz que vai ser cliente Fibron! 😄

Para agendar sua instalação, preciso de algumas informações:

📋 Nome completo:
📄 CPF:
📅 Data de nascimento:
📍 Endereço completo (rua, nº, complemento, bairro):
📱 WhatsApp de contato:
📅 Melhor dia e turno: (manhã / tarde)

A instalação acontece em até 72h. Nossa equipe avisa antes de ir! 😊', 'Após coletar os dados, registrar no IXC e acionar Thais para abertura de OS de instalação.', 8, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Objeção', 'Cliente acha o preço caro', 'Entendo! Vamos comparar juntos.

Você já tem internet em casa? Quanto paga hoje?

[Após resposta:]

Com a Fibron você tem fibra óptica de verdade com Wi-Fi 6 — muito mais estável, sem queda, e com suporte aqui perto sem precisar ligar pra central que nunca resolve.

Nosso plano de entrada é R$ 89,90/mês com 250 Mega e tudo incluso. Considerando o que você já paga e os benefícios, geralmente sai igual ou mais barato com muito mais qualidade. 😊

Posso detalhar o plano de 250 Mega pra você?', NULL, 5, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Objeção', 'Cliente não quer fidelidade de 12 meses', 'Entendo sua preocupação! A fidelidade de 12 meses existe porque a instalação e o roteador Wi-Fi 6 são fornecidos sem custo no momento da contratação.

Na prática, a maioria dos nossos clientes renova muito além dos 12 meses — porque o serviço funciona de verdade. 😊

E se precisar cancelar antes, a multa é proporcional ao tempo restante — nada abusivo.

Quer que eu explique exatamente como funciona?', NULL, 6, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Objeção', 'Cliente quer pensar / não respondeu', 'Claro, sem problema! 😊

Fica à vontade para pensar. Qualquer dúvida, é só me chamar aqui.

[2 dias sem resposta — follow-up:]

Olá, [nome]! Tudo bem? Aqui é o [atendente], da Fibron. 😊

Passando pra saber se você teve chance de pensar nos nossos planos. Tem alguma dúvida que posso esclarecer?', 'Follow-up em 2 dias úteis. Não insistir mais de 2 vezes sem retorno.', 7, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Pós-venda', 'Confirmação de instalação agendada', 'Olá, [nome]! Tudo confirmado! ✅

Sua instalação está agendada para [data], no período da [manhã/tarde].

Nossa equipe técnica entrará em contato antes de chegar.

Se precisar reagendar, avise com antecedência! 😊

Bem-vindo(a) à Fibron – Raul Soares! 💙', NULL, 9, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Proposta', 'Apresentar planos após confirmar cobertura', 'Boa notícia! Temos cobertura no seu endereço. ✅

Veja nossas opções:

📶 250 Mega — R$ 89,90/mês
📶 350 Mega — R$ 99,90/mês
📶 500 Mega — R$ 109,90/mês ⭐ Mais vendido
📶 800 Mega — R$ 139,90/mês

Todos os planos incluem:
✔ Wi-Fi 6 (roteador incluso*)
✔ Super App Fibron
✔ +120 canais de TV
✔ Livros digitais
✔ Suporte técnico local aqui em Raul Soares
✔ Instalação gratuita*

*Roteador e instalação consignados com fidelidade de 12 meses.
A instalação acontece em até 72h após a assinatura.

Qual plano te interessa? 😊', NULL, 3, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Proposta', 'Explicar fidelidade de 12 meses e consignação', 'Boa pergunta! O roteador Wi-Fi 6 e a instalação são fornecidos sem custo adicional, dentro de um contrato com fidelidade de 12 meses.

Isso significa:
✔ Você não paga nada pela instalação
✔ O roteador fica em sua casa durante o contrato
✔ Se cancelar antes dos 12 meses, há cobrança proporcional de multa

Após os 12 meses, o contrato vira mensal — sem fidelidade. 😊', NULL, 4, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('comercial', 'Sem cobertura', 'Endereço sem cobertura — cadastrar interesse', 'Olá, [nome]! Verificamos e, no momento, ainda não temos cobertura no seu endereço.

Mas estamos expandindo constantemente! Posso cadastrar seu endereço na lista de interesse — assim que chegarmos na sua rua, você é um dos primeiros a saber. 😊

Posso registrar seu contato?', 'Registrar endereço e contato. Reportar para Ramilson as regiões com maior demanda reprimida.', 10, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Bloqueio', 'Serviço bloqueado — comunicar e orientar', 'Olá, [nome]. Aqui é a Fibron – Raul Soares.

Seu serviço foi suspenso por fatura(s) em aberto no valor de R$ [valor].

Para reativar, você tem duas opções:

1️⃣ Realizar o pagamento — reativação em até [prazo] após confirmação.

2️⃣ Desbloqueio de confiança — libera por mais 5 dias para você providenciar o pagamento. Disponível 1 vez por período.

Como prefere proceder? 😊', NULL, 9, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Cancelamento', 'Cliente solicita cancelamento', 'Entendemos, [nome]. Antes de prosseguir, posso perguntar o motivo? Às vezes conseguimos resolver o que está causando essa decisão.

[Ouvir e tentar reverter]

[Se mantiver:]
Tudo bem. Vou registrar o pedido de cancelamento.

Preciso confirmar:
✔ Nome completo
✔ CPF
✔ Endereço de instalação

Importante: o roteador e equipamentos são consignados. Nossa equipe entrará em contato para retirada. Pendências financeiras serão informadas.

Você receberá a confirmação em breve. 😊', 'Registrar no IXC e acionar equipe para OS de retirada. Verificar pendências antes de confirmar.', 11, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Cobrança', 'Aviso preventivo — fatura próxima do vencimento', 'Olá, [nome]! Aqui é a Fibron – Raul Soares. 😊

Passando para lembrar que sua fatura de R$ [valor] vence em [data].

Para pagar é fácil:
💙 PIX — Chave: [chave PIX]
📱 App Fibron → "Financeiro"
📄 Boleto — é só pedir aqui

Qualquer dúvida, estamos à disposição!', 'Enviar 2–3 dias antes do vencimento. Tom leve e prestativo.', 7, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Cobrança', 'Fatura vencida — primeiro aviso (dias 1 a 7)', 'Olá, [nome]! Aqui é a Fibron – Raul Soares.

Identificamos uma fatura em aberto de R$ [valor], vencida em [data].

Para evitar interrupção no serviço, regularize o quanto antes. O bloqueio ocorre após 7 dias do vencimento.

Posso te enviar a segunda via agora? 😊', NULL, 8, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Desbloqueio', 'Cliente solicita desbloqueio de confiança', 'Olá, [nome]! Aqui é o [atendente], da Fibron – Raul Soares. 😊

Vou verificar se seu plano está elegível para o desbloqueio de confiança.

[Verificar no sistema: elegibilidade + histórico de uso do benefício]

✅ Tudo certo! Você tem direito ao desbloqueio de confiança.

Com ele, sua internet fica liberada por mais 5 dias para que você providencie o pagamento. Importante lembrar:

⚠️ Disponível apenas 1 vez por período.
⚠️ O pagamento deve ser feito dentro dos 5 dias — caso contrário o serviço será bloqueado novamente.

Confirma que deseja ativar? 😊', 'Ativar no sistema somente após confirmação do cliente. Registrar data de ativação e vencimento dos 5 dias.', 3, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Desbloqueio', 'Cliente já usou o desbloqueio no período', 'Olá, [nome]! Aqui é o [atendente], da Fibron – Raul Soares.

Verificamos aqui e, infelizmente, o desbloqueio de confiança já foi utilizado neste período. O benefício está disponível apenas 1 vez por ciclo de faturamento.

Para reativar seu serviço, será necessário regularizar o pagamento.

Posso te ajudar com a segunda via agora? 😊

💙 PIX — Chave: [chave PIX]
📄 Boleto — posso enviar agora
📱 App Fibron — aba "Financeiro"', NULL, 4, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Desbloqueio', 'Como solicitar desbloqueio pelo app — orientação', 'Você pode solicitar o desbloqueio de confiança pelo próprio App Fibron, sem precisar entrar em contato!

📱 Abra o App Fibron
→ Acesse "Financeiro"
→ Toque em "Desbloqueio de confiança"
→ Confirme a solicitação

Lembrando: libera sua internet por 5 dias e pode ser usado apenas 1 vez por período. 😊', NULL, 5, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Negociação', 'Cliente pede prazo ou negociação de débito', 'Entendo, [nome]. Deixa eu verificar as opções disponíveis para o seu caso.

[Consultar responsável]

[Após retorno:]
Conseguimos [condição: ex. prazo até XX/XX / entrada + restante parcelado].

Isso resolve pra você? Se sim, já formalizo e te envio a confirmação. 😊', 'Nunca prometer condição sem autorização. Negociações são sempre caso a caso com Ramilson.', 10, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Pós-pagamento', 'Confirmação de pagamento recebido', 'Olá, [nome]! Pagamento confirmado! ✅

Fatura de R$ [valor] — quitada em [data].

Seu serviço continua ativo normalmente. Qualquer dúvida, estamos aqui!

Obrigado pela confiança na Fibron – Raul Soares! 💙', NULL, 12, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Rotina', 'Cliente solicita segunda via de boleto / PIX', 'Olá, [nome]! Aqui é o [atendente], da Fibron – Raul Soares. 😊

Vou gerar sua segunda via agora mesmo!

[Consultar no IXC]

Sua fatura do mês de [mês] é de R$ [valor], com vencimento em [data].

Segue sua segunda via:
💙 PIX — Chave: [chave PIX da Fibron]
📄 Boleto — [link ou código de barras]
📱 Pelo App Fibron: acesse "Financeiro" → "Faturas" → "Pagar"

Precisa de mais alguma coisa? 😊', NULL, 1, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Rotina', 'Orientar cliente a pegar segunda via pelo app', 'Você também pode pegar sua segunda via direto pelo App Fibron! É bem rápido:

📱 Abra o App Fibron
→ Toque em "Financeiro"
→ Selecione "Faturas"
→ Escolha a fatura desejada
→ Toque em "Pagar" ou "Gerar boleto"

Se tiver alguma dificuldade, me chama que te ajudo aqui! 😊', NULL, 2, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('financeiro', 'Rotina', 'Cliente pergunta sobre o valor da fatura', 'Olá, [nome]! Vou verificar sua fatura agora. 😊

[Consultar no IXC]

Sua fatura de [mês] é de R$ [valor], vencimento em [data].

Formas de pagamento:
💙 PIX — Chave: [chave PIX]
📄 Boleto — posso enviar agora
📱 App Fibron → "Financeiro" → "Faturas"
🏦 Débito automático — se quiser cadastrar, me avisa!

Prefere que eu te envie o boleto aqui? 😊', NULL, 6, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Comercial', 'Cliente quer contratar internet', 'Ótimo! Vou te apresentar as opções disponíveis para o seu endereço.

Aqui na Fibron trabalhamos com internet fibra óptica com Wi-Fi 6 — muito mais estável e rápida do que a internet convencional.

Me fala: qual é o seu endereço? Assim confirmo a disponibilidade e já te mostro o plano ideal pra você.', NULL, 2, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Comercial', 'Cliente pergunta sobre planos', 'Que ótimo! 😄

Trabalhamos com internet fibra óptica com Wi-Fi 6 — muito mais estável e rápida.

Para te passar as opções certas, me informa:
📍 Qual é o seu endereço (rua + bairro)?

Assim confirmo a disponibilidade na sua rua e já apresento os planos! 👇', NULL, 8, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Comercial', 'Apresentar plano após confirmar cobertura', 'Boa notícia! Temos cobertura no seu endereço. ✅

Nossos planos disponíveis:
📶 250 Mega — R$ 89,90/mês
📶 350 Mega — R$ 99,90/mês
📶 500 Mega — R$ 109,90/mês ⭐ Mais vendido
📶 800 Mega — R$ 139,90/mês

✔ Wi-Fi 6 · App Fibron · +120 canais de TV · Livros digitais · Suporte local
✔ Instalação em até 72h*

*Roteador e instalação consignados com fidelidade de 12 meses.

Qual te interessa? 😊', NULL, 9, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Crítico', 'Cliente insatisfeito ou irritado', 'Entendo sua frustração e peço desculpas pelo transtorno.

Vou dar atenção total ao seu caso agora.

[Deixar o cliente falar sem interromper]

Obrigado por nos contar. Vou registrar tudo com prioridade e garantir que você receba um retorno ainda hoje.

Posso confirmar o seu WhatsApp para manter contato?', 'Nunca discutir com o cliente. Se a situação escalar, acionar o responsável imediatamente.', 5, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Crítico', 'Cliente insatisfeito ou reclamando', 'Olá, [nome]. Aqui é o [atendente], da Fibron.

Entendo sua situação e peço desculpas pelo transtorno. 🙏

Vou dar atenção pessoal ao seu caso agora.

Pode me contar o que aconteceu com mais detalhes? Quero garantir que isso seja resolvido o mais rápido possível.', 'Nunca deixar cliente insatisfeito sem resposta. Se não souber resolver, escalar imediatamente para o responsável.', 14, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Crítico', 'Mensagem fora do horário de atendimento', 'Olá! Obrigado por entrar em contato com a Fibron – Raul Soares. 😊

No momento estamos fora do horário de atendimento.
🕐 Seg–Sex: 8h às 18h | Sáb: manhã

Assim que retornarmos, te atendemos com prioridade!

Para emergências, nosso bot está disponível 24h aqui neste WhatsApp.', NULL, 15, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Encerramento', 'Despedida padrão', 'Pronto, [nome]! Tudo certo por aqui.

Qualquer dúvida, pode nos chamar pelo WhatsApp ou voltar aqui na loja. Estamos sempre por aqui! 😊

Obrigado pela confiança na Fibron – Raul Soares!', NULL, 6, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Encerramento', 'Finalização padrão do atendimento', 'Fico feliz em ter ajudado, [nome]! 😊

Se surgir qualquer dúvida, é só chamar aqui.
Estamos sempre por aqui para te atender!

Fibron – Raul Soares 💙', NULL, 16, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Entrada', 'Saudação inicial — cliente chega na loja', 'Olá! Seja bem-vindo à Fibron – Raul Soares! 😊
Meu nome é [nome]. Como posso te ajudar hoje?', 'Se o cliente parecer perdido: "Posso te apresentar nossos planos de internet, ou se veio para algum atendimento específico, é só me falar."', 1, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Entrada', 'Cliente manda mensagem pela primeira vez', 'Olá! Bem-vindo à Fibron – Raul Soares! 😊
Aqui é o [nome], do atendimento.

Como posso te ajudar hoje?', NULL, 7, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Cliente veio reclamar de problema técnico', 'Entendo, vamos resolver isso juntos.

Me conta o que está acontecendo:
— Desde quando o problema começou?
— A internet caiu completamente ou está lenta?
— O roteador tem alguma luz vermelha ou apagada?

Vou abrir um chamado aqui agora mesmo e você sai com o número do protocolo.', 'Sempre abrir a OS no IXC antes de liberar o cliente. Informar prazo real de atendimento.', 3, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Entrega do protocolo ao cliente', 'Seu chamado está registrado! ✅

🔖 Número do protocolo: [número]
⏰ Previsão de atendimento: [prazo]

Vou te enviar uma mensagem no WhatsApp confirmando tudo. Pode guardar o número do protocolo caso precise acompanhar.

Tem mais alguma dúvida antes de ir?', NULL, 4, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Cliente reporta problema técnico', 'Olá, [nome]! Aqui é o [atendente], da Fibron. 👋

Vou te ajudar a resolver isso agora.

Me conta:
1️⃣ O que está acontecendo? (sem internet / lenta / oscilando)
2️⃣ Desde quando está assim?
3️⃣ O roteador tem alguma luz diferente do normal?

Assim que me informar, já abro o chamado! 😊', NULL, 10, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Confirmação de abertura de chamado', 'Prontinho! Seu chamado foi aberto. ✅

🔖 Protocolo: [número]
⏰ Previsão:
• Horário comercial → retorno em breve
• Fora do horário → próximo dia útil
🔧 Visita técnica (se necessário) → até 72h

Assim que tivermos atualização, te aviso aqui! 😊', NULL, 11, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Atualização de chamado em andamento', 'Olá, [nome]! Aqui é a Fibron. 😊

Passando para atualizar sobre o protocolo [número].

Situação atual: [ex.: técnico a caminho / aguardando peça / agendado para amanhã]

Previsão: [data/horário]

Qualquer dúvida, estou aqui!', NULL, 12, true);
INSERT INTO public.scripts_atendimento (setor, categoria, titulo, conteudo, observacao, ordem, ativo) VALUES ('atendimento_geral', 'Suporte', 'Encerramento de chamado resolvido', 'Olá, [nome]! Aqui é a Fibron. 😊

Seu chamado [número] foi encerrado.
✅ Serviço realizado: [descrever brevemente]

Sua internet está funcionando normalmente agora?

Se precisar de qualquer coisa, é só chamar.
Obrigado pela confiança na Fibron – Raul Soares! 💙', NULL, 13, true);
