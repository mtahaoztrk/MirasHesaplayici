// logic.ts

// --- TİP TANIMLARI ---
export type Varisler = Record<string, number>;
export type Paylar = Record<string, Fraction>;

export interface HesaplamaSonucu {
  paylar: Paylar;
  bireyselPaylar: Paylar;
  ortakPayda: number;
  logs: string[];
}

// --- HASSAS KESİR MATEMATİĞİ ---
export class Fraction {
  n: number;
  d: number;

  constructor(numerator: number, denominator: number = 1) {
    if (denominator === 0) throw new Error("Payda sıfır olamaz");
    this.n = numerator;
    this.d = denominator;
    this.simplify();
  }

  gcd(a: number, b: number): number { return b ? this.gcd(b, a % b) : a; }

  simplify() {
    const common = this.gcd(Math.abs(this.n), Math.abs(this.d));
    this.n /= common;
    this.d /= common;
    if (this.d < 0) { this.n *= -1; this.d *= -1; }
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d);
  }

  mul(other: Fraction | number): Fraction {
    const o = typeof other === 'number' ? new Fraction(other, 1) : other;
    return new Fraction(this.n * o.n, this.d * o.d);
  }

  div(other: Fraction | number): Fraction {
    const o = typeof other === 'number' ? new Fraction(other, 1) : other;
    return new Fraction(this.n * o.d, this.d * o.n);
  }

  toFloat(): number { return this.n / this.d; }
  toString(): string { return `${this.n}/${this.d}`; }
}

// --- SİRÂCİYYE HESAPLAMA MOTORU ---
export class SiraciyyeMotoru {
  varisler: Varisler;
  paylar: Paylar;
  logs: string[];

  constructor(girdiler?: Varisler) {
    this.varisler = girdiler ? { ...girdiler } : {};
    this.paylar = {};
    this.logs = [];
  }

  reset() {
    this.varisler = {};
    this.paylar = {}; 
    this.logs = [];
  }

  log(msg: string) { this.logs.push(msg); }

  yukle(girdiler: Varisler) {
    this.varisler = { ...girdiler };
  }

  get(key: string): number { return this.varisler[key] || 0; }
  
  erkekCocukVar(): boolean { return this.get('ogul') > 0 || this.get('ogul_oglu') > 0 || this.get('ogul_oglunun_oglu') > 0; }
  cocukVar(): boolean { return this.erkekCocukVar() || this.get('kiz') > 0 || this.get('ogul_kizi') > 0; }

