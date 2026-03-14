"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { salmos } from '@/lib/salmosData';
import { frases } from '@/lib/frasesData';
import { praticas } from '@/lib/praticasData';
import { reflexoes } from '@/lib/reflexoesData';

export default function SharePage() {
  const router = useRouter();
  const [currentModel, setCurrentModel] = useState(0);
  const [content, setContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCanvases, setPreviewCanvases] = useState<{ [key: number]: string | null }>({});
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);

  useEffect(() => {
    console.log('🔄 Carregando conteúdo igual à home page...');
    
    try {
      let userId = localStorage.getItem('fidz_user_id');
      if (!userId) {
        userId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('fidz_user_id', userId);
      }

      const today = new Date().toDateString();
      const seed = userId + today;

      const generateHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash);
      };

      const hash = generateHash(seed);
      const salmoDoDia = salmos[hash % salmos.length];

      const findCompatibleItem = <T extends { tags: string[] }>(
        items: T[],
        targetTags: string[],
        fallbackIndex: number
      ): T => {
        const compatible = items.filter(item =>
          item.tags.some(tag => targetTags.includes(tag))
        );
        return compatible.length > 0 ? compatible[hash % compatible.length] : items[fallbackIndex];
      };

      const fraseDoDia = findCompatibleItem(frases, salmoDoDia.tags, hash % frases.length);
      const reflexaoDoDia = findCompatibleItem(reflexoes, salmoDoDia.tags, hash % reflexoes.length);
      const praticaDoDia = findCompatibleItem(praticas, salmoDoDia.tags, hash % praticas.length);

      const contentData = {
        salmoDoDia,
        fraseDoDia: fraseDoDia.texto,
        reflexaoDoDia: reflexaoDoDia.texto,
        praticaDoDia: praticaDoDia.texto,
      };

      console.log('📅 Conteúdo carregado:', contentData);
      setContent(contentData);
      
      // Gerar previews dos modelos após carregar conteúdo
      setTimeout(() => generatePreviews(contentData), 1000);
      
    } catch (error) {
      console.error('❌ Erro ao gerar conteúdo:', error);
    }
  }, []);

  // Função para gerar imagem CORRIGIDA
  const generateImage = async (modelType: 'salmo-frase' | 'com-reflexao' | 'completo') => {
    if (!content?.salmoDoDia) {
      console.error('❌ Conteúdo não disponível');
      return null;
    }

    console.log('🖼️ Gerando imagem modelo:', modelType);
    
    let container: HTMLDivElement | null = null;

    try {
      // Carregar fontes Inter
      await document.fonts.load('900 120px Inter');
      await document.fonts.load('400 48px Inter');
      console.log('✅ Fontes carregadas');

      // Criar container off-screen para renderização
      container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -5000px;
        top: -5000px;
        width: 1080px;
        height: 1920px;
        z-index: -1;
        background: transparent;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
        visibility: hidden;
      `;
      
      document.body.appendChild(container);
      console.log('✅ Container criado off-screen');

      // Gerar HTML do template
      const htmlContent = generateOverlayHTML(modelType);
      container.innerHTML = htmlContent;
      console.log('✅ HTML inserido');

      // Tornar visível para renderização
      container.style.visibility = 'visible';
      container.style.left = '0px';
      container.style.top = '0px';
      
      // Aguardar renderização completa
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('✅ Renderização aguardada');

      // Gerar canvas
      console.log('🎨 Gerando canvas...');
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1920,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1080,
        windowHeight: 1920,
        onclone: (clonedDoc) => {
          // Garantir fontes no documento clonado
          const style = clonedDoc.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { font-family: 'Inter', sans-serif !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error(`Canvas inválido: ${canvas?.width}x${canvas?.height}`);
      }

      console.log('✅ Canvas gerado:', canvas.width, 'x', canvas.height);
      
      return canvas;
      
    } catch (error) {
      console.error('❌ Erro na geração:', error);
      return null;
    } finally {
      // Remover container imediatamente
      if (container && container.parentNode) {
        document.body.removeChild(container);
        console.log('✅ Container removido');
      }
    }
  };

  // Função para escapar HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Função para gerar HTML da imagem (template igual à referência)
  const generateOverlayHTML = (type: string) => {
    if (!content) return '<div>Carregando...</div>';
    
    const { salmoDoDia, fraseDoDia, reflexaoDoDia, praticaDoDia } = content;
    
    const salmoTexto = escapeHtml(salmoDoDia?.texto || 'Salmo não encontrado');
    const fraseTexto = escapeHtml(fraseDoDia || 'Frase não encontrada');
    const reflexaoTexto = escapeHtml(reflexaoDoDia || 'Reflexão não encontrada');
    const praticaTexto = escapeHtml(praticaDoDia || 'Prática não encontrada');
    
    const salmoHTML = `
      <div style="margin-bottom: 60px;">
        <h1 style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 110px;
          color: white;
          margin: 0 0 20px 0;
          letter-spacing: -1px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">Salmo</h1>
        <div style="
          width: 100%; 
          height: 4px; 
          background: #FC7D1E; 
          margin-bottom: 30px;
        "></div>
        <p style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 44px;
          color: white;
          margin: 0;
          line-height: 1.4;
          letter-spacing: 0px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">${salmoTexto}</p>
      </div>
    `;

    const reflexaoHTML = `
      <div style="margin-bottom: ${(type === 'com-reflexao' || type === 'completo') ? '60px' : '0px'};">
        <h1 style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 110px;
          color: white;
          margin: 0 0 20px 0;
          letter-spacing: -1px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">Reflexão</h1>
        <div style="
          width: 100%; 
          height: 4px; 
          background: #FC7D1E; 
          margin-bottom: 30px;
        "></div>
        <p style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 44px;
          color: white;
          margin: 0;
          line-height: 1.4;
          letter-spacing: 0px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">${reflexaoTexto}</p>
      </div>
    `;

    const fraseHTML = (type === 'com-reflexao' || type === 'completo') ? `
      <div style="margin-bottom: ${type === 'completo' ? '60px' : '0px'};">
        <h1 style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 110px;
          color: white;
          margin: 0 0 20px 0;
          letter-spacing: -1px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">Frase do dia</h1>
        <div style="
          width: 100%; 
          height: 4px; 
          background: #FC7D1E; 
          margin-bottom: 30px;
        "></div>
        <p style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 44px;
          color: white;
          margin: 0;
          line-height: 1.4;
          letter-spacing: 0px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">${fraseTexto}</p>
      </div>
    ` : '';

    const praticaHTML = type === 'completo' ? `
      <div style="margin-bottom: 0px;">
        <h1 style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 110px;
          color: white;
          margin: 0 0 20px 0;
          letter-spacing: -1px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">Prática do dia</h1>
        <div style="
          width: 100%; 
          height: 4px; 
          background: #FC7D1E; 
          margin-bottom: 30px;
        "></div>
        <p style="
          font-family: 'Inter', sans-serif; 
          font-weight: 700;
          font-size: 44px;
          color: white;
          margin: 0;
          line-height: 1.4;
          letter-spacing: 0px;
          text-shadow: 0px -2px 20px rgba(0,0,0,0.05);
        ">${praticaTexto}</p>
      </div>
    ` : '';

    // Logo FIDZ SVG alinhada com o texto
    const logoHTML = `
      <div style="
        width: 150px;
        height: auto;
        margin-top: 30px;
      ">
        <svg width="150" height="65" viewBox="0 0 1489 645" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_219_18)">
            <path d="M1453.34 48.9784C1483.94 78.4984 1483.59 132.128 1472.96 170.408C1458.23 223.458 1414.53 272.648 1373.74 308.138C1361.84 318.488 1348.73 326.698 1336.73 337.108C1318.88 352.598 1272.32 395.248 1272.7 419.118C1272.97 436.048 1290.16 445.978 1305.38 447.498C1334.09 450.368 1378.68 437.108 1405.21 425.618C1420.48 419.008 1442.67 403.878 1459.22 405.118C1468.93 405.848 1473.84 414.518 1477.39 422.408C1498.88 470.228 1490.89 556.628 1448.17 591.598C1409.53 623.228 1308.75 637.438 1259.33 639.658C1191.36 642.708 1083.51 635.428 1034.39 581.628C936.017 473.908 1105.53 353.868 1170.35 281.628C1187.92 262.048 1224.18 220.358 1221.85 193.068C1218.34 151.938 1145.93 173.028 1122.62 181.868C1104.89 188.588 1088.97 198.798 1071.91 206.618C1063.63 174.248 1052.87 142.448 1037.09 112.938C1033.67 106.548 1025.2 97.2384 1025.98 90.2184C1027.53 76.3184 1039.74 56.5384 1050.43 47.6384C1077.22 25.3484 1142.77 13.7184 1177.42 8.69841C1253.29 -2.29159 1394.01 -8.2716 1453.35 48.9684H1453.34V48.9784ZM1366.73 490.628C1366.68 497.278 1366.77 503.978 1366.73 510.638C1367.7 511.608 1389.72 509.318 1393.73 511.138C1394.37 511.428 1394.43 512.298 1394.72 512.628L1394.7 566.148C1394.81 567.878 1395.34 570.088 1396.73 571.148C1397.23 571.528 1397.66 570.618 1397.72 570.628C1400.96 571.518 1416.71 573.248 1416.71 569.128V516.128C1416.71 515.868 1418.3 512.468 1418.66 512.078C1422.06 508.238 1441 512.608 1446.68 510.108C1451.75 507.868 1450.32 490.508 1446.99 489.618C1441 488.018 1423.94 491.738 1419.3 488.548C1413.25 484.388 1419.91 463.388 1415.25 458.598C1413.57 456.868 1402.12 457.608 1398.73 457.628C1398.67 457.628 1398.39 456.558 1397.75 457.038C1397.35 457.338 1394.73 461.828 1394.73 462.128V486.128C1394.73 491.428 1369.03 486.438 1366.19 489.628C1365.47 490.438 1366.75 490.518 1366.75 490.628H1366.73Z" fill="white"/>
            <path d="M207.106 1.9209C282.266 -0.339099 423.346 2.1209 474.596 65.7109C499.326 96.4009 505.926 146.151 463.876 164.811C432.986 178.521 386.366 176.861 354.986 165.381C305.356 147.231 264.396 79.3009 206.086 92.9009C157.176 104.311 181.086 158.661 203.286 184.151C244.786 231.801 293.956 229.911 352.726 226.611C379.356 225.121 415.596 215.741 437.216 236.101C456.346 254.121 457.006 300.691 428.376 310.301C406.776 317.551 371.486 305.941 347.776 304.581C274.636 300.381 295.616 372.971 314.536 415.831C335.266 462.791 402.166 550.711 350.706 595.601C296.936 642.501 166.786 651.521 99.6259 638.851C39.1959 627.451 -4.77411 605.811 0.415886 536.131C2.83589 503.601 23.7659 469.981 36.3859 440.121C77.5659 342.681 71.4359 271.941 36.1559 174.351C20.3859 130.731 -11.4741 74.5509 37.8859 38.6109C79.1259 8.5809 157.226 3.4109 207.096 1.9109L207.106 1.9209Z" fill="white"/>
            <path d="M729.837 1.92123C768.207 -0.438763 821.207 -0.708763 859.527 1.58123C976.017 8.53123 1044.01 114.431 1064.63 219.381C1072.71 260.491 1077.21 324.101 1069.77 365.011C1067.97 374.901 1059.41 380.331 1053.38 387.611C1015.42 433.421 984.967 474.721 998.197 537.851C1000.68 549.711 1004.57 546.481 995.907 558.101C975.397 585.621 942.057 611.301 910.487 624.641C861.297 645.421 803.287 642.481 750.507 640.581C720.647 639.511 693.877 638.461 666.087 625.121C594.617 590.831 631.587 536.191 645.637 479.661C672.557 371.361 669.897 264.871 645.847 156.371C644.927 152.241 642.167 147.321 642.067 143.081C641.747 129.481 651.317 102.911 654.607 88.6312C659.587 66.9812 661.087 46.9712 647.337 28.1112C647.497 25.9712 657.107 20.6912 659.427 19.4612C679.187 8.98123 707.547 3.28123 729.847 1.91123L729.837 1.92123ZM857.787 146.911C842.507 147.951 834.517 160.931 832.987 175.121C829.417 208.271 836.057 249.331 837.037 283.091C838.287 326.321 834.497 366.611 832.957 409.091C832.547 420.331 831.227 466.541 833.947 474.181C843.337 500.601 876.787 495.451 893.507 479.671C940.007 435.761 943.547 323.301 935.817 264.251C930.827 226.091 907.587 143.521 857.787 146.911Z" fill="white"/>
            <path d="M528.946 1.91955C564.006 -1.90045 643.256 8.81955 648.096 54.1195C650.526 76.8295 639.176 105.87 634.976 129.01C620.066 211.17 625.336 307.34 635.076 390.15C636.736 404.24 639.196 418.2 640.976 432.25C643.536 452.48 636.966 474.04 631.626 493.66C624.966 518.1 609.046 552.199 613.386 576.859C616.496 594.539 625.367 606.99 638.087 619.13C617.327 634.46 587.306 642.129 561.686 643.669C522.296 646.029 446.216 629.69 433.896 585.44C426.336 558.32 440.686 529.63 447.726 503.64C471.346 416.4 479.296 325.18 468.076 235.25C465.686 216.12 461.836 197.25 458.286 178.25C468.396 172.89 478.906 169.46 487.186 161.12C520.886 127.2 499.806 73.8895 469.216 46.1095C466.616 43.7495 452.156 33.7995 452.156 32.1395C452.146 29.6095 458.556 25.9995 460.696 24.6095C479.286 12.5995 507.146 4.28955 528.966 1.91955H528.946Z" fill="white"/>
            <path d="M1397.72 570.629C1397.67 570.619 1397.23 571.529 1396.73 571.149C1395.34 570.079 1394.81 567.879 1394.7 566.149L1394.72 512.629C1396.27 514.369 1396.48 514.629 1396.75 517.099C1398.57 534.059 1394.52 553.649 1397.72 570.629Z" fill="white"/>
            <path d="M1398.72 457.632C1393.69 463.782 1400 484.662 1394.3 488.702C1389.89 491.832 1372.66 487.542 1366.74 490.632C1366.74 490.532 1365.46 490.452 1366.18 489.632C1369.03 486.432 1394.72 491.432 1394.72 486.132V462.132C1394.72 461.832 1397.34 457.352 1397.74 457.042C1398.38 456.562 1398.66 457.632 1398.72 457.632Z" fill="white"/>
          </g>
          <defs>
            <clipPath id="clip0_219_18">
              <rect width="1489" height="645" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </div>
    `;

    return `
      <div style="
        width: 1080px;
        height: 1920px;
        padding: 120px 90px;
        box-sizing: border-box;
        background: transparent;
        position: relative;
      ">
        ${salmoHTML}
        ${reflexaoHTML}
        ${fraseHTML}
        ${praticaHTML}
        ${logoHTML}
      </div>
    `;
  };

  // Função para gerar preview pequeno de um modelo
  const generatePreview = async (modelType: 'salmo-frase' | 'com-reflexao' | 'completo', contentData: any) => {
    if (!contentData?.salmoDoDia) return null;

    let container: HTMLDivElement | null = null;

    try {
      await document.fonts.ready;

      // Criar container com dimensões adequadas para preview
      container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -3000px;
        top: -3000px;
        width: 280px;
        height: 400px;
        z-index: -1;
        background: transparent;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      document.body.appendChild(container);

      // HTML específico do modelo usando o conteúdo passado
      const { salmoDoDia, fraseDoDia, reflexaoDoDia, praticaDoDia } = contentData;
      
      const salmoTexto = escapeHtml(salmoDoDia?.texto || 'Salmo não encontrado');
      const fraseTexto = escapeHtml(fraseDoDia || 'Frase não encontrada');
      const reflexaoTexto = escapeHtml(reflexaoDoDia || 'Reflexão não encontrada');
      const praticaTexto = escapeHtml(praticaDoDia || 'Prática não encontrada');
      
      // Truncar textos para preview
      const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };

      // Template preview seguindo o design das imagens
      const salmoHTML = `
        <div style="margin-bottom: ${modelType === 'completo' ? '12px' : '18px'};">
          <h2 style="
            font-family: 'Inter', sans-serif; 
            font-weight: 600; 
            font-size: ${modelType === 'completo' ? '16px' : '20px'}; 
            color: white; 
            margin: 0 0 ${modelType === 'completo' ? '4px' : '6px'} 0;
            letter-spacing: -0.3px;
          ">Salmo</h2>
          <div style="width: 100%; height: 2px; background: #FC7D1E; margin-bottom: ${modelType === 'completo' ? '6px' : '8px'};"></div>
          <p style="
            font-family: 'Inter', sans-serif; 
            font-weight: 400; 
            font-size: ${modelType === 'completo' ? '9px' : '11px'}; 
            color: white; 
            margin: 0; 
            line-height: 1.35;
            letter-spacing: 0px;
          ">
            ${truncateText(salmoTexto, modelType === 'completo' ? 80 : 120)}
          </p>
        </div>
      `;

      const reflexaoHTML = `
        <div style="margin-bottom: ${modelType === 'completo' ? '12px' : (modelType === 'com-reflexao' ? '18px' : '0px')};">
          <h2 style="
            font-family: 'Inter', sans-serif; 
            font-weight: 600; 
            font-size: ${modelType === 'completo' ? '16px' : '20px'}; 
            color: white; 
            margin: 0 0 ${modelType === 'completo' ? '4px' : '6px'} 0;
            letter-spacing: -0.3px;
          ">Reflexão</h2>
          <div style="width: 100%; height: 2px; background: #FC7D1E; margin-bottom: ${modelType === 'completo' ? '6px' : '8px'};"></div>
          <p style="
            font-family: 'Inter', sans-serif; 
            font-weight: 400; 
            font-size: ${modelType === 'completo' ? '9px' : '11px'}; 
            color: white; 
            margin: 0; 
            line-height: 1.35;
            letter-spacing: 0px;
          ">
            ${truncateText(reflexaoTexto, modelType === 'completo' ? 70 : 100)}
          </p>
        </div>
      `;

      const fraseHTML = (modelType === 'com-reflexao' || modelType === 'completo') ? `
        <div style="margin-bottom: ${modelType === 'completo' ? '12px' : '0px'};">
          <h2 style="
            font-family: 'Inter', sans-serif; 
            font-weight: 600; 
            font-size: ${modelType === 'completo' ? '16px' : '20px'}; 
            color: white; 
            margin: 0 0 ${modelType === 'completo' ? '4px' : '6px'} 0;
            letter-spacing: -0.3px;
          ">Frase do dia</h2>
          <div style="width: 100%; height: 2px; background: #FC7D1E; margin-bottom: ${modelType === 'completo' ? '6px' : '8px'};"></div>
          <p style="
            font-family: 'Inter', sans-serif; 
            font-weight: 400; 
            font-size: ${modelType === 'completo' ? '9px' : '11px'}; 
            color: white; 
            margin: 0; 
            line-height: 1.35;
            letter-spacing: 0px;
          ">
            ${truncateText(fraseTexto, modelType === 'completo' ? 50 : 80)}
          </p>
        </div>
      ` : '';

      const praticaHTML = modelType === 'completo' ? `
        <div style="margin-bottom: 0px;">
          <h2 style="
            font-family: 'Inter', sans-serif; 
            font-weight: 600; 
            font-size: 16px; 
            color: white; 
            margin: 0 0 4px 0;
            letter-spacing: -0.3px;
          ">Prática do dia</h2>
          <div style="width: 100%; height: 2px; background: #FC7D1E; margin-bottom: 6px;"></div>
          <p style="
            font-family: 'Inter', sans-serif; 
            font-weight: 400; 
            font-size: 9px; 
            color: white; 
            margin: 0; 
            line-height: 1.35;
            letter-spacing: 0px;
          ">
            ${truncateText(praticaTexto, 40)}
          </p>
        </div>
      ` : '';

      // Logo FIDZ SVG no preview seguindo o design das imagens
      const logoHTML = `
        <div style="
          width: ${modelType === 'completo' ? '35px' : '45px'};
          height: auto;
          margin-top: ${modelType === 'completo' ? '10px' : '15px'};
        ">
          <svg width="${modelType === 'completo' ? '35' : '45'}" height="${modelType === 'completo' ? '15' : '20'}" viewBox="0 0 1489 645" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_219_18_preview)">
              <path d="M1453.34 48.9784C1483.94 78.4984 1483.59 132.128 1472.96 170.408C1458.23 223.458 1414.53 272.648 1373.74 308.138C1361.84 318.488 1348.73 326.698 1336.73 337.108C1318.88 352.598 1272.32 395.248 1272.7 419.118C1272.97 436.048 1290.16 445.978 1305.38 447.498C1334.09 450.368 1378.68 437.108 1405.21 425.618C1420.48 419.008 1442.67 403.878 1459.22 405.118C1468.93 405.848 1473.84 414.518 1477.39 422.408C1498.88 470.228 1490.89 556.628 1448.17 591.598C1409.53 623.228 1308.75 637.438 1259.33 639.658C1191.36 642.708 1083.51 635.428 1034.39 581.628C936.017 473.908 1105.53 353.868 1170.35 281.628C1187.92 262.048 1224.18 220.358 1221.85 193.068C1218.34 151.938 1145.93 173.028 1122.62 181.868C1104.89 188.588 1088.97 198.798 1071.91 206.618C1063.63 174.248 1052.87 142.448 1037.09 112.938C1033.67 106.548 1025.2 97.2384 1025.98 90.2184C1027.53 76.3184 1039.74 56.5384 1050.43 47.6384C1077.22 25.3484 1142.77 13.7184 1177.42 8.69841C1253.29 -2.29159 1394.01 -8.2716 1453.35 48.9684H1453.34V48.9784ZM1366.73 490.628C1366.68 497.278 1366.77 503.978 1366.73 510.638C1367.7 511.608 1389.72 509.318 1393.73 511.138C1394.37 511.428 1394.43 512.298 1394.72 512.628L1394.7 566.148C1394.81 567.878 1395.34 570.088 1396.73 571.148C1397.23 571.528 1397.66 570.618 1397.72 570.628C1400.96 571.518 1416.71 573.248 1416.71 569.128V516.128C1416.71 515.868 1418.3 512.468 1418.66 512.078C1422.06 508.238 1441 512.608 1446.68 510.108C1451.75 507.868 1450.32 490.508 1446.99 489.618C1441 488.018 1423.94 491.738 1419.3 488.548C1413.25 484.388 1419.91 463.388 1415.25 458.598C1413.57 456.868 1402.12 457.608 1398.73 457.628C1398.67 457.628 1398.39 456.558 1397.75 457.038C1397.35 457.338 1394.73 461.828 1394.73 462.128V486.128C1394.73 491.428 1369.03 486.438 1366.19 489.628C1365.47 490.438 1366.75 490.518 1366.75 490.628H1366.73Z" fill="white"/>
              <path d="M207.106 1.9209C282.266 -0.339099 423.346 2.1209 474.596 65.7109C499.326 96.4009 505.926 146.151 463.876 164.811C432.986 178.521 386.366 176.861 354.986 165.381C305.356 147.231 264.396 79.3009 206.086 92.9009C157.176 104.311 181.086 158.661 203.286 184.151C244.786 231.801 293.956 229.911 352.726 226.611C379.356 225.121 415.596 215.741 437.216 236.101C456.346 254.121 457.006 300.691 428.376 310.301C406.776 317.551 371.486 305.941 347.776 304.581C274.636 300.381 295.616 372.971 314.536 415.831C335.266 462.791 402.166 550.711 350.706 595.601C296.936 642.501 166.786 651.521 99.6259 638.851C39.1959 627.451 -4.77411 605.811 0.415886 536.131C2.83589 503.601 23.7659 469.981 36.3859 440.121C77.5659 342.681 71.4359 271.941 36.1559 174.351C20.3859 130.731 -11.4741 74.5509 37.8859 38.6109C79.1259 8.5809 157.226 3.4109 207.096 1.9109L207.106 1.9209Z" fill="white"/>
              <path d="M729.837 1.92123C768.207 -0.438763 821.207 -0.708763 859.527 1.58123C976.017 8.53123 1044.01 114.431 1064.63 219.381C1072.71 260.491 1077.21 324.101 1069.77 365.011C1067.97 374.901 1059.41 380.331 1053.38 387.611C1015.42 433.421 984.967 474.721 998.197 537.851C1000.68 549.711 1004.57 546.481 995.907 558.101C975.397 585.621 942.057 611.301 910.487 624.641C861.297 645.421 803.287 642.481 750.507 640.581C720.647 639.511 693.877 638.461 666.087 625.121C594.617 590.831 631.587 536.191 645.637 479.661C672.557 371.361 669.897 264.871 645.847 156.371C644.927 152.241 642.167 147.321 642.067 143.081C641.747 129.481 651.317 102.911 654.607 88.6312C659.587 66.9812 661.087 46.9712 647.337 28.1112C647.497 25.9712 657.107 20.6912 659.427 19.4612C679.187 8.98123 707.547 3.28123 729.847 1.91123L729.837 1.92123ZM857.787 146.911C842.507 147.951 834.517 160.931 832.987 175.121C829.417 208.271 836.057 249.331 837.037 283.091C838.287 326.321 834.497 366.611 832.957 409.091C832.547 420.331 831.227 466.541 833.947 474.181C843.337 500.601 876.787 495.451 893.507 479.671C940.007 435.761 943.547 323.301 935.817 264.251C930.827 226.091 907.587 143.521 857.787 146.911Z" fill="white"/>
              <path d="M528.946 1.91955C564.006 -1.90045 643.256 8.81955 648.096 54.1195C650.526 76.8295 639.176 105.87 634.976 129.01C620.066 211.17 625.336 307.34 635.076 390.15C636.736 404.24 639.196 418.2 640.976 432.25C643.536 452.48 636.966 474.04 631.626 493.66C624.966 518.1 609.046 552.199 613.386 576.859C616.496 594.539 625.367 606.99 638.087 619.13C617.327 634.46 587.306 642.129 561.686 643.669C522.296 646.029 446.216 629.69 433.896 585.44C426.336 558.32 440.686 529.63 447.726 503.64C471.346 416.4 479.296 325.18 468.076 235.25C465.686 216.12 461.836 197.25 458.286 178.25C468.396 172.89 478.906 169.46 487.186 161.12C520.886 127.2 499.806 73.8895 469.216 46.1095C466.616 43.7495 452.156 33.7995 452.156 32.1395C452.146 29.6095 458.556 25.9995 460.696 24.6095C479.286 12.5995 507.146 4.28955 528.966 1.91955H528.946Z" fill="white"/>
              <path d="M1397.72 570.629C1397.67 570.619 1397.23 571.529 1396.73 571.149C1395.34 570.079 1394.81 567.879 1394.7 566.149L1394.72 512.629C1396.27 514.369 1396.48 514.629 1396.75 517.099C1398.57 534.059 1394.52 553.649 1397.72 570.629Z" fill="white"/>
              <path d="M1398.72 457.632C1393.69 463.782 1400 484.662 1394.3 488.702C1389.89 491.832 1372.66 487.542 1366.74 490.632C1366.74 490.532 1365.46 490.452 1366.18 489.632C1369.03 486.432 1394.72 491.432 1394.72 486.132V462.132C1394.72 461.832 1397.34 457.352 1397.74 457.042C1398.38 456.562 1398.66 457.632 1398.72 457.632Z" fill="white"/>
            </g>
            <defs>
              <clipPath id="clip0_219_18_preview">
                <rect width="1489" height="645" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </div>
      `;

      // Container com fundo preto sólido como nas imagens de referência
      container.innerHTML = `
        <div style="
          width: 260px; 
          height: 380px; 
          padding: 20px 18px; 
          box-sizing: border-box;
          background:rgba(0, 0, 0, 0);
          position: relative;
          border-radius: 8px;
        ">
          ${salmoHTML}
          ${reflexaoHTML}
          ${fraseHTML}
          ${praticaHTML}
          ${logoHTML}
        </div>n
      `;

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        backgroundColor: 'transparent', // Fundo preto sólido como nas imagens de referência
        scale: 1,
        width: 280,
        height: 400,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false
      });

      return canvas.toDataURL('image/png', 1.0);
      
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      return null;
    } finally {
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    }
  };

  // Função para gerar todos os previews
  const generatePreviews = async (contentData: any) => {
    setIsLoadingPreviews(true);
    console.log('🔄 Gerando previews dos modelos...');
    
    try {
      const modelTypes = ['salmo-frase', 'com-reflexao', 'completo'] as const;
      const previews: { [key: number]: string | null } = {};
      
      // Gerar previews sequencialmente para não sobrecarregar
      for (let i = 0; i < modelTypes.length; i++) {
        console.log(`📸 Gerando preview ${i + 1}/3...`);
        const preview = await generatePreview(modelTypes[i], contentData);
        previews[i] = preview;
        
        // Atualizar estado gradualmente para feedback visual
        setPreviewCanvases({ ...previews });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('✅ Todos os previews gerados');
    } catch (error) {
      console.error('❌ Erro ao gerar previews:', error);
    } finally {
      setIsLoadingPreviews(false);
    }
  };

  // FUNÇÃO COPIAR
  const handleCopiar = async () => {
    if (!content?.salmoDoDia) {
      alert('⏳ Aguarde o carregamento do conteúdo...');
      return;
    }

    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      alert('❌ Navegador não suporta cópia de imagens\n\n💡 Use o botão "Salvar" como alternativa');
      return;
    }

    const modelTypes = ['salmo-frase', 'com-reflexao', 'completo'] as const;

    // Safari (macOS e iOS) e qualquer browser no iOS usam WebKit e exigem que
    // clipboard.write() seja chamado sincronamente no evento de clique.
    // A solução é passar uma Promise dentro do ClipboardItem — o WebKit gerencia
    // internamente sem quebrar o contexto de gesto do usuário.
    const isSafariLike =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/.test(navigator.userAgent);

    setIsGenerating(true);

    if (isSafariLike) {
      navigator.clipboard
        .write([
          new ClipboardItem({
            'image/png': generateImage(modelTypes[currentModel]).then(canvas => {
              if (!canvas) throw new Error('Erro ao gerar imagem');
              return new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  blob => (blob ? resolve(blob) : reject(new Error('toBlob falhou'))),
                  'image/png'
                );
              });
            }),
          }),
        ])
        .then(() => {
          setIsGenerating(false);
          alert('Imagem copiada, espalhe fé, não só palavras');
        })
        .catch(error => {
          setIsGenerating(false);
          console.error('❌ Erro ao copiar:', error);
          alert('❌ Erro ao copiar.\n\n💡 Tente o botão "Salvar"');
        });
      return;
    }

    // Chrome / Edge / outros: fluxo async normal
    try {
      const canvas = await generateImage(modelTypes[currentModel]);
      if (!canvas) {
        alert('❌ Erro ao gerar imagem');
        return;
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => (blob ? resolve(blob) : reject()), 'image/png', 1.0);
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Imagem copiada, espalhe fé, não só palavras');
    } catch (error) {
      console.error('❌ Erro ao copiar:', error);
      alert('❌ Erro ao copiar.\n\n💡 Tente o botão "Salvar"');
    } finally {
      setIsGenerating(false);
    }
  };

  // FUNÇÃO SALVAR CORRIGIDA  
  const handleSalvar = async () => {
    setIsGenerating(true);
    
    try {
      const modelTypes = ['salmo-frase', 'com-reflexao', 'completo'] as const;
      const canvas = await generateImage(modelTypes[currentModel]);
      
      if (!canvas) {
        alert('❌ Erro ao gerar imagem');
        return;
      }

      const link = document.createElement('a');
      link.download = `FIDZ-Modelo-${currentModel + 1}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('❌ Erro ao salvar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  // FUNÇÃO COMPARTILHAR CORRIGIDA
  const handleMais = async () => {
    setIsGenerating(true);
    
    try {
      const modelTypes = ['salmo-frase', 'com-reflexao', 'completo'] as const;
      const canvas = await generateImage(modelTypes[currentModel]);
      
      if (!canvas) {
        alert('❌ Erro ao gerar imagem');
        return;
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(), 'image/png', 1.0);
      });

      const file = new File([blob], `FIDZ-Modelo-${currentModel + 1}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'FIDZ - Compartilhar sua fé',
          text: 'Espalhe fé, não só palavras.',
          files: [file]
        });
      } else {
        alert('❌ Compartilhamento nativo não disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao compartilhar:', error);
      alert('❌ Erro ao compartilhar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full"
      style={{ 
        backgroundColor: '#21211F',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer'
          }}
        >
          Fechar
        </button>

        <div style={{
          color: 'white',
          fontSize: '16px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold'
        }}>
          Compartilhar sua fé
        </div>

        <div style={{ width: '50px' }} />
      </div>

      {/* Retângulo escuro com modelos */}
      <div style={{
        position: 'absolute',
        top: '70px',
        left: 0,
        right: 0,
        width: '100%',
        height: '480px',
        backgroundColor: 'rgb(14, 14, 13)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const cardWidth = 320; // 280px (card) + 40px (gap)
            const newIndex = Math.round(scrollLeft / cardWidth);
            setCurrentModel(Math.min(Math.max(newIndex, 0), 2));
          }}
          style={{
            display: 'flex',
            overflowX: 'scroll',
            gap: '40px',
            padding: '40px 80px 40px 40px', // Padding direito maior para acessar último modelo
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          className="scrollbar-hide"
        >
          {/* Modelo 1 */}
          <div style={{
            width: '280px',
            height: '400px',
            borderRadius: '12px',
            flexShrink: 0,
            position: 'relative',
            border: currentModel === 0 ? '2px solid #FC7D1E' : '2px solid transparent',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            // Padrão quadriculado como no Strava
            backgroundImage: `
              linear-gradient(45deg, #111 25%, transparent 25%), 
              linear-gradient(-45deg, #111 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #111 75%), 
              linear-gradient(-45deg, transparent 75%, #111 75%)
            `,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
            backgroundColor: '#000'
          }}>
            {/* Preview do canvas */}
            {previewCanvases[0] ? (
              <img 
                src={previewCanvases[0]}
                alt="Preview Modelo 1"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {isLoadingPreviews ? 'Gerando...' : 'Preview'}
              </div>
            )}
            {/* Label minimalista */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'Inter, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              Modelo 1
            </div>
          </div>

          {/* Modelo 2 */}
          <div style={{
            width: '280px',
            height: '400px',
            borderRadius: '12px',
            flexShrink: 0,
            position: 'relative',
            border: currentModel === 1 ? '2px solid #FC7D1E' : '2px solid transparent',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            // Padrão quadriculado como no Strava
            backgroundImage: `
              linear-gradient(45deg, #111 25%, transparent 25%), 
              linear-gradient(-45deg, #111 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #111 75%), 
              linear-gradient(-45deg, transparent 75%, #111 75%)
            `,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
            backgroundColor: '#000'
          }}>
            {/* Preview do canvas */}
            {previewCanvases[1] ? (
              <img 
                src={previewCanvases[1]}
                alt="Preview Modelo 2"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {isLoadingPreviews ? 'Gerando...' : 'Preview'}
              </div>
            )}
            {/* Label minimalista */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'Inter, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              Modelo 2
            </div>
          </div>

          {/* Modelo 3 */}
          <div style={{
            width: '280px',
            height: '400px',
            borderRadius: '12px',
            flexShrink: 0,
            position: 'relative',
            border: currentModel === 2 ? '2px solid #FC7D1E' : '2px solid transparent',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            // Padrão quadriculado como no Strava
            backgroundImage: `
              linear-gradient(45deg, #111 25%, transparent 25%), 
              linear-gradient(-45deg, #111 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #111 75%), 
              linear-gradient(-45deg, transparent 75%, #111 75%)
            `,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
            backgroundColor: '#000'
          }}>
            {/* Preview do canvas */}
            {previewCanvases[2] ? (
              <img 
                src={previewCanvases[2]}
                alt="Preview Modelo 3"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {isLoadingPreviews ? 'Gerando...' : 'Preview'}
              </div>
            )}
            {/* Label minimalista */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              fontFamily: 'Inter, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              Modelo 3
            </div>
          </div>
        </div>
      </div>

      {/* Botões na parte inferior */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '60px',
        alignItems: 'center'
      }}>
        {/* Botão Copiar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={handleCopiar}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isGenerating ? '#666' : '#43423F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="white" strokeWidth="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <span style={{
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '300'
          }}>
            Copiar
          </span>
        </div>

        {/* Botão Salvar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={handleSalvar}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isGenerating ? '#666' : '#43423F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2"/>
              <polyline points="7,10 12,15 17,10" stroke="white" strokeWidth="2"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <span style={{
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '300'
          }}>
            Salvar
          </span>
        </div>

        {/* Botão Mais */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={handleMais}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isGenerating ? '#666' : '#43423F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{ display: 'block', flexShrink: 0 }}
            >
              <circle cx="18" cy="5" r="3" stroke="white" strokeWidth="2"/>
              <circle cx="6" cy="12" r="3" stroke="white" strokeWidth="2"/>
              <circle cx="18" cy="19" r="3" stroke="white" strokeWidth="2"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="white" strokeWidth="2"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <span style={{
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '300'
          }}>
            Mais
          </span>
        </div>
      </div>

      {/* Loading overlay */}
      {isGenerating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontFamily: 'Inter, sans-serif'
          }}>
            Gerando imagem...
          </div>
        </div>
      )}
    </div>
  );
}