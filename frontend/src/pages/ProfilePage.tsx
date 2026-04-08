import { useState, useEffect } from "react";
import { AppLayout } from "#src/components/layout/AppLayout";
import { useApiToken } from "#src/hooks/useApiToken";
import { getMe, updateMe, UserProfile } from "#src/services/userService";
import axios from "axios";
import "#src/pages/ProfilePage.css";

function maskCEP(v: string): string {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function ProfilePage() {
  useApiToken();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");

  useEffect(() => {
    getMe()
      .then((p) => {
        setProfile(p);
        resetFields(p);
      })
      .catch(() => setError("Erro ao carregar perfil."))
      .finally(() => setLoading(false));
  }, []);

  function resetFields(p: UserProfile) {
    setName(p.name ?? "");
    setPhone(p.phone ?? "");
    setCep(p.cep ? p.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : "");
    setStreet(p.street ?? "");
    setNeighborhood(p.neighborhood ?? "");
    setCity(p.city ?? "");
    setState(p.state ?? "");
    setCountry(p.country ?? "Brasil");
    setNumber(p.number ?? "");
    setComplement(p.complement ?? "");
  }

  async function handleCepBlur() {
    const raw = cep.replace(/\D/g, "");
    if (raw.length !== 8) return;
    setLoadingCep(true);
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${raw}/json/`);
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
        setCountry("Brasil");
      }
    } catch {
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, string | null> = { name };
      if (phone !== (profile?.phone ?? "")) payload["phone"] = phone || null;
      if (cep.replace(/\D/g, "") !== (profile?.cep ?? "")) payload["cep"] = cep;
      if (street !== (profile?.street ?? "")) payload["street"] = street;
      if (neighborhood !== (profile?.neighborhood ?? "")) payload["neighborhood"] = neighborhood;
      if (city !== (profile?.city ?? "")) payload["city"] = city;
      if (state !== (profile?.state ?? "")) payload["state"] = state;
      if (country !== (profile?.country ?? "")) payload["country"] = country;
      if (number !== (profile?.number ?? "")) payload["number"] = number || null;
      if (complement !== (profile?.complement ?? "")) payload["complement"] = complement || null;

      const updated = await updateMe(payload);
      setProfile(updated);
      resetFields(updated);
      setEditing(false);
      setSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) resetFields(profile);
    setEditing(false);
    setError("");
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-loading"><div className="spinner" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Meu Perfil</h1>
          {!editing && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              Editar
            </button>
          )}
        </div>

        {success && <div className="profile-success">{success}</div>}
        {error && <div className="profile-error">{error}</div>}

        <div className="profile-card">
          <div className="profile-section-title">Dados pessoais</div>

          <div className="profile-row">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" value={profile?.email ?? ""} disabled className="input-readonly" />
            </div>
          </div>

          <div className="profile-row">
            <div className="form-group">
              <label>CPF</label>
              <input type="text" value={profile?.cpf ?? "—"} disabled className="input-readonly" />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-section-title">Endereço</div>

          <div className="profile-row">
            <div className="form-group">
              <label>CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(maskCEP(e.target.value))}
                onBlur={editing ? handleCepBlur : undefined}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                placeholder="00000-000"
                maxLength={9}
              />
              {loadingCep && <small style={{ color: "var(--text-muted)", fontSize: 11 }}>Buscando...</small>}
            </div>
            <div className="form-group">
              <label>País</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={100}
              />
            </div>
          </div>

          <div className="profile-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Rua</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label>Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                placeholder="Opcional"
                maxLength={20}
              />
            </div>
          </div>

          <div className="profile-row">
            <div className="form-group">
              <label>Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                maxLength={2}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                disabled={!editing}
                className={!editing ? "input-readonly" : ""}
                placeholder="Opcional"
                maxLength={100}
              />
            </div>
          </div>
        </div>

        {editing && (
          <div className="profile-actions">
            <button className="btn btn-ghost" onClick={handleCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}