  hesapla(): HesaplamaSonucu {
    this.paylar = {};
    this.logs = [];

    // --- 1. HACB (ENGELLEME - DÜŞÜRME) ---
    if (this.get('baba') > 0) {
      if (this.get('dede') > 0) { this.varisler['dede'] = 0; this.log("HACB: Baba, Dede'yi düşürdü."); }
      if (this.get('nine_baba') > 0) { this.varisler['nine_baba'] = 0; this.log("HACB: Baba, Babaannesini düşürdü."); }
    }
    if (this.get('anne') > 0) {
      if (this.get('nine_anne') > 0 || this.get('nine_baba') > 0) {
        this.varisler['nine_anne'] = 0; this.varisler['nine_baba'] = 0;
        this.log("HACB: Anne, tüm nineleri düşürdü.");
      }
    }
    
    // Oğul ve torun silsilesi hacb kuralı
    if (this.get('ogul') > 0) {
      this.varisler['ogul_oglu'] = 0; this.varisler['ogul_kizi'] = 0; this.varisler['ogul_oglunun_oglu'] = 0;
      this.log("HACB: Oğul, torunları ve aşağısını düşürdü.");
    }
    if (this.get('ogul_oglu') > 0) {
      this.varisler['ogul_oglunun_oglu'] = 0;
      this.log("HACB: Oğlun oğlu, kendi altındaki torunları düşürdü.");
    }

    if (this.get('kiz') >= 2 && this.get('ogul_oglu') === 0 && this.get('ogul_oglunun_oglu') === 0) {
      this.varisler['ogul_kizi'] = 0;
      this.log("HACB: İki veya daha fazla Kız, (asabe yapacak erkek torun yoksa) Oğlun Kızlarını düşürdü.");
    }
    
    const asilErkek = this.get('baba') > 0 || this.get('dede') > 0;
    const ferErkek = this.get('ogul') > 0 || this.get('ogul_oglu') > 0 || this.get('ogul_oglunun_oglu') > 0;
    const ferKiz = this.get('kiz') > 0 || this.get('ogul_kizi') > 0;

    // Asıl Erkek veya Fer Erkek altsoydaki tüm kardeş, yeğen ve amcaları düşürür
    if (asilErkek || ferErkek) {
      ['erkek_kardes_oz', 'kiz_kardes_oz', 'erkek_kardes_baba', 'kiz_kardes_baba', 'kardes_anne', 'erkek_kardes_oz_oglu', 'erkek_kardes_baba_oglu', 'amca', 'amca_oglu'].forEach(k => { 
        if (this.get(k) > 0) { this.varisler[k] = 0; this.log(`HACB: Asıl/Fer Erkek, ${k} düşürdü.`); } 
      });
    }

    // Fer Kızlar Anne Bir Kardeşleri düşürür
    if (ferKiz && this.get('kardes_anne') > 0) {
        this.varisler['kardes_anne'] = 0; this.log("HACB: Fer (Kız/Kız Torun), Anne bir kardeşleri düşürdü.");
    }

    // Kardeşler arası hacb ve yeğenleri düşürme
    const kizKardesOzAsabeOlur = this.get('kiz_kardes_oz') > 0 && ferKiz && !ferErkek && !asilErkek;
    if (this.get('erkek_kardes_oz') > 0 || kizKardesOzAsabeOlur) {
        ['erkek_kardes_baba', 'kiz_kardes_baba', 'erkek_kardes_oz_oglu', 'erkek_kardes_baba_oglu', 'amca', 'amca_oglu'].forEach(k => { 
            if (this.get(k) > 0) { this.varisler[k] = 0; this.log(`HACB: Öz Kardeş(ler), ${k} düşürdü.`); } 
        });
    }
    if (this.get('kiz_kardes_oz') >= 2 && this.get('erkek_kardes_baba') === 0 && this.get('kiz_kardes_baba') > 0) {
        this.varisler['kiz_kardes_baba'] = 0; this.log("HACB: İki Öz Kız Kardeş, Baba bir kız kardeşleri düşürdü.");
    }
    
    // Baba bir kardeşler altındaki yeğen ve amcaları düşürür
    const kizKardesBabaAsabeOlur = this.get('kiz_kardes_baba') > 0 && ferKiz && this.get('kiz_kardes_oz') === 0 && !ferErkek && !asilErkek;
    if (this.get('erkek_kardes_baba') > 0 || kizKardesBabaAsabeOlur) {
        ['erkek_kardes_oz_oglu', 'erkek_kardes_baba_oglu', 'amca', 'amca_oglu'].forEach(k => { 
            if (this.get(k) > 0) { this.varisler[k] = 0; this.log(`HACB: Baba Bir Kardeş(ler), ${k} düşürdü.`); } 
        });
    }

    // Yeğenlerin kendi aralarındaki hacbı ve amcaları düşürmesi
    if (this.get('erkek_kardes_oz_oglu') > 0) {
        ['erkek_kardes_baba_oglu', 'amca', 'amca_oglu'].forEach(k => { 
            if (this.get(k) > 0) { this.varisler[k] = 0; this.log(`HACB: Öz Kardeş Oğlu, ${k} düşürdü.`); } 
        });
    }
    if (this.get('erkek_kardes_baba_oglu') > 0) {
        ['amca', 'amca_oglu'].forEach(k => { 
            if (this.get(k) > 0) { this.varisler[k] = 0; this.log(`HACB: Baba Bir Kardeş Oğlu, ${k} düşürdü.`); } 
        });
    }

    // Amca amca oğlunu düşürür
    if (this.get('amca') > 0 && this.get('amca_oglu') > 0) {
        this.varisler['amca_oglu'] = 0; this.log(`HACB: Amca, Amca Oğlu'nu düşürdü.`);
    }

    // --- 2. FERÂİZ (FARZ PAYLAR) ---
    if (this.get('koca') > 0) {
      this.paylar['koca'] = this.cocukVar() ? new Fraction(1, 4) : new Fraction(1, 2);
      this.log(`Koca: ${this.cocukVar() ? '1/4 (Çocuk var)' : '1/2'}`);
    }
    if (this.get('kari') > 0) {
      this.paylar['kari'] = this.cocukVar() ? new Fraction(1, 8) : new Fraction(1, 4);
      this.log(`Karı: ${this.cocukVar() ? '1/8 (Çocuk var)' : '1/4'}`);
    }

    if (this.get('baba') > 0) {
      if (this.erkekCocukVar()) {
        this.paylar['baba'] = new Fraction(1, 6);
        this.log("Baba: 1/6 (Erkek çocuk var)");
      } else if (ferKiz) {
        this.paylar['baba'] = new Fraction(1, 6);
        this.log("Baba: 1/6 + Asabe (Kız çocuk var)");
      } else {
        this.paylar['baba'] = new Fraction(0, 1);
        this.log("Baba: Asabe (Çocuk yok)");
      }
    }

    if (this.get('dede') > 0) {
      if (this.erkekCocukVar()) {
        this.paylar['dede'] = new Fraction(1, 6);
        this.log("Dede: 1/6 (Erkek çocuk var)");
      } else if (ferKiz) {
        this.paylar['dede'] = new Fraction(1, 6);
        this.log("Dede: 1/6 + Asabe (Kız çocuk var)");
      } else {
        this.paylar['dede'] = new Fraction(0, 1);
        this.log("Dede: Asabe (Çocuk yok)");
      }
    }

    if (this.get('anne') > 0) {
      const kardesSayisi = ['erkek_kardes_oz', 'kiz_kardes_oz', 'erkek_kardes_baba', 'kiz_kardes_baba', 'kardes_anne']
                          .reduce((sum, k) => sum + this.get(k), 0);
      const omeriyye = (this.get('baba') > 0 && (this.get('koca') > 0 || this.get('kari') > 0) && !this.cocukVar() && kardesSayisi < 2);

      if (this.cocukVar() || kardesSayisi >= 2) {
        this.paylar['anne'] = new Fraction(1, 6);
        this.log("Anne: 1/6 (Çocuk veya kardeşler var)");
      } else if (omeriyye) {
        const esPayi = (this.paylar['koca'] || new Fraction(0)).add(this.paylar['kari'] || new Fraction(0));
        const kalan = new Fraction(1).sub(esPayi);
        this.paylar['anne'] = kalan.mul(new Fraction(1, 3));
        this.log("Anne: Ömeriyye (Eşten kalanın 1/3'ü)");
      } else {
        this.paylar['anne'] = new Fraction(1, 3);
        this.log("Anne: 1/3");
      }
    }

    let hakEdenNineGrupSayisi = (this.get('nine_anne') > 0 ? 1 : 0) + (this.get('nine_baba') > 0 ? 1 : 0);
    if (hakEdenNineGrupSayisi > 0) {
      if (this.get('nine_anne') > 0) this.paylar['nine_anne'] = new Fraction(1, 6 * hakEdenNineGrupSayisi);
      if (this.get('nine_baba') > 0) this.paylar['nine_baba'] = new Fraction(1, 6 * hakEdenNineGrupSayisi);
      this.log(`Nine(ler): 1/6 ${hakEdenNineGrupSayisi > 1 ? '(Ortak paylaşıldı)' : ''}`);
    }

    if (this.get('kiz') > 0 && this.get('ogul') === 0) {
      this.paylar['kiz'] = this.get('kiz') === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
      this.log(`Kız(lar): ${this.get('kiz') === 1 ? '1/2' : '2/3'}`);
    }

    if (this.get('ogul_kizi') > 0 && this.get('ogul_oglu') === 0 && this.get('ogul_oglunun_oglu') === 0) {
      if (this.get('kiz') === 0) {
        this.paylar['ogul_kizi'] = this.get('ogul_kizi') === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
        this.log(`Oğlun Kızı: ${this.get('ogul_kizi') === 1 ? '1/2' : '2/3'}`);
      } else if (this.get('kiz') === 1) {
        this.paylar['ogul_kizi'] = new Fraction(1, 6);
        this.log(`Oğlun Kızı: 1/6 (2/3'e tamamlama)`);
      }
    }

    if (this.get('kardes_anne') > 0) {
      this.paylar['kardes_anne'] = this.get('kardes_anne') === 1 ? new Fraction(1, 6) : new Fraction(1, 3);
      this.log(`Anne Bir Kardeş(ler): ${this.get('kardes_anne') === 1 ? '1/6' : '1/3'}`);
    }

    if (this.get('kiz_kardes_oz') > 0 && this.get('erkek_kardes_oz') === 0 && !ferKiz) {
      this.paylar['kiz_kardes_oz'] = this.get('kiz_kardes_oz') === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
      this.log(`Öz Kız Kardeş(ler): ${this.get('kiz_kardes_oz') === 1 ? '1/2' : '2/3'}`);
    }

    if (this.get('kiz_kardes_baba') > 0 && this.get('erkek_kardes_baba') === 0 && !ferKiz) {
      if (this.get('kiz_kardes_oz') === 0) {
        this.paylar['kiz_kardes_baba'] = this.get('kiz_kardes_baba') === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
        this.log(`Baba Bir Kız Kardeş(ler): ${this.get('kiz_kardes_baba') === 1 ? '1/2' : '2/3'}`);
      } else if (this.get('kiz_kardes_oz') === 1) {
        this.paylar['kiz_kardes_baba'] = new Fraction(1, 6);
        this.log(`Baba Bir Kız Kardeş(ler): 1/6 (2/3'e tamamlama)`);
      }
    }

    // --- 3. AVL ---
    let toplamFarz = new Fraction(0);
    Object.values(this.paylar).forEach(p => toplamFarz = toplamFarz.add(p));

    if (toplamFarz.toFloat() > 1) {
      this.log(`AVL (AVLIYE DURUMU): Payların toplamı (${toplamFarz.toString()}) bütünü aştı. Varisler arasında adaleti sağlamak ve herkesin payından kendi hissesi oranında kısılabilmesi için 'Asıl Mesele' ${toplamFarz.d} sayısından ${toplamFarz.n} sayısına yükseltilmiştir.`);
      Object.keys(this.paylar).forEach(k => {
        this.paylar[k] = this.paylar[k].div(toplamFarz);
      });
      toplamFarz = new Fraction(1);
    }

    let kalan = new Fraction(1).sub(toplamFarz);
    
    // --- 4. ASABE (SIRALI) ---
    if (kalan.n > 0) {
        if (this.get('ogul') > 0) {
            this.asabeDagit(['ogul', 'kiz'], kalan, 2, 1);
            this.log("ASABE: Oğul (ve varsa Kız) kalanı aldı.");
            kalan = new Fraction(0);
        } 
        else if (this.get('ogul_oglu') > 0) {
            this.asabeDagit(['ogul_oglu', 'ogul_kizi'], kalan, 2, 1);
            this.log("ASABE: Oğlun Oğlu (ve varsa Oğlun Kızı) kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('ogul_oglunun_oglu') > 0) {
            this.paylar['ogul_oglunun_oglu'] = kalan;
            this.log("ASABE: Oğlun Oğlunun Oğlu kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('baba') > 0) {
            const mevcut = this.paylar['baba'] || new Fraction(0);
            this.paylar['baba'] = mevcut.add(kalan);
            this.log("ASABE: Baba kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('dede') > 0) {
            const mevcut = this.paylar['dede'] || new Fraction(0);
            this.paylar['dede'] = mevcut.add(kalan);
            this.log("ASABE: Dede kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('erkek_kardes_oz') > 0) {
            this.asabeDagit(['erkek_kardes_oz', 'kiz_kardes_oz'], kalan, 2, 1);
            this.log("ASABE: Öz Kardeşler kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (kizKardesOzAsabeOlur) { 
            const mevcut = this.paylar['kiz_kardes_oz'] || new Fraction(0);
            this.paylar['kiz_kardes_oz'] = mevcut.add(kalan);
            this.log("ASABE MA'AL-GAYR: Öz Kız Kardeş kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('erkek_kardes_baba') > 0) {
            this.asabeDagit(['erkek_kardes_baba', 'kiz_kardes_baba'], kalan, 2, 1);
            this.log("ASABE: Baba Bir Kardeşler kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (kizKardesBabaAsabeOlur) { 
            const mevcut = this.paylar['kiz_kardes_baba'] || new Fraction(0);
            this.paylar['kiz_kardes_baba'] = mevcut.add(kalan);
            this.log("ASABE MA'AL-GAYR: Baba Bir Kız Kardeş kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('erkek_kardes_oz_oglu') > 0) {
            this.paylar['erkek_kardes_oz_oglu'] = kalan;
            this.log("ASABE: Öz Kardeş Oğlu kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('erkek_kardes_baba_oglu') > 0) {
            this.paylar['erkek_kardes_baba_oglu'] = kalan;
            this.log("ASABE: Baba Bir Kardeş Oğlu kalanı aldı.");
            kalan = new Fraction(0);
        }
        else if (this.get('amca') > 0) {
             this.paylar['amca'] = kalan;
             this.log("ASABE: Amca kalanı aldı.");
             kalan = new Fraction(0);
        }
        else if (this.get('amca_oglu') > 0) {
             this.paylar['amca_oglu'] = kalan;
             this.log("ASABE: Amca Oğlu kalanı aldı.");
             kalan = new Fraction(0);
        }
    }

    // --- 5. RED ---
    if (kalan.n > 0) {
        const redAlicilar = Object.keys(this.paylar).filter(k => k !== 'koca' && k !== 'kari' && this.paylar[k].n > 0);
        if (redAlicilar.length > 0) {
             let redToplam = new Fraction(0);
             redAlicilar.forEach(k => redToplam = redToplam.add(this.paylar[k]));
             
             redAlicilar.forEach(k => {
                 const ek = (this.paylar[k].div(redToplam)).mul(kalan);
                 this.paylar[k] = this.paylar[k].add(ek);
             });
             this.log("RED: Asabe yok, artan mal eşler hariç dağıtıldı.");
        }
    }
    
    // --- 6. TASHİH ---
    const bireyselPaylar: Paylar = {};
    let ortakPayda = 1;

    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b);

    Object.keys(this.paylar).forEach(k => {
      if (this.paylar[k].n > 0) {
        const adet = this.get(k) || 1;
        const bireysel = new Fraction(this.paylar[k].n, this.paylar[k].d * adet);
        bireyselPaylar[k] = bireysel;
        ortakPayda = lcm(ortakPayda, bireysel.d);
      }
    });

    return { paylar: this.paylar, bireyselPaylar, ortakPayda, logs: this.logs };
  }

  asabeDagit(keys: [string, string], miktar: Fraction, oranE: number, oranK: number) {
    const [eKey, kKey] = keys;
    const eSayi = this.get(eKey);
    const kSayi = this.get(kKey);
    const toplamHisse = eSayi * oranE + kSayi * oranK;
    const birim = miktar.div(new Fraction(toplamHisse));

    if (eSayi > 0) this.paylar[eKey] = (this.paylar[eKey] || new Fraction(0)).add(birim.mul(oranE * eSayi));
    if (kSayi > 0) this.paylar[kKey] = (this.paylar[kKey] || new Fraction(0)).add(birim.mul(oranK * kSayi));
  }
}