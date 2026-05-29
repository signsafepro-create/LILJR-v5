/**
 * AI SUITE FRONTEND CLIENT
 * Drop this into your frontend public/ or src/ folder
 */

class AISuiteClient {
  constructor(baseURL = '') {
    this.base = baseURL.replace(/\/$/, '');
    this.token = localStorage.getItem('lj_token') || '';
  }

  async _req(path, opts = {}) {
    const res = await fetch(this.base + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.token,
        ...opts.headers
      }
    });
    return res.json();
  }

  setToken(t) { this.token = t; localStorage.setItem('lj_token', t); }

  // Projects
  createProject(data) {
    return this._req('/api/project/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  generateService(service, data) {
    return this._req('/api/generate/' + service, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Actions
  marketingPost(data) {
    return this._req('/api/marketing/post', { method: 'POST', body: JSON.stringify(data) });
  }

  notaryDoc(data) {
    return this._req('/api/notary/document', { method: 'POST', body: JSON.stringify(data) });
  }

  socialReply(data) {
    return this._req('/api/social/reply', { method: 'POST', body: JSON.stringify(data) });
  }

  voiceScript(data) {
    return this._req('/api/voice/script', { method: 'POST', body: JSON.stringify(data) });
  }

  docAnalyze(data) {
    return this._req('/api/document/analyze', { method: 'POST', body: JSON.stringify(data) });
  }

  agentTask(data) {
    return this._req('/api/agent/task', { method: 'POST', body: JSON.stringify(data) });
  }

  referralQR(data) {
    return this._req('/api/referral/qr', { method: 'POST', body: JSON.stringify(data) });
  }

  chatbotEmbed(data) {
    return this._req('/api/chatbot/embed', { method: 'POST', body: JSON.stringify(data) });
  }

  // Health
  health() {
    return this._req('/api/health');
  }
}

if (typeof window !== 'undefined') {
  window.AISuiteClient = AISuiteClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AISuiteClient };
}
