import { Platform } from 'react-native';
import { VerseShareData } from '../types';

// Web globals for canvas
declare const document: any;
declare const window: any;

// Canvas types for web
interface HTMLCanvasElement {
  width: number;
  height: number;
  style: any;
  getContext(contextId: string): any;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
  toDataURL(type?: string, quality?: number): string;
}

interface CanvasRenderingContext2D {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: string;
  direction: string;
  scale(x: number, y: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): any;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
}

type ThemeMode = 'light' | 'dark';

interface VerseImagePalette {
  background: string;
  text: string;
  translation: string;
  accent: string;
  border: string;
  gradientTop: string;
  gradientMid: string;
  gradientBottom: string;
  footerText?: string;
}

export class VerseImageGenerator {
  private static readonly IMAGE_WIDTH = 800;
  private static readonly IMAGE_HEIGHT = 600;
  private static readonly PADDING = 50;
  private static readonly BACKGROUND_COLOR = '#FAFAFA';
  private static readonly TEXT_COLOR = '#2C2C2C';
  private static readonly ACCENT_COLOR = '#2E7D32';
  private static readonly BORDER_COLOR = '#E8E8E8';

  /**
   * Ayet resmini oluşturur (sadece web platformunda)
   */
  static async generateVerseImage(verseData: VerseShareData, options?: { themeMode?: ThemeMode }): Promise<string | null> {
    console.log('generateVerseImage başlatıldı', verseData);

    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      console.log('Resim oluşturma sadece web platformunda destekleniyor');
      return null;
    }

    try {
      console.log('Canvas oluşturuluyor...');
      const canvas = this.createCanvas();
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context oluşturulamadı');
      }

      console.log('Ayet resmi çiziliyor...');
  const palette = this.getPalette(options?.themeMode || 'light');
  await this.drawVerseImage(ctx, verseData, palette);

