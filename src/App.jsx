import { useState } from 'react';
import { Search, Globe, Building, Bot, Key } from 'lucide-react';
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

    if (isUrlProvided) {
      // Extract domain for filter if possible, otherwise just use web_search
      let domain = companyUrl;
      try {
        const urlObj = new URL(companyUrl);
        domain = urlObj.hostname;
      } catch (e) {
        // Fallback if user just types 'google.com' without protocol
        domain = companyUrl;
      }

      tools = [{
        type: 'web_search',
        filters: { allowed_domains: [domain] }
      }];
      messages = [
        {
          role: "developer",
          content: "You are a helpful assistant. Search the provided url and give me the company pain points."
        },
        {
          role: "user",
          content: `Find pain points for ${companyUrl}`
        }
      ];
    } else {
      tools = [{ type: 'web_search' }];
      messages = [
        {
          role: "developer",
          content: "You are a helpful assistant. Do web search and give me the company pain points."
        },
        {
          role: "user",
          content: `Find pain points for company: ${companyName}`
        }
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
          model: 'gpt-5', // Using gpt-5 as requested in prompt, though it might not exist for general public yet. 
          // If it fails, user can change it. the prompt explicitly asked for 'gpt-5'.
          tools: tools,
          input: messages
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || response.statusText);
      }

      const data = await response.json();
      // The response structure for v1/responses is non-standard. 
      // Based on curl: it likely returns a content result.
      // Standard chat completion has choices[0].message.content.
      // We will try to parse assume standard or check documentation if it differs.
      // The user gave an example curl but not the RESPONSE structure.
      // I will assume it returns something similar to chat completions or the 'output' field.
      // Let's dump the whole JSON if format is unknown, or try to find 'content'.

      // Since it's 'gpt-5' and 'v1/responses', this looks like a future or beta endpoint.
      // I'll assume the output is in `output` or `choices`.
      // I'll try to display data.output_text or data.choices[0].message.content

      const content = data.output_text || data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
      setResult(content);

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
        transition={{ duration: 0.5 }}
        className="glass-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Bot size={32} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pain Points Finder
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Deep dive into company challenges
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* API Key is now loaded from env */}

          <div>
            <label className="label-text">
              <Building size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Company Name (If no URL)
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Tesla, Apple"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!!companyUrl}
            />
          </div>

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>OR</div>

          <div>
            <label className="label-text">
              <Globe size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Company URL
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. https://tesla.com"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              disabled={!!companyName}
            />
          </div>

          <button type="submit" className="glow-button" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner"></span> Analyzing...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Search size={18} /> Find Pain Points
              </span>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', borderRadius: '8px', color: '#ffaaaa', fontSize: '0.9rem' }}
            >
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}
            >
              <h3 style={{ marginTop: 0 }}>Analysis Results</h3>
              <div className="markdown-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {result}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
        Agentic Scraper v1.0
      </div>
    </div>
  );
}

export default App;
