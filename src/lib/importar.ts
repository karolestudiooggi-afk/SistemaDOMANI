import type { ColunaTipo } from "./types";

export interface AbaImportada {
  nome: string;
  colunas: { nome: string; tipo: ColunaTipo }[];
  linhas: Record<string, string | number | null>[];
}

// ------------------------------------------------------------------
// Carregamento da biblioteca SheetJS (XLSX) via CDN, sob demanda.
// Assim não é preciso instalar nenhum pacote npm — a lib só é baixada
// quando o usuário realmente importa um arquivo.
// ------------------------------------------------------------------
declare global {
  interface Window {
    XLSX?: any;
  }
}

const CDN_XLSX = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
let xlsxPromise: Promise<any> | null = null;

function carregarXLSX(): Promise<any> {
  if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;

  xlsxPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Importação só está disponível no navegador."));
      return;
    }
    const script = document.createElement("script");
    script.src = CDN_XLSX;
    script.async = true;
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("Não foi possível carregar o leitor de planilhas."));
    };
    script.onerror = () => reject(new Error("Falha ao baixar o leitor de planilhas (verifique a conexão)."));
    document.head.appendChild(script);
  });
  return xlsxPromise;
}

// Infere o tipo de uma coluna a partir de uma amostra de valores
function inferirTipo(valores: unknown[]): ColunaTipo {
  const amostra = valores.filter((v) => v !== null && v !== undefined && String(v).trim() !== "").slice(0, 30);
  if (amostra.length === 0) return "texto";

  // 1) Datas primeiro (inclui Date do Excel, ISO, dd/mm/aaaa e timestamps grandes)
  const todosData = amostra.every((v) => {
    if (v instanceof Date) return true;
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true;        // ISO
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) return true; // dd/mm/aaaa
    if (/^\d{12,}$/.test(s)) return true;                  // timestamp em ms (data do Excel)
    return false;
  });
  if (todosData) return "data";

  // 2) Números (só se não forem datas)
  const todosNumero = amostra.every((v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== ""));
  if (todosNumero) return "numero";

  return "texto";
}

function normalizarData(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // timestamp em milissegundos (data vinda do Excel)
  if (/^\d{12,}$/.test(s)) {
    const d = new Date(Number(s));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    const [, d, m, y] = br;
    const ano = y.length === 2 ? "20" + y : y;
    return `${ano}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return s.slice(0, 10);
  return s;
}

/**
 * Lê um arquivo (xlsx/xls/csv) e devolve as abas com colunas tipadas e linhas.
 * A primeira linha de cada aba é tratada como cabeçalho.
 */
export async function lerArquivoPlanilha(file: File): Promise<AbaImportada[]> {
  const XLSX = await carregarXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });

  const abas: AbaImportada[] = [];

  for (const nomeAba of wb.SheetNames) {
    const ws = wb.Sheets[nomeAba];
    const matriz: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    if (!matriz.length) continue;

    const headerIdx = matriz.findIndex((r) => Array.isArray(r) && r.some((c) => c != null && String(c).trim() !== ""));
    if (headerIdx === -1) continue;

    const header = (matriz[headerIdx] as unknown[]).map((c, i) =>
      c != null && String(c).trim() !== "" ? String(c).trim() : `Coluna ${i + 1}`
    );
    const corpo = matriz
      .slice(headerIdx + 1)
      .filter((r) => Array.isArray(r) && r.some((c) => c != null && String(c).trim() !== ""));

    const tipos: ColunaTipo[] = header.map((_, ci) => inferirTipo(corpo.map((r) => (r as unknown[])[ci])));
    const colunas = header.map((nome, i) => ({ nome, tipo: tipos[i] }));

    const linhas = corpo.map((r) => {
      const row = r as unknown[];
      const dados: Record<string, string | number | null> = {};
      header.forEach((nome, ci) => {
        const raw = row[ci];
        if (raw == null || String(raw).trim() === "") {
          dados[nome] = null;
        } else if (tipos[ci] === "numero") {
          const n = Number(raw);
          dados[nome] = isNaN(n) ? String(raw) : n;
        } else if (tipos[ci] === "data") {
          dados[nome] = normalizarData(raw);
        } else {
          dados[nome] = String(raw);
        }
      });
      return dados;
    });

    abas.push({ nome: nomeAba, colunas, linhas });
  }

  return abas;
}