      console.log('Canvas blob\'a dönüştürülüyor...');
      // Canvas'ı blob'a dönüştür
      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            console.log('Resim başarıyla oluşturuldu:', url);
            resolve(url);
          } else {
            console.error('Blob oluşturulamadı');
            resolve(null);
          }
        }, 'image/png', 0.9);
      });
    } catch (error) {
      console.error('Ayet resmi oluşturma hatası:', error);
      return null;
    }
  }

  /**
   * Canvas elementi oluşturur
   */
  private static createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.IMAGE_WIDTH;
    canvas.height = this.IMAGE_HEIGHT;

    // Canvas'ı yüksek çözünürlükte render et
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    return canvas;
  }

  /**
   * Canvas'a ayet resmini çizer
   */
  private static async drawVerseImage(ctx: CanvasRenderingContext2D, verseData: VerseShareData, palette: VerseImagePalette): Promise<void> {
    const { arabicText, translation, surahName, verseNumber } = verseData;

    // Arka plan
  this.drawBackground(ctx, palette);

    // Dinamik font boyutları hesapla
    const fontSizes = this.calculateFontSizes(ctx, arabicText, translation);

    // Layout hesaplamaları
    const layout = this.calculateLayout(ctx, arabicText, translation, fontSizes);

    // Başlık (Sure adı ve ayet numarası)
  this.drawTitle(ctx, surahName, verseNumber, layout.titleY, palette);

    // Arapça metin
  await this.drawArabicText(ctx, arabicText, fontSizes.arabic, layout.arabicY, layout.arabicLines, layout.arabicLineHeight, palette);

    // Çeviri metni
  this.drawTranslation(ctx, translation, fontSizes.translation, layout.translationY, layout.translationLines, layout.translationLineHeight, palette);

    // Alt bilgi
  this.drawFooter(ctx, palette);

    // Dekoratif çerçeve
  this.drawBorder(ctx, palette);
  }

  /**
   * Arka planı çizer
   */
  private static drawBackground(ctx: CanvasRenderingContext2D, palette: VerseImagePalette): void {
    // Ana arka plan
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT);

    // Çok hafif gradient efekti
    const gradient = ctx.createLinearGradient(0, 0, 0, this.IMAGE_HEIGHT);
    gradient.addColorStop(0, palette.gradientTop);
    gradient.addColorStop(0.5, palette.gradientMid);
    gradient.addColorStop(1, palette.gradientBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
  }

  /**
   * Font boyutlarını dinamik olarak hesaplar - okunabilir ama sığacak boyutlar
   */
  private static calculateFontSizes(ctx: CanvasRenderingContext2D, arabicText: string, translation: string): { arabic: number; translation: number } {
    // Arapça metin için font boyutu - okunabilir seviyelerde
    let arabicFontSize = 36;

    if (arabicText.length > 250) {
      arabicFontSize = 26;
    } else if (arabicText.length > 200) {
      arabicFontSize = 28;
    } else if (arabicText.length > 150) {
      arabicFontSize = 30;
    } else if (arabicText.length > 100) {
      arabicFontSize = 32;
    } else if (arabicText.length > 50) {
      arabicFontSize = 34;
    }

    // Çeviri için font boyutu - okunabilir
    let translationFontSize = 17;

    if (translation.length > 350) {
      translationFontSize = 14;
    } else if (translation.length > 250) {
      translationFontSize = 15;
    } else if (translation.length > 150) {
      translationFontSize = 16;
    }

    console.log(`Font hesabı: Arapça uzunluk ${arabicText.length} -> ${arabicFontSize}px, Çeviri uzunluk ${translation.length} -> ${translationFontSize}px`);

    return {
      arabic: arabicFontSize,
      translation: translationFontSize
    };
  }

  /**
   * Layout pozisyonlarını hesaplar - doğru font ile hesaplama
   */
  private static calculateLayout(ctx: CanvasRenderingContext2D, arabicText: string, translation: string, fontSizes: { arabic: number; translation: number }): {
    titleY: number;
    arabicY: number;
    translationY: number;
    arabicLines: string[];
    translationLines: string[];
    arabicLineHeight: number;
    translationLineHeight: number;
  } {
    const footerHeight = 70; // footer + alt boşluk
    const minGapBetweenTexts = 30; // Arapça-çeviri arası
    const titleYFixed = 50; // BAŞLIK ÜSTTE SABİT
    const gapTitleArabic = 35; // başlık-ayet arası (biraz daha nefes)

    // Arapça metin için doğru font ayarla ve hesapla
    ctx.font = `${fontSizes.arabic}px "Arabic Typesetting", "Traditional Arabic", "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    console.log(`Layout hesaplaması: Arapça font ${fontSizes.arabic}px ayarlandı`);
    const arabicLines = this.wrapText(ctx, arabicText, this.IMAGE_WIDTH - (this.PADDING * 2), true);
    // Satır aralığını biraz artır: tek satırda +12, birden fazla satırda +14
    const arabicLineHeight = fontSizes.arabic + (arabicLines.length > 1 ? 20 : 12);
    const actualArabicHeight = arabicLines.length * arabicLineHeight;

    // Çeviri için doğru font ayarla ve hesapla  
    ctx.font = `${fontSizes.translation}px "Georgia", serif`;
    ctx.textAlign = 'center';
    ctx.direction = 'ltr';

    console.log(`Layout hesaplaması: Çeviri font ${fontSizes.translation}px ayarlandı`);
    const translationLines = this.wrapText(ctx, `"${translation}"`, this.IMAGE_WIDTH - (this.PADDING * 2.5));
    const translationLineHeight = fontSizes.translation + 4; // daha sıkı
    const actualTranslationHeight = translationLines.length * translationLineHeight;

    console.log(`DOĞRU Layout: Arapça ${arabicLines.length} satır (${actualArabicHeight}px), Çeviri ${translationLines.length} satır (${actualTranslationHeight}px)`);
    // Başlık sabit; sadece Arapça + çeviri bloğunu arada ortala
    // Tek satır Arapça ise gereksiz boşluğu azalt
    const dynamicGap = arabicLines.length === 1 ? Math.max(12, minGapBetweenTexts - 12) : minGapBetweenTexts;
    const blockHeight = actualArabicHeight + dynamicGap + actualTranslationHeight;
    const spaceAboveBlock = titleYFixed + gapTitleArabic; // blok başlangıcı için minimum
    const availableAfterTitle = this.IMAGE_HEIGHT - footerHeight - spaceAboveBlock;

    let offset = 0;
    if (blockHeight < availableAfterTitle) {
      offset = (availableAfterTitle - blockHeight) / 2; // sadece aşağı kaydır
    }

    const arabicY = spaceAboveBlock + offset;
    const translationY = arabicY + actualArabicHeight + dynamicGap;

    console.log(`Layout (title fixed): titleY=${titleYFixed}, arabicY=${arabicY}, translationY=${translationY}, offset=${offset}`);

    return {
      titleY: titleYFixed,
      arabicY,
      translationY,
      arabicLines,
      translationLines,
      arabicLineHeight,
      translationLineHeight
    };
  }

  /**
   * Başlık kısmını çizer
   */
  private static drawTitle(ctx: CanvasRenderingContext2D, surahName: string, verseNumber: number, y: number, palette: VerseImagePalette): void {
    ctx.fillStyle = palette.accent;
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';

    const titleText = `${surahName} Suresi - ${verseNumber}. Ayet`;
    ctx.fillText(titleText, this.IMAGE_WIDTH / 2, y);

    // Başlık altına elegant çizgi
  ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const lineY = y + 15;
    ctx.moveTo(this.IMAGE_WIDTH / 2 - 150, lineY);
    ctx.lineTo(this.IMAGE_WIDTH / 2 + 150, lineY);
    ctx.stroke();
  }

  /**
   * Arapça metni çizer
   */
  private static async drawArabicText(ctx: CanvasRenderingContext2D, arabicText: string, fontSize: number, startY: number, precomputedLines?: string[], lineHeightOverride?: number, palette?: VerseImagePalette): Promise<void> {
    ctx.fillStyle = palette?.text || this.TEXT_COLOR;
    ctx.font = `${fontSize}px "Scheherazade New", "Noto Naskh Arabic", Amiri, "Traditional Arabic", "Arabic Typesetting", "Times New Roman", serif`;
    // Blok ortalama: tüm satırlar için en geniş satırı bulup bloğu ortala
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    const maxWidth = this.IMAGE_WIDTH - (this.PADDING * 2);
    const lines = precomputedLines || this.wrapText(ctx, arabicText, maxWidth, true);
    const lineHeight = lineHeightOverride || (fontSize + 14);

    const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
    const startX = (this.IMAGE_WIDTH + widest) / 2; // sağ kenarı referans alacağız
    console.log(`Arapça çiziliyor (precomputed=${!!precomputedLines}): ${lines.length} satır, başlangıç Y=${startY}, satır yüksekliği=${lineHeight}, en geniş=${widest}, startX=${startX}`);
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, startX, y);
    });
    console.log(`Arapça metin bitti. Son satır Y: ${startY + (lines.length - 1) * lineHeight}`);
    return Promise.resolve();
  }

  /**
   * Çeviri metnini çizer
   */
  private static drawTranslation(ctx: CanvasRenderingContext2D, translation: string, fontSize: number, startY: number, precomputedLines?: string[], lineHeightOverride?: number, palette?: VerseImagePalette): void {
    ctx.fillStyle = palette?.translation || '#666666';
    ctx.font = `${fontSize}px "Georgia", serif`;
    ctx.textAlign = 'left';
    ctx.direction = 'ltr';
    const maxWidth = this.IMAGE_WIDTH - (this.PADDING * 2.5);
    const quotedTranslation = `"${translation}"`;
    const lines = precomputedLines || this.wrapText(ctx, quotedTranslation, maxWidth);
    const lineHeight = lineHeightOverride || (fontSize + 6);

    const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
    const startX = (this.IMAGE_WIDTH - widest) / 2; // sol kenarı referans alacağız
    console.log(`Çeviri çiziliyor (precomputed=${!!precomputedLines}): ${lines.length} satır, başlangıç Y=${startY}, satır yüksekliği=${lineHeight}, en geniş=${widest}, startX=${startX}`);
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, startX, y);
    });
    console.log(`Çeviri bitti. Son satır Y: ${startY + (lines.length - 1) * lineHeight}`);
  }

  /**
   * Alt bilgi kısmını çizer
   */
  private static drawFooter(ctx: CanvasRenderingContext2D, palette: VerseImagePalette): void {
    ctx.fillStyle = palette.footerText || palette.accent;
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';

    const footerText = 'kuran360.com';
    // İç çerçevenin (bottom= IMAGE_HEIGHT - 20) tam üzerine binmemesi için biraz yukarı al
    ctx.fillText(footerText, this.IMAGE_WIDTH / 2, this.IMAGE_HEIGHT - 35);
  }

  /**
   * Çerçeveyi çizer
   */
  private static drawBorder(ctx: CanvasRenderingContext2D, palette: VerseImagePalette): void {
    // Dış çerçeve - çok hafif
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, this.IMAGE_WIDTH - 10, this.IMAGE_HEIGHT - 10);

    // İç dekoratif çerçeve - daha elegant
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(20, 20, this.IMAGE_WIDTH - 40, this.IMAGE_HEIGHT - 40);
  }

  /**
   * Metni satırlara böler - Arapça ve Türkçe metinler için düzeltildi
   */
  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, isArabic: boolean = false): string[] {
    if (!text || text.trim().length === 0) return [''];
    console.log(`wrapText başlıyor: "${text.substring(0, 50)}...", maxWidth: ${maxWidth}, isArabic=${isArabic}`);

    // Arapça ve boşluksuz metinler için özel durum: boşluk yoksa karakter bazlı sar
    const hasSpaces = text.includes(' ');
    if (isArabic && !hasSpaces) {
      const lines: string[] = [];
      let currentLine = '';
      for (const char of text) {
        const testLine = currentLine + char;
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = char; // yeni satır başlat
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      console.log(`wrapText (char-mode) sonucu: ${lines.length} satır`);
      return lines;
    }

    // Normal kelime bazlı sarma
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine === '' ? word : currentLine + ' ' + word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
        // Eğer tek kelime çok uzunsa karakter bazlı böl
        if (ctx.measureText(word).width > maxWidth) {
          let segment = '';
          for (const ch of word) {
            const segTest = segment + ch;
            if (ctx.measureText(segTest).width > maxWidth && segment !== '') {
              lines.push(segment);
              segment = ch;
            } else {
              segment = segTest;
            }
          }
          currentLine = segment;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) lines.push('');
    console.log(`wrapText sonucu: ${lines.length} satır`);
    return lines;
  }

  /**
   * Canvas'tan base64 data URL'i alır
   */
  static canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png', 0.9);
  }

  /**
   * Data URL'den blob oluşturur
   */
  static async dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }

  /** Tema paleti üretir */
  private static getPalette(mode: ThemeMode): VerseImagePalette {
    if (mode === 'dark') {
      return {
        background: '#0F120F',
        text: '#F2F5F2',
        translation: '#C2C7C2',
        accent: '#66BB6A',
        border: '#1F2A1F',
        gradientTop: 'rgba(102,187,106,0.05)',
        gradientMid: 'rgba(255,255,255,0.03)',
        gradientBottom: 'rgba(102,187,106,0.04)',
        footerText: '#7AD27E'
      };
    }
    // light (default)
    return {
      background: this.BACKGROUND_COLOR,
      text: this.TEXT_COLOR,
      translation: '#666666',
      accent: this.ACCENT_COLOR,
      border: this.BORDER_COLOR,
      gradientTop: 'rgba(46,125,50,0.01)',
      gradientMid: 'rgba(255,255,255,0.3)',
      gradientBottom: 'rgba(46,125,50,0.02)'
    };
  }
}
