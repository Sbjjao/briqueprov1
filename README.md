# Brique Master

Crie um SaaS web app chamado BriquePro para gestão de compra, troca, venda e revenda de itens usados. O sistema deve ser pensado para quem faz brique com eletrônicos, celulares, games, informática, peças automotivas, colecionáveis e outros produtos, com foco em controle financeiro, histórico completo de negociações e visualização de lucro real por item e por operação.Memory

O app deve ter aparência de produto SaaS moderno, limpo e profissional, com dashboard, sidebar, tabelas, cards de KPI, filtros, busca, formulários rápidos, dark mode e navegação intuitiva. A interface deve priorizar produtividade, leitura rápida e organização visual, sem excesso de elementos decorativos.Memory

Módulos principais

Dashboard geral.Memory

Cadastro de itens/produtos.Memory

Aquisições.Memory

Custos adicionais.Memory

Vendas.Memory

Trocas/briques.Memory

Contatos/pessoas.Memory

Histórico/timeline por item.Memory

Relatórios e métricas.Memory

Cadastro de item

Cada item deve conter:

Nome do produto.Memory

Categoria: eletrônicos, carros/peças, games, celulares, informática, colecionáveis, outros.Memory

Descrição.Memory

Marca.Memory

Modelo.Memory

Cor.Memory

Número de série ou IMEI, quando aplicável.Memory

Fotos.Memory

Data de aquisição.Memory

Valor estimado atual.Memory

Status.Memory

Status possíveis:

Em negociação.Memory

Em estoque.Memory

Em manutenção.Memory

Anunciado.Memory

Reservado.Memory

Trocado.Memory

Vendido.Memory

Cancelado / prejuízo.Memory

Financeiro

O sistema deve permitir registrar:

Valor de compra.Memory

Forma de pagamento.Memory

Data da compra.Memory

De quem comprou.Memory

Custos extras: frete, manutenção, peças, taxas, outros.Memory

Calcular automaticamente:

Custo total = compra + frete + manutenção + peças + taxas + outros custos.Memory

Valor líquido da venda = valor vendido - taxas - frete pago por você.Memory

Lucro = valor líquido - custo total.Memory

Margem de lucro = (lucro ÷ custo total) × 100.Memory

Venda

Quando um item for vendido, registrar:

Valor anunciado.Memory

Valor mínimo aceito.Memory

Valor vendido.Memory

Data da venda.Memory

Forma de pagamento.Memory

Taxas.Memory

Frete pago por você.Memory

Comprador.Memory

Trocas

Criar um módulo de troca/brique onde o sistema registre:

Item que saiu.Memory

Custo real do item que saiu.Memory

Valor atribuído na negociação.Memory

Item recebido.Memory

Valor atribuído ao item recebido.Memory

Dinheiro adicional recebido.Memory

Dinheiro adicional pago.Memory

Pessoa da negociação.Memory

Data.Memory

Regras:

O item recebido deve virar automaticamente um novo item no estoque.Memory

O novo item deve manter vínculo com a origem da negociação.Memory

O sistema deve exibir uma árvore do brique, mostrando a sequência: item original → troca → novo item → venda final.Memory

Dashboard

Na tela inicial, mostrar:

Patrimônio em estoque.Memory

Dinheiro investido.Memory

Lucro potencial.Memory

Quantidade de itens em estoque.Memory

Quantidade de itens anunciados.Memory

Quantidade de itens em negociação.Memory

Quantidade de itens em manutenção.Memory

Lucro total acumulado.Memory

Número total de vendas.Memory

Número total de trocas.Memory

Maior lucro.Memory

Maior prejuízo.Memory

Histórico

Cada item deve ter uma timeline completa com eventos como:

Compra.Memory

Gasto adicional.Memory

Anúncio.Memory

Proposta recebida.Memory

Troca realizada.Memory

Venda final.Memory

Contatos

Criar cadastro de contatos com:

Nome.Memory

Telefone.Memory

Instagram/Facebook.Memory

Cidade.Memory

Quantidade de negociações.Memory

Histórico de compras, vendas e trocas.Memory

Observações.Memory

Indicador de confiabilidade.Memory

Função extra

Criar uma calculadora chamada “quanto preciso vender para valer a pena?” com:

Custo total.Memory

Lucro desejado em percentual.Memory

Taxas estimadas.Memory

Resultado:

Valor mínimo ideal de venda para atingir a margem desejada.Memory

Estrutura esperada

Gere:

As páginas do sistema.Memory

Os componentes principais.Memory

O fluxo de navegação.Memory

A estrutura de banco de dados.Memory

As regras de cálculo.Memory

Um MVP funcional primeiro.Memory

E depois sugestões de expansão futura.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://briqueprov1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3056b052-f363-4975-ab2f-a3579eeff311).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
