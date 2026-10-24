# AutoHistory (protótipo)

## Rodar
1. Backend (precisa do .NET 8 SDK):  cd backend/AutoHistory.Api && dotnet run   -> http://localhost:5080
2. Frontend: npm install && npm run dev
   (a URL da API fica em .env: VITE_API_URL)

## Banco
- Sem configurar nada, a API usa banco em memória (dados de demo recriados a cada start).
- Para usar o Supabase (Postgres): coloque a connection string em
  backend/AutoHistory.Api/appsettings.json -> ConnectionStrings:Supabase
  Ex.: Host=aws-0-REGIAO.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.PROJETO;Password=SENHA;SSL Mode=Require;Trust Server Certificate=true
  As tabelas e os dados de demo são criados automaticamente na primeira execução.

## Contas demo (senha 123456)
proprietario@demo.com, comprador@demo.com, oficina@demo.com
Consulta: placa ABC1D23 / credencial AH-7K2M-91

## Limitações do protótipo
Login sem token/JWT e senha em texto puro, sem autorização por perfil na API, Pix fictício.

## Novidades
- Usuários extras (senha 123456): marina@demo.com e bruno@demo.com (proprietários)
- Transferir veículo: aba "Transferir" no detalhe do veículo
- Oficina escolhe o cliente e informa o mecânico responsável no registro do serviço
- Proprietário avalia o serviço (1 a 5 estrelas); a oficina vê a média por mecânico no dashboard
- Mapa do Google de oficinas em /app/oficinas (proprietário e comprador)
- Bancos já criados no Supabase são atualizados automaticamente na inicialização da API
