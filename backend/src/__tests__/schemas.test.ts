import { TicketPriority } from "#src/entities/Ticket";
import {
  CreateUserSchema,
  CreateTicketSchema,
  UpdateTicketPrioritySchema
} from "#src/validators/schemas";

const validUser = {
  name: "John Doe",
  email: "john@example.com",
  cpf: "529.982.247-25",
  password: "SecurePass123"
};

describe("CreateUserSchema", () => {
  it("accepts valid payload", () =>
    expect(() => CreateUserSchema.parse(validUser)).not.toThrow());
  it("rejects invalid CPF", () =>
    expect(() =>
      CreateUserSchema.parse({ ...validUser, cpf: "000.000.000-00" })
    ).toThrow());
  it("rejects invalid email", () =>
    expect(() =>
      CreateUserSchema.parse({ ...validUser, email: "not-an-email" })
    ).toThrow());
  it("rejects short password", () =>
    expect(() =>
      CreateUserSchema.parse({ ...validUser, password: "123" })
    ).toThrow());
  it("normalizes email to lowercase", () => {
    const r = CreateUserSchema.parse({
      ...validUser,
      email: "JOHN@EXAMPLE.COM"
    });
    expect(r.email).toBe("john@example.com");
  });
});

describe("CreateTicketSchema", () => {
  const valid = {
    title: "My printer is broken",
    description: "The printer stopped working after the last update."
  };
  it("accepts valid ticket", () =>
    expect(() => CreateTicketSchema.parse(valid)).not.toThrow());
  it("rejects short title", () =>
    expect(() =>
      CreateTicketSchema.parse({ ...valid, title: "Hi" })
    ).toThrow());
  it("rejects short description", () =>
    expect(() =>
      CreateTicketSchema.parse({ ...valid, description: "Short" })
    ).toThrow());
  it("rejects invalid priority", () =>
    expect(() =>
      CreateTicketSchema.parse({ ...valid, priority: "urgent" })
    ).toThrow());
});

describe("UpdateTicketPrioritySchema", () => {
  it("accepts valid priority", () =>
    expect(() =>
      UpdateTicketPrioritySchema.parse({ priority: TicketPriority.CRITICAL })
    ).not.toThrow());
  it("rejects invalid value", () =>
    expect(() =>
      UpdateTicketPrioritySchema.parse({ priority: "extreme" })
    ).toThrow());
});
