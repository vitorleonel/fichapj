import type { Metadata } from "next";

import { LegalPage, Section } from "@/components/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade — Ficha PJ",
};

export default function Page() {
  return (
    <LegalPage title="Política de Privacidade" updated="30 de setembro de 2026">
      <Section title="O que este site faz">
        <p>
          Você digita um CNPJ e recebe a ficha pública daquela empresa: situação
          cadastral, endereço, atividade e quadro societário. Não existe
          cadastro, login nem área de usuário.
        </p>
      </Section>

      <Section title="O que guardamos sobre você">
        <p>
          Nada que identifique você. O site não cria conta, não usa cookies e
          não grava nada no seu navegador — nem em <code>localStorage</code>.
          Não há publicidade nem rastreamento entre sites, e nada do que você
          consulta aqui é perfilado.
        </p>
        <p>
          A única medição que existe é a descrita abaixo, e ela não vem deste
          site.
        </p>
      </Section>

      <Section title="A medição da Cloudflare">
        <p>
          Como o site é hospedado pela Cloudflare, ela injeta um medidor de
          audiência em toda página: o script <code>beacon.min.js</code>, servido
          de <code>static.cloudflareinsights.com</code>. Ele não está no código
          deste site — vem da borda da Cloudflare, e por isso não aparece em
          nenhuma lista de dependências daqui.
        </p>
        <p>
          O que ele registra é agrupado: visitas por página, de onde vieram, e o
          desempenho de carregamento. País, sistema operacional e navegador
          aparecem somados, não por visitante. Ele não usa cookies, não guarda
          nada no navegador e não acompanha a mesma pessoa em outros sites.
        </p>
      </Section>

      <Section title="O que sai do seu navegador">
        <p>
          O CNPJ consultado, e só ele. Ele vai no endereço da página —{" "}
          <code>/39581412000106</code> — e é o que o servidor recebe para fazer
          a consulta. A consulta em si parte de um servidor nosso, com uma
          credencial que nunca chega ao navegador.
        </p>
      </Section>

      <Section title="Registros de acesso">
        <p>
          A infraestrutura é da Cloudflare, para o site, e da Amazon, para a
          consulta. Cada uma mantém os registros operacionais próprios, como
          qualquer serviço na internet.
        </p>
        <p>
          Um detalhe que vale dizer: quando uma consulta falha, o endereço
          consultado — que contém o CNPJ — é gravado no log da função, do lado
          da Amazon, para que o erro possa ser investigado. Fora esse caso, o
          site não registra o que foi consultado.
        </p>
      </Section>

      <Section title="Sobre os dados das empresas">
        <p>
          As informações da ficha não são suas: são de empresas, e vêm da base
          aberta do CNPJ, que a Receita Federal publica. Os nomes dos sócios são
          dados pessoais, mas já são publicados pela Receita nessa base — este
          site apenas reproduz o que está lá.
        </p>
      </Section>

      <Section title="Com quem compartilhamos">
        <p>
          Com ninguém. Nada é vendido, cedido ou usado para outra finalidade. A
          medição fica com a própria Cloudflare, que é quem hospeda o site. O
          Google Maps só entra em cena se você clicar em “Ver no mapa” — nesse
          caso o endereço da empresa é enviado ao Google.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>
          Como não guardamos dados sobre você, não há o que corrigir ou apagar
          do nosso lado. Se o dado de uma empresa ou de um sócio estiver
          incorreto, a correção é feita na Receita Federal: este site é uma
          cópia da base, não a fonte dela.
        </p>
      </Section>

      <Section title="Mudanças">
        <p>Se esta política mudar, a data no topo desta página muda junto.</p>
      </Section>
    </LegalPage>
  );
}
