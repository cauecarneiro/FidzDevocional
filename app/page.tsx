"use client"; // Certifique-se de ter isso no topo do arquivo

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { praticas } from '@/lib/praticasData';
import { salmos } from '@/lib/salmosData';
import { frases } from '@/lib/frasesData';
import { reflexoes } from '@/lib/reflexoesData';

export default function Home() {
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const dataFormatada = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    // 1. Criar ou recuperar um ID único para este usuário
    let userId = localStorage.getItem('fidz_user_id');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('fidz_user_id', userId);
    }

    // 2. Criar uma semente que combina o ID do usuário + Data de hoje
    const today = new Date().toDateString();
    const seed = userId + today;

    // Função simples de hash para transformar string em número
    const generateHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const hash = generateHash(seed);

    // 3. Selecionar o salmo do dia
    const salmoDoDia = salmos[hash % salmos.length];

    // 4. Função para encontrar item com tags compatíveis
    const findCompatibleItem = <T extends { tags: string[] }>(
      items: T[],
      targetTags: string[],
      fallbackIndex: number
    ): T => {
      // Tentar encontrar itens que compartilham pelo menos 1 tag
      const compatible = items.filter(item =>
        item.tags.some(tag => targetTags.includes(tag))
      );

      if (compatible.length > 0) {
        // Se encontrou itens compatíveis, escolher um aleatório entre eles
        return compatible[hash % compatible.length];
      }

      // Fallback: usar índice aleatório se não encontrar match
      return items[fallbackIndex];
    };

    // 5. Selecionar frase, reflexão e prática compatíveis com as tags do salmo
    const fraseDoDia = findCompatibleItem(
      frases,
      salmoDoDia.tags,
      hash % frases.length
    );

    const reflexaoDoDia = findCompatibleItem(
      reflexoes,
      salmoDoDia.tags,
      hash % reflexoes.length
    );

    const praticaDoDia = findCompatibleItem(
      praticas,
      salmoDoDia.tags,
      hash % praticas.length
    );

    setContent({
      salmoDoDia,
      fraseDoDia: fraseDoDia.texto,
      reflexaoDoDia: reflexaoDoDia.texto,
      praticaDoDia: praticaDoDia.texto,
    });
  }, []);

  // Enquanto o conteúdo não carrega no lado do cliente
  if (!content) return <div className="min-h-screen bg-white" />;

  return (
    <main className="min-h-screen w-full flex flex-col items-center pt-20 pb-10 sm:pt-32 bg-transparent relative z-10">

      {/* Container que centraliza o bloco todo na tela */}
      <div className="flex flex-col items-center mb-16 w-full px-6" style={{ marginTop: '40px' }}>

        {/* O 'w-fit' garante que esta div tenha a largura exata do texto */}
        <div className="w-fit flex flex-col items-start max-w-full">

          {/* Título: 'whitespace-nowrap' impede a quebra. 
        O tamanho da fonte usa 'clamp' para diminuir em telas pequenas e travar em telas grandes. */}
          <h1
            className="mb-4 text-gray-900 text-left leading-tight whitespace-nowrap"
            style={{
              fontSize: 'clamp(1.2rem, 6vw, 1.875rem)', // Mínimo 1.2rem, escala com a tela, Máximo 1.875rem (3xl)
            }}
          >
            <span style={{ fontWeight: 600 }}>O seu momento de se </span>
            <span style={{ fontWeight: 400, fontStyle: 'italic' }}>aproximar.</span>
          </h1>

          {/* Ícones: Mantidos alinhados com o início do texto acima */}
          <div className="flex items-center justify-start gap-4" style={{ marginBottom: '20px' }}>
            <Image src="/user.svg" alt="Perfil" width={24} height={24} />
            <Image src="/book.svg" alt="Leitura" width={28} height={28} />
            <Image src="/hands.svg" alt="Oração" width={34} height={34} />
            <Image src="/lightbulb.svg" alt="Inspiração" width={28} height={28} />
          </div>

        </div>
      </div>

      {/* Exibição da Data */}
      <p className="italic text-sm text-gray-500 mb-6">{dataFormatada}</p>

      {/* Cards Dinâmicos */}
      <section className="w-full flex flex-col mb-10">
        <Card
          title={content.salmoDoDia.referencia}
          subtitle={content.salmoDoDia.texto}
        />
        <Card
          title="Reflexão"
          text={content.reflexaoDoDia}
        />
        <Card
          title="Frase do dia"
          text={content.fraseDoDia}
        />
        <Card
          title="Prática do dia"
          text={content.praticaDoDia}
        />
      </section>


      {/* Footer com frase e botão */}
      <footer className="flex flex-col items-center gap-5 pb-10">
        <p className="text-base sm:text-lg text-gray-900 text-center">
          <span style={{ fontWeight: 600 }}>Espalhe fé, não só </span>
          <span style={{ fontWeight: 400, fontStyle: 'italic' }}>palavras</span>
          <span style={{ fontWeight: 600 }}>.</span>
        </p>

        <button
          onClick={() => router.push('/share')}
          className="transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: '#FF994C',
            border: '2px solid black',
            borderRadius: '14px',
            padding: '18px 60px',
            fontSize: '20px',
            fontWeight: 520,
            color: 'black',
            boxShadow: '0 3px 0 0 rgba(0, 0, 0, 0.7)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Postar no story
        </button>

        {/* Logo FIDZ */}
        <div className="mt-14" style={{ marginBottom: '10px' }}>
          <Image
            src="/fidz.svg"
            alt="FIDZ"
            width={130}
            height={130}
            priority
            className="drop-shadow-2xl"
          />
        </div>

        {/* Ícones das redes sociais */}
        <div className="flex items-center" style={{ gap: '33px', marginBottom: '48px' }}>
          {/* Instagram */}
          <div
            onClick={() => window.open('https://www.instagram.com/usefidz/', '_blank')}
            className="cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#333">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>

          {/* TikTok */}
          <div
            onClick={() => window.open('https://www.tiktok.com/pt-BR/', '_blank')}
            className="cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="22" viewBox="0 0 24 24" fill="#333">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>

          {/* Site FIDZ */}
          <div
            onClick={() => window.open('https://www.usefidz.com', '_blank')}
            className="cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="2"/>
              <path d="M2 12h20" stroke="#333" strokeWidth="2"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#333" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </footer>
    </main >
  );
}

function Card({
  title,
  subtitle,
  text,
}: {
  title: string;
  subtitle?: string;
  text?: string;
}) {
  return (
    <div
      className="rounded-[10px] text-left border"
      style={{
        background: 'rgba(255, 255, 255, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        marginBottom: '18px',
        marginLeft: '18px',
        marginRight: '18px',
        paddingTop: '1px',
        paddingBottom: '1px',
        paddingLeft: '20px',
        paddingRight: '20px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Título (Referência do Salmo) */}
      <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">
        {title}
      </h2>

      {/* Subtitle (O Texto do Salmo propriamente dito) */}
      {subtitle && (
        <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-normal">
          "{subtitle}"
        </p>
      )}

      {/* Text (O Resumo/Reflexão) - Apenas exibe se existir */}
      {text && (
        <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-normal">
          {text}
        </p>
      )}
    </div>
  );
}