import type { Metadata } from "next";

import { LegalPage, Section } from "@/components/legal";

export const metadata: Metadata = {
  title: "Termos de Uso — Ficha PJ",
};

export default function Page() {
  return (
    <LegalPage title="Termos de Uso" updated="30 de setembro de 2026">
      <Section title="O que este site é">
        <p>
          Uma consulta à base aberta do CNPJ. Você digita um CNPJ e vê a ficha
          pública daquela empresa. É gratuito e não exige cadastro.
        </p>
      </Section>

      <Section title="De onde vêm os dados">
        <p>
          A Receita Federal publica periodicamente uma cópia completa do
          Cadastro Nacional da Pessoa Jurídica. Este site importa essa cópia e
          responde a partir dela, sem alterar nada do que está lá.
        </p>
      </Section>

      <Section title="A base é uma fotografia, não um espelho">
        <p>
          Uma mudança feita hoje — endereço novo, entrada de sócio, baixa da
          empresa — só aparece aqui na publicação seguinte, e isso pode levar
          semanas. Para saber a situação de agora, consulte os canais da Receita
          Federal.
        </p>
      </Section>

      <Section title="Sem garantia">
        <p>
          Os dados são reproduzidos como vieram, sem conferência nossa. Não
          garantimos que estejam completos, corretos ou atualizados, e não
          respondemos por decisão tomada com base neles.
        </p>
      </Section>

      <Section title="Não substitui a consulta oficial">
        <p>
          Este site não emite comprovante de inscrição e não substitui o Cartão
          CNPJ. Para qualquer efeito legal ou contratual, use os canais oficiais
          da Receita Federal.
        </p>
      </Section>

      <Section title="Uso aceitável">
        <p>
          Pode consultar à vontade. O que não vale é varrer a base em massa por
          aqui ou sobrecarregar a API. Se você precisa da base inteira, ela é
          pública e pode ser baixada direto da Receita Federal.
        </p>
      </Section>

      <Section title="Mudanças">
        <p>Estes termos podem mudar. A data no topo desta página acompanha.</p>
      </Section>
    </LegalPage>
  );
}
