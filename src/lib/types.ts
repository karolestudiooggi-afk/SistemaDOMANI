export type Role = "admin" | "editor" | "viewer";
export type ColunaTipo = "texto" | "numero" | "data";

export interface Projeto {
  id: string;
  nome: string;
  created_at: string;
  created_by: string | null;
}

export interface Usuario {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  is_super_admin: boolean;
  ativo: boolean;
  avatar_url: string | null;
  preferencias: Preferencias;
  created_at: string;
}

export interface Acesso {
  id: string;
  usuario_id: string;
  projeto_id: string;
  papel: Role;
  created_at: string;
}

export interface Preferencias {
  tema: "claro" | "escuro" | "sistema";
  tamanho_fonte: "pequeno" | "medio" | "grande";
  ordem_menus: string[];
}

export interface Aba {
  id: string;
  nome: string;
  projeto_id: string;
  ordem: number;
  created_at: string;
}

export interface Coluna {
  id: string;
  nome: string;
  tipo: ColunaTipo;
  aba_id: string;
  ordem: number;
  created_at: string;
}

export interface Linha {
  id: string;
  aba_id: string;
  dados: Record<string, string | number | null>;
  criado_em: string;
  criado_por: string | null;
}

export interface LogEvento {
  id: string;
  projeto_id: string | null;
  aba_id: string | null;
  entidade: string;
  acao: "insert" | "update" | "delete";
  registro_id: string | null;
  dados: Record<string, unknown> | null;
  usuario_id: string | null;
  criado_em: string;
}
