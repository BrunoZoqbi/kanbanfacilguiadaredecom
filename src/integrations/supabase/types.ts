export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias_produto: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      consumivel_saldo_tecnico: {
        Row: {
          id: string
          produto_id: string
          quantidade: number
          tecnico_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          quantidade?: number
          tecnico_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          quantidade?: number
          tecnico_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumivel_saldo_tecnico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_saldo: {
        Row: {
          estoque_id: string
          id: string
          produto_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          estoque_id: string
          id?: string
          produto_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          estoque_id?: string
          id?: string
          produto_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_saldo_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_saldo_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoques: {
        Row: {
          created_at: string
          id: string
          nome: string
          responsavel_id: string | null
          tipo: Database["public"]["Enums"]["tipo_estoque"]
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          responsavel_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_estoque"]
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_estoque"]
        }
        Relationships: []
      }
      itens_serializados: {
        Row: {
          cliente_vinculado: string | null
          condicao: Database["public"]["Enums"]["condicao_item"]
          created_at: string
          data_entrada: string
          estoque_atual_id: string | null
          fabricante: string | null
          fornecedor: string | null
          garantia_ate: string | null
          id: string
          local_instalacao: string | null
          mac_address: string | null
          modelo: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          observacoes: string | null
          os_vinculada: string | null
          patrimonio: string | null
          produto_id: string
          status: Database["public"]["Enums"]["status_item"]
          tecnico_atual_id: string | null
          ultima_movimentacao_em: string
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          cliente_vinculado?: string | null
          condicao?: Database["public"]["Enums"]["condicao_item"]
          created_at?: string
          data_entrada?: string
          estoque_atual_id?: string | null
          fabricante?: string | null
          fornecedor?: string | null
          garantia_ate?: string | null
          id?: string
          local_instalacao?: string | null
          mac_address?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          os_vinculada?: string | null
          patrimonio?: string | null
          produto_id: string
          status?: Database["public"]["Enums"]["status_item"]
          tecnico_atual_id?: string | null
          ultima_movimentacao_em?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          cliente_vinculado?: string | null
          condicao?: Database["public"]["Enums"]["condicao_item"]
          created_at?: string
          data_entrada?: string
          estoque_atual_id?: string | null
          fabricante?: string | null
          fornecedor?: string | null
          garantia_ate?: string | null
          id?: string
          local_instalacao?: string | null
          mac_address?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          os_vinculada?: string | null
          patrimonio?: string | null
          produto_id?: string
          status?: Database["public"]["Enums"]["status_item"]
          tecnico_atual_id?: string | null
          ultima_movimentacao_em?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_serializados_estoque_atual_id_fkey"
            columns: ["estoque_atual_id"]
            isOneToOne: false
            referencedRelation: "estoques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_serializados_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          cliente_vinculado: string | null
          created_at: string
          estoque_destino_id: string | null
          estoque_origem_id: string | null
          id: string
          item_serializado_id: string | null
          observacao: string | null
          os_vinculada: string | null
          produto_id: string
          quantidade: number
          tecnico_id: string | null
          tipo_movimento: Database["public"]["Enums"]["tipo_movimento_estoque"]
          usuario_responsavel_id: string
        }
        Insert: {
          cliente_vinculado?: string | null
          created_at?: string
          estoque_destino_id?: string | null
          estoque_origem_id?: string | null
          id?: string
          item_serializado_id?: string | null
          observacao?: string | null
          os_vinculada?: string | null
          produto_id: string
          quantidade?: number
          tecnico_id?: string | null
          tipo_movimento: Database["public"]["Enums"]["tipo_movimento_estoque"]
          usuario_responsavel_id: string
        }
        Update: {
          cliente_vinculado?: string | null
          created_at?: string
          estoque_destino_id?: string | null
          estoque_origem_id?: string | null
          id?: string
          item_serializado_id?: string | null
          observacao?: string | null
          os_vinculada?: string | null
          produto_id?: string
          quantidade?: number
          tecnico_id?: string | null
          tipo_movimento?: Database["public"]["Enums"]["tipo_movimento_estoque"]
          usuario_responsavel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_estoque_destino_id_fkey"
            columns: ["estoque_destino_id"]
            isOneToOne: false
            referencedRelation: "estoques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_estoque_origem_id_fkey"
            columns: ["estoque_origem_id"]
            isOneToOne: false
            referencedRelation: "estoques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_item_serializado_id_fkey"
            columns: ["item_serializado_id"]
            isOneToOne: false
            referencedRelation: "itens_serializados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          controla_serial: boolean
          created_at: string
          id: string
          is_active: boolean
          nome: string
          unidade_medida: string | null
        }
        Insert: {
          categoria: string
          controla_serial?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
          unidade_medida?: string | null
        }
        Update: {
          categoria?: string
          controla_serial?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
          unidade_medida?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospeccoes: {
        Row: {
          classificacao: Database["public"]["Enums"]["classificacao_prospeccao"]
          created_at: string
          data_contato: string
          data_retorno_prevista: string | null
          endereco: string | null
          id: string
          nome_contato: string
          observacoes: string | null
          pontuacao_total: number
          provedor_atual: string | null
          status: Database["public"]["Enums"]["status_prospeccao"]
          task_id_gerada: string | null
          telefone_whatsapp: string
          tipo_contato: Database["public"]["Enums"]["tipo_contato_prospeccao"]
          updated_at: string
          vendedor_responsavel_id: string
        }
        Insert: {
          classificacao?: Database["public"]["Enums"]["classificacao_prospeccao"]
          created_at?: string
          data_contato?: string
          data_retorno_prevista?: string | null
          endereco?: string | null
          id?: string
          nome_contato: string
          observacoes?: string | null
          pontuacao_total?: number
          provedor_atual?: string | null
          status?: Database["public"]["Enums"]["status_prospeccao"]
          task_id_gerada?: string | null
          telefone_whatsapp: string
          tipo_contato?: Database["public"]["Enums"]["tipo_contato_prospeccao"]
          updated_at?: string
          vendedor_responsavel_id: string
        }
        Update: {
          classificacao?: Database["public"]["Enums"]["classificacao_prospeccao"]
          created_at?: string
          data_contato?: string
          data_retorno_prevista?: string | null
          endereco?: string | null
          id?: string
          nome_contato?: string
          observacoes?: string | null
          pontuacao_total?: number
          provedor_atual?: string | null
          status?: Database["public"]["Enums"]["status_prospeccao"]
          task_id_gerada?: string | null
          telefone_whatsapp?: string
          tipo_contato?: Database["public"]["Enums"]["tipo_contato_prospeccao"]
          updated_at?: string
          vendedor_responsavel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospeccoes_task_id_gerada_fkey"
            columns: ["task_id_gerada"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      prospeccoes_respostas: {
        Row: {
          id: string
          pergunta: string
          pontos: number
          prospeccao_id: string
          resposta_selecionada: string
        }
        Insert: {
          id?: string
          pergunta: string
          pontos?: number
          prospeccao_id: string
          resposta_selecionada: string
        }
        Update: {
          id?: string
          pergunta?: string
          pontos?: number
          prospeccao_id?: string
          resposta_selecionada?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospeccoes_respostas_prospeccao_id_fkey"
            columns: ["prospeccao_id"]
            isOneToOne: false
            referencedRelation: "prospeccoes"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_documentos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          ordem: number
          titulo: string
          url: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          titulo: string
          url: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      recursos_links: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          ordem: number
          titulo: string
          url: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          titulo: string
          url: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ordem?: number
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      scripts_atendimento: {
        Row: {
          ativo: boolean
          categoria: string
          conteudo: string
          created_at: string
          id: string
          observacao: string | null
          ordem: number
          setor: Database["public"]["Enums"]["setor_script"]
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          conteudo: string
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          setor: Database["public"]["Enums"]["setor_script"]
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          setor?: Database["public"]["Enums"]["setor_script"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_configs: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          task_id: string
          uploaded_by_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          task_id: string
          uploaded_by_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          task_id?: string
          uploaded_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          position: number
          task_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          task_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          id: string
          tag_id: string
          task_id: string
        }
        Insert: {
          id?: string
          tag_id: string
          task_id: string
        }
        Update: {
          id?: string
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by_id: string
          description: string | null
          due_date: string
          id: string
          item_serializado_id: string | null
          location: string | null
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          recurrence_days: number[] | null
          recurrence_end_after: number | null
          recurrence_end_date: string | null
          recurrence_interval: number
          recurrence_time: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          scheduled_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id: string
          description?: string | null
          due_date: string
          id?: string
          item_serializado_id?: string | null
          location?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence_days?: number[] | null
          recurrence_end_after?: number | null
          recurrence_end_date?: string | null
          recurrence_interval?: number
          recurrence_time?: string | null
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_id?: string
          description?: string | null
          due_date?: string
          id?: string
          item_serializado_id?: string | null
          location?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          recurrence_days?: number[] | null
          recurrence_end_after?: number | null
          recurrence_end_date?: string | null
          recurrence_interval?: number
          recurrence_time?: string | null
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_item_serializado_id_fkey"
            columns: ["item_serializado_id"]
            isOneToOne: false
            referencedRelation: "itens_serializados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_consulta_tentativas: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          numero_ticket: number
          sucesso: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          numero_ticket: number
          sucesso: boolean
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          numero_ticket?: number
          sucesso?: boolean
        }
        Relationships: []
      }
      ticket_notas_internas: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          texto: string
          ticket_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          texto: string
          ticket_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          texto?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notas_internas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_respostas: {
        Row: {
          autor_id: string | null
          autor_nome: string
          created_at: string
          id: string
          texto: string
          ticket_id: string
        }
        Insert: {
          autor_id?: string | null
          autor_nome: string
          created_at?: string
          id?: string
          texto: string
          ticket_id: string
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string
          created_at?: string
          id?: string
          texto?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_respostas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          atendente_id: string | null
          cpf_ou_contrato: string
          created_at: string
          created_by_id: string | null
          descricao: string
          id: string
          nome_cliente: string
          numero_ticket: number
          prioridade: Database["public"]["Enums"]["prioridade_ticket"]
          resolved_at: string | null
          sla_prazo: string | null
          status: Database["public"]["Enums"]["status_ticket"]
          telefone: string
          tipo_problema: string
          updated_at: string
        }
        Insert: {
          atendente_id?: string | null
          cpf_ou_contrato: string
          created_at?: string
          created_by_id?: string | null
          descricao: string
          id?: string
          nome_cliente: string
          numero_ticket?: number
          prioridade?: Database["public"]["Enums"]["prioridade_ticket"]
          resolved_at?: string | null
          sla_prazo?: string | null
          status?: Database["public"]["Enums"]["status_ticket"]
          telefone: string
          tipo_problema: string
          updated_at?: string
        }
        Update: {
          atendente_id?: string | null
          cpf_ou_contrato?: string
          created_at?: string
          created_by_id?: string | null
          descricao?: string
          id?: string
          nome_cliente?: string
          numero_ticket?: number
          prioridade?: Database["public"]["Enums"]["prioridade_ticket"]
          resolved_at?: string | null
          sla_prazo?: string | null
          status?: Database["public"]["Enums"]["status_ticket"]
          telefone?: string
          tipo_problema?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_buscar_logs: {
        Args: {
          p_action?: string
          p_entity_type?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          action: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          user_id: string
          user_name: string
        }[]
      }
      admin_buscar_usuarios: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_search?: string
        }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone_whatsapp: string
          role: string
        }[]
      }
      admin_get_user_email: { Args: { p_user_id: string }; Returns: string }
      buscar_itens_instalados: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          cliente_vinculado: string | null
          condicao: Database["public"]["Enums"]["condicao_item"]
          created_at: string
          data_entrada: string
          estoque_atual_id: string | null
          fabricante: string | null
          fornecedor: string | null
          garantia_ate: string | null
          id: string
          local_instalacao: string | null
          mac_address: string | null
          modelo: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          observacoes: string | null
          os_vinculada: string | null
          patrimonio: string | null
          produto_id: string
          status: Database["public"]["Enums"]["status_item"]
          tecnico_atual_id: string | null
          ultima_movimentacao_em: string
          updated_at: string
          valor_aquisicao: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "itens_serializados"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      buscar_itens_serializados_disponiveis: {
        Args: {
          p_categoria?: string
          p_limit?: number
          p_offset?: number
          p_produto_id?: string
          p_search?: string
        }
        Returns: {
          cliente_vinculado: string | null
          condicao: Database["public"]["Enums"]["condicao_item"]
          created_at: string
          data_entrada: string
          estoque_atual_id: string | null
          fabricante: string | null
          fornecedor: string | null
          garantia_ate: string | null
          id: string
          local_instalacao: string | null
          mac_address: string | null
          modelo: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          observacoes: string | null
          os_vinculada: string | null
          patrimonio: string | null
          produto_id: string
          status: Database["public"]["Enums"]["status_item"]
          tecnico_atual_id: string | null
          ultima_movimentacao_em: string
          updated_at: string
          valor_aquisicao: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "itens_serializados"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      buscar_movimentacoes_estoque: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_tipo?: string
        }
        Returns: {
          created_at: string
          id: string
          numero_serie: string
          observacao: string
          produto_nome: string
          quantidade: number
          tecnico_nome: string
          tipo_movimento: Database["public"]["Enums"]["tipo_movimento_estoque"]
        }[]
      }
      confirmar_baixa_definitiva: {
        Args: { p_item_id: string; p_observacao?: string }
        Returns: undefined
      }
      criar_notificacao: {
        Args: {
          p_link?: string
          p_mensagem: string
          p_tipo: string
          p_titulo: string
          p_user_id: string
        }
        Returns: undefined
      }
      dar_baixa_item: {
        Args: {
          p_item_id: string
          p_novo_status: Database["public"]["Enums"]["status_item"]
          p_observacao: string
        }
        Returns: undefined
      }
      devolver_consumivel_sede: {
        Args: {
          p_observacao?: string
          p_produto_id: string
          p_quantidade: number
        }
        Returns: undefined
      }
      devolver_sede: {
        Args: { p_item_id: string; p_observacao?: string }
        Returns: undefined
      }
      estoque_disponivel_por_produto: {
        Args: { p_produto_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      instalar_item: {
        Args: {
          p_cliente_vinculado: string
          p_item_id: string
          p_local_instalacao: string
          p_os_vinculada: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_gestor_comercial: { Args: never; Returns: boolean }
      is_gestor_tecnico: { Args: never; Returns: boolean }
      is_user_active: { Args: never; Returns: boolean }
      lancar_entrada_consumivel: {
        Args: {
          p_estoque_id: string
          p_observacao?: string
          p_produto_id: string
          p_quantidade: number
        }
        Returns: undefined
      }
      lancar_saida_consumivel: {
        Args: {
          p_estoque_id: string
          p_observacao?: string
          p_produto_id: string
          p_quantidade: number
        }
        Returns: undefined
      }
      lancar_tarefa_recolhimento: {
        Args: {
          p_descricao: string
          p_due_date: string
          p_item_id: string
          p_location?: string
          p_tecnico_id: string
          p_titulo: string
        }
        Returns: string
      }
      lancar_uso_consumivel: {
        Args: {
          p_observacao?: string
          p_produto_id: string
          p_quantidade: number
        }
        Returns: undefined
      }
      reparo_concluido: {
        Args: { p_item_id: string; p_observacao?: string }
        Returns: undefined
      }
      resumo_estoque_por_status: { Args: never; Returns: Json }
      retirar_consumivel_para_tecnico: {
        Args: {
          p_observacao?: string
          p_produto_id: string
          p_quantidade: number
          p_tecnico_id: string
        }
        Returns: undefined
      }
      retirar_para_tecnico: {
        Args: { p_item_id: string; p_observacao?: string; p_tecnico_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gestor_tecnico" | "gestor_comercial"
      classificacao_prospeccao: "baixa" | "media" | "alta"
      condicao_item: "novo" | "usado" | "recondicionado"
      prioridade_ticket: "baixa" | "media" | "alta" | "urgente"
      recurrence_type: "none" | "daily" | "weekly" | "monthly"
      setor_script: "comercial" | "financeiro" | "atendimento_geral" | "suporte_tecnico"
      status_item:
        | "disponivel"
        | "com_tecnico"
        | "instalado_cliente"
        | "analise_defeito"
        | "baixado"
      status_prospeccao: "novo" | "em_negociacao" | "convertido" | "perdido"
      status_ticket:
        | "aberto"
        | "em_andamento"
        | "aguardando_cliente"
        | "resolvido"
        | "fechado"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "todo" | "doing" | "done"
      task_type: "daily" | "one_time"
      tipo_contato_prospeccao: "visita" | "ligacao"
      tipo_estoque: "geral" | "tecnico"
      tipo_movimento_estoque:
        | "entrada_compra"
        | "retirada_tecnico"
        | "instalacao"
        | "recolhimento"
        | "devolucao_sede"
        | "baixa_defeito"
        | "descarte"
        | "saida_consumo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "gestor_tecnico", "gestor_comercial"],
      classificacao_prospeccao: ["baixa", "media", "alta"],
      condicao_item: ["novo", "usado", "recondicionado"],
      prioridade_ticket: ["baixa", "media", "alta", "urgente"],
      recurrence_type: ["none", "daily", "weekly", "monthly"],
      setor_script: ["comercial", "financeiro", "atendimento_geral", "suporte_tecnico"],
      status_item: [
        "disponivel",
        "com_tecnico",
        "instalado_cliente",
        "analise_defeito",
        "baixado",
      ],
      status_prospeccao: ["novo", "em_negociacao", "convertido", "perdido"],
      status_ticket: [
        "aberto",
        "em_andamento",
        "aguardando_cliente",
        "resolvido",
        "fechado",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["todo", "doing", "done"],
      task_type: ["daily", "one_time"],
      tipo_contato_prospeccao: ["visita", "ligacao"],
      tipo_estoque: ["geral", "tecnico"],
      tipo_movimento_estoque: [
        "entrada_compra",
        "retirada_tecnico",
        "instalacao",
        "recolhimento",
        "devolucao_sede",
        "baixa_defeito",
        "descarte",
        "saida_consumo",
      ],
    },
  },
} as const
