import { useState } from 'react';
import { Search, Globe, Building, Bot, Key, Sparkles, AlertCircle, Zap, Target, Briefcase, Wrench, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('API Key not found in environment.');
      return;
    }
    if (!companyName && !companyUrl) {
      setError('Please provide a company name or URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const isUrlProvided = !!companyUrl;
    let messages = [];
    let tools = [];

    const SYSTEM_PROMPT = `
# Role
You are a Company Intelligence & AI Opportunity Analysis Agent.

# Objective
Research the output strictly in **VALID JSON** format. Do NOT return markdown.
The user wants a high-density dashboard. Be extremely concise. Use phrases, not sentences.

# JSON Structure
{
  "company_overview": {
    "industry": "string",
    "target_customers": "string",
    "size": "string",
    "description": "string (max 15 words)"
  },
  "operational_workflow": [
    "string (short bullet point)",
    "string",
    "string"
  ],
  "pain_points": [
    "string (critical bottleneck)",
    "string",
    "string"
  ],
  "ai_opportunities": [
    {
      "solution": "string (Agent Name/Type)",
      "impact": "string (e.g. Save 20h/week)",
      "description": "string (short explanation)"
    },
    {
       "solution": "string",
       "impact": "string",
       "description": "string"
    }
  ],
  "tools_integration": [
    "string (Tool Name)",
    "string",
    "string"
  ],
  "executive_pitch": "string (2-3 concise lines selling the solution)"
}
`;

    if (isUrlProvided) {
      let domain = companyUrl;
      try {
        const urlObj = new URL(companyUrl);
        domain = urlObj.hostname;
      } catch (e) {
        domain = companyUrl;
      }

      tools = [{
        type: 'web_search',
        filters: { allowed_domains: [domain] }
      }];
      messages = [
        { role: "developer", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze: ${companyUrl}` }
      ];
    } else {
      tools = [{ type: 'web_search' }];
      messages = [
        { role: "developer", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze: ${companyName}` }
      ];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          tools: tools,
          input: messages
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || response.statusText);
      }

      const data = await response.json();

      let content = "";
      if (data.output && Array.isArray(data.output)) {
        data.output.forEach(item => {
          if (item.type === 'message' && item.content) {
            if (Array.isArray(item.content)) {
              item.content.forEach(part => {
                if (part.type === 'output_text') content += part.text;
              });
            } else if (typeof item.content === 'string') {
              content += item.content;
            }
          }
        });
      } else if (data.choices && data.choices[0]) {
        content = data.choices[0].message.content;
      } else if (data.output_text) {
        content = data.output_text;
      }

      // Parse JSON from content (handle markdown code blocks if present)
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsedData = JSON.parse(jsonString);
        setResult(parsedData);
      } catch (parseError) {
        console.error("JSON Parse Error", parseError);
        // Fallback to displaying raw text if parsing fails
        setResult({ raw_error: true, content: content });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={result ? "dashboard-container expanded" : "dashboard-container"}
      >
        <div className="header-section">
          <div className="icon-container">
            <Bot size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="main-title">Agentic Scraper</h1>
            <p className="subtitle">Instant AI Business Intelligence</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-row">
            <div className="input-group">
              <Building size={16} className="input-icon" />
              <input
                type="text"
                className="glass-input"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!!companyUrl || loading}
              />
            </div>
            <div className="divider-vertical">OR</div>
            <div className="input-group">
              <Globe size={16} className="input-icon" />
              <input
                type="text"
                className="glass-input"
                placeholder="Company URL"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                disabled={!!companyName || loading}
              />
            </div>
            <button type="submit" className="glow-button" disabled={loading}>
              {loading ? <span className="spinner"></span> : <Sparkles size={18} />}
              <span>Analyze</span>
            </button>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="error-message"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {result && !result.raw_error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="dashboard-grid"
            >
              {/* Executive Pitch - Span 3 / Row 1 */}
              <div className="dashboard-card highlight-card col-span-3">
                <div className="card-header">
                  <Target size={16} className="card-icon" />
                  <h3>Executive Summary</h3>
                </div>
                <p className="pitch-text">{result.executive_pitch}</p>
              </div>

              {/* Company Overview - Span 1 / Row 2 (Vertical Card) */}
              <div className="dashboard-card col-span-1 row-span-2">
                <div className="card-header">
                  <Briefcase size={16} className="card-icon" />
                  <h3>Company Profile</h3>
                </div>
                <div className="info-list">
                  <div className="info-item">
                    <span className="label">Industry</span>
                    <span className="value">{result.company_overview.industry}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Target</span>
                    <span className="value">{result.company_overview.target_customers}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Size</span>
                    <span className="value">{result.company_overview.size}</span>
                  </div>
                  <p className="description-text">{result.company_overview.description}</p>
                </div>
              </div>

              {/* Workflow - Span 1 */}
              <div className="dashboard-card col-span-1">
                <div className="card-header">
                  <Zap size={16} className="card-icon" />
                  <h3>Operational Workflow</h3>
                </div>
                <ul className="bullet-list">
                  {result.operational_workflow.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Pain Points - Span 1 */}
              <div className="dashboard-card alert-border col-span-1">
                <div className="card-header">
                  <AlertCircle size={16} className="card-icon alert-icon" />
                  <h3>Pain Points & Bottlenecks</h3>
                </div>
                <ul className="bullet-list alert-list">
                  {result.pain_points.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Tools - Span 1 */}
              <div className="dashboard-card col-span-1">
                <div className="card-header">
                  <Wrench size={16} className="card-icon" />
                  <h3>Tools & Tech Stack</h3>
                </div>
                <div className="tags-container">
                  {result.tools_integration.map((tool, i) => (
                    <span key={i} className="tech-tag">{tool}</span>
                  ))}
                </div>
              </div>

              {/* AI Opportunities - Full Width Bottom */}
              <div className="dashboard-card col-span-full">
                <div className="card-header">
                  <Sparkles size={16} className="card-icon" />
                  <h3>AI & Automation Opportunities</h3>
                </div>
                <div className="opportunities-grid">
                  {result.ai_opportunities.map((opp, i) => (
                    <div key={i} className="opportunity-item">
                      <div className="opp-header">
                        <h4>{opp.solution}</h4>
                        <span className="impact-badge">{opp.impact}</span>
                      </div>
                      <p>{opp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {result && result.raw_error && (
            <div className="dashboard-card full-width">
              <h3>Raw Output (Parsing Failed)</h3>
              <pre className="raw-output">{result.content}</pre>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;
