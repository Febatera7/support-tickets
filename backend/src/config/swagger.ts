import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Support Tickets API",
      version: "1.0.0",
      description: "API de gestão de tickets de suporte com triagem por IA, SLA configurável e autenticação via Keycloak."
    },
    servers: [{ url: "http://localhost:4000", description: "Local" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtido via Keycloak. Faça login em http://localhost:8080 com o client support-web."
        }
      },
      schemas: {
        UserRole: { type: "string", enum: ["user", "operator", "admin"] },
        TicketStatus: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
        TicketPriority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        ProcessingStatus: { type: "string", enum: ["queued", "processing", "processed", "error"] },
        UserSummary: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" }
          }
        },
        Ticket: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            status: { $ref: "#/components/schemas/TicketStatus" },
            priority: { $ref: "#/components/schemas/TicketPriority" },
            aiSuggestedPriority: { $ref: "#/components/schemas/TicketPriority", nullable: true },
            aiSuggestedCategory: { type: "string", nullable: true },
            category: { type: "string", nullable: true },
            processingStatus: { $ref: "#/components/schemas/ProcessingStatus" },
            slaDeadline: { type: "string", format: "date-time", nullable: true },
            resolvedAt: { type: "string", format: "date-time", nullable: true },
            resolutionTimeMinutes: { type: "number", nullable: true, description: "Tempo de resolução em minutos (calculado)" },
            operatorComment: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            createdBy: { $ref: "#/components/schemas/UserSummary" },
            assignedTo: { $ref: "#/components/schemas/UserSummary", nullable: true },
            assignedToId: { type: "string", format: "uuid", nullable: true }
          }
        },
        TicketHistory: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            ticketId: { type: "string", format: "uuid" },
            action: { type: "string", enum: ["created", "status_changed", "priority_changed", "assigned", "ai_processed", "processing_error"] },
            oldValue: { type: "string", nullable: true },
            newValue: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            changedBy: { $ref: "#/components/schemas/UserSummary", nullable: true }
          }
        },
        SLAConfig: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            priority: { $ref: "#/components/schemas/TicketPriority" },
            responseTimeHours: { type: "integer", minimum: 1, maximum: 720 },
            resolutionTimeHours: { type: "integer", minimum: 1, maximum: 2160 },
            autoEscalateAfterHours: { type: "integer", nullable: true, description: "Horas até escalonamento automático de prioridade" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/UserRole" },
            cpf: { type: "string", nullable: true, description: "CPF mascarado (***.***.***-XX)" },
            phone: { type: "string", nullable: true },
            cep: { type: "string", nullable: true },
            street: { type: "string", nullable: true },
            neighborhood: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            state: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            number: { type: "string", nullable: true },
            complement: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        PaginatedTickets: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" }
          }
        },
        PaginatedHistory: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/TicketHistory" } },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
            errors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } }
          }
        },
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: { type: "object" }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: "Token ausente ou inválido",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        Forbidden: {
          description: "Sem permissão para este recurso",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        NotFound: {
          description: "Recurso não encontrado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        ValidationError: {
          description: "Dados inválidos",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/users": {
        post: {
          tags: ["Usuários"],
          summary: "Criar usuário",
          description: "Cria um usuário comum (sem autenticação). Para criar operadores ou admins, requer token de admin e campo `role` no body.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "cpf", "password"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100, example: "João da Silva" },
                    email: { type: "string", format: "email", example: "joao@email.com" },
                    cpf: { type: "string", pattern: "^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$", example: "529.982.247-25" },
                    password: { type: "string", minLength: 8, maxLength: 100, example: "senha123" },
                    phone: { type: "string", example: "(11) 99999-9999" },
                    cep: { type: "string", example: "01310-100" },
                    street: { type: "string", example: "Avenida Paulista" },
                    neighborhood: { type: "string", example: "Bela Vista" },
                    city: { type: "string", example: "São Paulo" },
                    state: { type: "string", maxLength: 2, example: "SP" },
                    country: { type: "string", example: "Brasil" },
                    number: { type: "string", example: "1000" },
                    complement: { type: "string", example: "Apto 42" },
                    role: { $ref: "#/components/schemas/UserRole", description: "Requer autenticação de admin. Se omitido, cria como 'user'." }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Usuário criado", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }] } } } },
            "409": { description: "E-mail ou CPF já cadastrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "422": { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/users/me": {
        get: {
          tags: ["Usuários"],
          summary: "Obter perfil do usuário autenticado",
          description: "Retorna os dados completos do usuário logado, incluindo endereço.",
          responses: {
            "200": { description: "Perfil do usuário", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/UserProfile" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" }
          }
        },
        patch: {
          tags: ["Usuários"],
          summary: "Atualizar perfil do usuário autenticado",
          description: "Atualiza os campos enviados no body. Apenas os campos presentes serão alterados. E-mail e CPF não podem ser alterados.",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    phone: { type: "string", nullable: true },
                    cep: { type: "string" },
                    street: { type: "string" },
                    neighborhood: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string", maxLength: 2 },
                    country: { type: "string" },
                    number: { type: "string", nullable: true },
                    complement: { type: "string", nullable: true }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Perfil atualizado", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/UserProfile" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "422": { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/users/operators": {
        get: {
          tags: ["Usuários"],
          summary: "Listar operadores",
          description: "Retorna todos os usuários com role `operator`. Requer autenticação de admin.",
          responses: {
            "200": { description: "Lista de operadores", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, data: { type: "array", items: { $ref: "#/components/schemas/UserProfile" } } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/tickets": {
        get: {
          tags: ["Tickets"],
          summary: "Listar tickets",
          description: "Lista tickets paginados. Usuários comuns veem apenas seus próprios tickets. Operadores e admins veem todos. Por padrão retorna tickets com status `open`.",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Página" },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Itens por página" },
            { name: "status", in: "query", schema: { $ref: "#/components/schemas/TicketStatus" }, description: "Filtrar por status único. Não usar junto com `statuses`." },
            { name: "statuses", in: "query", schema: { type: "string", example: "open,in_progress" }, description: "Filtrar por múltiplos status separados por vírgula. Ex: `open,in_progress` ou `resolved,closed`." },
            { name: "priority", in: "query", schema: { $ref: "#/components/schemas/TicketPriority" }, description: "Filtrar por prioridade" },
            { name: "search", in: "query", schema: { type: "string", maxLength: 200 }, description: "Busca por título, descrição ou categoria" },
            { name: "assignedToId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por operador atribuído (admin/operator)" },
            { name: "createdById", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por criador (admin/operator)" },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date-time" }, description: "Data de criação a partir de (ISO 8601)" },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date-time" }, description: "Data de criação até (ISO 8601)" }
          ],
          responses: {
            "200": { description: "Lista paginada de tickets", content: { "application/json": { schema: { allOf: [{ type: "object", properties: { status: { type: "string" } } }, { $ref: "#/components/schemas/PaginatedTickets" }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" }
          }
        },
        post: {
          tags: ["Tickets"],
          summary: "Criar ticket",
          description: "Cria um novo ticket. A prioridade e categoria são definidas automaticamente pela IA após criação. O campo `priority` do body é ignorado — a IA define.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "description"],
                  properties: {
                    title: { type: "string", minLength: 5, maxLength: 150, example: "Meu computador não liga" },
                    description: { type: "string", minLength: 10, maxLength: 5000, example: "Ao pressionar o botão power, nada acontece. Já tentei trocar a tomada." }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Ticket criado. A IA processa prioridade e categoria em background.", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "422": { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/tickets/available": {
        get: {
          tags: ["Tickets"],
          summary: "Listar tickets disponíveis para atribuição",
          description: "Retorna tickets sem operador atribuído. Exclusivo para operadores e admins. Ordenado por prioridade e data mais antiga.",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "priority", in: "query", schema: { $ref: "#/components/schemas/TicketPriority" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "dateFrom", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "dateTo", in: "query", schema: { type: "string", format: "date-time" } }
          ],
          responses: {
            "200": { description: "Tickets disponíveis", content: { "application/json": { schema: { allOf: [{ type: "object", properties: { status: { type: "string" } } }, { $ref: "#/components/schemas/PaginatedTickets" }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/tickets/{id}/status": {
        patch: {
          tags: ["Tickets"],
          summary: "Atualizar status do ticket",
          description: "Operadores só podem atualizar tickets atribuídos a eles. Ao resolver ou fechar, `resolvedAt` é preenchido e o SLA é calculado.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { $ref: "#/components/schemas/TicketStatus" },
                    operatorComment: { type: "string", maxLength: 2000, description: "Comentário sobre o que foi feito ou motivo de estouro de SLA" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Status atualizado", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}/priority": {
        patch: {
          tags: ["Tickets"],
          summary: "Atualizar prioridade do ticket",
          description: "Recalcula o `slaDeadline` com base na nova prioridade e na data de criação original. Operadores só podem atualizar tickets atribuídos a eles.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["priority"],
                  properties: {
                    priority: { $ref: "#/components/schemas/TicketPriority" },
                    reason: { type: "string", minLength: 5, maxLength: 500, description: "Justificativa para a mudança de prioridade" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Prioridade atualizada", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}/category": {
        patch: {
          tags: ["Tickets"],
          summary: "Atualizar categoria do ticket",
          description: "Permite que operadores corrijam a categoria sugerida pela IA. `aiSuggestedCategory` não é alterado.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["category"],
                  properties: {
                    category: { type: "string", maxLength: 100, example: "hardware" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Categoria atualizada", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}/assign": {
        post: {
          tags: ["Tickets"],
          summary: "Atribuir ticket a um operador",
          description: "Exclusivo para admins. Atribui o ticket a um operador específico e muda o status para `in_progress`.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["operatorId"],
                  properties: {
                    operatorId: { type: "string", format: "uuid", description: "ID do operador a ser atribuído" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Ticket atribuído", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}/self-assign": {
        post: {
          tags: ["Tickets"],
          summary: "Operador assume o ticket",
          description: "Exclusivo para operadores. O próprio operador assume o ticket. Falha se o ticket já estiver atribuído.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Ticket assumido", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Ticket" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}/history": {
        get: {
          tags: ["Tickets"],
          summary: "Histórico de mudanças do ticket",
          description: "Retorna o log completo de alterações do ticket (status, prioridade, atribuições). Exclusivo para admins.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
          ],
          responses: {
            "200": { description: "Histórico paginado", content: { "application/json": { schema: { allOf: [{ type: "object", properties: { status: { type: "string" } } }, { $ref: "#/components/schemas/PaginatedHistory" }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/tickets/{id}": {
        delete: {
          tags: ["Tickets"],
          summary: "Excluir ticket",
          description: "Admins podem excluir qualquer ticket. Usuários comuns só podem excluir tickets com status `open` criados por eles.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "204": { description: "Ticket excluído" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/sla": {
        get: {
          tags: ["SLA"],
          summary: "Listar configurações de SLA",
          description: "Retorna as configurações de SLA para cada nível de prioridade. Exclusivo para admins.",
          responses: {
            "200": { description: "Configurações de SLA", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, data: { type: "array", items: { $ref: "#/components/schemas/SLAConfig" } } } } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/sla/{priority}": {
        put: {
          tags: ["SLA"],
          summary: "Atualizar configuração de SLA",
          description: "Atualiza os tempos de SLA para uma prioridade específica. Ao alterar, todos os tickets com essa prioridade terão o `slaDeadline` recalculado nos próximos agendamentos.",
          parameters: [{ name: "priority", in: "path", required: true, schema: { $ref: "#/components/schemas/TicketPriority" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["responseTimeHours", "resolutionTimeHours"],
                  properties: {
                    responseTimeHours: { type: "integer", minimum: 1, maximum: 720, description: "Tempo máximo para primeira resposta (horas)" },
                    resolutionTimeHours: { type: "integer", minimum: 1, maximum: 2160, description: "Tempo máximo para resolução (horas)" },
                    autoEscalateAfterHours: { type: "integer", minimum: 1, maximum: 2160, nullable: true, description: "Após quantas horas sem resolução o ticket é escalado automaticamente para a próxima prioridade" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "SLA atualizado", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/SLAConfig" } } }] } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "422": { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/events": {
        get: {
          tags: ["SSE"],
          summary: "Conectar ao canal de eventos em tempo real",
          description: "Abre uma conexão Server-Sent Events (SSE). O token JWT deve ser passado como query param pois o `EventSource` do browser não suporta headers customizados.\n\n**Eventos enviados:**\n- `CONNECTED` — confirmação de conexão\n- `TICKET_PROCESSING_UPDATE` — IA terminou de processar um ticket\n- `PRIORITY_CHANGED` — prioridade de um ticket foi alterada\n- `TICKET_ASSIGNED` — ticket foi atribuído a um operador",
          parameters: [{ name: "token", in: "query", required: true, schema: { type: "string" }, description: "Token JWT Bearer" }],
          responses: {
            "200": {
              description: "Stream SSE aberto",
              content: {
                "text/event-stream": {
                  schema: {
                    type: "string",
                    example: "data: {\"type\":\"TICKET_PROCESSING_UPDATE\",\"payload\":{\"ticketId\":\"uuid\",\"processingStatus\":\"processed\",\"aiSuggestedPriority\":\"critical\"}}\n\n"
                  }
                }
              }
            },
            "401": { $ref: "#/components/responses/Unauthorized" }
          }
        }
      },
      "/health": {
        get: {
          tags: ["Sistema"],
          summary: "Health check",
          description: "Verifica se a API está respondendo.",
          security: [],
          responses: {
            "200": {
              description: "API online",
              content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, timestamp: { type: "string", format: "date-time" } } } } }
            }
          }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
